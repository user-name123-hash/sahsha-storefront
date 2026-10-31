import { listProducts } from "@core/data/products"
import { getRegion } from "@core/data/regions"
import type { ProductCardRating } from "@core/types/product-card"
import { slimProductsForCard, slimRegion } from "@lib/slim-home-payload"
import { HttpTypes } from "@medusajs/types"
import RelatedProductsCarousel from "./carousel"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

function ratingFromProduct(
  item: HttpTypes.StoreProduct
): ProductCardRating | undefined {
  const extended = item as HttpTypes.StoreProduct & {
    average_rating?: number
    total_rating_count?: number
  }
  const average = Number(extended.average_rating) || 0
  const total = Number(extended.total_rating_count) || 0
  if (average <= 0 && total <= 0) {
    return undefined
  }
  return {
    product_id: item.id,
    average_rating: average,
    total_reviews: total,
  }
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const baseParams: HttpTypes.StoreProductListParams = {
    limit: 20,
    is_giftcard: false,
    region_id: region.id,
    fields:
      "*variants.calculated_price,*images,+variants.inventory_quantity,+metadata,+tags,+average_rating,+total_rating_count",
  }

  let products: HttpTypes.StoreProduct[] = []

  if (product.collection_id) {
    const fallbackPromise = listProducts({
      queryParams: baseParams,
      countryCode,
    }).catch(() => null)

    const collectionResult = await listProducts({
      queryParams: {
        ...baseParams,
        collection_id: [product.collection_id],
      },
      countryCode,
    }).catch(() => null)

    products = collectionResult?.response?.products || []

    if (products.length < 5) {
      const fallbackResult = await fallbackPromise
      const fallbackProducts = fallbackResult?.response?.products || []
      const seen = new Set(products.map((item) => item.id))
      for (const item of fallbackProducts) {
        if (!seen.has(item.id)) {
          products.push(item)
          seen.add(item.id)
        }
      }
    }
  } else {
    const fallbackResult = await listProducts({
      queryParams: baseParams,
      countryCode,
    }).catch(() => null)
    products = fallbackResult?.response?.products || []
  }

  const related = products.filter((item) => item.id !== product.id)

  if (!related.length) {
    return null
  }

  const ratings = related
    .map(ratingFromProduct)
    .filter((rating): rating is ProductCardRating => Boolean(rating))

  return (
    <RelatedProductsCarousel
      region={slimRegion(region)}
      products={slimProductsForCard(related)}
      ratings={ratings}
    />
  )
}
