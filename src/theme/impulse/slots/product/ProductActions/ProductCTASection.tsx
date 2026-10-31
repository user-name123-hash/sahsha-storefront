"use client"

import { useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { scrollToRelatedProducts } from "@lib/scroll-to-related-products"
import type { ProductOptions } from "@core/domain/product/variant-selection"

export type ProductCTASectionProps = {
  product: HttpTypes.StoreProduct
  selectedVariant?: HttpTypes.StoreProductVariant
  options: ProductOptions
  isValidVariant: boolean
  disabled?: boolean
  inStock: boolean
  inventoryLimit: number | null
  quantity: number
  setQuantity: (value: number) => void
  quantityInCart: number
  variantInCart: HttpTypes.StoreCartLineItem | undefined
  isAdding: boolean
  isBuyingNow: boolean
  showNotifyMessage: boolean
  setShowNotifyMessage: (v: boolean) => void
  handleAddToCart: () => void
  handleBuyNow: () => void
  handleIncreaseQuantity: () => void
  handleDecreaseQuantity: () => void
}

const btnBase =
  "product-cta-btn h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"

export function ProductCTASection(props: ProductCTASectionProps) {
  const router = useRouter()
  const {
    product,
    selectedVariant,
    options,
    isValidVariant,
    disabled,
    inStock,
    inventoryLimit,
    quantity,
    setQuantity,
    quantityInCart,
    variantInCart,
    isAdding,
    isBuyingNow,
    showNotifyMessage,
    setShowNotifyMessage,
    handleAddToCart,
    handleBuyNow,
  } = props

  const addToCartDisabled =
    !inStock ||
    !!disabled ||
    isAdding ||
    isBuyingNow ||
    (!isValidVariant && product.options?.every((opt) => options[opt.id]))

  const addToCartLabel =
    !selectedVariant || !isValidVariant
      ? product.options?.every((opt) => options[opt.id])
        ? "Unavailable"
        : "Select options"
      : !inStock
        ? inventoryLimit !== null &&
          inventoryLimit + quantityInCart > 0 &&
          quantity > inventoryLimit
          ? inventoryLimit <= 0
            ? "Sold out"
            : "Max quantity reached"
          : "Sold out"
        : `Add to Cart${quantity > 1 ? ` (${quantity})` : ""}`

  if (!inStock && selectedVariant) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <p className="text-sm font-medium text-brand-sale uppercase tracking-[var(--letter-spacing-nav)]">
          Sold out
        </p>

        {showNotifyMessage ? (
          <div className="border border-[var(--color-header-border)] p-5 flex flex-col gap-3">
            <p className="text-sm text-body">
              We&apos;ll notify you when this item is back in stock.
            </p>
            <button
              onClick={() => {
                if (!scrollToRelatedProducts()) {
                  router.push("/store")
                }
              }}
              className="text-sm font-medium underline underline-offset-4 text-heading hover:opacity-70 w-fit"
            >
              Browse similar products
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNotifyMessage(true)}
            className={`${btnBase} w-full bg-brand-accent text-inverse hover:bg-brand-accent-hover`}
          >
            Notify me when available
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {inventoryLimit !== null && inventoryLimit > 0 && inventoryLimit <= 5 && (
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-600 text-right">
          Hurry! Only {inventoryLimit} left
        </p>
      )}

      {variantInCart && quantityInCart > 0 && (
        <div className="product-cta-cart-notice" role="status">
          <span className="product-cta-cart-notice__icon" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </span>
          <span className="product-cta-cart-notice__text">
            Already in your cart —{" "}
            <strong>
              {quantityInCart} {quantityInCart === 1 ? "item" : "items"}
            </strong>
          </span>
        </div>
      )}

      <div className="flex items-stretch gap-3 w-full">
        <div className="flex h-12 shrink-0 w-[120px] items-center border border-[var(--color-header-border)] rounded-full overflow-hidden bg-surface">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            className="w-10 h-full flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
          >
            −
          </button>
          <span className="flex-1 text-center font-semibold text-gray-900">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => {
              if (inventoryLimit === null || quantity < inventoryLimit) {
                setQuantity(quantity + 1)
              }
            }}
            disabled={inventoryLimit !== null && quantity >= inventoryLimit}
            className="w-10 h-full flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={addToCartDisabled}
          className={`${btnBase} flex-1 min-w-0 product-cta-btn--secondary`}
          data-testid="add-product-button"
          data-ga-event="add_to_bag_click"
          data-ga-label={product.title || "Product"}
        >
          {isAdding ? (
            <span className="product-cta-btn__label">
              <Spinner />
            </span>
          ) : (
            <span className="product-cta-btn__label">{addToCartLabel}</span>
          )}
        </button>
      </div>

      <button
        onClick={handleBuyNow}
        disabled={
          !inStock ||
          !!disabled ||
          isAdding ||
          isBuyingNow ||
          (!isValidVariant && product.options?.every((opt) => options[opt.id]))
        }
        className={`${btnBase} w-full product-cta-btn--primary`}
      >
        {isBuyingNow ? (
          <span className="product-cta-btn__label">
            <Spinner />
          </span>
        ) : (
          <span className="product-cta-btn__label">Buy It Now</span>
        )}
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
