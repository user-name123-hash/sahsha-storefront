import type { ImageProps } from "next/image"
import { PRODUCT_IMAGE } from "../../image-config"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"

/** Home rails / grids — resize remote S3 via next/image (smaller than full product PNG). */
function productCardUnoptimized(src: string): boolean {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return false
  }
  return shouldUnoptimizeImage(src)
}

export function productCardImageDeliveryProps(
  src: string,
  options?: { priority?: boolean }
): Pick<
  ImageProps,
  "quality" | "sizes" | "priority" | "loading" | "fetchPriority" | "unoptimized"
> {
  const priority = options?.priority ?? false
  return {
    quality: PRODUCT_IMAGE.quality.card,
    sizes: PRODUCT_IMAGE.sizes.card,
    priority,
    loading: priority ? undefined : "lazy",
    fetchPriority: priority ? "high" : "low",
    unoptimized: productCardUnoptimized(src),
  }
}
