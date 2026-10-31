"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice, getPricesForVariant } from "@core/util/get-product-price"
import { convertToLocale } from "@core/util/money"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import ProductCardRatingDisplay from "@modules/common/components/product/product-card-rating"
import ProductCardColorSwatches, {
  getProductColorVariants,
  getVariantCardImage,
} from "@modules/common/components/product/product-card-color-swatches"
import WishlistIcon from "@modules/common/components/product/wishlist-icon"
import { useProductQuickAdd } from "@modules/wishlist/components/product-quick-add"
import { clx } from "@lib/util/clx"
import type { ProductCardProps } from "@core/types/product-card"
import { productCardImageDeliveryProps } from "@lib/product-card-image-delivery"
import { productCardImageProps } from "@lib/product-image"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"
import { ImageLoader } from "@modules/loaders"

const QuickAddContent = dynamic(
  () =>
    import("@modules/wishlist/components/product-quick-add").then(
      (mod) => mod.QuickAddContent
    ),
  { ssr: false }
)

type Props = ProductCardProps & {
  imageClassName?: string
  quickAddClassName?: string
  showWishlistIcon?: boolean
  /** Eager/high-priority primary thumbnail (home rails). */
  imagePriority?: boolean
}

export default function ProductCard({
  product,
  region,
  className,
  imageClassName,
  quickAddClassName,
  showWishlistIcon,
  imagePriority = false,
  rating,
}: Props) {
  const router = useRouter()
  const { countryCode } = useParams()
  const [imageHover, setImageHover] = useState(false)
  /** Mount hover image only after first hover so initial page load skips it. */
  const [hoverImageReady, setHoverImageReady] = useState(false)
  /** Keep primary visible until hover image has painted — avoids blank card. */
  const [hoverImageLoaded, setHoverImageLoaded] = useState(false)
  const [isMobileSheet, setIsMobileSheet] = useState(false)
  const [sheetMounted, setSheetMounted] = useState(false)
  const colorVariants = useMemo(() => getProductColorVariants(product), [product])
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  const {
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
  } = useProductQuickAdd(product)

  useEffect(() => {
    setSheetMounted(true)
    const media = window.matchMedia("(max-width: 1023px)")
    const sync = () => setIsMobileSheet(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (!showQuickAdd || !isMobileSheet) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [showQuickAdd, isMobileSheet])

  const activeVariant = useMemo(() => {
    if (!selectedVariantId) {
      return null
    }

    return product.variants?.find((variant) => variant.id === selectedVariantId) ?? null
  }, [product.variants, selectedVariantId])

  const thumbnail = activeVariant
    ? getVariantCardImage(activeVariant, product)
    : product.thumbnail
  const secondImage = activeVariant?.images?.[1]?.url ?? product.images?.[1]?.url

  useEffect(() => {
    setHoverImageLoaded(false)
    setHoverImageReady(false)
  }, [secondImage])

  const productHref = activeVariant
    ? `/products/${product.handle}?v_id=${activeVariant.id}`
    : `/products/${product.handle}`

  const displayPrice = useMemo(() => {
    if (activeVariant) {
      return getPricesForVariant(activeVariant) ?? getProductPrice({ product }).cheapestPrice
    }

    return getProductPrice({ product }).cheapestPrice
  }, [activeVariant, product])

  const priceLabel = useMemo(() => {
    if (!displayPrice) return null
    return convertToLocale({
      amount: displayPrice.calculated_price_number,
      currency_code: displayPrice.currency_code,
    }).replace(/\.00\b/, "")
  }, [displayPrice])

  const compareLabel = useMemo(() => {
    if (!displayPrice?.original_price_number) return null
    if (displayPrice.calculated_price_number >= displayPrice.original_price_number)
      return null
    return convertToLocale({
      amount: displayPrice.original_price_number,
      currency_code: displayPrice.currency_code,
    }).replace(/\.00\b/, "")
  }, [displayPrice])

  const discountPercent = useMemo(() => {
    if (!displayPrice?.original_price_number) return null
    if (displayPrice.calculated_price_number >= displayPrice.original_price_number)
      return null

    const fromField = Number.parseInt(
      String(displayPrice.percentage_diff ?? "").replace(/\D/g, ""),
      10
    )
    if (fromField > 0) return fromField

    return Math.round(
      ((displayPrice.original_price_number - displayPrice.calculated_price_number) /
        displayPrice.original_price_number) *
        100
    )
  }, [displayPrice])

  const onQuickAdd = (e: React.MouseEvent) => {
    handleQuickAdd(e)
  }

  const handleSelectColorVariant = (variantId: string) => {
    setSelectedVariantId(variantId)

    const locale =
      typeof countryCode === "string"
        ? countryCode
        : Array.isArray(countryCode)
          ? countryCode[0]
          : ""

    if (locale && product.handle) {
      router.push(`/${locale}/products/${product.handle}?v_id=${variantId}`)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!showQuickAdd || !product.id || isMobileSheet) return
      const target = e.target as HTMLElement
      if (!target.closest(`[data-product-id="${product.id}"]`)) {
        closeQuickAdd()
      }
    }

    if (showQuickAdd && !isMobileSheet) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showQuickAdd, product.id, closeQuickAdd, isMobileSheet])

  const hideRatingBadge = imageHover || (showQuickAdd && !isMobileSheet)
  const showSecondImage =
    Boolean(secondImage) && imageHover && hoverImageReady && hoverImageLoaded

  const primaryImageProps = thumbnail
    ? productCardImageDeliveryProps(thumbnail, { priority: imagePriority })
    : null

  const quickAddContent = (
    <QuickAddContent
      product={product}
      selectedOptions={selectedOptions}
      setOptionValue={setOptionValue}
      handleAddToCart={handleQuickAdd}
      isAdding={isAdding}
      showError={showError}
      onClose={closeQuickAdd}
      isMobile={isMobileSheet}
      selectedVariantPrice={selectedVariantPrice}
      quantity={quantity}
      setQuantity={setQuantity}
      cart={cart}
      actionLabel="Add to Bag"
    />
  )

  return (
    <article
      data-product-id={product.id}
      className={clx("product-card group flex flex-col w-full h-full relative", className)}
    >
      <LocalizedClientLink
        href={productHref}
        className="product-card__link flex flex-col h-full"
        data-testid="product-card"
      >
        <div
          className={clx(
            "product-card__media relative overflow-hidden bg-surface-muted",
            imageClassName
          )}
          onMouseEnter={() => {
            setImageHover(true)
            if (secondImage) setHoverImageReady(true)
          }}
          onMouseLeave={() => setImageHover(false)}
        >
          {thumbnail ? (
            <>
              <div
                className={clx(
                  "absolute inset-0 transition-opacity duration-500 pointer-events-none",
                  showSecondImage ? "opacity-0" : "opacity-100"
                )}
              >
                <ImageLoader
                  src={thumbnail}
                  alt={product.title || "Product"}
                  fill
                  quality={primaryImageProps?.quality ?? productCardImageProps.quality}
                  sizes={primaryImageProps?.sizes ?? productCardImageProps.sizes}
                  priority={primaryImageProps?.priority}
                  loading={primaryImageProps?.loading}
                  fetchPriority={primaryImageProps?.fetchPriority}
                  unoptimized={primaryImageProps?.unoptimized}
                  className="object-cover"
                />
              </div>
              {secondImage && hoverImageReady ? (
                <div
                  className={clx(
                    "absolute inset-0 transition-opacity duration-500 pointer-events-none",
                    showSecondImage ? "opacity-100" : "opacity-0"
                  )}
                >
                  <Image
                    src={secondImage}
                    alt={product.title || "Product"}
                    fill
                    quality={productCardImageProps.quality}
                    sizes={productCardImageProps.sizes}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    unoptimized={shouldUnoptimizeImage(secondImage)}
                    className="object-cover"
                    onLoad={() => setHoverImageLoaded(true)}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <PlaceholderImage size={48} />
            </div>
          )}

          <ProductCardRatingDisplay
            product={product}
            rating={rating}
            variant="overlay"
            hidden={hideRatingBadge}
          />

          <div
            className="product-card__actions"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            {showWishlistIcon && product.id && (
              <WishlistIcon productId={product.id} variant="card" />
            )}
            <button
              type="button"
              className="product-card__cart-btn"
              onClick={onQuickAdd}
              disabled={isAdding}
              aria-label={isAdding ? "Adding to cart" : "Add to cart"}
            >
              <span
                className="product-card__cart-icon"
                style={{
                  WebkitMaskImage: 'url("/shopping-cart.svg")',
                  maskImage: 'url("/shopping-cart.svg")',
                }}
                aria-hidden
              />
            </button>
          </div>

          {!showQuickAdd && (
            <div className="product-card__quick-add-wrap">
              <button
                type="button"
                onClick={onQuickAdd}
                disabled={isAdding}
                className={clx(
                  "product-card__quick-add w-full disabled:opacity-60",
                  quickAddClassName
                )}
              >
                <span className="product-card__quick-add-label">
                  {isAdding ? "Adding…" : "Quick add"}
                </span>
              </button>
            </div>
          )}

          {showQuickAdd && !isMobileSheet && (
            <div
              className="product-card__quick-add-panel"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              {quickAddContent}
            </div>
          )}
        </div>

        <div className="product-card__info flex-1">
          <h3 className="product-card__title text-heading group-hover:underline underline-offset-2">
            {product.title}
          </h3>
          {colorVariants.length > 1 && (
            <ProductCardColorSwatches
              product={product}
              selectedVariantId={selectedVariantId}
              onSelectVariant={handleSelectColorVariant}
            />
          )}
          <div className="product-card__prices">
            {priceLabel && (
              <span className="product-card__price">{priceLabel}</span>
            )}
            {compareLabel && (
              <span className="product-card__compare">{compareLabel}</span>
            )}
            {discountPercent != null && discountPercent > 0 && (
              <span className="product-card__discount">({discountPercent}% OFF)</span>
            )}
          </div>
        </div>
      </LocalizedClientLink>

      {sheetMounted &&
        showQuickAdd &&
        isMobileSheet &&
        createPortal(
          <div className="quick-add-sheet" role="dialog" aria-modal="true">
            <button
              type="button"
              className="quick-add-sheet__backdrop"
              aria-label="Close"
              onClick={closeQuickAdd}
            />
            <div
              className="quick-add-sheet__panel"
              onClick={(e) => e.stopPropagation()}
            >
              {quickAddContent}
            </div>
          </div>,
          document.body
        )}
    </article>
  )
}
