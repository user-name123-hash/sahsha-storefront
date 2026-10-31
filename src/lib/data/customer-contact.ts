"use server"

import { getAuthHeaders, getCacheTag, setAuthToken } from "@core/data/cookies"
import { revalidateTag } from "next/cache"

const getHeaders = () => {
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  return {
    "Content-Type": "application/json",
    "x-publishable-api-key": publishableKey || "",
  }
}

const getBaseUrl = () =>
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

/**
 * Request OTP to add/change email (or phone) via
 * POST /store/customers/me/contact
 */
export async function requestContactChange(input: {
  email?: string
  phone?: string
}): Promise<{ success: boolean; token?: string; error?: string }> {
  const email = input.email?.trim().toLowerCase()
  const phone = input.phone?.trim()

  if (!email && !phone) {
    return { success: false, error: "Email or phone is required" }
  }

  try {
    const response = await fetch(`${getBaseUrl()}/store/customers/me/contact`, {
      method: "POST",
      headers: {
        ...getHeaders(),
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify(email ? { email } : { phone }),
      cache: "no-store",
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        success: false,
        error: err.message || "Failed to send verification code",
      }
    }

    const data = await response.json()
    return { success: true, token: data.token as string }
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send verification code",
    }
  }
}

/**
 * Confirm contact change OTP via POST /store/customers/me/contact/verify
 */
export async function verifyContactChange(
  token: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (!token || !code) {
    return { success: false, error: "OTP is required" }
  }

  try {
    const response = await fetch(
      `${getBaseUrl()}/store/customers/me/contact/verify`,
      {
        method: "POST",
        headers: {
          ...getHeaders(),
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify({ token, code }),
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return { success: false, error: err.message || "Invalid OTP" }
    }

    const data = await response.json()
    if (typeof data.token === "string" && data.token) {
      await setAuthToken(data.token)
    }

    const customerCacheTag = await getCacheTag("customers")
    if (customerCacheTag) {
      revalidateTag(customerCacheTag)
    }

    return { success: true }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify OTP",
    }
  }
}
