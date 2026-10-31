import { listStoreProductsWithSort } from "@lib/data/store-products"
import { sortStoreProducts } from "@lib/util/store-product-sort"
import { storefrontConfig } from "@storefront-config"
import { HttpTypes } from "@medusajs/types"

const BESTSELLER_TAG_CANDIDATES = [
  "bestseller",
  "best-seller",
  "best seller",
]

async function fetchProductsByTag(
  countryCode: string,
  tagValue: string,
  limit: number
): Promise<HttpTypes.StoreProduct[]> {
  const result = await listStoreProductsWithSort({
    page: 1,
    queryParams: {
      tags: [tagValue] as unknown as string[],
      limit,
    } as HttpTypes.FindParams & HttpTypes.StoreProductParams,
    sortBy: "created_at_desc",
    countryCode,
  }).catch(() => null)

  if (result?.response.products?.length) {
    return sortStoreProducts(result.response.products, "created_at_desc").slice(
      0,
      limit
    )
  }

  return []
}

export async function getBestsellerProducts(
  countryCode: string,
  limit = 12
): Promise<HttpTypes.StoreProduct[]> {
  const primaryTag = storefrontConfig.homeProductTags?.bestsellers?.trim()
  if (primaryTag) {
    const primary = await fetchProductsByTag(countryCode, primaryTag, limit)
    if (primary.length) {
      return primary
    }
  }

  for (const tagValue of BESTSELLER_TAG_CANDIDATES) {
    if (tagValue === primaryTag) {
      continue
    }
    const products = await fetchProductsByTag(countryCode, tagValue, limit)
    if (products.length) {
      return products
    }
  }

  return []
}
