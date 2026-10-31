import { HttpTypes } from "@medusajs/types"
import CartDropdown from "../cart-dropdown"

type CartButtonProps = {
  cart: HttpTypes.StoreCart | null
}

export default function CartButton({ cart }: CartButtonProps) {
  return <CartDropdown cart={cart} />
}
