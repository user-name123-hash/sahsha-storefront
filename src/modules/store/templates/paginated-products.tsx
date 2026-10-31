import { getRegion } from "@core/data/regions"
import { fetchRatings } from "@core/data/reviews"
import { buildStoreProductQueryParams } from "@lib/data/store-filters"
import { listStoreProductsWithSort } from "@lib/data/store-products"
import { slimProductsForCard, slimRegion } from "@lib/slim-home-payload"
import ProductCard from "@registry/components/product-card"
import ProductListViewTracker from "@modules/store/components/product-list-view-tracker"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreHeader from "@modules/store/components/store-header"
import type { AnalyticsProduct } from "@core/analytics/types"
import { HttpTypes } from "@medusajs/types"

const PRODUCT_LIMIT = 12

function toAnalyticsProducts(
  products: HttpTypes.StoreProduct[]
): AnalyticsProduct[] {
  return products.map((product) => ({
    id: product.id!,
    title: product.title ?? undefined,
    variants: product.variants?.map((variant) => ({
      id: variant.id!,
      title: variant.title ?? undefined,
      calculated_price: (
        variant as {
          calculated_price?: {
            calculated_amount?: number
            currency_code?: string
          }
        }
      ).calculated_price,
    })),
  }))
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  color,
  size,
  metadataParams,
  min_price,
  max_price,
  q,
  filterProps,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  color?: string
  size?: string
  metadataParams?: Record<string, string | undefined>
  min_price?: string
  max_price?: string
  q?: string
  filterProps?: Record<string, unknown>
}) {
  const queryParams = buildStoreProductQueryParams({
    limit: PRODUCT_LIMIT,
    collectionId,
    categoryId,
    productsIds,
    color,
    size,
    metadataParams,
    min_price,
    max_price,
    q,
  })

  const [region, allRatings, productResult] = await Promise.all([
    getRegion(countryCode),
    fetchRatings().catch(() => []),
    listStoreProductsWithSort({
      page,
      queryParams,
      sortBy,
      countryCode,
    }),
  ])

  if (!region) {
    return null
  }

  const products = slimProductsForCard(productResult.response.products)
  const count = productResult.response.count
  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const compactRegion = slimRegion(region)

  return (
    <>
      <ProductListViewTracker
        products={toAnalyticsProducts(products)}
        listId={collectionId ?? categoryId ?? "store"}
        listName={collectionId ? "Collection" : categoryId ? "Category" : "Store"}
      />
      <StoreHeader sortBy={sortBy || "created_at_desc"} productCount={count} filterProps={filterProps} />
      <ul
        className="store-page__products-grid"
        data-testid="products-list"
      >
        {products.map((p) => {
          const productRating = allRatings.find((r: { product_id?: string }) => r.product_id === p.id)
          return (
            <li key={p.id} className="w-full min-w-0">
              <ProductCard
                product={p as HttpTypes.StoreProduct}
                region={compactRegion}
                rating={productRating}
                showWishlistIcon
              />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
