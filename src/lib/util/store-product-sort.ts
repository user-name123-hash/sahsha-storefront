import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const DEFAULT_STORE_SORT: SortOptions = "created_at_desc"

export function resolveStoreSort(sortBy?: SortOptions): SortOptions {
  if (!sortBy || sortBy === "created_at") {
    return DEFAULT_STORE_SORT
  }

  return sortBy
}

/** Medusa store API order string (e.g. `-created_at` = newest first). */
export function toMedusaProductOrder(sortBy?: SortOptions): string {
  switch (resolveStoreSort(sortBy)) {
    case "created_at_asc":
      return "created_at"
    case "price_asc":
    case "price_desc":
      // Store API does not support price ordering — sorted client-side instead.
      return "-created_at"
    case "created_at_desc":
    default:
      return "-created_at"
  }
}

type MinPricedProduct = HttpTypes.StoreProduct & { _minPrice?: number }

export function sortStoreProducts(
  products: HttpTypes.StoreProduct[],
  sortBy?: SortOptions
): HttpTypes.StoreProduct[] {
  const resolved = resolveStoreSort(sortBy)

  if (resolved === "bestsellers") {
    return products
  }

  const sorted = [...products] as MinPricedProduct[]

  if (resolved === "created_at_asc") {
    return sorted.sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime()
    )
  }

  if (resolved === "created_at_desc") {
    return sorted.sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    )
  }

  if (resolved === "price_asc" || resolved === "price_desc") {
    sorted.forEach((product) => {
      if (product.variants?.length) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) => variant?.calculated_price?.calculated_amount || 0
          )
        )
      } else {
        product._minPrice = Infinity
      }
    })

    return sorted.sort((a, b) => {
      const diff = (a._minPrice ?? 0) - (b._minPrice ?? 0)
      return resolved === "price_asc" ? diff : -diff
    })
  }

  return sorted
}
