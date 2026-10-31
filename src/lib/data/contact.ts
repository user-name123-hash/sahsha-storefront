"use server"

import { sdk } from "@core/config"
import { getAuthHeaders } from "@core/data/cookies"

export type ContactRequest = {
  id: string
  email: string
  payload: {
    full_name: string
    phone: string
    topic: string
    message: string
  }
  reply?: string
  reply_comment?: string
  reply_images?: string[]
  comments?: Array<{
    id: string
    comment: string
    images?: string[]
    created_at: string
  }>
  status: string
  created_at: string
  updated_at: string
  [key: string]: any
}

export type ContactRequestResponse = {
  requests: ContactRequest[]
  count: number
  limit: number
  offset: number
}

export const listContactRequests = async (
  limit: number = 10,
  offset: number = 0
): Promise<ContactRequestResponse | null> => {
  const headers = await getAuthHeaders()

  if (!headers || !("authorization" in headers)) {
    return null
  }

  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    expand: "comments",
    order: "created_at",
    order_direction: "DESC",
  })

  return sdk.client
    .fetch<ContactRequestResponse>(
      `/store/contact-requests?${queryParams.toString()}`,
      {
        method: "GET",
        headers,
        next: {
          revalidate: 0,
        },
      }
    )
    .then((res) => res)
    .catch((err) => {
      console.error("Error fetching contact requests:", err)
      return null
    })
}
