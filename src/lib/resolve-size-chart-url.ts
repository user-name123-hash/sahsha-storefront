import { HttpTypes } from "@medusajs/types"
import { resolveMediaUrl } from "./resolve-media-url"

const SIZE_CHART_KEY = "size_chart"

function extractUrl(raw: unknown): string | null {
  if (!raw) return null

  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed) return null

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return extractUrl(JSON.parse(trimmed))
      } catch {
        return trimmed
      }
    }

    return trimmed
  }

  if (typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return (
      extractUrl(record.url) ||
      extractUrl(record.src) ||
      extractUrl(record.href) ||
      null
    )
  }

  return null
}

function getMetadataSizeChartUrl(
  metadata: Record<string, unknown> | null | undefined
): string | null {
  if (!metadata) return null
  return resolveMediaUrl(extractUrl(metadata[SIZE_CHART_KEY]))
}

/** Product size chart first, then linked categories (and parents if present). */
export function resolveSizeChartUrl(
  product: HttpTypes.StoreProduct
): string | null {
  const fromProduct = getMetadataSizeChartUrl(
    product.metadata as Record<string, unknown> | undefined
  )
  if (fromProduct) return fromProduct

  for (const category of product.categories ?? []) {
    const fromCategory = getMetadataSizeChartUrl(
      category.metadata as Record<string, unknown> | undefined
    )
    if (fromCategory) return fromCategory

    const parent = (
      category as HttpTypes.StoreProductCategory & {
        parent_category?: HttpTypes.StoreProductCategory | null
      }
    ).parent_category

    const fromParent = getMetadataSizeChartUrl(
      parent?.metadata as Record<string, unknown> | undefined
    )
    if (fromParent) return fromParent
  }

  return null
}
