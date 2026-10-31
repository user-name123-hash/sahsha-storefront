import { HttpTypes } from "@medusajs/types"
import CartItemCard from "@modules/cart/components/cart-item-card"

export type CartItemSlotProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  cart?: HttpTypes.StoreCart | null
}

export default function CartItem({ item, currencyCode, cart }: CartItemSlotProps) {
  return <CartItemCard item={item} currencyCode={currencyCode} cart={cart} />
}
