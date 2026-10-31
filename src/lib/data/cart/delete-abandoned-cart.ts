"use server"

import { sdk } from "@core/config"
import {
  getAuthHeaders,
  getCacheTag,
  removeBuyNowCartId,
} from "@core/data/cookies"
import { revalidateTag } from "next/cache"
import { cookies as nextCookies } from "next/headers"
import { HttpTypes } from "@medusajs/types"

/**
 * Remove a pending Buy Now / Reorder cart using the same Store API as
 * bag item remove: DELETE /store/carts/:id/line-items/:line_id
 * Then clear ephemeral metadata so it no longer appears as pending.
 */
export async function deleteAbandonedCart(cartId: string) {
  if (!cartId) {
    return { success: false, error: "Missing cart id." }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!("authorization" in headers) || !headers.authorization) {
    return { success: false, error: "Please login to remove this order." }
  }

  try {
    const cartRes = await sdk.client.fetch<{ cart: HttpTypes.StoreCart }>(
      `/store/carts/${cartId}`,
      {
        method: "GET",
        query: {
          fields: "*items,+metadata",
        },
        headers,
        cache: "no-store",
      }
    )

    const cart = cartRes?.cart
    if (!cart) {
      return { success: false, error: "Cart not found." }
    }

    const metadata = (cart.metadata || {}) as Record<string, unknown>
    if (metadata.is_buy_now !== true && metadata.is_reorder !== true) {
      return {
        success: false,
        error: "Only pending Buy Now or Reorder orders can be removed.",
      }
    }

    const items = cart.items || []
    for (const item of items) {
      await sdk.store.cart.deleteLineItem(cartId, item.id, {}, headers)
    }

    const nextMetadata = { ...metadata }
    delete nextMetadata.is_buy_now
    delete nextMetadata.is_reorder

    await sdk.store.cart.update(cartId, { metadata: nextMetadata }, {}, headers)

    const cookieStore = await nextCookies()
    if (cookieStore.get("buy_now_cart_id")?.value === cartId) {
      await removeBuyNowCartId()
    }

    const cartCacheTag = await getCacheTag("carts")
    if (cartCacheTag) {
      revalidateTag(cartCacheTag)
    }

    return { success: true }
  } catch (e: any) {
    console.error("Failed to delete abandoned cart:", e)
    return {
      success: false,
      error: e?.message || "Failed to remove pending order.",
    }
  }
}
