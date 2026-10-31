"use client"

import dynamic from "next/dynamic"
import type { HttpTypes } from "@medusajs/types"
import type { WelcomeCouponConfig } from "@lib/data/welcome-coupon"

const LoginPopup = dynamic(
  () => import("@modules/layout/components/login-popup/login-popup"),
  { ssr: false }
)

const WelcomeCouponPopup = dynamic(
  () =>
    import("@modules/layout/components/login-popup/welcome-coupon-popup"),
  { ssr: false }
)

const FreeShippingPriceNudge = dynamic(
  () => import("@modules/shipping/components/free-shipping-price-nudge"),
  { ssr: false }
)

type LayoutDeferredChromeProps = {
  showLoginPopup: boolean
  welcomeCouponEnabled: boolean
  welcomeCoupon: WelcomeCouponConfig
  logoSrc: string
  cart: HttpTypes.StoreCart | null
  shippingOptions: HttpTypes.StoreCartShippingOption[]
}

/**
 * Client-only islands — `ssr: false` is illegal in Server Components,
 * so deferred chrome lives here.
 */
export default function LayoutDeferredChrome({
  showLoginPopup,
  welcomeCouponEnabled,
  welcomeCoupon,
  logoSrc,
  cart,
  shippingOptions,
}: LayoutDeferredChromeProps) {
  return (
    <>
      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      {showLoginPopup && <LoginPopup />}
      {welcomeCouponEnabled && (
        <WelcomeCouponPopup config={welcomeCoupon} logoSrc={logoSrc} />
      )}
    </>
  )
}
