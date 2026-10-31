import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"

export type PromotionalBanner = {
  image: string
  title?: string
  description?: string
  buttonName?: string
  link?: string
}

function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isValidLink(link: string): boolean {
  return (
    link.startsWith("/") ||
    link.startsWith("http://") ||
    link.startsWith("https://")
  )
}

/**
 * Admin "Promotional Banners" — public config path (same as logo/SEO).
 * Mapping unchanged: promotional-banner-array → image/title/description/cta/link.
 */
export async function getPromotionalBannersFromConfig(): Promise<
  PromotionalBanner[]
> {
  try {
    const homepage = await getPublicHomepageConfig()
    const bannerArray = homepage?.["promotional-banner-array"]

    if (!Array.isArray(bannerArray) || bannerArray.length === 0) {
      return []
    }

    const banners: PromotionalBanner[] = []

    for (const entry of bannerArray) {
      const banner = entry?.["promotional-banner"]
      const image = nonEmpty(banner?.["promotional-banner-image"])
      if (!image) continue

      const rawLink = nonEmpty(banner?.["promotional-banner-link"])
      const title = nonEmpty(banner?.["promotional-banner-title"]) ?? undefined
      const description =
        nonEmpty(banner?.["promotional-banner-description"]) ?? undefined
      const buttonName =
        nonEmpty(banner?.["promotional-banner-button-name"]) ?? undefined

      banners.push({
        image,
        title,
        description,
        buttonName,
        link: rawLink && isValidLink(rawLink) ? rawLink : undefined,
      })
    }

    return banners
  } catch {
    return []
  }
}
