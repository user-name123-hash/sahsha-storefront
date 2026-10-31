import { Container, clx } from "@medusajs/ui"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { productThumbnailImageProps } from "@lib/product-image"
import { ImageLoader } from "@modules/loaders"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  variantImages?: any[] | null // Variant-specific images (highest priority)
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

// Function to get the first variant image (prioritize variant images)
const getFilteredVariantImage = (
  variantImages: any[] | null | undefined,
  thumbnail: string | null | undefined,
  productImages: any[] | null | undefined
): string | null => {
  if (!variantImages || variantImages.length === 0) {
    return null
  }

  // If variant images exist, always use the first variant image
  // This ensures the correct variant image is shown even if it matches product images
  // The variant image is what the user selected, so it should be prioritized
  return variantImages[0]?.url || null
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  variantImages,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const filteredVariantImage = getFilteredVariantImage(
    variantImages,
    thumbnail,
    images
  )
  // Priority: explicit thumbnail (variant-resolved) > variant images > product images
  const initialImage = thumbnail || filteredVariantImage || images?.[0]?.url

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden p-4 bg-ui-bg-subtle shadow-elevation-card-rest rounded-large group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/16]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} />
    </Container>
  )
}

const THUMBNAIL_SIZES: Record<
  NonNullable<ThumbnailProps["size"]>,
  string
> = {
  small: "180px",
  medium: "290px",
  large: "440px",
  full: "(max-width: 768px) 50vw, 280px",
  square: "(max-width: 640px) 96px, 180px",
}

const ImageOrPlaceholder = ({
  image,
  size = "small",
}: Pick<ThumbnailProps, "size"> & { image?: string }) => {
  return image ? (
    <ImageLoader
      {...productThumbnailImageProps}
      sizes={THUMBNAIL_SIZES[size]}
      src={image}
      alt="Thumbnail"
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
