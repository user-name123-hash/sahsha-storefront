import { cache } from "react"
import { listCartOptions } from "@core/data/cart"
import { retrieveCustomer } from "@core/data/customer"
import { getLocale } from "@core/data/locale-actions"
import type { MainLayoutData } from "@core/types/layout"
import { HttpTypes } from "@medusajs/types"
import {
  listStorefrontCategories,
  listStorefrontCollections,
} from "@lib/data/cached-catalog"
import { retrieveCartForChrome } from "@lib/data/retrieve-cart-for-chrome"
import {
  getWelcomeCouponFromConfig,
  type WelcomeCouponConfig,
} from "@lib/data/welcome-coupon"
import { getPromoBarLayoutFromConfig } from "@lib/data/promo-bar-lines"
import { getSocialLinksFromConfig } from "@lib/data/social-links"
import {
  slimCategoriesForNav,
  slimCollectionsForNav,
} from "@lib/slim-home-payload"

export type NavLayoutData = MainLayoutData["nav"] & {
  categories: HttpTypes.StoreProductCategory[]
  collections: HttpTypes.StoreCollection[]
}

export type StoreMainLayoutData = MainLayoutData & {
  nav: NavLayoutData
  promoBar: MainLayoutData["promoBar"] & {
    lines: [string | null, string | null, string | null, string | null]
  }
  welcomeCoupon: WelcomeCouponConfig
}

export const loadLayoutData = cache(async function loadLayoutData(): Promise<StoreMainLayoutData> {
  const cartWithShippingPromise = retrieveCartForChrome().then(
    async (cart) => {
      if (!cart) {
        return { cart: null, shippingOptions: [] as MainLayoutData["shippingOptions"] }
      }
      try {
        const { shipping_options } = await listCartOptions()
        return { cart, shippingOptions: shipping_options }
      } catch {
        return { cart, shippingOptions: [] as MainLayoutData["shippingOptions"] }
      }
    }
  )

  const [
    customer,
    cartBundle,
    currentLocale,
    promoBarLayout,
    welcomeCoupon,
    allCategories,
    allCollections,
    fetchedSocialLinks,
  ] = await Promise.all([
    retrieveCustomer(),
    cartWithShippingPromise,
    getLocale(),
    getPromoBarLayoutFromConfig(),
    getWelcomeCouponFromConfig(),
    listStorefrontCategories(),
    listStorefrontCollections(),
    getSocialLinksFromConfig(),
  ])

  const { cart, shippingOptions } = cartBundle

  const topLevelCategories = allCategories.filter(
    (category) => !category.parent_category_id
  )

  const defaultSocialLinks = [
    { name: "LinkedIn", url: "#", icon: "/LINK.svg" },
    { name: "Facebook", url: "#", icon: "/FACE.svg" },
    { name: "Instagram", url: "#", icon: "/INSTA.svg" },
    { name: "YouTube", url: "#", icon: "/YOU.svg" },
  ]

  const getFallbackIcon = (name: string) => {
    const n = name.toLowerCase()
    if (n.includes("facebook")) return "/FACE.svg"
    if (n.includes("linkedin")) return "/LINK.svg"
    if (n.includes("instagram")) return "/INSTA.svg"
    if (n.includes("youtube")) return "/YOU.svg"
    return null
  }

  const socialLinks = (
    fetchedSocialLinks && fetchedSocialLinks.length > 0
      ? fetchedSocialLinks
      : defaultSocialLinks
  ).map((link) => ({
    ...link,
    icon: link.icon || getFallbackIcon(link.name),
  }))

  const promoBarConfig = promoBarLayout.config
  const promoBarLines = promoBarLayout.lines

  const promoCode = promoBarConfig.code?.trim() || welcomeCoupon.code
  const promoValue = promoBarConfig.value?.trim() || ""
  const rawPromoText = promoBarConfig.text?.trim() || ""

  let promoText = rawPromoText
  if (!promoText) {
    promoText = `Flat 10% OFF On Your First Order • Use Code: ${promoCode}`
  } else {
    if (promoValue && !promoText.includes(promoValue)) {
      promoText = `${promoText} • ${promoValue}`
    }
    if (promoCode && !promoText.includes(promoCode)) {
      promoText = `${promoText} • Use Code: ${promoCode}`
    }
  }

  const navCategories = slimCategoriesForNav(topLevelCategories)
  const navCollections = slimCollectionsForNav(allCollections)

  return {
    customer,
    cart,
    shippingOptions,
    nav: {
      // Nav UI does not render region switcher — keep empty to shrink every-page HTML.
      regions: [],
      currentLocale: currentLocale || "in",
      customer,
      categories: navCategories,
      collections: navCollections,
    },
    promoBar: {
      text: promoText,
      code: promoCode,
      value: promoValue,
      active: promoBarConfig.active,
      lines: promoBarLines,
    },
    footer: { categories: navCategories.slice(0, 6), socialLinks },
    welcomeCoupon,
  }
})
