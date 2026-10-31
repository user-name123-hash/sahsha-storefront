import { getCartBadgeCount } from "@lib/cart-badge-count"
import { retrieveCartForChrome } from "@lib/data/retrieve-cart-for-chrome"

import MobileBottomNavClient from "./mobile-bottom-nav-client"

export default async function MobileBottomNav() {
  const cart = await retrieveCartForChrome()
  const cartCount = getCartBadgeCount(cart)

  return <MobileBottomNavClient cartCount={cartCount} />
}
