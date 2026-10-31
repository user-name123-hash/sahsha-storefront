/**
 * Safe browser APIs for Instagram / Facebook in-app WebViews (esp. iOS WKWebView),
 * which often lack Notification/ServiceWorker and throw on storage access.
 */

export function isMetaInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false
  return /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS|Messenger/i.test(
    navigator.userAgent || ""
  )
}

export function safeLocalGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeLocalSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private / blocked storage */
  }
}

export function safeSessionGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeSessionSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* private / blocked storage */
  }
}

/** True when push / FCM can run without throwing in restricted WebViews. */
export function canUseWebPush(): boolean {
  if (typeof window === "undefined") return false
  if (isMetaInAppBrowser()) return false
  if (!("Notification" in window)) return false
  if (!("serviceWorker" in navigator)) return false
  return true
}
