import { PRODUCT_METADATA_FIELDS } from "@theme/slots/product/ProductActions/product-metadata-fields"

export type StoreFilterOption = {
  value: string
  label: string
  hex?: string
}

export type StoreMetadataFilterKey = string

/** Shop sidebar metadata filters — curated list only */
export const SHOP_METADATA_FILTER_KEYS = [
  "fabric",
  "occasion",
  "neck",
] as const

const FILTER_LABEL_OVERRIDES: Record<string, string> = {
  neck: "Neck Style",
}

export function getMetadataFieldLabel(key: string): string {
  return (
    FILTER_LABEL_OVERRIDES[key] ||
    PRODUCT_METADATA_FIELDS.find((field) => field.key === key)?.label ||
    formatFilterLabel(key)
  )
}

export function formatFilterLabel(value: string, metadataKey?: string): string {
  const normalized = value.trim()
  if (!normalized) return ""

  // Free-text metadata: show as typed when it has spaces / mixed case
  if (/\s/.test(normalized) || /[A-Z]/.test(normalized.slice(1))) {
    return normalized
  }

  return normalized
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function pickMetadataSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): Record<string, string | string[]> {
  const picked: Record<string, string | string[]> = {}

  for (const key of SHOP_METADATA_FILTER_KEYS) {
    const value = searchParams[key]
    if (value) {
      picked[key] = value
    }
  }

  return picked
}

export function metadataSearchParamsToStrings(
  params: Record<string, string | string[]>
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {}

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      result[key] = value.join(",")
    } else {
      result[key] = value
    }
  }

  return result
}
