import {
  getHeroImageProps,
  HERO_DESKTOP_HEIGHT,
  HERO_DESKTOP_WIDTH,
} from "@lib/home/hero-image-delivery"

type HeroPictureProps = {
  desktopSrc: string
  mobileSrc: string
  desktopAlt: string
  mobileAlt: string
}

/** One responsive `<picture>` — only the matching breakpoint image is fetched. */
export default function HeroPicture({
  desktopSrc,
  mobileSrc,
  desktopAlt,
  mobileAlt,
}: HeroPictureProps) {
  const desktop = getHeroImageProps("desktop", desktopSrc, desktopAlt)
  const mobile = getHeroImageProps("mobile", mobileSrc, mobileAlt)
  const { srcSet: desktopSrcSet, sizes: desktopSizes } = desktop.props
  const { srcSet: mobileSrcSet, sizes: mobileSizes, ...imgProps } = mobile.props

  return (
    <picture className="impulse-hero__picture">
      <source
        media="(min-width: 551px)"
        srcSet={desktopSrcSet}
        sizes={desktopSizes}
      />
      <source
        media="(max-width: 550px)"
        srcSet={mobileSrcSet}
        sizes={mobileSizes}
      />
      <img
        {...imgProps}
        alt={mobileAlt}
        width={HERO_DESKTOP_WIDTH}
        height={HERO_DESKTOP_HEIGHT}
        sizes={desktopSizes}
        className="impulse-hero__image"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  )
}
