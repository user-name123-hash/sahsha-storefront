import { montserrat, playfair } from "@lib/site-fonts"
import { cookies } from "next/headers"
import { Metadata } from "next"
import { Suspense } from "react"
import "@theme/tokens/theme.css"
import "styles/globals.css"
import CookieConsent from "@modules/layout/components/cookie-consent"
import DeferredThirdPartyScripts from "@modules/analytics/deferred-third-party-scripts"
import { getRootMetadata } from "@lib/site-metadata"
import { isClarityEnabled, isGtmEnabled, siteConfig } from "@lib/site-config"
import { ShopBrandingProvider } from "@lib/context/shop-branding-context"
import { LoadingSystem } from "@modules/loaders"
import { STRIP_META_TRACKING_PARAMS_SCRIPT } from "@lib/util/meta-tracking-params"
import SafeGoogleAuthShell from "@modules/common/components/safe-google-auth-shell"
import { isLocalStorefrontEnv } from "@lib/is-local-storefront"

/** Reads Shop Name / SEO fields from dynamic-config (public cache, 5 min). */
export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await getRootMetadata()),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: "/apple-touch-icon.png",
      shortcut: "/favicon.ico",
    },
  }
}

/** Cookie gate only — keeps One Tap off for signed-in users without blocking HTML. */
async function GoogleAuthGate() {
  if (isLocalStorefrontEnv()) return null
  const cookieStore = await cookies()
  const hasJwt = Boolean(cookieStore.get("_medusa_jwt")?.value)
  return <SafeGoogleAuthShell isAuthenticated={hasJwt} />
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME?.trim() || "Sahsha"
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()
  const requireConsent = siteConfig.features.cookieConsent !== false

  return (
    <html
      lang="en"
      data-mode="light"
      suppressHydrationWarning
      className={`${montserrat.variable} ${playfair.variable}`}
    >
      <head>
        {/* Strip Instagram/Facebook click IDs before hydration (in-app browser). */}
        <script
          id="strip-meta-tracking-params"
          dangerouslySetInnerHTML={{
            __html: STRIP_META_TRACKING_PARAMS_SCRIPT,
          }}
        />
        {isGtmEnabled() && (
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        )}
        {isClarityEnabled() && (
          <link rel="dns-prefetch" href="https://www.clarity.ms" />
        )}
        {/* Hero CDN — start TLS early for LCP image from ap-south-1 */}
        <link
          rel="preconnect"
          href="https://sahsha-images.s3.ap-south-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://sahsha-images.s3.ap-south-1.amazonaws.com"
        />
        {requireConsent && (
          <script
            id="cookie-consent-init"
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var k="cookie_consent";var v=localStorage.getItem(k);if(v!=="granted"&&v!=="denied"){document.documentElement.setAttribute("data-cookie-banner","pending");}}catch(e){}})();`,
            }}
          />
        )}
      </head>
      <body className="bg-page-bg font-sans antialiased">
        <Suspense fallback={null}>
          <GoogleAuthGate />
        </Suspense>
        <ShopBrandingProvider shopName={shopName}>
          <Suspense fallback={null}>
            <LoadingSystem />
          </Suspense>
          <div className="relative">{props.children}</div>
          {requireConsent && <CookieConsent />}
        </ShopBrandingProvider>

        {/* Third-party scripts after consent (or idle if consent disabled) */}
        <DeferredThirdPartyScripts
          requireConsent={requireConsent}
          googleClientId={googleClientId}
        />
      </body>
    </html>
  )
}
