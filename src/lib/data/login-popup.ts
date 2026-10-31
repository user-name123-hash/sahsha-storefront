import { getPublicDynamicConfig } from "@lib/data/public-dynamic-config"
import { storefrontConfig } from "@storefront-config"
import { getThemeDefaultAssets } from "@lib/theme-default-assets"
import { getNavLogosFromConfig } from "@lib/data/logo-config"

export type LoginPopupFeatureCard = {
  imageSrc?: string
  title: string
  text: string
}

export type LoginPopupConfig = {
  enabled: boolean
  showDelayMs: number
  storageKey: string
  imageSrc: string
  logoSrc: string
  brandTitle: string
  headline: string
  subtext: string
  featureCards: readonly LoginPopupFeatureCard[]
}

export const DEFAULT_LOGIN_POPUP_FEATURE_CARDS: LoginPopupFeatureCard[] = [
  {
    title: "Customer-first",
    text: "Putting you in the center",
  },
  {
    title: "Transparent",
    text: "Honest from the inside out",
  },
  {
    title: "Innovative",
    text: "Getting the absolute best for you",
  },
]

function nonEmpty(value: string | undefined | null): string | null {
  if (!value?.trim()) return null
  return value.trim()
}

function parseBool(value: string | undefined | null, fallback: boolean): boolean {
  if (!value?.trim()) return fallback
  const normalized = value.trim().toLowerCase()
  if (["true", "yes", "1", "on"].includes(normalized)) return true
  if (["false", "no", "0", "off"].includes(normalized)) return false
  return fallback
}

function parseDelay(value: string | undefined | null, fallback: number): number {
  if (!value?.trim()) return fallback
  const parsed = Number.parseInt(value.trim(), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

type PopupSource = Record<string, string | undefined> & {
  "login-popup-feature-cards-array"?: Array<
    Record<string, Record<string, string | undefined>>
  >
}

function parseFeatureCards(
  popup: PopupSource,
  fallback: readonly LoginPopupFeatureCard[]
): readonly LoginPopupFeatureCard[] {
  const cardArray = popup["login-popup-feature-cards-array"]
  if (!cardArray || cardArray.length === 0) {
    return fallback
  }

  const cards: LoginPopupFeatureCard[] = []

  for (const entry of cardArray) {
    const card = entry?.["login-popup-feature-card"]
    const title = nonEmpty(card?.["login-popup-feature-title"])
    const text = nonEmpty(card?.["login-popup-feature-text"])
    if (!title || !text) continue

    cards.push({
      imageSrc: nonEmpty(card?.["login-popup-feature-image"]) ?? undefined,
      title,
      text,
    })
  }

  return cards.length > 0 ? cards : fallback
}

export async function getLoginPopupFromConfig(): Promise<LoginPopupConfig> {
  const storefrontDefaults = storefrontConfig.loginPopup
  const defaults: LoginPopupConfig = {
    enabled: storefrontDefaults?.enabled ?? true,
    showDelayMs: storefrontDefaults?.showDelayMs ?? 8000,
    storageKey: storefrontDefaults?.storageKey ?? "sahsha_login_popup_seen",
    imageSrc: storefrontDefaults?.imageSrc ?? "",
    logoSrc: storefrontDefaults?.logoSrc ?? getThemeDefaultAssets().logo,
    brandTitle: storefrontDefaults?.brandTitle ?? "Login now",
    headline: storefrontDefaults?.headline ?? "Unlock Exclusive Deals",
    subtext: storefrontDefaults?.subtext ?? "",
    featureCards:
      storefrontDefaults?.featureCards ?? DEFAULT_LOGIN_POPUP_FEATURE_CARDS,
  }
  const themeLogo = getThemeDefaultAssets().logo

  try {
    const [config, { darkLogo }] = await Promise.all([
      getPublicDynamicConfig(),
      getNavLogosFromConfig(),
    ])

    const popup = config?.["homepage-config"]?.["login-popup"] as
      | PopupSource
      | undefined
    const resolvedLogo = darkLogo || defaults.logoSrc || themeLogo

    if (!popup) {
      return { ...defaults, logoSrc: resolvedLogo }
    }

    return {
      enabled: parseBool(popup["login-popup-enabled"], defaults.enabled),
      showDelayMs: parseDelay(popup["login-popup-delay"], defaults.showDelayMs),
      storageKey: defaults.storageKey,
      imageSrc: nonEmpty(popup["login-popup-image"]) || defaults.imageSrc,
      logoSrc: nonEmpty(popup["login-popup-logo"]) || resolvedLogo,
      brandTitle: nonEmpty(popup["login-popup-brand-title"]) || defaults.brandTitle,
      headline: nonEmpty(popup["login-popup-headline"]) || defaults.headline,
      subtext: nonEmpty(popup["login-popup-subtext"]) || defaults.subtext,
      featureCards: parseFeatureCards(popup, defaults.featureCards),
    }
  } catch {
    return { ...defaults, logoSrc: themeLogo }
  }
}
