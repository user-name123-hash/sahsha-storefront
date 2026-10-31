/** Fired after login / signup / logout so client providers can re-sync. */
export const AUTH_SESSION_CHANGED_EVENT = "sahsha:auth-session-changed"

export type AuthSessionChangeDetail = {
  /** logout: clear client state only. login (default): clear then re-fetch. */
  mode?: "login" | "logout"
}

export function notifyAuthSessionChanged(detail?: AuthSessionChangeDetail) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_CHANGED_EVENT, { detail })
  )
}
