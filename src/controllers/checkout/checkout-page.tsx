import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutBeginTracker from "@modules/checkout/components/checkout-begin-tracker"
import CheckoutFormSlot from "@controllers/checkout/checkout-form-slot"
import CheckoutSummarySlot from "@controllers/checkout/checkout-summary-slot"
import type { CheckoutPageData } from "@controllers/checkout/load-checkout-data"

type CheckoutPageProps = {
  data: CheckoutPageData
}

export async function CheckoutPage({ data }: CheckoutPageProps) {
  const { cart, customer } = data

  return (
    <div className="checkout-page__container w-full max-w-[1360px] mx-auto">
      <CheckoutBeginTracker cart={cart} />
      <div className="grid grid-cols-1 min-[1024px]:grid-cols-[1fr_416px] gap-4 min-[550px]:gap-5 sm:gap-6 md:gap-8 min-[768px]:gap-6 min-[1023px]:gap-4 min-[1150px]:gap-6 min-[1200px]:gap-10 min-[1360px]:gap-12 w-full items-start">
        <div className="w-full min-[1024px]:sticky min-[1024px]:top-20">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            .checkout-form-scroll::-webkit-scrollbar { display: none; }
            .checkout-form-scroll { -ms-overflow-style: none; scrollbar-width: none; }
          `,
            }}
          />
          <div className="w-full min-[1024px]:max-h-[calc(100vh-140px)] min-[1024px]:overflow-y-auto min-[1024px]:pr-4 checkout-form-scroll">
            <PaymentWrapper cart={cart}>
              <CheckoutFormSlot cart={cart} customer={customer} />
            </PaymentWrapper>
          </div>
        </div>
        <div className="w-full min-[1024px]:sticky min-[1024px]:top-20">
          <CheckoutSummarySlot cart={cart} customer={customer} />
        </div>
      </div>
    </div>
  )
}
