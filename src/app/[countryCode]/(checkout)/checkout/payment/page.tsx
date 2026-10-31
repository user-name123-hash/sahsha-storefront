import { retrieveCart } from "@core/data/cart"
import { retrieveCustomer } from "@core/data/customer"
import { listCartPaymentMethods } from "@core/data/payment"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutShippingTracker from "@modules/checkout/components/checkout-shipping-tracker"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import BackLink from "@modules/checkout/components/back-link"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Payment - Checkout",
}

export default async function PaymentPage() {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!paymentMethods) {
    return notFound()
  }

  return (
    <div className="w-full max-w-[1360px] mx-auto px-3 min-[550px]:px-4 sm:px-6 md:px-8 min-[1023px]:px-4 min-[1150px]:px-6 min-[1360px]:px-8 py-4 min-[550px]:py-6 sm:py-8 md:py-12 min-[1023px]:py-10 min-[1150px]:py-12 min-[1360px]:py-12">
      {/* Back Button */}
      <div className="mb-4 min-[550px]:mb-6">
        <BackLink />
      </div>
      <div className="grid grid-cols-1 min-[1024px]:grid-cols-[1fr_416px] gap-4 min-[550px]:gap-5 sm:gap-6 md:gap-8 min-[768px]:gap-6 min-[1023px]:gap-4 min-[1150px]:gap-6 min-[1200px]:gap-10 min-[1360px]:gap-12 w-full">
        <PaymentWrapper cart={cart}>
          <div className="w-full grid grid-cols-1 gap-y-6 min-[550px]:gap-y-8">
            <Payment cart={cart} availablePaymentMethods={paymentMethods} />
          </div>
        </PaymentWrapper>
        <CheckoutSummary cart={cart} customer={customer} />
      </div>
    </div>
  )
}
