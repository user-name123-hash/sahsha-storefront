import type { ImageProps } from "next/image"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"

/** Category tiles are small — resize via next/image even when other remote images are direct. */
function categoryTileUnoptimized(src: string): boolean {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return false
  }
  return shouldUnoptimizeImage(src)
}

const DEFAULT_CATEGORY_TILE_SIZES =
  "(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 280px"

export function categoryTileImageProps(
  src: string,
  options?: { priority?: boolean; sizes?: string }
): Pick<
  ImageProps,
  "loading" | "decoding" | "fetchPriority" | "quality" | "sizes" | "unoptimized"
> {
  const priority = options?.priority ?? false
  return {
    loading: priority ? "eager" : "lazy",
    decoding: "async",
    fetchPriority: priority ? "high" : "low",
    quality: 65,
    sizes: options?.sizes ?? DEFAULT_CATEGORY_TILE_SIZES,
    unoptimized: categoryTileUnoptimized(src),
  }
}
