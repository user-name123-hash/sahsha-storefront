"use server"

import { transferCart } from "@core/data/customer"
import { getCacheTag, removeSyncLock, setAuthToken } from "@core/data/cookies"
import { revalidateTag } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

type OtpAuthType = "email_auth" | "phone_auth"

const getHeaders = () => {
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  return {
    "Content-Type": "application/json",
    "x-publishable-api-key": publishableKey || "",
  }
}

const getBaseUrl = () =>
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

function buildSendOtpPayload(identifier: string): {
  body: Record<string, string>
  type: OtpAuthType
} {
  const value = identifier.trim()

  if (value.includes("@")) {
    return {
      body: { email: value.toLowerCase(), type: "email_auth" },
      type: "email_auth",
    }
  }

  const digits = value.replace(/[^\d+]/g, "")
  const phone = digits.startsWith("+") ? digits : `+${digits}`

  return {
    body: { phone, type: "phone_auth" },
    type: "phone_auth",
  }
}

export async function requestLoginOtp(identifier: string) {
  if (!identifier.trim()) {
    return { success: false, error: "Email or mobile number is required" }
  }

  const baseUrl = getBaseUrl()
  const { body } = buildSendOtpPayload(identifier)

  try {
    const response = await fetch(`${baseUrl}/store/customers/otp/send`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
      cache: "no-store",
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return {
        success: false,
        error: err.message || "Failed to send OTP. Please try again.",
      }
    }

    const data = await response.json()
    return {
      success: true,
      token: data.token as string,
      expiresAt: data.expires_at as string | undefined,
      isNewUser: Boolean(data.is_new_user),
    }
  } catch (error: unknown) {
    const { isNextRedirectError, safeErrorMessage } = await import(
      "@lib/util/is-next-redirect"
    )
    if (isNextRedirectError(error)) throw error
    return {
      success: false,
      error: safeErrorMessage(error, "Failed to send OTP"),
    }
  }
}

export async function verifyLoginOtp(
  _currentState: unknown,
  formData: FormData
) {
  const token = formData.get("otp_token") as string
  const code = formData.get("otp_code") as string
  const identifier = formData.get("identifier") as string
  const firstName = (formData.get("first_name") as string)?.trim()
  const isNewUser = formData.get("is_new_user") === "true"
  const countryCode = (formData.get("country_code") as string) || "in"
  const redirectUrl = formData.get("redirect_url") as string | null
  const skipRedirect = formData.get("skip_redirect") === "true"

  if (!token || !code || code.length < 6) {
    return "Please enter the 6-digit OTP"
  }

  if (isNewUser && !firstName) {
    return "Please enter your first name to continue"
  }

  const baseUrl = getBaseUrl()
  // Backend decide create vs login from token; first_name only used for new users.
  const verifyBody: Record<string, string> = { token, code }
  if (firstName) {
    verifyBody.first_name = firstName
    // Medusa requires last_name; OTP signup only collects first name.
    verifyBody.last_name = "."
  }

  try {
    const response = await fetch(`${baseUrl}/store/customers/otp/verify`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(verifyBody),
      cache: "no-store",
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const message = err.message || "Invalid OTP. Please try again."
      // Wrong register path leftover — guide user back to OTP continue flow
      if (
        typeof message === "string" &&
        message.toLowerCase().includes("already has an account")
      ) {
        return "This email already has an account. Use Continue with OTP to sign in."
      }
      return message
    }

    const data = await response.json()
    const loginToken = data.token as string | null | undefined

    if (!loginToken) {
      return data.needs_login
        ? "OTP verified. Please complete login."
        : "OTP verified but login failed. Please try again."
    }

    await setAuthToken(loginToken)
    // Allow middleware cart merge on the next page load after login.
    await removeSyncLock()

    const cookieIdentifier =
      data.customer?.email?.toLowerCase() ||
      (identifier.includes("@") ? identifier.toLowerCase() : identifier)

    if (cookieIdentifier) {
      const cookieStore = await cookies()
      cookieStore.set("_medusa_customer_email", cookieIdentifier, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
    }

    try {
      await transferCart(loginToken)
    } catch {
      // non-fatal
    }

    const customerCacheTag = await getCacheTag("customers")
    if (customerCacheTag) {
      revalidateTag(customerCacheTag)
    }

    if (skipRedirect) {
      return isNewUser ? "NEW_USER_SUCCESS" : "LOGIN_SUCCESS"
    }

    const hasKeepContext = redirectUrl?.includes("login_context=keep")
    if (redirectUrl && redirectUrl.startsWith("/") && hasKeepContext) {
      redirect(redirectUrl)
    }

    redirect(`/${countryCode}`)
  } catch (error: unknown) {
    const { isNextRedirectError, safeErrorMessage } = await import(
      "@lib/util/is-next-redirect"
    )
    if (isNextRedirectError(error)) throw error
    return safeErrorMessage(error, "Failed to verify OTP")
  }
}
