export const WELCOME_COUPON_PENDING_KEY = "sahsha_welcome_coupon_pending"
export const WELCOME_COUPON_EVENT = "sahsha:welcome-coupon"

export function markWelcomeCouponPending() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(WELCOME_COUPON_PENDING_KEY, "1")
    window.dispatchEvent(new Event(WELCOME_COUPON_EVENT))
  } catch {
    // private mode / blocked storage
  }
}

export function clearWelcomeCouponPending() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(WELCOME_COUPON_PENDING_KEY)
  } catch {
    // private mode / blocked storage
  }
}

export function isWelcomeCouponPending(): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(WELCOME_COUPON_PENDING_KEY) === "1"
  } catch {
    return false
  }
}
