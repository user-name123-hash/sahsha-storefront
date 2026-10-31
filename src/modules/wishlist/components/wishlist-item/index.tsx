"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice, getPricesForVariant } from "@core/util/get-product-price"
import { addToCartWithSizeFallback } from "@lib/data/cart/add-to-cart-with-fallback"
import { trackAddToCart } from "@core/analytics/ga4-ecommerce"
import { useParams, useRouter } from "next/navigation"
import { clx } from "@lib/util/clx"
import { addToWishlist, removeFromWishlist } from "@core/data/wishlist"
import LoginPopup from "@modules/common/components/login-popup"
import Modal from "@modules/common/components/modal"
import {
  getAddToCartPayloadFromResolution,
  isVariantPurchasable,
  resolveSizeFallback,
} from "@lib/util/size-fallback"
import {
  findVariantByOptions,
  optionsAsKeymap,
} from "@core/domain/product/variant-selection"
import {
  QuickAddContent,
  useProductQuickAdd,
} from "@modules/wishlist/components/product-quick-add"

export { QuickAddContent, useProductQuickAdd }

interface WishlistItemProps {
  product: HttpTypes.StoreProduct
  countryCode: string
  cart: HttpTypes.StoreCart | null
  onRemove: () => void
  onAddedToCart?: () => void
}

