import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"
import { sanitizePublicMediaUrl } from "@lib/media-url"

export type WhyChooseUsFeatures = {
  title: string
  features: Array<{ name: string; icon: string }>
}

function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Admin "Why Choose Us" — public config path (same as logo/SEO).
 * Mapping unchanged: why-choose-us-title + why-choose-us-features[].
 */
export async function getFeaturesFromPublicConfig(): Promise<WhyChooseUsFeatures | null> {
  try {
    const homepage = await getPublicHomepageConfig()
    if (!homepage) return null

    const title =
      nonEmpty(homepage["why-choose-us-title"]) || "Why Choose Sahsha?"
    const featuresRaw = homepage["why-choose-us-features"] || []

    if (!Array.isArray(featuresRaw)) {
      return { title, features: [] }
    }

    const features = featuresRaw
      .map((item: Record<string, unknown>) => {
        const feature = (item?.feature ?? item) as Record<string, string>
        const name = nonEmpty(feature?.["feature-name"]) || ""
        const icon =
          sanitizePublicMediaUrl(nonEmpty(feature?.["feature-icon"])) || ""
        return { name, icon }
      })
      .filter((f) => Boolean(f.name && f.icon))

    return { title, features }
  } catch {
    return null
  }
}
