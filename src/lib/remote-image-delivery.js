/**
 * Legacy flag: previously disabled all next/image optimization globally.
 * Optimization is now per-component; this helper remains for optional overrides.
 *
 * Set NEXT_PUBLIC_DIRECT_REMOTE_IMAGES=true|false to override auto-detection.
 */
function shouldLoadRemoteImagesDirectly() {
  const override = process.env.NEXT_PUBLIC_DIRECT_REMOTE_IMAGES
  if (override === "true") return true
  if (override === "false") return false

  const raw =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    process.env.MEDUSA_BACKEND_URL ||
    ""
  const url = raw.trim()
  if (!url) return false

  try {
    const { hostname } = new URL(url)
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "backend"
    ) {
      return false
    }
    // Remote Vyaparnext / S3: skip local next/image proxy (dev and prod builds).
    return true
  } catch {
    return false
  }
}

module.exports = { shouldLoadRemoteImagesDirectly }
