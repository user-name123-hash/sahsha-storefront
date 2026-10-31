import { getImageProps } from "next/image"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"

/** Visual quality: 75 provides great balance of crisp retina visuals with ~40% file size savings. */
export const HERO_IMAGE_QUALITY = 75

/** Full-bleed desktop hero (100vw). 1920 covers 1x FHD; srcset can pick 2560 for 2x. */
export const HERO_DESKTOP_WIDTH = 1920
export const HERO_DESKTOP_HEIGHT = 1100

/** Mobile ~390–430 CSS px × 2–3 DPR — 1080 stays sharp under object-fit cover. */
export const HERO_MOBILE_WIDTH = 1080
export const HERO_MOBILE_HEIGHT = 1350

export const HERO_DESKTOP_SIZES = "(min-width: 551px) 100vw"
export const HERO_MOBILE_SIZES = "(max-width: 550px) 100vw"

/** LCP hero: always resize via next/image for remote banners (full S3 originals are too heavy). */
export function heroImageUnoptimized(src: string): boolean {
  if (!src) {
    return true
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    return false
  }

  return shouldUnoptimizeImage(src)
}

type HeroVariant = "desktop" | "mobile"

function heroDimensions(variant: HeroVariant) {
  if (variant === "desktop") {
    return {
      width: HERO_DESKTOP_WIDTH,
      height: HERO_DESKTOP_HEIGHT,
      sizes: HERO_DESKTOP_SIZES,
    }
  }

  return {
    width: HERO_MOBILE_WIDTH,
    height: HERO_MOBILE_HEIGHT,
    sizes: HERO_MOBILE_SIZES,
  }
}

export function getHeroImageProps(
  variant: HeroVariant,
  src: string,
  alt: string
) {
  const { width, height, sizes } = heroDimensions(variant)
  const unoptimized = heroImageUnoptimized(src)

  return getImageProps({
    alt,
    src,
    width,
    height,
    sizes,
    quality: HERO_IMAGE_QUALITY,
    unoptimized,
  })
}

/** Preload href must match the URL `<picture>` / optimizer will request. */
export function getHeroPreloadHref(
  variant: HeroVariant,
  src: string
): string {
  const { props } = getHeroImageProps(variant, src, "")
  return props.src
}
