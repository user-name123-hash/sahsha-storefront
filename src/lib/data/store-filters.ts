import Color from "color"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"
import { getRegion } from "@core/data/regions"
import {
  formatFilterLabel,
  getMetadataFieldLabel,
  SHOP_METADATA_FILTER_KEYS,
  type StoreFilterOption,
} from "@lib/store-filter-config"
import { PRODUCT_METADATA_FIELDS } from "@theme/slots/product/ProductActions/product-metadata-fields"

export type StoreFiltersResult = {
  genders: StoreFilterOption[]
  productTypes: StoreFilterOption[]
  materials: StoreFilterOption[]
  colors: StoreFilterOption[]
  sizes: StoreFilterOption[]
  collectionIds: string[]
  metadataFilters: {
    param: string
    title: string
    options: StoreFilterOption[]
  }[]
}

const FILTER_PRODUCT_FIELDS =
  "+metadata,+collection_id,*options,*variants,*variants.options,*type"

function isColorOptionTitle(title: string): boolean {
  const normalized = title.toLowerCase()
  return normalized.includes("color") || normalized.includes("colour")
}

function isSizeOptionTitle(title: string): boolean {
  return title.toLowerCase().includes("size")
}

function emptyFilters(): StoreFiltersResult {
  return {
    genders: [],
    productTypes: [],
    materials: [],
    colors: [],
    sizes: [],
    collectionIds: [],
    metadataFilters: [],
  }
}

function toOptions(
  values: string[],
  metadataKey?: string
): StoreFilterOption[] {
  const uniqueByLabel = new Map<string, string>()

  for (const raw of values) {
    const value = String(raw || "").trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (!uniqueByLabel.has(key)) {
      uniqueByLabel.set(key, value)
    }
  }

  return Array.from(uniqueByLabel.values())
    .sort((a, b) =>
      formatFilterLabel(a, metadataKey).localeCompare(
        formatFilterLabel(b, metadataKey)
      )
    )
    .map((value) => ({
      value,
      label: formatFilterLabel(value, metadataKey),
    }))
}

function addMetadataValue(
  sets: Record<string, Set<string>>,
  key: string,
  raw: unknown,
  normalize?: (value: string) => string
) {
  if (raw === undefined || raw === null) return

  const values =
    key === "color" || key === "material"
      ? String(raw)
          .split(/[,/\n\r]+/)
          .map((part) => part.trim())
          .filter(Boolean)
      : [String(raw).trim()].filter(Boolean)

  if (!sets[key]) {
    sets[key] = new Set()
  }

  values.forEach((value) => {
    sets[key].add(normalize ? normalize(value) : value)
  })
}

function getOptionValue(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (value && typeof value === "object" && "value" in value) {
    return String((value as { value?: string }).value || "").trim()
  }
  return ""
}

function aggregateFiltersFromProducts(products: HttpTypes.StoreProduct[]) {
  const metadataSets: Record<string, Set<string>> = {}
  const colorSet = new Set<string>()
  const sizeSet = new Set<string>()
  const collectionIds = new Set<string>()

  for (const product of products) {
    if (product.collection_id) {
      collectionIds.add(product.collection_id)
    }

    const metadata = product.metadata || {}

    addMetadataValue(metadataSets, "color", metadata.color, (value) =>
      value.toLowerCase()
    )

    for (const field of PRODUCT_METADATA_FIELDS) {
      if (field.key === "color") continue
      addMetadataValue(metadataSets, field.key, metadata[field.key])
    }

    const optionTitleById = new Map<string, string>()

    for (const option of product.options || []) {
      const title = option.title?.toLowerCase() || ""
      if (option.id) {
        optionTitleById.set(option.id, title)
      }

      for (const optionValue of option.values || []) {
        const value = getOptionValue(optionValue)
        if (!value) continue

        if (isColorOptionTitle(title)) {
          colorSet.add(value.toLowerCase())
        }

        if (isSizeOptionTitle(title)) {
          sizeSet.add(value.toUpperCase())
        }
      }
    }

    for (const variant of product.variants || []) {
      for (const variantOption of variant.options || []) {
        const title =
          optionTitleById.get(variantOption.option_id || "") || ""
        const value = variantOption.value?.trim()
        if (!value) continue

        if (isColorOptionTitle(title)) {
          colorSet.add(value.toLowerCase())
        }

        if (isSizeOptionTitle(title)) {
          sizeSet.add(value.toUpperCase())
        }
      }
    }
  }

  if (metadataSets.color) {
    metadataSets.color.forEach((color) => colorSet.add(color))
  }

  return { metadataSets, colorSet, sizeSet, collectionIds }
}

