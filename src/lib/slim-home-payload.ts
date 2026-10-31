import { HttpTypes } from "@medusajs/types"

/** Keep only fields product cards need for price/currency display. */
export function slimRegion(
  region: HttpTypes.StoreRegion
): HttpTypes.StoreRegion {
  return {
    id: region.id,
    name: region.name,
    currency_code: region.currency_code,
  } as HttpTypes.StoreRegion
}

/** Nav/footer only need identity + image metadata — drop nested product graphs. */
export function slimCategoriesForNav(
  categories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory[] {
  return categories.map(
    (category) =>
      ({
        id: category.id,
        name: category.name,
        handle: category.handle,
        parent_category_id: category.parent_category_id,
      }) as HttpTypes.StoreProductCategory
  )
}

export function slimCollectionsForNav(
  collections: HttpTypes.StoreCollection[]
): HttpTypes.StoreCollection[] {
  return collections.map(
    (collection) =>
      ({
        id: collection.id,
        handle: collection.handle,
        title: collection.title,
        metadata: collection.metadata,
      }) as HttpTypes.StoreCollection
  )
}

/** Homepage shop-by-category only renders parent tiles. */
export function slimCategoriesForHome(
  categories: HttpTypes.StoreProductCategory[]
): HttpTypes.StoreProductCategory[] {
  return categories
    .filter((category) => !category.parent_category_id)
    .map((category) => {
      const products = (
        category as { products?: Array<{ id?: string; thumbnail?: string }> }
      ).products
      const children = (
        category as {
          category_children?: Array<{ products?: Array<{ id?: string }> }>
        }
      ).category_children

      // Count before trimming — we only keep one product for the tile image.
      const productCount =
        (products?.length ?? 0) +
        (children?.reduce(
          (sum, child) => sum + (child.products?.length ?? 0),
          0
        ) ?? 0)

      const existingMeta =
        category.metadata && typeof category.metadata === "object"
          ? (category.metadata as Record<string, unknown>)
          : {}

      return {
        id: category.id,
        name: category.name,
        handle: category.handle,
        parent_category_id: category.parent_category_id,
        metadata: {
          ...existingMeta,
          product_count: String(productCount),
        },
        products: products?.slice(0, 1)?.map((product) => ({
          id: product.id,
          thumbnail: product.thumbnail,
        })),
      } as HttpTypes.StoreProductCategory
    })
}

const VARIANT_METADATA_KEYS = [
  "color_hex",
  "image",
  "thumbnail",
  "color_image",
  "variant_image",
] as const

/** Keep only keys ProductCard / quick-add / size-fallback actually read. */
function slimProductMetadata(
  metadata: HttpTypes.StoreProduct["metadata"]
): HttpTypes.StoreProduct["metadata"] | null {
  if (!metadata || typeof metadata !== "object") return null
  if (!("size_order" in metadata)) return null
  return { size_order: (metadata as Record<string, unknown>).size_order }
}

function slimVariantMetadata(
  metadata: HttpTypes.StoreProductVariant["metadata"]
): HttpTypes.StoreProductVariant["metadata"] | null {
  if (!metadata || typeof metadata !== "object") return null

  const slim: Record<string, unknown> = {}
  for (const key of VARIANT_METADATA_KEYS) {
    if (key in metadata && (metadata as Record<string, unknown>)[key] != null) {
      slim[key] = (metadata as Record<string, unknown>)[key]
    }
  }

  return Object.keys(slim).length ? slim : null
}

function slimImages(
  images: HttpTypes.StoreProduct["images"] | HttpTypes.StoreProductVariant["images"]
) {
  if (!images?.length) return undefined
  return images.slice(0, 2).map((image) => ({
    id: image.id,
    url: image.url,
  }))
}

function imageUrlSet(
  images: HttpTypes.StoreProduct["images"] | HttpTypes.StoreProductVariant["images"]
) {
  return new Set((images || []).map((image) => image.url).filter(Boolean))
}

/** Skip variant galleries that only repeat the product gallery (common for sizes). */
function slimVariantImages(
  variant: HttpTypes.StoreProductVariant,
  productImages: HttpTypes.StoreProduct["images"]
) {
  const variantImages = slimImages(variant.images)
  if (!variantImages?.length) return undefined

  const productUrls = imageUrlSet(productImages)
  if (
    productUrls.size > 0 &&
    variantImages.every((image) => productUrls.has(image.url))
  ) {
    return undefined
  }

  return variantImages
}

function slimOption(option: HttpTypes.StoreProductOption) {
  return {
    id: option.id,
    title: option.title,
    values: option.values?.map((value) => ({
      id: value.id,
      value: value.value,
    })),
  }
}

/** Only amounts/currency that getProductPrice / getPricesForVariant read. */
function slimCalculatedPrice(calculatedPrice: unknown) {
  if (!calculatedPrice || typeof calculatedPrice !== "object") {
    return undefined
  }

  const price = calculatedPrice as Record<string, unknown>
  const nested = price.calculated_price as Record<string, unknown> | undefined

  // getPricesForVariant always reads `.calculated_price.price_list_type` —
  // keep the nested object even when price_list_type is null/undefined.
  return {
    calculated_amount: price.calculated_amount,
    original_amount: price.original_amount,
    currency_code: price.currency_code,
    calculated_price: {
      price_list_type: nested?.price_list_type ?? null,
    },
  }
}

function slimVariant(
  variant: HttpTypes.StoreProductVariant,
  productImages?: HttpTypes.StoreProduct["images"]
): HttpTypes.StoreProductVariant {
  const extended = variant as HttpTypes.StoreProductVariant & {
    calculated_price?: unknown
    inventory_quantity?: number
  }

  const slim: Record<string, unknown> = {
    id: variant.id,
    title: variant.title,
    options: variant.options?.map((option) => ({
      id: option.id,
      value: option.value,
      option_id: option.option_id,
    })),
  }

  if (variant.sku) slim.sku = variant.sku
  if (variant.thumbnail) slim.thumbnail = variant.thumbnail

  const images = slimVariantImages(variant, productImages)
  if (images?.length) slim.images = images

  const calculatedPrice = slimCalculatedPrice(extended.calculated_price)
  if (calculatedPrice) slim.calculated_price = calculatedPrice

  if (variant.manage_inventory != null) {
    slim.manage_inventory = variant.manage_inventory
  }
  if (variant.allow_backorder != null) {
    slim.allow_backorder = variant.allow_backorder
  }
  if (extended.inventory_quantity != null) {
    slim.inventory_quantity = extended.inventory_quantity
  }

  const metadata = slimVariantMetadata(variant.metadata)
  if (metadata) slim.metadata = metadata

  return slim as HttpTypes.StoreProductVariant
}

/**
 * Drop description, timestamps, fat metadata, and unused relations before
 * products cross the RSC → client ProductCard boundary. Same card UI / quick-add.
 */
export function slimProductForCard(
  product: HttpTypes.StoreProduct
): HttpTypes.StoreProduct {
  const slim: Record<string, unknown> = {
    id: product.id,
    title: product.title,
    handle: product.handle,
    options: product.options?.map(slimOption),
    variants: product.variants?.map((variant) =>
      slimVariant(variant, product.images)
    ),
  }

  if (product.thumbnail) slim.thumbnail = product.thumbnail

  const images = slimImages(product.images)
  if (images?.length) slim.images = images

  const metadata = slimProductMetadata(product.metadata)
  if (metadata) slim.metadata = metadata

  const extended = product as HttpTypes.StoreProduct & {
    average_rating?: number
    total_rating_count?: number
  }
  if (extended.average_rating != null) {
    slim.average_rating = extended.average_rating
  }
  if (extended.total_rating_count != null) {
    slim.total_rating_count = extended.total_rating_count
  }

  return slim as HttpTypes.StoreProduct
}

export function slimProductsForCard(
  products: HttpTypes.StoreProduct[]
): HttpTypes.StoreProduct[] {
  return products.map(slimProductForCard)
}
