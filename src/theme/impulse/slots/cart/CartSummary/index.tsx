import type { CartSummaryProps } from "@core/types/cart"
import Summary from "@modules/cart/templates/summary"

export type CartSummarySlotProps = CartSummaryProps

export default function CartSummary({ cart, customer }: CartSummarySlotProps) {
  return <Summary cart={cart} customer={customer} />
}
