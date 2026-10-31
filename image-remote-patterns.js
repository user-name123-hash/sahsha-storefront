/**
 * Project-specific next/image remotePatterns.
 * Customize hosts for your Medusa backend, CDN, and S3 buckets.
 */
function getImageRemotePatterns() {
  const patterns = [
    { protocol: "http", hostname: "localhost" },
    { protocol: "https", hostname: "**.amazonaws.com" },
  ]

  const backendUrl =
    process.env.FILE_LOCAL_BACKEND_URL || process.env.MEDUSA_BACKEND_URL
  if (backendUrl) {
    try {
      const hostname = new URL(backendUrl).hostname
      if (hostname && hostname !== "localhost") {
        patterns.push({ protocol: "https", hostname })
        patterns.push({ protocol: "http", hostname })
      }
    } catch {
      /* ignore invalid backend URL */
    }
  }

  const s3Hostname = process.env.MEDUSA_CLOUD_S3_HOSTNAME
  const s3Pathname = process.env.MEDUSA_CLOUD_S3_PATHNAME
  if (s3Hostname && s3Pathname) {
    patterns.push({
      protocol: "https",
      hostname: s3Hostname,
      pathname: s3Pathname,
    })
  }

  const extraHosts = process.env.NEXT_PUBLIC_IMAGE_HOSTS
  if (extraHosts) {
    for (const hostname of extraHosts.split(",").map((s) => s.trim()).filter(Boolean)) {
      patterns.push({ protocol: "https", hostname })
      patterns.push({ protocol: "http", hostname })
    }
  }

  return patterns
}

module.exports = { getImageRemotePatterns }
