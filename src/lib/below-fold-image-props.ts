import type { ImageProps } from "next/image"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"

/** Shared props for homepage sections under the hero — lazy, smaller, direct S3 when enabled. */
export function belowFoldImageProps(
  src: string,
  options?: { quality?: number; sizes?: string; priority?: boolean }
): Pick<
  ImageProps,
  "loading" | "decoding" | "fetchPriority" | "quality" | "sizes" | "unoptimized"
> {
  const priority = options?.priority ?? false
  return {
    loading: priority ? "eager" : "lazy",
    decoding: "async",
    fetchPriority: priority ? "auto" : "low",
    quality: options?.quality ?? 65,
    sizes: options?.sizes,
    unoptimized: shouldUnoptimizeImage(src),
  }
}
