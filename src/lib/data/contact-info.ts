import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"

export type ContactInfo = {
  phone?: string
  email?: string
  address?: string
  whatsapp?: string
}

function nonEmpty(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * Admin "Contact Us" — public config path (same as logo/SEO/shop banner).
 * @core getContactInfoFromConfig uses cookie getDynamicConfig which fails on prod CDN HTML.
 */
export async function getContactInfoFromConfig(): Promise<ContactInfo | null> {
  try {
    const homepage = await getPublicHomepageConfig()
    const contact = homepage?.["contact-us"] as
      | Record<string, unknown>
      | undefined

    if (!contact) return null

    const phone = nonEmpty(contact["contact-phone"])
    const email = nonEmpty(contact["contact-email"])
    const address = nonEmpty(contact["contact-address"])
    const whatsapp = nonEmpty(contact["contact-whatsapp"])

    if (!phone && !email && !address && !whatsapp) {
      return null
    }

    return { phone, email, address, whatsapp }
  } catch {
    return null
  }
}
