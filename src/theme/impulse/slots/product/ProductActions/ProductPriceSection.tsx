import {
  formatDisplayPrice,
  formatINRPrice,
  type VariantPrice,
} from "@core/domain/product/pricing"

type ProductPriceSectionProps = {
  displayPrice: VariantPrice
  quantityInCart: number
}

export function ProductPriceSection({
  displayPrice,
  quantityInCart,
}: ProductPriceSectionProps) {
  const originalPrice = displayPrice?.original_price_number
  const currentPrice = displayPrice?.calculated_price_number
  const discountPercentage =
    originalPrice && currentPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null

  return (
    <div className="product-price">
      <div className="product-price__row">
        <div className="product-price__main">
          <span className="product-price__current">
            {formatDisplayPrice(displayPrice, currentPrice)}
          </span>
          {originalPrice && currentPrice && originalPrice > currentPrice && (
            <>
              <span className="product-price__mrp">
                MRP {formatINRPrice(originalPrice)}
              </span>
              {discountPercentage !== null && (
                <span className="product-price__discount">
                  ({discountPercentage}% OFF)
                </span>
              )}
            </>
          )}
        </div>

        {quantityInCart > 0 && (
          <span className="product-price__in-bag">
            {quantityInCart} in bag
          </span>
        )}
      </div>
      <p className="product-price__tax">inclusive of all taxes</p>
    </div>
  )
}
