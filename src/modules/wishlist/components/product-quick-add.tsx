"use client"

import { useState, useEffect, useMemo, useCallback, startTransition } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { getPricesForVariant } from "@core/util/get-product-price"
import { addToCartWithSizeFallback } from "@lib/data/cart/add-to-cart-with-fallback"
import { trackAddToCart } from "@core/analytics/ga4-ecommerce"
import { useParams, useRouter } from "next/navigation"
import { clx } from "@lib/util/clx"
import {
  getAddToCartPayloadFromResolution,
  getVariantQuantityInCart,
  isVariantPurchasable,
  resolveSizeFallback,
} from "@lib/util/size-fallback"
import {
  findVariantByOptions,
  optionsAsKeymap,
} from "@core/domain/product/variant-selection"

export const QuickAddContent = ({
  product,
  selectedOptions,
  setOptionValue,
  handleAddToCart,
  isAdding,
  showError,
  onClose,
  isMobile,
  selectedVariantPrice,
  quantity,
  setQuantity,
  cart,
  actionLabel = "Move to Bag",
}: {
  product: HttpTypes.StoreProduct,
  selectedOptions: Record<string, string>,
  setOptionValue: (o: string, v: string) => void,
  handleAddToCart: (e?: React.MouseEvent) => void,
  isAdding: boolean,
  showError: boolean,
  onClose: () => void,
  isMobile: boolean,
  selectedVariantPrice?: {
    calculated_price: string
    original_price: string
    percentage_diff: string
  } | null,
  quantity: number,
  setQuantity: (q: number) => void,
  cart: HttpTypes.StoreCart | null,
  actionLabel?: string,
}) => {
  // Find selected variant for inventory check
  const selectedVariant = useMemo(() => {
    if (!product.variants || Object.keys(selectedOptions).length === 0) return null
    return findVariantByOptions(product, selectedOptions) ?? null
  }, [selectedOptions, product])

  const inStock = useMemo(() => {
    if (!selectedVariant) return false

    return isVariantPurchasable({
      product,
      selectedVariant,
      options: selectedOptions,
      quantity,
      cart,
    })
  }, [selectedVariant, product, selectedOptions, quantity, cart])

  // Auto-adjust quantity if it exceeds available stock for the selected variant
  useEffect(() => {
    if (!selectedVariant) {
      return
    }

    const resolution = resolveSizeFallback({
      product,
      selectedVariant,
      options: selectedOptions,
      quantity,
      cart,
    })

    if (resolution.status === "out_of_stock") {
      setQuantity(1)
      return
    }

    const stockVariant = resolution.variant

    if (stockVariant.manage_inventory && !stockVariant.allow_backorder) {
      const inCartQuantity = getVariantQuantityInCart(cart, stockVariant.id)
      const stock = (stockVariant.inventory_quantity || 0) - inCartQuantity

      if (quantity > stock && stock > 0) {
        setQuantity(stock)
      } else if (stock <= 0) {
        setQuantity(1)
      }
    }
  }, [selectedVariant, product, selectedOptions, quantity, setQuantity, cart])

  const hasSale =
    !!selectedVariantPrice &&
    selectedVariantPrice.calculated_price !== selectedVariantPrice.original_price
  const salePct = hasSale
    ? String(selectedVariantPrice?.percentage_diff ?? "").replace(/\D/g, "")
    : ""
  const formatQuickAddPrice = (price: string) => price.replace(/\.00\b/, "")
  const productImage = product.thumbnail || product.images?.[0]?.url

  const qtyControls = selectedVariant && !inStock ? (
    <span className="quick-add__oos">Out of Stock</span>
  ) : (
    <div className="quick-add__qty-wrap">
      <div
        className={clx(
          "quick-add__qty",
          (() => {
            const inCartQuantity =
              cart?.items?.find((item) => item.variant_id === selectedVariant?.id)?.quantity || 0
            const maxQuantity =
              !selectedVariant?.manage_inventory || selectedVariant?.allow_backorder
                ? 100
                : (selectedVariant?.inventory_quantity || 0) - inCartQuantity
            return quantity >= maxQuantity ? "quick-add__qty--limit" : ""
          })()
        )}
      >
        <button
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="quick-add__qty-btn"
          aria-label="Decrease quantity"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <span className="quick-add__qty-value">{quantity}</span>
        <button
          type="button"
          onClick={() => {
            const inCartQuantity = cart?.items?.find(item => item.variant_id === selectedVariant?.id)?.quantity || 0
            const maxQuantity = !selectedVariant?.manage_inventory || selectedVariant?.allow_backorder
              ? 100
              : ((selectedVariant?.inventory_quantity || 0) - inCartQuantity)
            if (quantity < maxQuantity) {
              setQuantity(quantity + 1)
            }
          }}
          disabled={(() => {
            const inCartQuantity = cart?.items?.find(item => item.variant_id === selectedVariant?.id)?.quantity || 0
            const maxQuantity = !selectedVariant?.manage_inventory || selectedVariant?.allow_backorder
              ? 100
              : ((selectedVariant?.inventory_quantity || 0) - inCartQuantity)
            return quantity >= maxQuantity
          })()}
          className="quick-add__qty-btn"
          aria-label="Increase quantity"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {(() => {
        const inCartQuantity = cart?.items?.find(item => item.variant_id === selectedVariant?.id)?.quantity || 0
        const maxQuantity = !selectedVariant?.manage_inventory || selectedVariant?.allow_backorder ? 100 : ((selectedVariant?.inventory_quantity || 0) - inCartQuantity)
        if (quantity >= maxQuantity && maxQuantity < 100) {
          return (
            <span className="quick-add__qty-note">
              {maxQuantity <= 0 ? "Already in bag (Max reached)" : `Only ${maxQuantity} more available`}
            </span>
          )
        }
        return null
      })()}
    </div>
  )

  const priceBlock = selectedVariantPrice ? (
    <div className="quick-add__price-row">
      <span className="quick-add__price">
        {formatQuickAddPrice(selectedVariantPrice.calculated_price)}
      </span>
      {hasSale && (
        <>
          <span className="quick-add__price-was">
            {formatQuickAddPrice(selectedVariantPrice.original_price)}
          </span>
          {salePct ? (
            <span className="quick-add__sale-badge">{salePct}% off</span>
          ) : null}
        </>
      )}
    </div>
  ) : (
    <div className="quick-add__price-spacer" />
  )

  return (
    <div className={clx("quick-add", isMobile && "quick-add--sheet")}>
      {isMobile ? (
        <div className="quick-add__handle" aria-hidden>
          <span className="quick-add__handle-bar" />
        </div>
      ) : (
        <div className="quick-add__accent" aria-hidden />
      )}

      <div className="quick-add__head">
        <div className="quick-add__head-text">
          {isMobile ? (
            <h4 className="quick-add__eyebrow">Select options</h4>
          ) : (
            <p className="quick-add__product-title">
              {product.title || "Select options"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="quick-add__close"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      {isMobile ? (
        <div className="quick-add__summary">
          {productImage ? (
            <div className="quick-add__thumb">
              <Image
                src={productImage}
                alt={product.title || "Product"}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="quick-add__summary-meta">
            <p className="quick-add__product-title">
              {product.title || "Select options"}
            </p>
            <div className="quick-add__summary-row">
              {priceBlock}
              {qtyControls}
            </div>
          </div>
        </div>
      ) : (
        <div className="quick-add__top">
          {priceBlock}
          {qtyControls}
        </div>
      )}

      <div className="quick-add__body">
        <div className="quick-add__options">
          {(product.options || []).slice().sort((a, b) => {
            const getOrder = (title: string) => {
              const t = title.toLowerCase()
              if (t.includes('color') || t.includes('colour')) return 1
              if (t.includes('size')) return 2
              return 3
            }
            return getOrder(a.title || "") - getOrder(b.title || "")
          }).map((option) => {
            const selectedValue = selectedOptions[option.id]
            return (
              <div key={option.id} className="quick-add__option-group">
                <span className="quick-add__option-label">
                  {option.title}
                  {selectedValue ? (
                    <span className="quick-add__option-chosen"> · {selectedValue}</span>
                  ) : null}
                </span>
                <div className="quick-add__option-list">
                  {option.values?.map((v: any) => {
                    const isSelected = selectedOptions[option.id] === v.value
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setOptionValue(option.id, v.value)}
                        className={clx(
                          "quick-add__option",
                          isSelected && "quick-add__option--selected"
                        )}
                      >
                        {v.value}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={(e) => handleAddToCart(e)}
          disabled={isAdding || (!isAdding && !showError && (!selectedVariant || !inStock))}
          className={clx(
            "quick-add__cta",
            showError && "quick-add__cta--error",
            !isAdding && !showError && (!selectedVariant || !inStock) && "quick-add__cta--disabled"
          )}
        >
          {isAdding
            ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )
            : showError
              ? "Select All Options"
              : !selectedVariant
                ? "Not Available"
                : !inStock
                  ? "Out of Stock"
                  : `${actionLabel}${quantity > 1 ? ` (${quantity})` : ''}`}
        </button>
      </div>
    </div>
  )
}

export function useProductQuickAdd(
  product: HttpTypes.StoreProduct,
  cart: HttpTypes.StoreCart | null = null
) {
  const { countryCode } = useParams() as { countryCode: string }
  const router = useRouter()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [showError, setShowError] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const selectedVariantPrice = useMemo(() => {
    if (!product.variants || Object.keys(selectedOptions).length === 0) return null
    const matchedVariant = findVariantByOptions(product, selectedOptions)
    if (!matchedVariant) return null
    return getPricesForVariant(matchedVariant)
  }, [selectedOptions, product])

  useEffect(() => {
    const handleCloseOthers = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail !== product.id) {
        setShowQuickAdd(false)
        setSelectedOptions({})
        setQuantity(1)
      }
    }

    if (showQuickAdd) {
      window.addEventListener("close-other-quick-adds", handleCloseOthers)
    }

    return () => {
      window.removeEventListener("close-other-quick-adds", handleCloseOthers)
    }
  }, [showQuickAdd, product.id])

  useEffect(() => {
    if (!showQuickAdd || !product.variants?.length) return
    if (Object.keys(selectedOptions).length > 0) return

    const preferred =
      product.variants.find((variant) =>
        isVariantPurchasable({
          product,
          selectedVariant: variant,
          options: optionsAsKeymap(variant.options) ?? {},
          quantity: 1,
          cart,
        })
      ) ?? product.variants[0]

    const opts = optionsAsKeymap(preferred.options) ?? {}
    if (Object.keys(opts).length > 0) {
      setSelectedOptions(opts)
    }
  }, [showQuickAdd, product, cart, selectedOptions])

  const closeQuickAdd = useCallback(() => {
    setShowQuickAdd(false)
    setSelectedOptions({})
    setQuantity(1)
    setShowError(false)
  }, [])

  const setOptionValue = useCallback((optionId: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
    setShowError(false)
  }, [])

  const addVariantToCart = useCallback(
    async (
      variant: HttpTypes.StoreProductVariant,
      optionValues: Record<string, string>
    ) => {
      if (!variant.id) return

      const resolution = resolveSizeFallback({
        product,
        selectedVariant: variant,
        options: optionValues,
        quantity,
        cart,
      })

      if (resolution.status === "out_of_stock") {
        throw new Error("Selected size is out of stock")
      }

      const payload = getAddToCartPayloadFromResolution(resolution, quantity)

      setIsAdding(true)
      try {
        await addToCartWithSizeFallback({
          ...payload,
          countryCode,
        })
        const currency =
          (variant as { calculated_price?: { currency_code?: string } }).calculated_price
            ?.currency_code?.toUpperCase() ?? "USD"
        const unitPrice =
          (variant as { calculated_price?: { calculated_amount?: number } }).calculated_price
            ?.calculated_amount ?? 0
        trackAddToCart({
          currency,
          value: unitPrice / 100,
          items: [
            {
              item_id: variant.id,
              item_name: product.title ?? "",
              price: unitPrice / 100,
              quantity,
              item_variant: variant.title ?? undefined,
            },
          ],
        })
        closeQuickAdd()
        // Server action already revalidates cart cache; refresh in background
        // so the UI is not blocked waiting for a full page RSC refetch.
        startTransition(() => {
          router.refresh()
        })
      } catch (error: any) {
        alert(error?.message || "Failed to add product to cart. Please try again.")
      } finally {
        setIsAdding(false)
      }
    },
    [cart, closeQuickAdd, countryCode, product, quantity, router]
  )

  const handleQuickAdd = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (!product.variants || product.variants.length === 0) {
        alert("This product has no variants available")
        return
      }

      if (product.variants.length === 1) {
        const firstVariant = product.variants[0]
        if (!firstVariant.id) {
          alert("Product variant is not available")
          return
        }

        const defaultOptions = optionsAsKeymap(firstVariant.options) ?? {}

        if (
          !isVariantPurchasable({
            product,
            selectedVariant: firstVariant,
            options: defaultOptions,
            quantity,
            cart,
          })
        ) {
          window.dispatchEvent(
            new CustomEvent("close-other-quick-adds", { detail: product.id })
          )
          setShowQuickAdd(true)
          return
        }

        await addVariantToCart(firstVariant, defaultOptions)
        return
      }

      if (!showQuickAdd) {
        window.dispatchEvent(
          new CustomEvent("close-other-quick-adds", { detail: product.id })
        )
        setShowQuickAdd(true)
        return
      }

      const selectedVariant = findVariantByOptions(product, selectedOptions)

      if (selectedVariant) {
        await addVariantToCart(selectedVariant, selectedOptions)
      } else {
        setShowError(true)
        setTimeout(() => setShowError(false), 2000)
      }
    },
    [addVariantToCart, cart, product, quantity, selectedOptions, showQuickAdd]
  )

  return {
    showQuickAdd,
    closeQuickAdd,
    selectedOptions,
    setOptionValue,
    quantity,
    setQuantity,
    showError,
    isAdding,
    selectedVariantPrice,
    handleQuickAdd,
    cart,
  }
}
