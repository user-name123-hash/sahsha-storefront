"use server"

import { cookies } from "next/headers"
import { sdk } from "@core/config"
import medusaError from "@core/util/medusa-error"
import {
  getAuthHeaders,
  getCacheOptions,
} from "@core/data/cookies"
import { HttpTypes } from "@medusajs/types"

const ORDER_DETAIL_FIELDS =
  "id,display_id,customer_id,email,created_at,status,fulfillment_status,payment_status,currency_code,subtotal,shipping_total,tax_total,discount_total,metadata,total,*payment_collections.payments,*items,*items.metadata,*items.variant,*items.variant.images,*items.variant.product,*items.variant.product.thumbnail,*items.variant.product.images,*items.variant.product.variants,*items.product,*items.product.thumbnail,*items.product.images,*items.product.variants,*fulfillments,*fulfillments.items,*fulfillments.labels,*returns,*returns.items,*cart,*shipping_address,*billing_address,*region,*shipping_methods"

export const retrieveOrder = async (id: string) => {
  const cookieStore = await cookies()
  const token = cookieStore.get("_medusa_jwt")?.value
  const guestToken = !token
    ? cookieStore.get("_medusa_guest_jwt")?.value ||
      cookieStore.get("_medusa_guest_token")?.value
    : null

  const next = {
    ...(await getCacheOptions("orders")),
  }

  if (guestToken && !token) {
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

    const requestHeaders: Record<string, string> = {
      Authorization: `Bearer ${guestToken}`,
    }
    if (publishableKey) {
      requestHeaders["x-publishable-api-key"] = publishableKey
    }

    const response = await sdk.client.fetch<any>(`/store/orders/${id}`, {
      method: "GET",
      headers: requestHeaders,
      query: {
        fields: ORDER_DETAIL_FIELDS,
      },
      cache: "no-store",
    })

    if (!response || !response.order) {
      throw new Error("Order not found or access denied")
    }

    return response.order
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: {
        fields: ORDER_DETAIL_FIELDS,
      },
      headers,
      next,
      cache: "no-store",
    })
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}
