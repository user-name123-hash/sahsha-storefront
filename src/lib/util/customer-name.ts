/**
 * Build a display name from customer first/last, ignoring empty placeholders.
 * OTP signup often only has first_name; last_name may be null, "", ".", or the string "null".
 */
export function formatCustomerDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  fallback = ""
): string {
  const clean = (value?: string | null) => {
    const trimmed = value?.trim()
    if (!trimmed) return ""
    const lower = trimmed.toLowerCase()
    if (lower === "null" || lower === "undefined" || trimmed === ".") return ""
    return trimmed
  }

  const first = clean(firstName)
  const last = clean(lastName)
  const full = [first, last].filter(Boolean).join(" ")
  return full || fallback
}
