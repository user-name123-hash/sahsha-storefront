/**
 * Next.js redirect()/notFound() throw control-flow errors that must be rethrown.
 * Never surface these strings in the UI.
 */

const CONTROL_FLOW_RE = /NEXT_REDIRECT|NEXT_REDIRECTION|NEXT_NOT_FOUND|NEXT_HTTP_ERROR_FALLBACK/i

function textLooksLikeControlFlow(value: string): boolean {
  return CONTROL_FLOW_RE.test(value)
}

export function isNextRedirectError(err: unknown): boolean {
  if (err == null) return false

  if (typeof err === "string") {
    return textLooksLikeControlFlow(err)
  }

  if (typeof err !== "object") {
    return textLooksLikeControlFlow(String(err))
  }

  const digest =
    "digest" in err ? String((err as { digest?: unknown }).digest ?? "") : ""
  if (textLooksLikeControlFlow(digest)) {
    return true
  }

  const message =
    err instanceof Error
      ? err.message
      : "message" in err
        ? String((err as { message?: unknown }).message ?? "")
        : ""

  if (textLooksLikeControlFlow(message)) {
    return true
  }

  try {
    return textLooksLikeControlFlow(String(err))
  } catch {
    return false
  }
}

export function safeErrorMessage(err: unknown, fallback: string): string {
  if (isNextRedirectError(err)) return fallback
  if (err instanceof Error) {
    const msg = err.message?.trim()
    if (!msg || textLooksLikeControlFlow(msg)) return fallback
    return msg
  }
  if (typeof err === "string") {
    const msg = err.trim()
    if (!msg || textLooksLikeControlFlow(msg)) return fallback
    return msg
  }
  return fallback
}

export function isNextRedirectMessage(value: unknown): boolean {
  return typeof value === "string" && textLooksLikeControlFlow(value)
}
