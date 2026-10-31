"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { buildStoreProductQueryParams } from "@lib/data/store-filters"
import { listStoreProductsWithSort } from "@lib/data/store-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type UseProductListingOptions = {
  sortBy?: string
  initialPage?: number
  limit?: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  gender?: string
  type?: string
  material?: string
  color?: string
  minPrice?: string
  maxPrice?: string
  q?: string
  countryCode: string
}

export function useProductListing({
  sortBy,
  initialPage = 1,
  limit = 12,
  collectionId,
  categoryId,
  productsIds,
  gender,
  type,
  material,
  color,
  minPrice,
  maxPrice,
  q,
  countryCode,
}: UseProductListingOptions) {
  const searchParams = useSearchParams()
  const pageParam = parseInt(searchParams.get("page") || String(initialPage), 10)
  const currentPage =
    Number.isFinite(pageParam) && pageParam > 0 ? pageParam : initialPage

  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const metadataParams: Record<string, string | undefined> = {}
    if (gender) metadataParams.gender = gender
    if (type) metadataParams.type = type
    if (material) metadataParams.material = material

    const queryParams = buildStoreProductQueryParams({
      limit,
      collectionId,
      categoryId,
      productsIds,
      color,
      min_price: minPrice,
      max_price: maxPrice,
      q,
      metadataParams,
    })

    setIsLoading(true)

    listStoreProductsWithSort({
      page: currentPage,
      queryParams,
      sortBy: sortBy as SortOptions | undefined,
      countryCode,
    })
      .then(({ response }) => {
        if (cancelled) return
        setProducts(response.products)
        setCount(response.count)
      })
      .catch(() => {
        if (cancelled) return
        setProducts([])
        setCount(0)
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    collectionId,
    categoryId,
    color,
    countryCode,
    currentPage,
    gender,
    limit,
    material,
    maxPrice,
    minPrice,
    productsIds,
    q,
    sortBy,
    type,
  ])

  const totalPages = Math.max(1, Math.ceil(count / limit))

  return {
    products,
    count,
    isLoading,
    totalPages,
    currentPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}
