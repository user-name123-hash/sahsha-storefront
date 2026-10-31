import { unstable_cache } from "next/cache"
import { cache } from "react"
import type { DynamicConfig } from "@core/data/dynamic-config"

const EMPTY_PUBLIC_DYNAMIC_CONFIG = {} as DynamicConfig

const DYNAMIC_CONFIG_RETRY_STATUSES = new Set([502, 503, 504])
const DYNAMIC_CONFIG_MAX_ATTEMPTS = 3

/**
 * Public storefront config — no cookies/auth.
 * Keeps homepage metadata + hero off the dynamic cookie path so HTML can
 * flush / be edge-cached without waiting on personalized Medusa calls.
 *
 * Retries transient backend errors; returns empty config instead of throwing
 * so revalidation does not spam logs or break layout when Medusa is briefly down.
 */
async function fetchPublicDynamicConfig(): Promise<DynamicConfig> {
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  const baseUrl = (
    process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  )
    .trim()
    .replace(/\/+$/, "")

  if (!publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY")
  }

  const requestInit: RequestInit = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-publishable-api-key": publishableKey,
    },
    next: { revalidate: 300, tags: ["dynamic-config"] },
  }

  let lastStatus: number | undefined

  for (let attempt = 1; attempt <= DYNAMIC_CONFIG_MAX_ATTEMPTS; attempt++) {
    const response = await fetch(
      `${baseUrl}/store/dynamic-config`,
      requestInit
    )

    if (response.ok) {
      return (await response.json()) as DynamicConfig
    }

    lastStatus = response.status

    if (
      DYNAMIC_CONFIG_RETRY_STATUSES.has(response.status) &&
      attempt < DYNAMIC_CONFIG_MAX_ATTEMPTS
    ) {
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
      continue
    }

    if (DYNAMIC_CONFIG_RETRY_STATUSES.has(response.status)) {
      console.warn(
        `[dynamic-config] HTTP ${response.status} after ${DYNAMIC_CONFIG_MAX_ATTEMPTS} attempts; using empty config`
      )
      return EMPTY_PUBLIC_DYNAMIC_CONFIG
    }

    throw new Error(`dynamic-config HTTP ${response.status}`)
  }

  console.warn(
    `[dynamic-config] HTTP ${lastStatus ?? "unknown"}; using empty config`
  )
  return EMPTY_PUBLIC_DYNAMIC_CONFIG
}

/** One dynamic-config fetch per request (hero + home + promos share the same JSON). */
const fetchPublicDynamicConfigPerRequest = cache(fetchPublicDynamicConfig)

export const getPublicDynamicConfig = unstable_cache(
  fetchPublicDynamicConfigPerRequest,
  ["public-dynamic-config"],
  { revalidate: 300, tags: ["dynamic-config"] }
)

function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function getPublicHomeBanners() {
  try {
    const config = await getPublicDynamicConfig()
    const bannerArray = config?.["homepage-config"]?.["homepage-banner-array"]

    if (!bannerArray?.length) return null

    return bannerArray
      .map((item) => {
        const banner = item["homepage-banner"]
        return {
          image: nonEmpty(banner?.["homepage-banner-image"]) ?? undefined,
          title: nonEmpty(banner?.["homepage-banner-title"]) ?? undefined,
          subtitle: nonEmpty(banner?.["homepage-banner-subtitle"]) ?? undefined,
          description:
            nonEmpty(banner?.["homepage-banner-description"]) ?? undefined,
          buttonName:
            nonEmpty(banner?.["homepage-banner-button-name"]) ?? undefined,
          buttonLink:
            nonEmpty(banner?.["homepage-banner-button-link"]) ?? undefined,
        }
      })
      .filter((b) => b.image || b.title || b.subtitle)
  } catch {
    return null
  }
}

export async function getPublicAppBanners() {
  try {
    const config = await getPublicDynamicConfig()
    const bannerArray = config?.["homepage-config"]?.["app-banner-array"]

    if (!bannerArray?.length) return null

    return bannerArray
      .map((item) => {
        const banner = item["app-banner"]
        return {
          image: nonEmpty(banner?.["app-banner-image"]) ?? undefined,
          title: nonEmpty(banner?.["app-banner-title"]) ?? undefined,
          subtitle: nonEmpty(banner?.["app-banner-subtitle"]) ?? undefined,
          description: nonEmpty(banner?.["app-banner-description"]) ?? undefined,
          buttonName: nonEmpty(banner?.["app-banner-button-name"]) ?? undefined,
          buttonLink: nonEmpty(banner?.["app-banner-button-link"]) ?? undefined,
        }
      })
      .filter((b) => b.image || b.title || b.subtitle)
  } catch {
    return null
  }
}

export async function getPublicHomepageConfig() {
  try {
    const config = await getPublicDynamicConfig()
    return config?.["homepage-config"] ?? null
  } catch {
    return null
  }
}

/**
 * Admin "Company Logo (White — Footer & Navbar Hero)".
 * Uses the public cache path (same as SEO/hero) so logos still resolve when
 * the personalized `"use server"` dynamic-config path is skipped/unavailable.
 */
export async function getPublicLogo(): Promise<string | null> {
  const homepage = await getPublicHomepageConfig()
  return nonEmpty(homepage?.logo)
}

/**
 * Admin logos for nav:
 * - lightLogo ← Company Logo (white) — hero / transparent nav + footer
 * - darkLogo  ← Navbar Logo (black) — after scroll
 *
 * Cross-fills so one uploaded logo still shows in both modes.
 * Returns nulls when admin has neither — callers must not invent brand assets.
 */
export async function getPublicNavLogos(): Promise<{
  lightLogo: string | null
  darkLogo: string | null
}> {
  const homepage = await getPublicHomepageConfig()
  const companyLogo = nonEmpty(homepage?.logo)
  const navbarLogo = nonEmpty(homepage?.["navbar-logo"])

  return {
    lightLogo: companyLogo || navbarLogo,
    darkLogo: navbarLogo || companyLogo,
  }
}
