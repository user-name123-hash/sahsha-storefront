import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"
import { resolveMediaUrl } from "@lib/resolve-media-url"

export type ShopPageBanner = {
  image: string
  link?: string
}

function isValidLink(link: string): boolean {
  return (
    link.startsWith("/") ||
    link.startsWith("http://") ||
    link.startsWith("https://")
  )
}

/** Admin file fields may be a URL string, JSON string, or { url } object. */
function extractConfigMediaUrl(raw: unknown): string | null {
  if (!raw) return null

  if (typeof raw === "string") {
    const trimmed = raw.trim()
    if (!trimmed) return null

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return extractConfigMediaUrl(JSON.parse(trimmed))
      } catch {
        return resolveMediaUrl(trimmed)
      }
    }

    return resolveMediaUrl(trimmed)
  }

  if (Array.isArray(raw)) {
    for (const item of raw) {
      const url = extractConfigMediaUrl(item)
      if (url) return url
    }
    return null
  }

  if (typeof raw === "object") {
    const record = raw as Record<string, unknown>
    return (
      extractConfigMediaUrl(record.url) ||
      extractConfigMediaUrl(record.src) ||
      extractConfigMediaUrl(record.href) ||
      extractConfigMediaUrl(record.file_key) ||
      null
    )
  }

  return null
}

export async function getShopPageBannerFromConfig(): Promise<ShopPageBanner | null> {
  try {
    // Public path — same as logo/SEO; @core getDynamicConfig fails on prod CDN HTML.
    const homepage = await getPublicHomepageConfig()
    const block = homepage?.["shop-page-banner"] as
      | Record<string, unknown>
      | undefined
    const image = extractConfigMediaUrl(block?.["shop-banner-image"])
    const rawLink =
      typeof block?.["shop-banner-link"] === "string"
        ? block["shop-banner-link"].trim()
        : ""

    if (!image) {
      return null
    }

    return {
      image,
      link: rawLink && isValidLink(rawLink) ? rawLink : undefined,
    }
  } catch {
    return null
  }
}
