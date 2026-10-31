import { listProducts } from "@core/data/products"
import { getWishlistProductIds } from "@core/data/wishlist"
import { slimProductsForCard, slimRegion } from "@lib/slim-home-payload"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductCard from "@registry/components/product-card"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  // Fetch wishlist IDs once for all products
  const wishlistProductIds = await getWishlistProductIds()
  const products = slimProductsForCard(pricedProducts)
  const compactRegion = slimRegion(region)

  return (
    <div className="content-container py-12 small:py-24">
      <div className="flex justify-between mb-8">
        <Text className="txt-xlarge">{collection.title}</Text>
        <InteractiveLink href={`/store?collection=${collection.id}`}>
          View all
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-24 small:gap-y-36">
        {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} region={compactRegion} isFeatured wishlistProductIds={wishlistProductIds} />
            </li>
          ))}
      </ul>
    </div>
  )
}
