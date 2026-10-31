import Nav from "@modules/layout/templates/nav"
import Footer from "@modules/layout/templates/footer"
import { ModalProvider } from "@core/context/modal-context"
import NavWrapper from "@modules/layout/components/nav-wrapper"
import { WishlistProvider } from "@core/context/wishlist-context"
import CheckoutLeaveGuard from "@modules/checkout/components/checkout-leave-guard"
import { retrieveCustomer } from "@core/data/customer"
import VerificationBanner from "@modules/layout/components/verification-banner"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await retrieveCustomer()
  return (
    <WishlistProvider>
      <ModalProvider>
        <CheckoutLeaveGuard />
        <NavWrapper>
          <Nav />
        </NavWrapper>
        {customer && <VerificationBanner customer={customer} />}
        <div className="w-full bg-page-bg relative min-h-screen">
          <div className="relative" data-testid="checkout-container">{children}</div>
        </div>
        <Footer />
      </ModalProvider>
    </WishlistProvider>
  )
}
