/** Site-wide integration config (GTM, Clarity, cookie consent). */
export const siteConfig: {
  gtmId: string
  clarityId: string
  features: {
    gtm?: boolean
    cookieConsent?: boolean
  }
} = {
  gtmId: process.env.NEXT_PUBLIC_GTM_ID?.trim() || "",
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID?.trim() || "",
  features: {
    gtm: true,
    cookieConsent: true,
  },
}

export function isGtmEnabled() {
  return siteConfig.features.gtm !== false && Boolean(siteConfig.gtmId)
}

export function isClarityEnabled() {
  return Boolean(siteConfig.clarityId)
}
