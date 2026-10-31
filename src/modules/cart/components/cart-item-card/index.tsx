"use client"

import { useState, useMemo, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { updateLineItem, deleteLineItem, retrieveCart } from "@core/data/cart"
import { addToCartWithSizeFallback } from "@lib/data/cart/add-to-cart-with-fallback"
import {
  getAddToCartPayloadFromResolution,
  getCartExcludingLineItem,
  getCustomerFacingCartOptions,
  getCustomerFacingVariantTitle,
  mergeFreshProductInventory,
  resolveSizeFallback,
  SIZE_FALLBACK_METADATA,
} from "@lib/util/size-fallback"
import { findSizeOption, isVariantInStock } from "@core/domain/product/variant-selection"
import { getProductByHandle } from "@core/data/products"
import { trackAddToCart, trackRemoveFromCart } from "@core/analytics/ga4-ecommerce"
import { useParams } from "next/navigation"

/** Shallow equality for plain option objects \u2014 replaces lodash isEqual. */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false
  const ka = Object.keys(a as object)
  const kb = Object.keys(b as object)
  if (ka.length !== kb.length) return false
  return ka.every((k) => (a as Record<string, unknown>)[k] === (b as Record<string, unknown>)[k])
}

import { getCartLineItemThumbnail } from "@lib/cart-line-item-image"
import Thumbnail from "@modules/products/components/thumbnail"
import DeleteButton from "@modules/common/components/delete-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import ErrorMessage from "@modules/checkout/components/error-message"
import { getProductPrice } from "@core/util/get-product-price"
import { convertToLocale } from "@core/util/money"
import { shouldShowProductOption } from "@lib/util/should-show-product-option"

type CartItemCardProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  cart?: HttpTypes.StoreCart | null
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const CartItemCard = ({ item, currencyCode, cart }: CartItemCardProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [freshProduct, setFreshProduct] = useState<HttpTypes.StoreProduct | null>(null)
  const countryCode = useParams().countryCode as string

  // Get product from cart item - it should be available since we updated cart retrieval
  // Check both item.product and item.variant?.product
  const product = (item as any).product || item.variant?.product

  // Initialize options from customer-selected size when fallback metadata exists
  useEffect(() => {
    setOptions(getCustomerFacingCartOptions(item, product))
  }, [item, product])

  // Fetch fresh product data to get accurate inventory for all variants
  useEffect(() => {
    const fetchFreshData = async () => {
      if (item.product_handle) {
        const productData = await getProductByHandle(item.product_handle)
        if (productData) {
          setFreshProduct(productData)
        }
      }
    }
    fetchFreshData()
  }, [item.product_handle])

  const freshVariant = useMemo(() => {
    if (!freshProduct?.variants?.length) {
      return null
    }

    return (
      freshProduct.variants.find((variant) => variant.id === item.variant_id) ??
      null
    )
  }, [freshProduct, item.variant_id])

  const revertOptions = () => {
    setOptions(getCustomerFacingCartOptions(item, product))
  }

  // Find selected variant based on options
  const selectedVariant = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) {
      return item.variant
    }

    return product.variants.find((v: HttpTypes.StoreProductVariant) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product?.variants, options, item.variant])

  // Get available option values
  const getOptionValues = (optionId: string) => {
    if (!product?.variants) return []

    const values = new Set<string>()
    product.variants.forEach((variant: HttpTypes.StoreProductVariant) => {
      variant.options?.forEach((opt: any) => {
        if (opt.option_id === optionId) {
          values.add(opt.value)
        }
      })
    })
    return Array.from(values)
  }

  // Get product options (hide placeholder/default options with no real choice)
  const productOptions = useMemo(() => {
    const options = (product?.options || []) as HttpTypes.StoreProductOption[]
    return options.filter(shouldShowProductOption)
  }, [product?.options])

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const handleOptionChange = async (optionId: string, value: string) => {
    const newOptions = {
      ...options,
      [optionId]: value,
    }
    setOptions(newOptions)
    setError(null)

    let latestFreshProduct = freshProduct
    if (item.product_handle) {
      try {
        latestFreshProduct = (await getProductByHandle(item.product_handle)) ?? latestFreshProduct
        if (latestFreshProduct) {
          setFreshProduct(latestFreshProduct)
        }
      } catch {
        // Fall back to cached product data when refresh fails.
      }
    }

    const productForResolution = mergeFreshProductInventory(
      product!,
      latestFreshProduct
    )

    // Find variant with new options
    const newVariant = productForResolution.variants?.find(
      (v: HttpTypes.StoreProductVariant) => {
        const variantOptions = optionsAsKeymap(v.options)
        return isEqual(variantOptions, newOptions)
      }
    )

    if (!newVariant) {
      revertOptions()
      return
    }

    const cartForResolution = getCartExcludingLineItem(cart, item.id)
    const sizeOption = findSizeOption(productForResolution)
    const selectedSize = sizeOption ? newOptions[sizeOption.id] : null
    const actualInventorySize =
      item.metadata?.[SIZE_FALLBACK_METADATA.actualInventorySize]
    const isExplicitActualSizeSelection =
      typeof selectedSize === "string" &&
      typeof actualInventorySize === "string" &&
      selectedSize.toLowerCase() === actualInventorySize.toLowerCase() &&
      newVariant.id === item.variant_id &&
      isVariantInStock(newVariant, productForResolution, item.quantity, 0)

    const resolution = isExplicitActualSizeSelection
      ? { status: "direct" as const, variant: newVariant }
      : resolveSizeFallback({
          product: productForResolution,
          selectedVariant: newVariant,
          options: newOptions,
          quantity: item.quantity,
          cart: cartForResolution,
        })

    if (resolution.status === "out_of_stock") {
      setError("Selected size is out of stock")
      revertOptions()
      return
    }

    const payload = getAddToCartPayloadFromResolution(resolution, item.quantity)
    const metadataChanged =
      JSON.stringify(item.metadata ?? {}) !== JSON.stringify(payload.metadata ?? {})

    if (payload.variantId !== item.variant_id || metadataChanged) {
      setUpdating(true)

      try {
        const unitTotal = item.total ? item.total / item.quantity : 0
        trackRemoveFromCart({
          currency: currencyCode,
          value: (item.total ?? 0) / 100,
          items: [
            {
              item_id: item.variant_id ?? item.id,
              item_name: item.title ?? "",
              price: unitTotal / 100,
              quantity: item.quantity,
            },
          ],
        })
        await deleteLineItem(item.id)

        await addToCartWithSizeFallback({
          ...payload,
          countryCode,
        })
        const newUnitPrice =
          (resolution.variant as any).calculated_price?.calculated_amount ?? 0
        trackAddToCart({
          currency: currencyCode,
          value: (newUnitPrice * item.quantity) / 100,
          items: [
            {
              item_id: resolution.variant.id,
              item_name: product?.title ?? item.title ?? "",
              price: newUnitPrice / 100,
              quantity: item.quantity,
              item_variant: getCustomerFacingVariantTitle({
                variant: resolution.variant,
                metadata: payload.metadata ?? item.metadata,
                title: item.title,
              }),
            },
          ],
        })
      } catch (err: any) {
        setError(err.message)
        revertOptions()
      } finally {
        setUpdating(false)
      }
    }
  }

  const maxQuantity = useMemo(() => {
    const variant = freshVariant || selectedVariant || item.variant
    if (!variant) return 10

    // If inventory management is off or backorders are allowed, allow a high quantity
    if (variant.manage_inventory === false || (variant as any).allow_backorder) {
      return 100
    }

    // Otherwise use actual inventory quantity if available
    const stock = (variant as any).inventory_quantity
    if (stock === undefined || stock === null) {
      return 100 // Fallback if still unknown
    }

    return stock
  }, [freshVariant, selectedVariant, item.variant])

  const isAtMax = item.quantity >= maxQuantity

  // Get price information from cart item
  // item.total is the total for the line item (quantity * unit_price)
  // So we divide by quantity to get unit price
  const unitTotal = item.total ? item.total / item.quantity : 0
  const unitOriginalTotal = item.original_total ? item.original_total / item.quantity : 0

  // Use variant price if available, otherwise use item total
  const displayVariant = selectedVariant || item.variant
  const variantPrice = displayVariant?.calculated_price?.calculated_amount
  const variantOriginalPrice = displayVariant?.calculated_price?.original_amount

  // Prefer variant price, fallback to item total
  // Note: variant prices are already in smallest currency unit (e.g., paise for INR)
  // item.total is also in smallest currency unit
  const currentPriceAmount = variantPrice || unitTotal
  const originalPriceAmount = variantOriginalPrice || unitOriginalTotal

  const discountPercentage = originalPriceAmount && currentPriceAmount && originalPriceAmount > currentPriceAmount
    ? Math.round(((originalPriceAmount - currentPriceAmount) / originalPriceAmount) * 100)
    : 0

  const itemThumbnail = getCartLineItemThumbnail(item)

  return (
    <div className="cart-page__item relative">
      {/* Remove button */}
      <div className="absolute top-2.5 min-[340px]:top-3 min-[550px]:top-3 right-2.5 min-[340px]:right-3 min-[550px]:right-3 sm:top-3 sm:right-3 min-[1023px]:top-2 min-[1023px]:right-2 min-[1150px]:top-3 min-[1150px]:right-3 min-[1360px]:top-3 min-[1360px]:right-3 z-10">
        <DeleteButton
          id={item.id}
          productId={item.product_id || ""}
          thumbnail={itemThumbnail}
          data-testid="product-delete-button"
          onAfterDelete={() => {
            const unitTotal = item.total ? item.total / item.quantity : 0
            trackRemoveFromCart({
              currency: currencyCode,
              value: (item.total ?? 0) / 100,
              items: [
                {
                  item_id: item.variant_id ?? item.id,
                  item_name: item.title ?? "",
                  price: unitTotal / 100,
                  quantity: item.quantity,
                },
              ],
            })
          }}
        />
      </div>

      <div className="cart-page__item-body flex flex-row gap-3 min-[340px]:gap-3.5 min-[550px]:gap-4 sm:gap-4 min-[1023px]:gap-3 min-[1150px]:gap-4 min-[1360px]:gap-4">
        {/* Product Image */}
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="flex-shrink-0 self-start"
        >
          <Thumbnail
            thumbnail={itemThumbnail}
            size="square"
            className="w-20 h-20 min-[550px]:w-24 min-[550px]:h-24 sm:w-24 sm:h-24"
          />
        </LocalizedClientLink>

        {/* Product Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-2.5 min-[340px]:gap-3 min-[550px]:gap-3 sm:gap-3 min-[1023px]:gap-2 min-[1150px]:gap-3 min-[1360px]:gap-3 pr-6 min-[340px]:pr-7 min-[550px]:pr-8 sm:pr-8 min-[1023px]:pr-6 min-[1150px]:pr-8 min-[1360px]:pr-8">
          {/* Brand */}
          {product?.metadata?.brand && (
            <p className="text-xs min-[340px]:text-xs min-[550px]:text-xs text-gray-500">{product.metadata.brand}</p>
          )}

          {/* Product Title */}
          <h3 className="cart-page__item-title font-bold text-sm min-[340px]:text-sm min-[550px]:text-base sm:text-base min-[1023px]:text-sm min-[1150px]:text-base min-[1360px]:text-base text-heading pr-8 min-[340px]:pr-9 min-[550px]:pr-8 sm:pr-8 min-[1023px]:pr-8 min-[1150px]:pr-8 min-[1360px]:pr-8">
            {item.product_title}
          </h3>

          {/* Variant Dropdowns */}
          {!product ? (
            <div className="flex gap-2.5 min-[340px]:gap-3 flex-wrap">
              <div className="h-9 min-[340px]:h-9.5 min-[550px]:h-10 sm:h-10 min-[1023px]:h-9 min-[1150px]:h-10 min-[1360px]:h-10 w-full sm:w-32 min-[1023px]:w-28 min-[1150px]:w-32 min-[1360px]:w-32 bg-gray-100 animate-pulse rounded" />
              <div className="h-9 min-[340px]:h-9.5 min-[550px]:h-10 sm:h-10 min-[1023px]:h-9 min-[1150px]:h-10 min-[1360px]:h-10 w-full sm:w-32 min-[1023px]:w-28 min-[1150px]:w-32 min-[1360px]:w-32 bg-gray-100 animate-pulse rounded" />
              <div className="h-9 min-[340px]:h-9.5 min-[550px]:h-10 sm:h-10 min-[1023px]:h-9 min-[1150px]:h-10 min-[1360px]:h-10 w-full sm:w-24 min-[1023px]:w-20 min-[1150px]:w-24 min-[1360px]:w-24 bg-gray-100 animate-pulse rounded" />
            </div>
          ) : (
            <div className="flex flex-col min-[340px]:flex-col min-[640px]:flex-row gap-2.5 min-[340px]:gap-3 min-[550px]:gap-3 sm:gap-2 min-[1023px]:gap-1.5 min-[1150px]:gap-2 min-[1360px]:gap-2 items-stretch min-[640px]:items-center">
              {productOptions.map((option: HttpTypes.StoreProductOption) => {
                const currentValue = options[option.id]
                const availableValues = getOptionValues(option.id)

                return (
                  <div key={option.id} className="relative">
                    <select
                      value={currentValue || ""}
                      onChange={(e) => handleOptionChange(option.id, e.target.value)}
                      disabled={updating}
                      className="appearance-none bg-surface border border-[var(--color-border)] rounded px-3 min-[340px]:px-3.5 min-[550px]:px-4 py-2 min-[340px]:py-2.5 min-[550px]:py-2.5 pr-8 min-[340px]:pr-9 min-[550px]:pr-9 text-xs min-[340px]:text-xs min-[550px]:text-sm sm:text-sm min-[1023px]:text-xs min-[1150px]:text-sm min-[1360px]:text-sm font-medium text-heading focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent cursor-pointer disabled:opacity-50 w-full min-[640px]:min-w-[140px] min-[1023px]:min-w-[120px] min-[1150px]:min-w-[140px] min-[1360px]:min-w-[140px] h-9 min-[340px]:h-9.5 min-[550px]:h-10 sm:h-10 min-[1023px]:h-9 min-[1150px]:h-10 min-[1360px]:h-10"
                    >
                      {!currentValue && (
                        <option value="" disabled>
                          {option.title}: Select
                        </option>
                      )}
                      {availableValues.map((value) => (
                        <option key={value} value={value}>
                          {option.title}: {value}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg
                        className="fill-current h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                )
              })}

              {/* Quantity Selector Container with Absolute Messages */}
              <div className="hidden min-[640px]:flex relative h-fit">
                <div className="flex items-center border border-gray-300 rounded-[5px] overflow-hidden bg-surface h-8 min-[550px]:h-9 sm:h-10 min-[1023px]:h-9 min-[1150px]:h-10 min-[1360px]:h-10 w-[96px] min-[550px]:w-[108px] sm:w-[120px] relative z-0 shadow-sm">
                  <button
                    onClick={() => changeQuantity(Math.max(1, item.quantity - 1))}
                    disabled={updating || item.quantity <= 1}
                    className="w-8 min-[550px]:w-9 sm:w-10 h-full flex items-center justify-center text-heading hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base min-[550px]:text-lg sm:text-xl transition-colors duration-200"
                    type="button"
                  >
                    −
                  </button>
                  <span className="w-8 min-[550px]:w-9 sm:w-10 text-center font-semibold text-heading border-x border-[var(--color-border)] h-full flex items-center justify-center text-xs min-[550px]:text-sm sm:text-base min-[1023px]:text-sm min-[1150px]:text-base min-[1360px]:text-base bg-surface">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => changeQuantity(Math.min(maxQuantity, item.quantity + 1))}
                    disabled={updating || item.quantity >= maxQuantity}
                    className="w-8 min-[550px]:w-9 sm:w-10 h-full flex items-center justify-center text-heading hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-base min-[550px]:text-lg sm:text-xl transition-colors duration-200"
                    type="button"
                  >
                    +
                  </button>
                  {updating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface bg-opacity-75 z-10">
                      <Spinner />
                    </div>
                  )}
                </div>
                {isAtMax && maxQuantity > 0 && (
                  <p className="absolute top-[105%] left-0 text-[10px] min-[1150px]:text-[11px] text-red-500 font-bold animate-pulse whitespace-nowrap">
                    Maximum available stock reached
                  </p>
                )}
                {!isAtMax && maxQuantity < 6 && maxQuantity > 0 && (
                  <p className="absolute top-[105%] left-0 text-[10px] min-[1150px]:text-[11px] text-orange-500 font-bold whitespace-nowrap">
                    Only {maxQuantity - item.quantity} left in stock
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quantity Selector and Price - Side by side at 340px-639px, aligned to left */}
          <div className="cart-page__item-footer flex flex-col min-[640px]:hidden gap-2 w-full mt-2 min-[340px]:mt-2.5">
            <div className="flex flex-row flex-nowrap gap-3 items-center justify-start w-full min-w-0">
              {/* Quantity Selector */}
              <div className="flex items-center border border-gray-300 rounded-[5px] overflow-hidden bg-surface h-9 min-[340px]:h-9.5 min-[550px]:h-10 w-[108px] min-[340px]:w-[114px] min-[550px]:w-[120px] flex-shrink-0 relative z-0 shadow-sm">
                <button
                  onClick={() => changeQuantity(Math.max(1, item.quantity - 1))}
                  disabled={updating || item.quantity <= 1}
                  className="w-9 min-[340px]:w-9.5 min-[550px]:w-10 h-full flex items-center justify-center text-heading hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-lg min-[340px]:text-xl min-[550px]:text-xl transition-colors duration-200"
                  type="button"
                >
                  −
                </button>
                <span className="w-9 min-[340px]:w-9.5 min-[550px]:w-10 text-center font-semibold text-heading border-x border-[var(--color-border)] h-full flex items-center justify-center text-sm min-[340px]:text-sm min-[550px]:text-base bg-surface">
                  {item.quantity}
                </span>
                <button
                  onClick={() => changeQuantity(Math.min(maxQuantity, item.quantity + 1))}
                  disabled={updating || item.quantity >= maxQuantity}
                  className="w-9 min-[340px]:w-9.5 min-[550px]:w-10 h-full flex items-center justify-center text-heading hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-lg min-[340px]:text-xl min-[550px]:text-xl transition-colors duration-200"
                  type="button"
                >
                  +
                </button>
                {updating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface bg-opacity-75 z-10">
                    <Spinner />
                  </div>
                )}
              </div>

              {/* Price Information */}
              {currentPriceAmount > 0 && (
                <div className="flex items-center gap-2 min-[340px]:gap-2.5 flex-nowrap min-w-0">
                  <span className="font-bold text-base min-[340px]:text-lg min-[550px]:text-xl text-heading whitespace-nowrap">
                    {convertToLocale({
                      amount: currentPriceAmount,
                      currency_code: currencyCode,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {originalPriceAmount && originalPriceAmount > currentPriceAmount && (
                    <>
                      <span className="text-sm min-[340px]:text-base min-[550px]:text-lg text-gray-500 line-through whitespace-nowrap">
                        {convertToLocale({
                          amount: originalPriceAmount,
                          currency_code: currencyCode,
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      {discountPercentage > 0 && (
                        <span className="text-xs min-[340px]:text-xs min-[550px]:text-sm text-brand-accent font-medium whitespace-nowrap">
                          ({discountPercentage}% OFF)
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Stock Warning - Below Selector */}
            <div className="flex flex-col gap-1.5 px-1 mt-3">
              {isAtMax && maxQuantity > 0 && (
                <p className="text-[10px] text-red-500 font-bold animate-pulse">
                  Maximum stock reached
                </p>
              )}
              {!isAtMax && maxQuantity < 6 && maxQuantity > 0 && (
                <p className="text-[10px] text-orange-500 font-bold">
                  Only {maxQuantity - item.quantity} left
                </p>
              )}
            </div>
          </div>

          {/* Price Information - Only visible at 640px+ (same as 650px view) */}
          {currentPriceAmount > 0 && (
            <div className="hidden min-[640px]:flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base min-[550px]:text-[0.9375rem] sm:text-lg min-[1023px]:text-base min-[1150px]:text-lg min-[1360px]:text-lg text-heading">
                {convertToLocale({
                  amount: currentPriceAmount,
                  currency_code: currencyCode,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
              {originalPriceAmount && originalPriceAmount > currentPriceAmount && (
                <>
                  <span className="text-sm min-[550px]:text-[0.8125rem] sm:text-base min-[1023px]:text-sm min-[1150px]:text-base min-[1360px]:text-base text-gray-500 line-through">
                    {convertToLocale({
                      amount: originalPriceAmount,
                      currency_code: currencyCode,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                  {discountPercentage > 0 && (
                    <span className="text-xs min-[550px]:text-[0.6875rem] sm:text-sm min-[1023px]:text-xs min-[1150px]:text-sm min-[1360px]:text-sm text-brand-accent font-medium">
                      ({discountPercentage}% OFF)
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          <ErrorMessage error={error} data-testid="product-error-message" />
        </div>
      </div>
    </div>
  )
}

export default CartItemCard

