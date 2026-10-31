import { HttpTypes } from "@medusajs/types"
import { resolveMediaUrl } from "./resolve-media-url"

type MetadataRecord = Record<string, string | undefined>

type CategoryWithRelations = HttpTypes.StoreProductCategory & {
  products?: Array<{ id?: string }>
  category_children?: Array<{
    products?: Array<{ id?: string }>
  }>
}

export function getCategoryProductCount(
  category: HttpTypes.StoreProductCategory
): number {
  const metadata = (category.metadata || {}) as MetadataRecord
  const raw = metadata.product_count || metadata.products_count
  const fromMeta = raw ? Number.parseInt(raw, 10) : Number.NaN

  if (!Number.isNaN(fromMeta) && fromMeta >= 0) {
    return fromMeta
  }

  const cat = category as CategoryWithRelations
  const direct = cat.products?.length ?? 0
  const fromChildren =
    cat.category_children?.reduce(
      (sum, child) => sum + (child.products?.length ?? 0),
      0
    ) ?? 0

  return direct + fromChildren
}

export function getCategoryImage(
  category: HttpTypes.StoreProductCategory
): string | null {
  const metadata = (category.metadata || {}) as MetadataRecord
  const products = (category as { products?: Array<{ thumbnail?: string }> })
    .products

  const fromMetadata =
    metadata.category_image ||
    metadata.image ||
    metadata.thumbnail ||
    null

  const fromProduct = products?.find((p) => p.thumbnail)?.thumbnail || null

  return resolveMediaUrl(fromMetadata) || resolveMediaUrl(fromProduct)
}

export function getCollectionProductCount(
  collection: HttpTypes.StoreCollection
): number {
  const metadata = (collection.metadata || {}) as MetadataRecord
  const raw = metadata.product_count || metadata.products_count
  const fromMeta = raw ? Number.parseInt(raw, 10) : Number.NaN

  if (!Number.isNaN(fromMeta) && fromMeta >= 0) {
    return fromMeta
  }

  const products = (collection as { products?: Array<{ id?: string }> })
    .products

  return products?.length ?? 0
}

export function getCollectionImage(
  collection: HttpTypes.StoreCollection
): string | null {
  const metadata = (collection.metadata || {}) as MetadataRecord
  const extended = collection as {
    thumbnail?: string
    image?: string
  }

  const raw =
    metadata.collection_icon ||
    metadata.collection_image ||
    metadata.image ||
    extended.thumbnail ||
    extended.image ||
    null

  return resolveMediaUrl(raw)
}
