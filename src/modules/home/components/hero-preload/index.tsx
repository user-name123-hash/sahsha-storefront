import {
  getHeroImageProps,
  getHeroPreloadHref,
} from "@lib/home/hero-image-delivery"

type HeroPreloadProps = {
  desktopImage: string
  mobileImage: string
}

function imageOrigin(url: string): string | null {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return null
  }

  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

/** Responsive preloads — srcSet must match `<picture>` so the browser does not fetch twice. */
export default function HeroPreload({
  desktopImage,
  mobileImage,
}: HeroPreloadProps) {
  const desktop = getHeroImageProps("desktop", desktopImage, "")
  const mobile = getHeroImageProps("mobile", mobileImage, "")

  const origins = new Set(
    [desktopImage, mobileImage].map(imageOrigin).filter(Boolean) as string[]
  )

  return (
    <>
      {Array.from(origins).map((origin) => (
        <link key={origin} rel="preconnect" href={origin} crossOrigin="anonymous" />
      ))}
      <link
        rel="preload"
        as="image"
        href={getHeroPreloadHref("mobile", mobileImage)}
        imageSrcSet={mobile.props.srcSet}
        imageSizes={mobile.props.sizes}
        media="(max-width: 550px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={getHeroPreloadHref("desktop", desktopImage)}
        imageSrcSet={desktop.props.srcSet}
        imageSizes={desktop.props.sizes}
        media="(min-width: 551px)"
        fetchPriority="high"
      />
    </>
  )
}
