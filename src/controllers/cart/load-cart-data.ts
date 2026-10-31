import { retrieveCart, getAbandonedCarts } from "@core/data/cart"
import { retrieveCustomer } from "@core/data/customer"
import type { CartPageData } from "@core/types/cart"
import { CART_RETRIEVE_FIELDS } from "@lib/cart-retrieve-fields"

export async function loadCartData(countryCode: string): Promise<CartPageData> {
  const [cart, customer, abandonedCarts] = await Promise.all([
    retrieveCart(undefined, CART_RETRIEVE_FIELDS),
    retrieveCustomer(),
    getAbandonedCarts(),
  ])

  return {
    cart,
    customer,
    countryCode,
    abandonedCarts,
  }
}
