/** Normalize Medusa / S3 / relative media paths for next/image. */
export function resolveMediaUrl(
  url: string | null | undefined
): string | null {
  if (!url || typeof url !== "string") return null

  const trimmed = url.trim()
  if (!trimmed) return null

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed
  }

  const base =
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "http://localhost:9000"

  return `${base.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`
}
