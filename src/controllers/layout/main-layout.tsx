import { Suspense } from "react"
import { WishlistProvider } from "@core/context/wishlist-context"
import { resolveComponent } from "@registry/resolve-component"
import { loadLayoutData } from "@controllers/layout/load-layout-data"
import { MainLayoutShell } from "@theme/layouts/MainLayoutShell"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import LazyPushNotificationManager from "@modules/layout/components/lazy-push-notification-manager"
import DeletionPendingModal from "@modules/account/components/deletion-pending-modal"
import VerificationBanner from "@modules/layout/components/verification-banner"
import { LoginPopupProvider } from "@modules/layout/components/login-popup/login-popup-context"
import LayoutDeferredChrome from "@modules/layout/components/layout-deferred-chrome"
import MobileBottomNav from "@modules/layout/components/mobile-bottom-nav"
import { getLoginPopupFromConfig } from "@lib/data/login-popup"

type MainLayoutProps = {
  children: React.ReactNode
}

/** Reserve chrome height so hero overlap doesn't jump while nav streams in. */
function LayoutChromeFallback() {
  return (
    <div
      aria-hidden
      style={{
        height: "calc(var(--header-height, 64px) + var(--promo-bar-height, 36px))",
      }}
    />
  )
}

async function LayoutChrome() {
  const [data, PromoBar, Nav, loginPopupConfig] = await Promise.all([
    loadLayoutData(),
    resolveComponent("slots/layout/PromoBar").then((m) => m.default),
    resolveComponent("slots/layout/Nav").then((m) => m.default),
    getLoginPopupFromConfig(),
  ])

  const { welcomeCoupon } = data

  const { customer, cart, shippingOptions } = data
  const isLoggedIn = Boolean(customer && customer.id !== "pending_deletion")
  const showLoginPopup = loginPopupConfig.enabled && !isLoggedIn

  const chrome = (
    <>
      <PromoBar {...data.promoBar} />
      <Nav {...data.nav} cart={cart} />
      {customer && <VerificationBanner customer={customer} />}
      {customer && cart && <CartMismatchBanner customer={customer} cart={cart} />}
      <LayoutDeferredChrome
        showLoginPopup={showLoginPopup}
        welcomeCouponEnabled={welcomeCoupon.enabled}
        welcomeCoupon={welcomeCoupon}
        logoSrc={loginPopupConfig.logoSrc}
        cart={cart}
        shippingOptions={shippingOptions}
      />
      <LazyPushNotificationManager customerId={customer?.id} />
      {customer?.id === "pending_deletion" && (
        <DeletionPendingModal isOpen={true} email={customer.email} />
      )}
    </>
  )

  if (!showLoginPopup) {
    return chrome
  }

  return (
    <LoginPopupProvider
      popupConfig={loginPopupConfig}
      welcomeCoupon={welcomeCoupon}
      isLoggedIn={isLoggedIn}
    >
      {chrome}
    </LoginPopupProvider>
  )
}

async function LayoutFooter() {
  const [data, Footer] = await Promise.all([
    loadLayoutData(),
    resolveComponent("slots/layout/Footer").then((m) => m.default),
  ])
  const isLoggedIn = Boolean(
    data.customer && data.customer.id !== "pending_deletion"
  )

  return <Footer {...data.footer} isLoggedIn={isLoggedIn} />
}

/**
 * Streams page children immediately for TTFB/LCP.
 * Nav/footer/cart chrome load in parallel Suspense — same UI, faster first byte.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <WishlistProvider>
      <Suspense fallback={<LayoutChromeFallback />}>
        <LayoutChrome />
      </Suspense>
      <MainLayoutShell>{children}</MainLayoutShell>
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
      <Suspense fallback={null}>
        <LayoutFooter />
      </Suspense>
    </WishlistProvider>
  )
}
