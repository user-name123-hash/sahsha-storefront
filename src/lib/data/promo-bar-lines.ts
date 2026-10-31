import { cache } from "react"
import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"

function nonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value
  if (typeof value !== "string" || !value.trim()) return fallback
  const normalized = value.trim().toLowerCase()
  if (["true", "yes", "1", "on"].includes(normalized)) return true
  if (["false", "no", "0", "off"].includes(normalized)) return false
  return fallback
}

export type PromoBarConfig = {
  text: string | null
  code: string | null
  value: string | null
  active: boolean
}

export type PromoBarLayoutData = {
  config: PromoBarConfig
  lines: [string | null, string | null, string | null, string | null]
}

const getPromoBarLayoutData = cache(async (): Promise<PromoBarLayoutData> => {
  try {
    const homepage = await getPublicHomepageConfig()
    const promo = homepage?.["promo-bar"] as Record<string, unknown> | undefined

    return {
      config: {
        text: nonEmpty(promo?.["promo-text"]),
        code: nonEmpty(promo?.["promo-code"]),
        value: nonEmpty(promo?.["promo-value"]),
        active: parseBool(promo?.["promo-active"], false),
      },
      lines: [
        nonEmpty(promo?.["promo-line-1"]),
        nonEmpty(promo?.["promo-line-2"]),
        nonEmpty(promo?.["promo-line-3"]),
        nonEmpty(promo?.["promo-line-4"]),
      ],
    }
  } catch {
    return {
      config: { text: null, code: null, value: null, active: false },
      lines: [null, null, null, null],
    }
  }
})

/**
 * Admin Promo Bar — public config path (same as logo/SEO).
 * @core getPromoBarConfig uses cookie getDynamicConfig which fails on prod CDN HTML.
 */
export async function getPromoBarConfig(): Promise<PromoBarConfig> {
  return (await getPromoBarLayoutData()).config
}

/** Admin Promo Bar lines 1–4 (coupon line 5 uses promo-text / promo-code). */
export async function getPromoBarLinesFromConfig(): Promise<
  [string | null, string | null, string | null, string | null]
> {
  return (await getPromoBarLayoutData()).lines
}

/** Layout loader — one config read for promo text + lines. */
export async function getPromoBarLayoutFromConfig(): Promise<PromoBarLayoutData> {
  return getPromoBarLayoutData()
}
