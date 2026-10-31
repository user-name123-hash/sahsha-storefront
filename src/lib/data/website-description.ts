import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"

function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Admin Website Description — public config path (same as logo/SEO).
 * @core getWebsiteDescriptionFromConfig fails on prod CDN HTML.
 */
export async function getWebsiteDescriptionFromConfig(): Promise<string | null> {
  try {
    const homepage = await getPublicHomepageConfig()
    return (
      nonEmpty(homepage?.["website-description"]) ||
      nonEmpty(homepage?.["website_description"]) ||
      null
    )
  } catch {
    return null
  }
}
