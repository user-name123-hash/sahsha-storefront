import { listProducts } from "@core/data/products"
import { storefrontConfig } from "@storefront-config"
import { HttpTypes } from "@medusajs/types"

export const FEATURED_COLLECTION_COUNT = 3
export const PRODUCTS_PER_COLLECTION = 4

function normalizeCollectionKey(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "")
}

export function pickFeaturedCollections(
  collections: HttpTypes.StoreCollection[]
): HttpTypes.StoreCollection[] {
  const fromMetadata = collections
    .filter((collection) => {
      const value = (collection.metadata || {}).home_featured
      return value === true || value === "true" || value === "1"
    })
    .sort((a, b) => {
      const aSort = Number.parseInt(String((a.metadata || {}).home_sort ?? ""), 10)
      const bSort = Number.parseInt(String((b.metadata || {}).home_sort ?? ""), 10)
      return (Number.isFinite(aSort) ? aSort : 999) - (Number.isFinite(bSort) ? bSort : 999)
    })
    .slice(0, FEATURED_COLLECTION_COUNT)

  if (fromMetadata.length > 0) {
    return fromMetadata
  }

  const configuredHandles = storefrontConfig.homeFeaturedCollectionHandles ?? []
  const fromConfig: HttpTypes.StoreCollection[] = []

  for (const handle of configuredHandles) {
    const key = normalizeCollectionKey(handle)
    const found = collections.find((collection) => {
      const byHandle = normalizeCollectionKey(collection.handle || "")
      const byTitle = normalizeCollectionKey(collection.title || "")
      return byHandle === key || byTitle === key
    })

    if (found && !fromConfig.some((item) => item.id === found.id)) {
      fromConfig.push(found)
    }
  }

  if (fromConfig.length > 0) {
    return fromConfig.slice(0, FEATURED_COLLECTION_COUNT)
  }

  return collections.slice(0, FEATURED_COLLECTION_COUNT)
}

export async function fetchCollectionProducts(
  collectionId: string,
  regionId: string
): Promise<HttpTypes.StoreProduct[]> {
  try {
    const { response } = await listProducts({
      regionId,
      queryParams: {
        collection_id: collectionId,
        limit: PRODUCTS_PER_COLLECTION,
        fields:
          "*variants.calculated_price,+average_rating,+total_rating_count,*variants.images,*variants.thumbnail",
      },
    })
    return response.products ?? []
  } catch {
    return []
  }
}
