import { PRODUCT_IMAGE } from "../../image-config"

export const productGalleryImageProps = {
  quality: PRODUCT_IMAGE.quality.gallery,
  sizes: PRODUCT_IMAGE.sizes.gallery,
  width: PRODUCT_IMAGE.dimensions.width,
  height: PRODUCT_IMAGE.dimensions.height,
} as const

export const productGalleryThumbImageProps = {
  quality: PRODUCT_IMAGE.quality.galleryThumb,
  sizes: PRODUCT_IMAGE.sizes.galleryThumb,
} as const

export const productGalleryZoomImageProps = {
  quality: PRODUCT_IMAGE.quality.galleryZoom,
  sizes: PRODUCT_IMAGE.sizes.galleryZoom,
} as const

export const productCardImageProps = {
  quality: PRODUCT_IMAGE.quality.card,
  sizes: PRODUCT_IMAGE.sizes.card,
} as const

export const productThumbnailImageProps = {
  quality: PRODUCT_IMAGE.quality.thumbnail,
  sizes: PRODUCT_IMAGE.sizes.thumbnail,
} as const
