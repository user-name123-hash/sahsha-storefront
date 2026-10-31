"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  denyCookieConsent,
  grantCookieConsent,
  readStoredConsent,
} from "@core/analytics/consent"
import { COOKIE_CONSENT_EVENT } from "@lib/cookie-consent-event"

const COOKIE_BANNER_ATTR = "data-cookie-banner"

function hideCookieBanner() {
  document.documentElement.removeAttribute(COOKIE_BANNER_ATTR)
}

function broadcastConsent(value: "granted" | "denied") {
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value })
  )
}

const CookieConsent = () => {
  const { countryCode } = useParams()
  const region =
    (countryCode as string) ||
    process.env.NEXT_PUBLIC_DEFAULT_REGION ||
    "in"

  useEffect(() => {
    try {
      if (readStoredConsent() !== null) {
        hideCookieBanner()
      }
    } catch {
      // Instagram iOS WebView can throw on localStorage — keep banner usable.
    }
  }, [])

  const acceptConsent = () => {
    try {
      grantCookieConsent()
    } catch {
      /* storage blocked */
    }
    hideCookieBanner()
    broadcastConsent("granted")
  }

  const rejectConsent = () => {
    try {
      denyCookieConsent()
    } catch {
      /* storage blocked */
    }
    hideCookieBanner()
    broadcastConsent("denied")
  }

  return (
    <div
      id="cookie-banner"
      className="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div id="cookie-content" className="cookie-banner__inner">
        <div className="cookie-banner__content">
          <p id="cookie-banner-title" className="cookie-banner__title">
            We use cookies to enhance your experience.
          </p>
          <p id="cookie-banner-desc" className="cookie-banner__text">
            By clicking &quot;Accept&quot;, you consent to our use of cookies.{" "}
            <Link
              href={`/${region}/privacy-policy`}
              className="cookie-banner__link"
            >
              Read our Privacy Policy
            </Link>
          </p>
        </div>

        <div className="cookie-banner__actions">
          <button
            type="button"
            onClick={rejectConsent}
            className="cookie-banner__btn cookie-banner__btn--reject"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={acceptConsent}
            className="cookie-banner__btn cookie-banner__btn--accept"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
