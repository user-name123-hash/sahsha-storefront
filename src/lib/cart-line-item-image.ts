import { HttpTypes } from "@medusajs/types"
import {
  getImagesForVariant,
  variantOptionsAsKeymap,
} from "@core/util/product"

type CartLineItemWithProduct = HttpTypes.StoreCartLineItem & {
  product?: HttpTypes.StoreProduct
}

function getMetadataImage(
  variant?: HttpTypes.StoreProductVariant | null
): string | null {
  const metadata = variant?.metadata as Record<string, unknown> | undefined

  if (!metadata) {
    return null
  }

  return (
    (metadata.image as string | undefined) ||
    (metadata.thumbnail as string | undefined) ||
    (metadata.color_image as string | undefined) ||
    (metadata.variant_image as string | undefined) ||
    null
  )
}

function getColorOptionId(product: HttpTypes.StoreProduct): string | null {
  const colorOption = product.options?.find((option) => {
    const title = option.title?.toLowerCase() ?? ""
    return title.includes("color") || title.includes("colour")
  })

  return colorOption?.id ?? null
}

function getVariantColorValue(
  product: HttpTypes.StoreProduct,
  variant: HttpTypes.StoreProductVariant
): string | null {
  const colorOptionId = getColorOptionId(product)
  if (!colorOptionId) {
    return null
  }

  const options = variantOptionsAsKeymap(variant.options)
  return options[colorOptionId] ?? null
}

function getImageForColor(
  product: HttpTypes.StoreProduct,
  colorValue: string
): string | null {
  const colorOptionId = getColorOptionId(product)
  if (!colorOptionId) {
    return null
  }

  const normalizedColor = colorValue.toLowerCase().trim()

  for (const candidate of product.variants ?? []) {
    const options = variantOptionsAsKeymap(candidate.options)
    const candidateColor = options[colorOptionId]

    if (
      !candidateColor ||
      candidateColor.toLowerCase().trim() !== normalizedColor
    ) {
      continue
    }

    const metadataImage = getMetadataImage(candidate)
    if (metadataImage) {
      return metadataImage
    }

    const galleryImage = getImagesForVariant(product, candidate.id)[0]?.url
    if (galleryImage) {
      return galleryImage
    }
  }

  return null
}

export function getCartLineItemThumbnail(
  item: CartLineItemWithProduct
): string | null {
  const variantId = item.variant_id ?? item.variant?.id
  const variant = item.variant
  const product = item.product ?? item.variant?.product

  const metadataImage = getMetadataImage(variant)
  if (metadataImage) {
    return metadataImage
  }

  if (product && variant) {
    const colorValue = getVariantColorValue(product, variant)
    if (colorValue) {
      const colorImage = getImageForColor(product, colorValue)
      if (colorImage) {
        return colorImage
      }
    }
  }

  if (product && variantId) {
    const variantImages = getImagesForVariant(product, variantId)
    if (variantImages[0]?.url) {
      return variantImages[0].url
    }
  }

  if (variant?.images?.length) {
    const urls = variant.images
      .map((image) => image.url)
      .filter((url): url is string => Boolean(url))

    if (urls.length > 1) {
      return urls[urls.length - 1] ?? urls[0]
    }

    if (urls[0]) {
      return urls[0]
    }
  }

  if (variant?.thumbnail) {
    return variant.thumbnail
  }

  return item.thumbnail ?? null
}
