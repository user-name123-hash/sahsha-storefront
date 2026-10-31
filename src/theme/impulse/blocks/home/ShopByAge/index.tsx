import { listProducts } from "@core/data/products"
import { getRegion } from "@core/data/regions"
import { fetchRatings } from "@core/data/reviews"
import type { ProductCardRating } from "@core/types/product-card"
import { slimProductsForCard, slimRegion } from "@lib/slim-home-payload"
import { HttpTypes } from "@medusajs/types"
import { storefrontConfig } from "@storefront-config"
import CollectionsShowcaseClient from "./collections-showcase-client"
import type { CollectionTab } from "./collections-showcase-types"

type ShopByAgeProps = {
  collections: HttpTypes.StoreCollection[]
  /** Prefetched by loadHomeData — when set, skip network (same UI). */
  productsByCollection?: Record<string, HttpTypes.StoreProduct[]>
  region?: HttpTypes.StoreRegion
  countryCode?: string
  ratings?: ProductCardRating[]
}

const FEATURED_TAB_COUNT = 3
const PRODUCTS_PER_COLLECTION = 4

function normalizeCollectionKey(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "")
}

function getCollectionMetadata(collection: HttpTypes.StoreCollection) {
  return (collection.metadata || {}) as Record<string, unknown>
}

function isHomeFeatured(collection: HttpTypes.StoreCollection) {
  const value = getCollectionMetadata(collection).home_featured
  return value === true || value === "true" || value === "1"
}

function getHomeSort(collection: HttpTypes.StoreCollection) {
  const raw = getCollectionMetadata(collection).home_sort
  const num = Number.parseInt(String(raw ?? ""), 10)
  return Number.isFinite(num) ? num : 999
}

function pickFeaturedFromMetadata(collections: HttpTypes.StoreCollection[]) {
  return collections
    .filter(isHomeFeatured)
    .sort((a, b) => getHomeSort(a) - getHomeSort(b))
    .slice(0, FEATURED_TAB_COUNT)
}

function pickFeaturedFromConfig(collections: HttpTypes.StoreCollection[]) {
  const configuredHandles = storefrontConfig.homeFeaturedCollectionHandles ?? []
  if (!configuredHandles.length) {
    return []
  }

  const picked: HttpTypes.StoreCollection[] = []

  for (const handle of configuredHandles) {
    const key = normalizeCollectionKey(handle)
    const found = collections.find((collection) => {
      const byHandle = normalizeCollectionKey(collection.handle || "")
      const byTitle = normalizeCollectionKey(collection.title || "")
      return byHandle === key || byTitle === key
    })

    if (found && !picked.some((item) => item.id === found.id)) {
      picked.push(found)
    }
  }

  return picked
}

function pickFeaturedCollections(collections: HttpTypes.StoreCollection[]) {
  const fromMetadata = pickFeaturedFromMetadata(collections)
  if (fromMetadata.length > 0) {
    return fromMetadata
  }

  const fromConfig = pickFeaturedFromConfig(collections)
  if (fromConfig.length > 0) {
    return fromConfig
  }

  return collections.slice(0, FEATURED_TAB_COUNT)
}

const ShopByAge = async ({
  collections: fallbackCollections,
  productsByCollection: productsByCollectionProp,
  region: regionFromProps,
  countryCode: countryCodeProp,
  ratings: ratingsFromProps,
}: ShopByAgeProps) => {
  const collections = fallbackCollections

  if (!collections || collections.length === 0) {
    return null
  }

  let region = regionFromProps

  if (!region) {
    const countryCode = countryCodeProp?.toLowerCase() || "in"
    region = (await getRegion(countryCode)) ?? undefined
  }

  if (!region) {
    return null
  }

  const featuredCollections = pickFeaturedCollections(collections)
  const tabs: CollectionTab[] = featuredCollections.map((collection) => ({
    id: collection.id,
    title: collection.title || "Collection",
  }))

  let productsByCollection: Record<string, HttpTypes.StoreProduct[]>
  let fetchedRatings: ProductCardRating[]

  if (productsByCollectionProp) {
    productsByCollection = productsByCollectionProp
    fetchedRatings = (ratingsFromProps || []) as ProductCardRating[]
  } else {
    const [productGroups, ratings] = await Promise.all([
      Promise.all(
        featuredCollections.map(async (collection) => {
          try {
            const { response } = await listProducts({
              regionId: region.id,
              queryParams: {
                collection_id: collection.id,
                limit: PRODUCTS_PER_COLLECTION,
                fields: "*variants.calculated_price",
              },
            })

            return {
              collectionId: collection.id,
              products: response.products ?? [],
            }
          } catch {
            return {
              collectionId: collection.id,
              products: [] as HttpTypes.StoreProduct[],
            }
          }
        })
      ),
      ratingsFromProps
        ? Promise.resolve(ratingsFromProps)
        : fetchRatings().catch(() => [] as ProductCardRating[]),
    ])

    productsByCollection = productGroups.reduce<
      Record<string, HttpTypes.StoreProduct[]>
    >((acc, group) => {
      acc[group.collectionId] = slimProductsForCard(group.products)
      return acc
    }, {})
    fetchedRatings = ratings as ProductCardRating[]
  }

  const visibleProductIds = new Set(
    Object.values(productsByCollection)
      .flat()
      .map((product) => product.id)
      .filter((id): id is string => Boolean(id))
  )
  const visibleRatings = fetchedRatings.filter((rating) =>
    visibleProductIds.has(rating.product_id)
  )

  const compactRegion = slimRegion(region)

  return (
    <section className="collections-showcase w-full bg-page-bg">
      <div
        className="collections-showcase__inner mx-auto"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <header className="collections-showcase__header">
          <p className="collections-showcase__eyebrow">What&apos;s new</p>
        </header>

        <CollectionsShowcaseClient
          tabs={tabs}
          productsByCollection={productsByCollection}
          region={compactRegion}
          ratings={visibleRatings}
        />
      </div>
    </section>
  )
}

export default ShopByAge
