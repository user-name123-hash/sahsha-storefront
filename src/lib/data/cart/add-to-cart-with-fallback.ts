"use server"

import { sdk } from "@core/config"
import medusaError from "@core/util/medusa-error"
import { getAuthHeaders, getCacheTag } from "@core/data/cookies"
import { getOrSetCart } from "@core/data/cart"
import { revalidateTag } from "next/cache"
import type { SizeFallbackLineMetadata } from "@lib/util/size-fallback"

export async function addToCartWithSizeFallback({
  variantId,
  quantity,
  countryCode,
  metadata,
}: {
  variantId: string
  quantity: number
  countryCode: string
  metadata?: SizeFallbackLineMetadata
}) {
  if (!variantId) {
    throw new Error("Missing variant ID")
  }

  if (!quantity || quantity < 1) {
    throw new Error("Quantity must be at least 1")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .createLineItem(
      cart.id,
      {
        variant_id: variantId,
        quantity,
        metadata,
      },
      {},
      headers
    )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}
