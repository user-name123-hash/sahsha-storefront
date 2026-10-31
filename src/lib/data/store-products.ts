"use server"

import { sdk } from "@core/config"
import { getAuthHeaders, getCacheOptions } from "@core/data/cookies"
import { getRegion } from "@core/data/regions"
import {
  resolveStoreSort,
  sortStoreProducts,
  toMedusaProductOrder,
} from "@lib/util/store-product-sort"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/** Filters that require medusa-product-helper (not core /store/products). */
const PRODUCT_HELPER_FILTER_KEYS = [
  "metadata",
  "min_price",
  "max_price",
  "q",
  "tags",
  "option_value",
  "style",
  "brand",
] as const

const STORE_PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.images,+variants.metadata,+variants.options,+metadata,+tags,+average_rating,+total_rating_count,+total_rating_sum,"

function hasAdvancedFilters(
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
) {
  if (!queryParams) return false

  return Object.keys(queryParams).some(
    (key) =>
      PRODUCT_HELPER_FILTER_KEYS.includes(
        key as (typeof PRODUCT_HELPER_FILTER_KEYS)[number]
      ) && (queryParams as Record<string, unknown>)[key] !== undefined
  )
}

function appendIdFilterParam(
  params: URLSearchParams,
  key: "collection_id" | "category_id",
  value: unknown
) {
  const ids = Array.isArray(value)
    ? value.map(String)
    : String(value)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
  ids.forEach((id) => params.append(`${key}[]`, id))
}

async function fetchStoreProducts({
  pageParam = 1,
  queryParams,
  countryCode,
  sortBy,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode: string
  sortBy?: SortOptions
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return { products: [], count: 0 }
  }

  const limit = queryParams?.limit || 12
  const page = Math.max(pageParam, 1)
  const offset = page === 1 ? 0 : (page - 1) * limit
  const resolvedSort = resolveStoreSort(sortBy)
  const medusaOrder = toMedusaProductOrder(resolvedSort)

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
  }

  const fetchCoreStoreProducts = async () => {
    const finalQuery: Record<string, unknown> = {
      limit,
      offset,
      region_id: region.id,
      order: medusaOrder,
      fields: STORE_PRODUCT_FIELDS,
    }

    const safeKeys = [
      "id",
      "handle",
      "status",
      "created_at",
      "updated_at",
      "type_id",
      "collection_id",
      "category_id",
    ]

    for (const key of safeKeys) {
      if (queryParams && (queryParams as Record<string, unknown>)[key]) {
        finalQuery[key] = (queryParams as Record<string, unknown>)[key]
      }
    }

    const { products, count } = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
      count: number
    }>("/store/products", {
      method: "GET",
      query: finalQuery,
      headers,
      next: { ...next, revalidate: 60 },
      cache: "force-cache",
    })

    return {
      products: sortStoreProducts(products || [], resolvedSort),
      count: count || 0,
    }
  }

  const useHelper = hasAdvancedFilters(queryParams)

  if (useHelper) {
    const params = new URLSearchParams()
    params.append("limit", limit.toString())
    params.append("offset", offset.toString())
    params.append("region_id", region.id)
    params.append("fields", STORE_PRODUCT_FIELDS)
    params.append("order", medusaOrder)

    for (const [key, value] of Object.entries(queryParams || {})) {
      if (
        [
          "metadata",
          "min_price",
          "max_price",
          "limit",
          "offset",
          "region_id",
          "fields",
          "order",
        ].includes(key)
      ) {
        continue
      }

      const values = Array.isArray(value) ? value : [value]
      const lowerKey = key.toLowerCase()

      if (key === "collection_id" || key === "category_id") {
        appendIdFilterParam(
          params,
          key,
          value
        )
      } else if (lowerKey === "color") {
        values.forEach((v) => params.append("option_value[]", String(v)))
      } else if (["style", "brand", "fabric"].includes(lowerKey)) {
        values.forEach((v) => params.append(`metadata[${lowerKey}]`, String(v)))
      } else if (Array.isArray(value)) {
        value.forEach((v) => params.append(`${key}[]`, String(v)))
      } else if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    }

    if ((queryParams as Record<string, unknown>)?.min_price) {
      params.append(
        "price_min",
        String((queryParams as Record<string, unknown>).min_price)
      )
    }
    if ((queryParams as Record<string, unknown>)?.max_price) {
      params.append(
        "price_max",
        String((queryParams as Record<string, unknown>).max_price)
      )
    }

    if ((queryParams as Record<string, unknown>)?.metadata) {
      for (const [key, value] of Object.entries(
        (queryParams as Record<string, Record<string, string | string[]>>)
          .metadata
      )) {
        const values = Array.isArray(value) ? value : [value]

        values.forEach((v) => {
          if (key.toLowerCase() === "color") {
            params.append("option_value[]", String(v))
          } else {
            params.append(`metadata[${key}]`, String(v))
          }
        })
      }
    }

    try {
      const { products, count } = await sdk.client.fetch<{
        products: HttpTypes.StoreProduct[]
        count: number
      }>(`/store/product-helper/products?${params.toString()}`, {
        method: "GET",
        headers,
        next: { ...next, revalidate: 60 },
        cache: "force-cache",
      })

      return {
        products: sortStoreProducts(products || [], resolvedSort),
        count: count || 0,
      }
    } catch (error) {
      console.warn(
        "[store-products] product-helper failed, falling back to /store/products:",
        error instanceof Error ? error.message : error
      )
      return fetchCoreStoreProducts()
    }
  }

  return fetchCoreStoreProducts()
}

const STORE_PRODUCT_BATCH_SIZE = 100

export async function listStoreProductsWithSort({
  page = 1,
  queryParams,
  sortBy,
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}) {
  const limit = queryParams?.limit || 12
  const { products, count } = await fetchStoreProducts({
    pageParam: page,
    queryParams,
    countryCode,
    sortBy,
  })

  const nextPage = count > page * limit ? page + 1 : null

  return {
    response: { products, count },
    nextPage,
    queryParams,
  }
}

/** Fetch every matching product for the shop grid (no pagination). */
export async function listAllStoreProductsWithSort({
  queryParams,
  sortBy,
  countryCode,
}: {
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductParams
  sortBy?: SortOptions
  countryCode: string
}) {
  const batchParams = {
    ...queryParams,
    limit: STORE_PRODUCT_BATCH_SIZE,
  }

  const allProducts: HttpTypes.StoreProduct[] = []
  const seen = new Set<string>()
  let totalCount = 0
  let page = 1

  while (page <= 50) {
    const { products, count } = await fetchStoreProducts({
      pageParam: page,
      queryParams: batchParams,
      countryCode,
      sortBy,
    })

    totalCount = count

    for (const product of products) {
      if (!product.id || seen.has(product.id)) continue
      seen.add(product.id)
      allProducts.push(product)
    }

    if (allProducts.length >= count || products.length === 0) {
      break
    }

    page += 1
  }

  const resolvedSort = resolveStoreSort(sortBy)

  return {
    response: {
      products: sortStoreProducts(allProducts, resolvedSort),
      count: totalCount || allProducts.length,
    },
    queryParams: batchParams,
  }
}
