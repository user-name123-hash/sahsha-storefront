"use server"

import { placeOrder as corePlaceOrder, retrieveCart, updateCart } from "@core/data/cart"
import { getCartId } from "@core/data/cookies"
import {
  buildOrderSizeFallbackMetadata,
  ORDER_FALLBACK_METADATA,
} from "@lib/util/size-fallback"

export async function placeOrderWithSizeFallback(cartId?: string) {
  const id = cartId || (await getCartId())

  if (id) {
    const cart = await retrieveCart(id)

    if (cart?.items?.length) {
      const { summary, details } = buildOrderSizeFallbackMetadata(cart.items)

      if (summary) {
        await updateCart({
          metadata: {
            ...(cart.metadata ?? {}),
            [ORDER_FALLBACK_METADATA.summary]: summary,
            [ORDER_FALLBACK_METADATA.details]: details,
          },
        })
      }
    }
  }

  return corePlaceOrder(cartId)
}
