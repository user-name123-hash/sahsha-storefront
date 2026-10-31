import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import ShopPageBanner from "@modules/store/components/shop-page-banner"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type StorePageProps = {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  collections?: HttpTypes.StoreCollection[]
  collection?: string | string[]
  category?: string | string[]
  color?: string | string[]
  size?: string | string[]
  metadataSearchParams?: Record<string, string | string[]>
  metadataParams?: Record<string, string | undefined>
  minPrice?: string
  maxPrice?: string
  colorOptions?: { value: string; label: string; hex?: string }[]
  sizeOptions?: { value: string; label: string }[]
  metadataFilters?: {
    param: string
    title: string
    options: { value: string; label: string }[]
  }[]
  categoryOptions?: { value: string; label: string }[]
  q?: string
}

export default function StorePage({
  sortBy,
  page,
  countryCode,
  collections,
  collection,
  category,
  color,
  size,
  metadataSearchParams = {},
  metadataParams = {},
  minPrice,
  maxPrice,
  colorOptions,
  sizeOptions,
  metadataFilters,
  categoryOptions,
  q,
}: StorePageProps) {
  const pageNumber = page ? parseInt(page, 10) : 1
  const sort = sortBy || "created_at_desc"

  const filterProps = {
    sortBy: sort,
    collections,
    collectionValue: collection,
    categoryValue: category,
    categoryOptions,
    colorValue: color,
    sizeValue: size,
    metadataValues: metadataSearchParams,
    minPrice,
    maxPrice,
    colorOptions,
    sizeOptions,
    metadataFilters,
    q,
  }

  return (
    <div className="store-page min-h-screen bg-white">
      <ShopPageBanner />

      <div className="store-page__container">
        <nav className="store-page__breadcrumb hidden lg:flex" aria-label="Breadcrumb">
          <LocalizedClientLink href="/">Home</LocalizedClientLink>
          <span aria-hidden>/</span>
          <span>Shop</span>
        </nav>

        <div className="store-page__layout">
          <aside className="store-page__sidebar">
            <RefinementList {...filterProps} />
          </aside>

          <div className="store-page__main">
            {q && (
              <div className="store-page__search-banner">
                <span>
                  Results for <strong>&ldquo;{q}&rdquo;</strong>
                </span>
                <LocalizedClientLink href="/store">Clear</LocalizedClientLink>
              </div>
            )}

            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                countryCode={countryCode}
                collectionId={
                  Array.isArray(collection) ? collection.join(",") : collection
                }
                categoryId={Array.isArray(category) ? category.join(",") : category}
                color={Array.isArray(color) ? color.join(",") : color}
                size={Array.isArray(size) ? size.join(",") : size}
                metadataParams={metadataParams}
                min_price={minPrice}
                max_price={maxPrice}
                q={q}
                filterProps={filterProps}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
