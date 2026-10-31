import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"

export type WelcomeCouponConfig = {
  enabled: boolean
  code: string
  discount: string
  title: string
  description: string
}

const DEFAULTS: WelcomeCouponConfig = {
  enabled: true,
  code: "WELCOME10",
  discount: "",
  title: "Welcome Gift!",
  description:
    "Thanks for joining Sahsha. Use this code on your first order for a special discount.",
}

function nonEmpty(value: string | undefined | null): string | null {
  if (!value?.trim()) return null
  return value.trim()
}

function parseBool(
  value: string | boolean | undefined | null,
  fallback: boolean
): boolean {
  if (typeof value === "boolean") return value
  if (!value?.toString().trim()) return fallback
  const normalized = value.toString().trim().toLowerCase()
  if (["true", "yes", "1", "on"].includes(normalized)) return true
  if (["false", "no", "0", "off"].includes(normalized)) return false
  return fallback
}

/**
 * Admin Welcome Coupon — public config path (same as logo/SEO).
 * @core getDynamicConfig fails on prod CDN HTML.
 */
export async function getWelcomeCouponFromConfig(): Promise<WelcomeCouponConfig> {
  try {
    const homepage = await getPublicHomepageConfig()
    const welcome = homepage?.["welcome-coupon"] as
      | Record<string, string | boolean | undefined>
      | undefined
    const promo = homepage?.["promo-bar"] as
      | Record<string, string | boolean | undefined>
      | undefined

    const code =
      nonEmpty(welcome?.["welcome-coupon-code"] as string | undefined) ||
      nonEmpty(promo?.["promo-code"] as string | undefined) ||
      DEFAULTS.code

    return {
      enabled: parseBool(
        welcome?.["welcome-coupon-enabled"],
        DEFAULTS.enabled
      ),
      code,
      discount:
        nonEmpty(welcome?.["welcome-coupon-discount"] as string | undefined) ||
        DEFAULTS.discount,
      title:
        nonEmpty(welcome?.["welcome-coupon-title"] as string | undefined) ||
        DEFAULTS.title,
      description:
        nonEmpty(
          welcome?.["welcome-coupon-description"] as string | undefined
        ) || DEFAULTS.description,
    }
  } catch {
    return DEFAULTS
  }
}
