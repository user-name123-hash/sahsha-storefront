import { HttpTypes } from "@medusajs/types"
import { isEphemeralCart } from "@core/domain/cart"

/**
 * Nav / bottom-nav badge count. Ephemeral buy-now/reorder carts must not
 * inflate the bag badge when the main bag is empty.
 */
export function getCartBadgeCount(
  cart?: HttpTypes.StoreCart | null
): number {
  if (!cart?.items?.length) return 0
  if (isEphemeralCart(cart.metadata as Record<string, unknown> | null)) {
    return 0
  }

  return cart.items.reduce((total, item) => {
    const qty = Number(item.quantity)
    return total + (Number.isFinite(qty) && qty > 0 ? qty : 0)
  }, 0)
}
