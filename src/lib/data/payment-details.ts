"use server"

import { sdk } from "@core/config"
import { getAuthHeaders } from "@core/data/cookies"

export const updatePaymentDetail = async (
  id: string,
  type: "upi" | "bank" | "card",
  detail_json: Record<string, string>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client.fetch<{ payment_detail: any }>(
    `/store/payment-details/${id}`,
    {
      method: "PUT",
      headers,
      body: { type, detail_json },
    }
  )
}
