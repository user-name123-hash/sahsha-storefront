"use server"

import { sdk } from "@core/config"
import medusaError from "@core/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheTag,
  removeBuyNowCartId,
  setBuyNowCartId,
} from "@core/data/cookies"
import { getRegion } from "@core/data/regions"
import { getLocale } from "@core/data/locale-actions"
import { retrieveCustomer } from "@core/data/customer"
import {
  createBuyNowMetadata,
  getBuyNowCheckoutUrl,
  shouldSkipToPayment,
  validateAddToCartInput,
} from "@core/domain/cart"
import { addShippingMethodWithPricing } from "@core/data/cart"
import type { SizeFallbackLineMetadata } from "@lib/util/size-fallback"

export async function buyNowWithSizeFallback({
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
  validateAddToCartInput({ variantId, quantity })

  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const locale = await getLocale()

  const cartResp = await sdk.store.cart.create(
    {
      region_id: region.id,
      locale: locale || undefined,
      metadata: createBuyNowMetadata(),
    },
    {},
    headers
  )
  const cart = cartResp.cart

  await removeBuyNowCartId()
  await setBuyNowCartId(cart.id)

  try {
    await sdk.client.fetch(`/store/carts/merge/skip`, {
      method: "POST",
      body: { cart_id: cart.id },
      headers,
    })
  } catch (error) {
    console.error("Failed to skip cart merge for buy now cart:", error)
  }

  await sdk.store.cart.createLineItem(
    cart.id,
    {
      variant_id: variantId,
      quantity,
      metadata,
    },
    {},
    headers
  )

  const customer = await retrieveCustomer().catch(() => null)
  const defaultAddress =
    customer?.addresses?.find(
      (address) =>
        address.is_default_shipping ||
        address.metadata?.is_default === "true" ||
        address.metadata?.is_default === true
    ) || customer?.addresses?.[0]

  let skipToPayment = false

  if (defaultAddress) {
    try {
      await sdk.store.cart.update(
        cart.id,
        {
          shipping_address: {
            first_name: defaultAddress.first_name,
            last_name: defaultAddress.last_name,
            address_1: defaultAddress.address_1,
            address_2: defaultAddress.address_2,
            city: defaultAddress.city,
            country_code: defaultAddress.country_code,
            postal_code: defaultAddress.postal_code,
            province: defaultAddress.province,
            phone: defaultAddress.phone,
            company: defaultAddress.company,
          },
          billing_address: {
            first_name: defaultAddress.first_name,
            last_name: defaultAddress.last_name,
            address_1: defaultAddress.address_1,
            address_2: defaultAddress.address_2,
            city: defaultAddress.city,
            country_code: defaultAddress.country_code,
            postal_code: defaultAddress.postal_code,
            province: defaultAddress.province,
            phone: defaultAddress.phone,
            company: defaultAddress.company,
          },
          email: customer?.email,
        },
        {},
        headers
      )

      const { shipping_options } = await sdk.client.fetch<{
        shipping_options: HttpTypes.StoreCartShippingOption[]
      }>("/store/shipping-options", {
        query: { cart_id: cart.id },
        headers,
        cache: "no-store",
      })

      if (shouldSkipToPayment(shipping_options?.length ?? 0)) {
        await addShippingMethodWithPricing(
          cart.id,
          shipping_options[0].id,
          shipping_options[0]
        )
        skipToPayment = true
      }
    } catch (error) {
      console.error("Failed to auto-fill address and shipping:", error)
    }
  }

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
  revalidatePath(`/${countryCode}/checkout`, "page")

  redirect(getBuyNowCheckoutUrl(countryCode, cart.id, skipToPayment))
}
