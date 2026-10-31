import { getThemeDefaultAssets } from "@core/util/theme-default-assets"
import { resolveMediaUrl } from "@lib/resolve-media-url"
import type { HomePageData, BannerData } from "@core/types/home"

function resolveBannerImage(url: string | undefined, fallback: string): string {
  return resolveMediaUrl(url) || fallback
}

function buildDefaultBanner(): BannerData {
  const assets = getThemeDefaultAssets()
  return {
    image: assets.heroDesktop,
    title: "Premium Kids Shop",
    subtitle: "Little Trends, Quality Kids Wear",
    description:
      "Shop stylish kids wear for little ones and children of all years—from newborn up to 15 years. Crafted for play, absolute comfort, and everyday magic.",
    buttonName: "Shop Kids Wear",
    buttonLink: "/store",
  }
}

export function buildHeroBlockData(
  homeBanners: BannerData[] | null | undefined,
  appBanners: BannerData[] | null | undefined
): HomePageData["hero"] {
  const assets = getThemeDefaultAssets()
  const defaultBanner = buildDefaultBanner()
  const homeBanner =
    homeBanners && homeBanners.length > 0 ? homeBanners[0] : defaultBanner
  const homeBannerImage = resolveBannerImage(homeBanner.image, assets.heroDesktop)
  const firstAppBanner =
    appBanners && appBanners.length > 0 ? appBanners[0] : null

  return {
    homeBanner: { ...homeBanner, image: homeBannerImage },
    appBanner: {
      image: resolveBannerImage(firstAppBanner?.image, assets.heroMobile),
      title: firstAppBanner?.title || homeBanner.title,
      subtitle: firstAppBanner?.subtitle || homeBanner.subtitle,
      description: firstAppBanner?.description || homeBanner.description,
      buttonName: firstAppBanner?.buttonName || homeBanner.buttonName,
      buttonLink: firstAppBanner?.buttonLink || homeBanner.buttonLink,
    },
  }
}
