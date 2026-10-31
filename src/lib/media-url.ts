/** Legacy / private buckets referenced in imported admin config — skip in UI. */
const BLOCKED_IMAGE_HOSTS = ["chocomelon-1.s3.ap-south-1.amazonaws.com"]

export function isBlockedMediaUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return true

  try {
    const hostname = new URL(url.trim()).hostname.toLowerCase()
    return BLOCKED_IMAGE_HOSTS.some(
      (blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`)
    )
  } catch {
    return false
  }
}

export function sanitizePublicMediaUrl(
  url: string | null | undefined
): string | undefined {
  if (!url?.trim()) return undefined
  if (isBlockedMediaUrl(url)) return undefined
  return url.trim()
}