const WishlistItem = ({
  product,
  countryCode,
  cart,
  onRemove,
  onAddedToCart,
}: WishlistItemProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { countryCode: paramCountryCode } = useParams() as { countryCode: string }
  const finalCountryCode = countryCode || paramCountryCode
  const router = useRouter()

  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [showError, setShowError] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [showAsModal, setShowAsModal] = useState(false)

  // Detect when to use Modal vs in-card overlay
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      // Use Modal for mobile (< 500px) and the specific range where clipping happens (1023px-1100px)
      setShowAsModal(width < 500 || (width >= 1023 && width <= 1100))
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const { cheapestPrice } = getProductPrice({
    product,
  })

  // Compute selected variant price from already-loaded data (no API call)
  const selectedVariantPrice = useMemo(() => {
    if (!product.variants || Object.keys(selectedOptions).length === 0) return null
    const matchedVariant = findVariantByOptions(product, selectedOptions)
    if (!matchedVariant) return null
    return getPricesForVariant(matchedVariant)
  }, [selectedOptions, product])

  const productImage = product.thumbnail || product.images?.[0]?.url

  // Logic to ensure only one Quick Add is open at a time
  useEffect(() => {
    const handleCloseOthers = (e: any) => {
      if (e.detail !== product.id) {
        setShowQuickAdd(false)
        setSelectedOptions({})
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (showQuickAdd) {
        const target = e.target as HTMLElement
        if (!target.closest(`[data-product-id="${product.id}"]`)) {
          setShowQuickAdd(false)
          setSelectedOptions({})
          setQuantity(1)
        }
      }
    }

    if (showQuickAdd) {
      window.addEventListener("close-other-quick-adds", handleCloseOthers)
      // Only close on click-outside if NOT in modal mode
      if (!showAsModal) {
        document.addEventListener("mousedown", handleClickOutside)
      }
    }

    return () => {
      window.removeEventListener("close-other-quick-adds", handleCloseOthers)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showQuickAdd, product.id, showAsModal])

  // Auto-select options from a real (preferably in-stock) variant — not first value per option
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

  const handleMoveToCart = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!product.variants || product.variants.length === 0) {
      alert("This product has no variants available")
      return
    }

    // Case 1: Only one variant exists - add it immediately if in stock
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
        // If out of stock, show the prompt so user sees the message
        window.dispatchEvent(new CustomEvent("close-other-quick-adds", { detail: product.id }))
        setShowQuickAdd(true)
        return
      }

      setIsAdding(true)
      setSuccessMessage(null)

      try {
        const resolution = resolveSizeFallback({
          product,
          selectedVariant: firstVariant,
          options: defaultOptions,
          quantity,
          cart,
        })

        if (resolution.status === "out_of_stock") {
          throw new Error("Selected size is out of stock")
        }

        const payload = getAddToCartPayloadFromResolution(resolution, quantity)

        await addToCartWithSizeFallback({
          ...payload,
          countryCode: finalCountryCode,
        })
        const currency = (firstVariant as any).calculated_price?.currency_code?.toUpperCase() ?? "USD"
        const unitPrice = (firstVariant as any).calculated_price?.calculated_amount ?? 0
        trackAddToCart({
          currency,
          value: unitPrice / 100,
          items: [
            {
              item_id: firstVariant.id,
              item_name: product.title ?? "",
              price: unitPrice / 100,
              quantity: quantity,
              item_variant: firstVariant.title ?? undefined,
            },
          ],
        })
        setSuccessMessage("Added to bag!")
        onAddedToCart?.()
        router.refresh()
        setTimeout(() => {
          setSuccessMessage(null)
        }, 2000)
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to add product to cart. Please try again."
        alert(errorMessage)
      } finally {
        setIsAdding(false)
      }
      return
    }

    // Case 2: Multiple variants - show prompt first if not open
    if (!showQuickAdd) {
      // Dispatch event to close other overlays
      window.dispatchEvent(new CustomEvent("close-other-quick-adds", { detail: product.id }))
      setShowQuickAdd(true)
      // Defaults will be selected by the useEffect when showQuickAdd becomes true
      return
    }

    // Case 3: Multiple variants and prompt is already open - verify selection and add
    const selectedVariant = findVariantByOptions(product, selectedOptions)

    if (selectedVariant) {
      setIsAdding(true)
      setSuccessMessage(null)
      try {
        const resolution = resolveSizeFallback({
          product,
          selectedVariant,
          options: selectedOptions,
          quantity,
          cart,
        })

        if (resolution.status === "out_of_stock") {
          throw new Error("Selected size is out of stock")
        }

        const payload = getAddToCartPayloadFromResolution(resolution, quantity)

        await addToCartWithSizeFallback({
          ...payload,
          countryCode: finalCountryCode,
        })
        const currency = (selectedVariant as any).calculated_price?.currency_code?.toUpperCase() ?? "USD"
        const unitPrice = (selectedVariant as any).calculated_price?.calculated_amount ?? 0
        trackAddToCart({
          currency,
          value: unitPrice / 100,
          items: [
            {
              item_id: selectedVariant.id,
              item_name: product.title ?? "",
              price: unitPrice / 100,
              quantity: quantity,
              item_variant: selectedVariant.title ?? undefined,
            },
          ],
        })
        setShowQuickAdd(false)
        setSelectedOptions({})
        setQuantity(1)
        setSuccessMessage("Added to bag!")
        onAddedToCart?.()
        router.refresh()
        setTimeout(() => {
          setSuccessMessage(null)
        }, 2000)
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to add product to cart. Please try again."
        alert(errorMessage)
      } finally {
        setIsAdding(false)
      }
    } else {
      // Shaker effect or error if they try to add without selecting
      setShowError(true)
      setTimeout(() => setShowError(false), 2000)
    }
  }

  const setOptionValue = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
    setShowError(false)
  }

  const discountPercent = useMemo(() => {
    if (!cheapestPrice?.original_price_number) return 0
    if (cheapestPrice.calculated_price_number >= cheapestPrice.original_price_number) {
      return 0
    }

    const fromField = Number.parseInt(
      String(cheapestPrice.percentage_diff ?? "").replace(/\D/g, ""),
      10
    )
    if (fromField > 0) return fromField

    return Math.round(
      ((cheapestPrice.original_price_number - cheapestPrice.calculated_price_number) /
        cheapestPrice.original_price_number) *
        100
    )
  }, [cheapestPrice])

  return (
    <>
      <article
        className={clx(
          "wishlist-item product-card group flex flex-col w-full h-full relative",
          product.deleted_at && "wishlist-item--unavailable"
        )}
        data-product-id={product.id}
      >
        <div className="wishlist-item__media product-card__media relative overflow-hidden bg-surface-muted">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="block absolute inset-0"
          >
            {productImage ? (
              <Image
                src={productImage}
                alt={product.title || "Product"}
                fill
                sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-muted">
                <span className="text-xs text-[var(--color-text-muted)]">No image</span>
              </div>
            )}
          </LocalizedClientLink>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }}
            className="wishlist-item__remove"
            aria-label="Remove from wishlist"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="wishlist-item__body product-card__info">
          <LocalizedClientLink href={`/products/${product.handle}`}>
            <h3 className="wishlist-item__title product-card__title">
              {product.title}
            </h3>
          </LocalizedClientLink>

          {cheapestPrice && (
            <div className="wishlist-item__price-row product-card__prices">
              <span className="wishlist-item__price product-card__price">
                {cheapestPrice.calculated_price}
              </span>
              {cheapestPrice.calculated_price !== cheapestPrice.original_price && (
                <span className="wishlist-item__price-was product-card__compare">
                  {cheapestPrice.original_price}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="wishlist-item__discount product-card__discount">
                  ({discountPercent}% OFF)
                </span>
              )}
            </div>
          )}

          {product.deleted_at ? (
            <button type="button" disabled className="wishlist-item__btn wishlist-item__btn--disabled">
              No longer available
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMoveToCart}
              disabled={isAdding || !!successMessage}
              className={clx(
                "wishlist-item__btn",
                successMessage && "wishlist-item__btn--success"
              )}
              data-ga-event="wishlist_move_to_bag_click"
              data-ga-label={product.title || "Product"}
            >
              <span className="wishlist-item__btn-label">
                {isAdding ? (
                  "Adding…"
                ) : successMessage ? (
                  successMessage
                ) : (
                  "Move to Bag"
                )}
              </span>
            </button>
          )}
        </div>

        {showQuickAdd &&
          (showAsModal ? (
            <Modal
              isOpen={showQuickAdd}
              close={() => {
                setShowQuickAdd(false)
                setSelectedOptions({})
              }}
              size="xsmall"
              square
            >
              <Modal.Body>
                <div className="wishlist-item__quick-add text-left">
                  <QuickAddContent
                    product={product}
                    selectedOptions={selectedOptions}
                    setOptionValue={setOptionValue}
                    handleAddToCart={handleMoveToCart}
                    isAdding={isAdding}
                    showError={showError}
                    onClose={() => {
                      setShowQuickAdd(false)
                      setSelectedOptions({})
                      setQuantity(1)
                    }}
                    isMobile={true}
                    selectedVariantPrice={selectedVariantPrice}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    cart={cart}
                  />
                </div>
              </Modal.Body>
            </Modal>
          ) : (
            <div
              className="wishlist-item__quick-add-panel absolute inset-x-0 bottom-0 z-[25] text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <QuickAddContent
                product={product}
                selectedOptions={selectedOptions}
                setOptionValue={setOptionValue}
                handleAddToCart={handleMoveToCart}
                isAdding={isAdding}
                showError={showError}
                onClose={() => {
                  setShowQuickAdd(false)
                  setSelectedOptions({})
                  setQuantity(1)
                }}
                isMobile={false}
                selectedVariantPrice={selectedVariantPrice}
                quantity={quantity}
                setQuantity={setQuantity}
                cart={cart}
              />
            </div>
          ))}
      </article>
    </>
  )
}

export default WishlistItem
