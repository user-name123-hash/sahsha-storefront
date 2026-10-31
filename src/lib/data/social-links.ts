import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"

export type SocialLink = {
  name: string
  url: string
  icon?: string
}

function nonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Admin Social Media Links — public config path (same as logo/SEO).
 * @core getSocialLinksFromConfig uses cookie getDynamicConfig which fails on prod CDN HTML.
 */
export async function getSocialLinksFromConfig(): Promise<SocialLink[] | null> {
  try {
    const homepage = await getPublicHomepageConfig()
    const socialLinksRaw = homepage?.["social-links"]

    if (!Array.isArray(socialLinksRaw) || socialLinksRaw.length === 0) {
      return null
    }

    const socialLinks = socialLinksRaw
      .map((item: Record<string, unknown>) => {
        const link = (item?.["social-link"] ?? item) as Record<string, unknown>
        return {
          name: nonEmpty(link?.["social-platform-name"]) || "",
          url: nonEmpty(link?.["social-platform-url"]) || "",
          icon: nonEmpty(link?.["social-platform-icon"]) || undefined,
        }
      })
      .filter((l) => Boolean(l.name && l.url))

    return socialLinks.length > 0 ? socialLinks : null
  } catch {
    return null
  }
}
