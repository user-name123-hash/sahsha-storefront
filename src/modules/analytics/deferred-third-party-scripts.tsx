"use client"

import { useEffect, useState } from "react"
import Script from "next/script"
import {
  GoogleTagManager,
  GoogleTagManagerNoScript,
} from "@modules/analytics/google-tag-manager"
import { COOKIE_CONSENT_EVENT } from "@lib/cookie-consent-event"
import { isClarityEnabled, isGtmEnabled, siteConfig } from "@lib/site-config"
import { isMetaInAppBrowser } from "@lib/util/safe-browser"
import { isLocalStorefrontEnv } from "@lib/is-local-storefront"

const CONSENT_KEY = "cookie_consent"

function readConsent(): "granted" | "denied" | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    if (value === "granted" || value === "denied") return value
  } catch {
    /* ignore */
  }
  return null
}

type DeferredThirdPartyScriptsProps = {
  /** When cookie banner is disabled, load analytics on idle as before. */
  requireConsent: boolean
  googleClientId?: string
}

/**
 * Loads GTM / Clarity / Google Identity only after consent (or idle if
 * cookie consent is off). Same tracking behavior once allowed — fewer
 * early requests on first paint.
 */
export default function DeferredThirdPartyScripts({
  requireConsent,
  googleClientId,
}: DeferredThirdPartyScriptsProps) {
  const [consent, setConsent] = useState<"granted" | "denied" | null>(null)
  const [ready, setReady] = useState(!requireConsent)
  const [allowGoogleIdentity, setAllowGoogleIdentity] = useState(false)
  useEffect(() => {
    // GIS / FedCM crashes Instagram & Facebook iOS WebViews.
    if (isMetaInAppBrowser()) return

    const enable = () => setAllowGoogleIdentity(true)
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as any).requestIdleCallback(enable, { timeout: 3000 })
      return () => (window as any).cancelIdleCallback(handle)
    } else {
      const timer = window.setTimeout(enable, 2000)
      return () => window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!requireConsent) {
      setReady(true)
      return
    }

    const stored = readConsent()
    setConsent(stored)
    if (stored === "granted") {
      setReady(true)
    }

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<"granted" | "denied">).detail
      setConsent(detail)
      if (detail === "granted") setReady(true)
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent)
  }, [requireConsent])

  const loadAnalytics =
    ready && (requireConsent ? consent === "granted" : true)

  return (
    <>
      {loadAnalytics && isGtmEnabled() && (
        <>
          <GoogleTagManagerNoScript gtmId={siteConfig.gtmId} />
          <GoogleTagManager gtmId={siteConfig.gtmId} />
        </>
      )}
      {loadAnalytics && isClarityEnabled() && (
        <Script
          id="microsoft-clarity"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${siteConfig.clarityId}");`,
          }}
        />
      )}
      {googleClientId && allowGoogleIdentity && !isLocalStorefrontEnv() ? (
        <Script
          id="google-identity-services"
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
      ) : null}
    </>
  )
}