async function fetchProductsForFilters(
  regionId: string
): Promise<HttpTypes.StoreProduct[]> {
  const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!publishableKey) {
    return []
  }

  const limit = 100
  const headers = {
    "Content-Type": "application/json",
    "x-publishable-api-key": publishableKey,
  }

  const firstParams = new URLSearchParams({
    limit: String(limit),
    offset: "0",
    region_id: regionId,
    fields: FILTER_PRODUCT_FIELDS,
  })

  const firstResponse = await fetch(
    `${backendUrl}/store/products?${firstParams}`,
    {
      method: "GET",
      headers,
      next: { revalidate: 300, tags: [`store-filters-${regionId}`] },
    }
  )

  if (!firstResponse.ok) {
    return []
  }

  const firstData = (await firstResponse.json()) as {
    products?: HttpTypes.StoreProduct[]
    count?: number
  }

  const firstBatch = firstData.products || []
  const total = firstData.count ?? firstBatch.length
  const products = [...firstBatch]

  if (products.length >= total || firstBatch.length === 0) {
    return products
  }

  const remainingOffsets: number[] = []
  for (let offset = limit; offset < total; offset += limit) {
    remainingOffsets.push(offset)
  }

  const batches = await Promise.all(
    remainingOffsets.map(async (offset) => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        region_id: regionId,
        fields: FILTER_PRODUCT_FIELDS,
      })

      const response = await fetch(`${backendUrl}/store/products?${params}`, {
        method: "GET",
        headers,
        next: { revalidate: 300, tags: [`store-filters-${regionId}`] },
      })

      if (!response.ok) {
        return [] as HttpTypes.StoreProduct[]
      }

      const data = (await response.json()) as {
        products?: HttpTypes.StoreProduct[]
      }
      return data.products || []
    })
  )

  for (const batch of batches) {
    products.push(...batch)
  }

  return products
}

export const getStoreFilters = cache(async function getStoreFilters(
  countryCode: string
): Promise<StoreFiltersResult> {
  const empty = emptyFilters()

  try {
    const region = await getRegion(countryCode)
    if (!region?.id) {
      return empty
    }

    const products = await fetchProductsForFilters(region.id)
    if (products.length === 0) {
      return empty
    }

    const { metadataSets, colorSet, sizeSet, collectionIds } =
      aggregateFiltersFromProducts(products)

    const metadataFilters = SHOP_METADATA_FILTER_KEYS.map((param) => ({
      param,
      title: getMetadataFieldLabel(param),
      options: toOptions(Array.from(metadataSets[param] || []), param),
    })).filter((filter) => filter.options.length > 0)

    return {
      genders: [],
      productTypes: [],
      materials: [],
      colors: Array.from(colorSet)
        .sort()
        .map((value) => {
          let hex = ""
          try {
            hex = Color(value.replace(/\s+/g, "").toLowerCase()).hex()
          } catch {
            try {
              hex = Color(value.toLowerCase()).hex()
            } catch {
              hex = ""
            }
          }

          return {
            value,
            label: formatFilterLabel(value),
            hex: hex || undefined,
          }
        }),
      sizes: Array.from(sizeSet)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((value) => ({
          value,
          label: value.toUpperCase(),
        })),
      collectionIds: Array.from(collectionIds),
      metadataFilters,
    }
  } catch (error) {
    console.error("Error building store filters:", error)
    return empty
  }
})

export function buildStoreProductQueryParams(input: {
  limit?: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  sortBy?: string
  color?: string
  size?: string
  min_price?: string
  max_price?: string
  q?: string
  metadataParams?: Record<string, string | undefined>
}) {
  const queryParams: Record<string, unknown> = {
    limit: input.limit ?? 12,
  }

  if (input.q) queryParams.q = input.q
  if (input.collectionId) queryParams.collection_id = input.collectionId
  if (input.categoryId) queryParams.category_id = input.categoryId
  if (input.productsIds) queryParams.id = input.productsIds
  if (input.min_price) queryParams.min_price = input.min_price
  if (input.max_price) queryParams.max_price = input.max_price

  const metadata: Record<string, string[]> = {}

  for (const key of SHOP_METADATA_FILTER_KEYS) {
    const value = input.metadataParams?.[key]
    if (!value) continue

    metadata[key] = value
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  }

  if (Object.keys(metadata).length > 0) {
    queryParams.metadata = metadata
  }

  const optionValues = [
    ...(input.color
      ? input.color.split(",").map((value) => value.trim()).filter(Boolean)
      : []),
    ...(input.size
      ? input.size.split(",").map((value) => value.trim()).filter(Boolean)
      : []),
  ]

  if (optionValues.length > 0) {
    queryParams.option_value = optionValues
  }

  return queryParams
}
