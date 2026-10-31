/**
 * Next.js image optimizer settings for product photos (S3 HEIF served as .png).
 * Requires glibc Sharp (node:24-slim in Docker — not Alpine).
 */
function getImageConfig() {
  return {
    // Per-image `unoptimized` controls delivery. Global off so category/product/hero
    // can resize S3 originals via /_next/image even when DIRECT_REMOTE is set.
    unoptimized: false,
    remotePatterns: require("./image-remote-patterns").getImageRemotePatterns(),
    formats: ["image/avif", "image/webp"],
    // 1920/2560 — full-bleed banners on retina. Product cards still pick
    // smaller widths via their `sizes` attributes.
    deviceSizes: [640, 750, 828, 1000, 1080, 1200, 1920, 2560],
    // Include small widths for cart/checkout/review thumbs (display × 2).
    imageSizes: [64, 96, 128, 160, 256, 384, 480, 640],
    // Next 15 only serves qualities listed here.
    qualities: [65, 70, 75, 90, 95],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  }
}

const PRODUCT_IMAGE = {
  quality: {
    gallery: 90,
    galleryThumb: 70,
    galleryZoom: 95,
    card: 65,
    thumbnail: 65,
  },
  sizes: {
    gallery: "(max-width: 768px) 100vw, (max-width: 1280px) 48vw, 680px",
    galleryThumb: "(max-width: 640px) 25vw, 15vw",
    galleryZoom: "(min-width: 1024px) 680px, 100vw",
    card: "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 320px",
    // Match Thumbnail size props (small/medium/large/square); avoid 800px overfetch.
    thumbnail:
      "(max-width: 576px) 180px, (max-width: 768px) 290px, (max-width: 992px) 440px, 440px",
  },
  /** Native dimensions of uploaded product photos — keeps aspect ratio & srcset accurate. */
  dimensions: {
    width: 1000,
    height: 1405,
  },
}

module.exports = { getImageConfig, PRODUCT_IMAGE }
