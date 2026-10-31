import { HttpTypes } from "@medusajs/types"
import {
  getImagesForSelection,
  getImagesForVariant,
} from "@core/util/product"

function normalizeImageUrl(url: string): string {
  return url.split("?")[0].toLowerCase().trim()
}

function imageUrlsMatch(a: string, b: string): boolean {
  const cleanA = normalizeImageUrl(a)
  const cleanB = normalizeImageUrl(b)

  if (cleanA === cleanB) {
    return true
  }

  const pathA = cleanA.split("/").pop() || ""
  const pathB = cleanB.split("/").pop() || ""

  return pathA !== "" && pathA === pathB
}

function withThumbnailFallback(
  product: HttpTypes.StoreProduct,
  images: HttpTypes.StoreProductImage[]
): HttpTypes.StoreProductImage[] {
  const usableImages = images.filter((image) => Boolean(image.url))

  if (usableImages.length > 0) {
    return usableImages
  }

  if (product.thumbnail) {
    return [
      {
        id: "product-thumbnail",
        url: product.thumbnail,
      } as HttpTypes.StoreProductImage,
    ]
  }

  return []
}

/** Default PDP gallery — main thumbnail first when no variant is selected. */
function prioritizeThumbnailFirst(
  product: HttpTypes.StoreProduct,
  images: HttpTypes.StoreProductImage[]
): HttpTypes.StoreProductImage[] {
  const thumbnail = product.thumbnail

  if (!thumbnail || images.length === 0) {
    return images
  }

  const existingIndex = images.findIndex((image) =>
    image.url ? imageUrlsMatch(image.url, thumbnail) : false
  )

  if (existingIndex > 0) {
    const reordered = [...images]
    const [match] = reordered.splice(existingIndex, 1)
    return [match, ...reordered]
  }

  if (existingIndex === 0) {
    return images
  }

  return [
    {
      id: "product-thumbnail",
      url: thumbnail,
    } as HttpTypes.StoreProductImage,
    ...images,
  ]
}

function hasOptionSelection(
  options: Record<string, string | undefined>
): boolean {
  return Object.values(options).some(Boolean)
}

export function getProductGalleryImages(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
): HttpTypes.StoreProductImage[] {
  if (!selectedVariantId) {
    const images = withThumbnailFallback(product, product.images || [])
    return prioritizeThumbnailFirst(product, images)
  }

  return withThumbnailFallback(
    product,
    getImagesForVariant(product, selectedVariantId)
  )
}

export function getProductGalleryImagesForSelection(
  product: HttpTypes.StoreProduct,
  options: Record<string, string | undefined>
): HttpTypes.StoreProductImage[] {
  if (!hasOptionSelection(options)) {
    const images = withThumbnailFallback(product, product.images || [])
    return prioritizeThumbnailFirst(product, images)
  }

  return withThumbnailFallback(product, getImagesForSelection(product, options))
}
