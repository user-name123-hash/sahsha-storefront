"use client"

import { HttpTypes } from "@medusajs/types"
import ShareButton from "@modules/common/components/product/share-button"
import WishlistIcon from "@modules/common/components/product/wishlist-icon"

type ProductGalleryOverlayActionsProps = {
  product: HttpTypes.StoreProduct
}

export default function ProductGalleryOverlayActions({
  product,
}: ProductGalleryOverlayActionsProps) {
  if (!product.id) return null

  return (
    <div className="product-gallery__overlay-actions" aria-label="Product actions">
      <WishlistIcon productId={product.id} />
      <ShareButton
        productTitle={product.title ?? ""}
        productHandle={product.handle ?? ""}
      />
    </div>
  )
}
