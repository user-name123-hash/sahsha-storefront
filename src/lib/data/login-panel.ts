import { getPublicDynamicConfig } from "@lib/data/public-dynamic-config"
import { getNavLogosFromConfig } from "@lib/data/logo-config"

import {
  DEFAULT_LOGIN_PAGE_PANEL,
  LOGIN_PANEL_PLACEHOLDER_IMAGE,
  type LoginPageFeatureCard,
  type LoginPagePanelConfig,
} from "@lib/constants/login-panel"

function nonEmpty(value: string | undefined | null): string | null {
  if (!value?.trim()) return null
  return value.trim()
}

type PanelSource = Record<string, string | undefined> & {
  "login-page-feature-cards-array"?: Array<
    Record<string, Record<string, string | undefined>>
  >
}

function parseFeatureCards(
  panel: PanelSource,
  fallback: readonly LoginPageFeatureCard[]
): readonly LoginPageFeatureCard[] {
  const cardArray = panel["login-page-feature-cards-array"]
  if (!cardArray || cardArray.length === 0) {
    return fallback
  }

  const cards: LoginPageFeatureCard[] = []

  for (const entry of cardArray) {
    const card = entry?.["login-page-feature-card"]
    const title = nonEmpty(card?.["login-page-feature-title"])
    const text = nonEmpty(card?.["login-page-feature-text"])
    if (!title || !text) continue

    cards.push({
      imageSrc: nonEmpty(card?.["login-page-feature-image"]) ?? undefined,
      title,
      text,
    })
  }

  return cards.length > 0 ? cards : fallback
}

export async function getLoginPagePanelFromConfig(): Promise<LoginPagePanelConfig> {
  try {
    const [config, { darkLogo, lightLogo }] = await Promise.all([
      getPublicDynamicConfig(),
      getNavLogosFromConfig(),
    ])
    const panel = config?.["homepage-config"]?.["login-page-panel"] as
      | PanelSource
      | undefined

    const fallbackLogo = darkLogo || lightLogo || null

    if (!panel) {
      return { ...DEFAULT_LOGIN_PAGE_PANEL, logo: fallbackLogo }
    }

    return {
      image:
        nonEmpty(panel["login-page-image"]) || LOGIN_PANEL_PLACEHOLDER_IMAGE,
      logo: nonEmpty(panel["login-page-logo"]) || fallbackLogo,
      title:
        nonEmpty(panel["login-page-title"]) ||
        DEFAULT_LOGIN_PAGE_PANEL.title,
      description:
        nonEmpty(panel["login-page-description"]) ||
        DEFAULT_LOGIN_PAGE_PANEL.description,
      featuresLabel:
        nonEmpty(panel["login-page-features-label"]) ||
        DEFAULT_LOGIN_PAGE_PANEL.featuresLabel,
      featureCards: parseFeatureCards(
        panel,
        DEFAULT_LOGIN_PAGE_PANEL.featureCards
      ),
    }
  } catch {
    return DEFAULT_LOGIN_PAGE_PANEL
  }
}