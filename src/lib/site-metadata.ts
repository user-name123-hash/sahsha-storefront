import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"
import { getBaseURL } from "@core/util/env"
import type { Metadata } from "next"
import { cache } from "react"

function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const getHomepageConfig = cache(async () => {
  return getPublicHomepageConfig()
})

export async function getShopName() {
  const homepage = await getHomepageConfig()

  return (
    nonEmpty(homepage?.["shop-name"]) ||
    process.env.NEXT_PUBLIC_SHOP_NAME?.trim() ||
    "Store"
  )
}

export async function getSiteDescription() {
  const homepage = await getHomepageConfig()
  const shopName = await getShopName()

  return (
    nonEmpty(homepage?.["website-description"]) ||
    nonEmpty(homepage?.["website_description"]) ||
    `Shop ${shopName} for curated products and a seamless online experience.`
  )
}

export async function getHomePageTitle() {
  const homepage = await getHomepageConfig()

  return nonEmpty(homepage?.["home-page-title"]) || "Sahsha-Ethnic Fashion"
}

export async function getHomePageDescription() {
  const homepage = await getHomepageConfig()

  return (
    nonEmpty(homepage?.["home-page-description"]) ||
    (await getSiteDescription())
  )
}

async function getSiteLocale() {
  const homepage = await getHomepageConfig()

  return nonEmpty(homepage?.["site-locale"]) || "en_IN"
}

export async function getRootMetadata(): Promise<Metadata> {
  const shopName = await getShopName()
  const description = await getSiteDescription()
  const homePageTitle = await getHomePageTitle()
  const locale = await getSiteLocale()
  const baseUrl = getBaseURL()

  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: `%s | ${shopName}`,
      default: `${shopName} | ${homePageTitle}`,
    },
    description,
    openGraph: {
      title: `${shopName} | ${homePageTitle}`,
      description,
      url: baseUrl,
      siteName: shopName,
      images: [
        {
          url: "/appbanner.png",
          width: 1200,
          height: 630,
          alt: shopName,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${shopName} | ${homePageTitle}`,
      description,
      images: ["/appbanner.png"],
    },
    // Self-canonicalize each route (not the homepage for every page).
    alternates: {
      canonical: "./",
    },
  }
}
