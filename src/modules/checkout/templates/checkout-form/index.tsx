import { listCartShippingMethods } from "@core/data/fulfillment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Shipping from "@modules/checkout/components/shipping"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = cart.region?.payment_providers || []

  if (!shippingMethods) {
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-6 min-[550px]:gap-y-8">
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      {/* Payment and Review components are shown on /checkout/payment page */}
      <Payment cart={cart} availablePaymentMethods={paymentMethods} />

      {/* <Review cart={cart} /> */}
    </div>
  )
}
