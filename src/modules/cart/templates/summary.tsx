"use client"

import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import type { CartSummaryProps } from "@core/types/cart"

function getCheckoutStep(
  _cart: CartSummaryProps["cart"],
  _customer: CartSummaryProps["customer"]
) {
  return "payment"
}

const Summary = ({ cart, customer }: CartSummaryProps) => {
  const step = getCheckoutStep(cart, customer)

  return (
    <div className="flex flex-col gap-y-4 cart-page__sidebar">
      <DiscountCode cart={cart} />
      <CartTotals totals={cart} items={cart.items} checkoutStep={step} customer={customer} />
    </div>
  )
}

export default Summary
