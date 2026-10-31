"use client"

import { useProductListing } from "@modules/store/hooks/use-product-listing"
import ProductCard from "@registry/components/product-card"
import { Pagination } from "@modules/store/components/pagination"
import StoreHeader from "@modules/store/components/store-header"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

export const ClientPaginatedProductsInner = ({
  sortBy,
  initialPage,
  collectionId,
  categoryId,
  productsIds,
  gender,
  type,
  material,
  color,
  min_price,
  max_price,
  q,
  countryCode,
  region,
}: {
  sortBy?: string
  initialPage?: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  gender?: string
  type?: string
  material?: string
  color?: string
  min_price?: string
  max_price?: string
  q?: string
  countryCode: string
  region: any
}) => {
  const { products, count, isLoading, totalPages, currentPage } =
    useProductListing({
      sortBy,
      initialPage: initialPage ?? 1,
      limit: PRODUCT_LIMIT,
      collectionId,
      categoryId,
      productsIds,
      gender,
      type,
      material,
      color,
      minPrice: min_price,
      maxPrice: max_price,
      q,
      countryCode,
    })

  return (
    <>
      <StoreHeader sortBy={(sortBy || "created_at") as SortOptions} productCount={count} q={q} />
      {isLoading ? (
        <div className="w-full flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <ul
          className="store-page__products-grid"
          data-testid="products-list"
        >
          {products.map((p) => (
            <li key={p.id} className="w-full min-w-0">
              <ProductCard product={p as any} region={region} showWishlistIcon />
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={currentPage}
          totalPages={totalPages}
        />
      )}
    </>
  )
}


export default function ClientPaginatedProducts(props: any) {
  return (
    <ClientPaginatedProductsInner {...props} />
  )
}
