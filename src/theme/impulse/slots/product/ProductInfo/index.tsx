import { HttpTypes } from "@medusajs/types"
import ProductRating from "@modules/common/components/product/product-rating"
import ShareButton from "@modules/common/components/product/share-button"
import WishlistIcon from "@modules/common/components/product/wishlist-icon"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const metadataBrand = product.metadata?.brand as string | undefined
  const brand = metadataBrand || product.collection?.title || "Sahsha"

  return (
    <div id="product-info" className="product-info">
      <p className="product-info__brand">{brand}</p>

      <div className="product-info__title-row">
        <h1 className="product-info__title" data-testid="product-title">
          {product.title}
        </h1>
        <div className="product-info__actions">
          {product.id && <WishlistIcon productId={product.id} />}
          <ShareButton
            productTitle={product.title ?? ""}
            productHandle={product.handle ?? ""}
          />
        </div>
      </div>

      <ProductRating product={product} showButton={false} variant="badge" />
    </div>
  )
}
