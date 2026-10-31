/** True when the public storefront URL is local dev (skip FedCM / One Tap). */
export function isLocalStorefrontEnv(): boolean {
  if (process.env.NODE_ENV === "development") {
    return true
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL || "").trim().toLowerCase()
  if (!base) return false
  try {
    const { hostname } = new URL(base)
    return hostname === "localhost" || hostname === "127.0.0.1"
  } catch {
    return false
  }
}
