function getFixedHeaderOffset(extraPx = 12): number {
  const spacer = document.querySelector(".nav-header-spacer")
  if (spacer instanceof HTMLElement && spacer.offsetHeight > 0) {
    return spacer.offsetHeight + extraPx
  }

  const root = getComputedStyle(document.documentElement)
  const rootFontSize = parseFloat(root.fontSize) || 16

  const readRem = (name: string, fallbackRem: number) => {
    const raw = root.getPropertyValue(name).trim()
    if (!raw) {
      return fallbackRem * rootFontSize
    }

    if (raw.endsWith("rem")) {
      return parseFloat(raw) * rootFontSize
    }

    if (raw.endsWith("px")) {
      return parseFloat(raw)
    }

    const numeric = parseFloat(raw)
    return Number.isFinite(numeric) ? numeric : fallbackRem * rootFontSize
  }

  return (
    readRem("--header-height", 4) +
    readRem("--promo-bar-height", 0) +
    extraPx
  )
}

export function scrollToRelatedProducts(
  behavior: ScrollBehavior = "smooth"
): boolean {
  const target =
    document.getElementById("related-products-heading") ??
    document.getElementById("related-products-scroll-target") ??
    document.getElementById("related-products")

  if (!target) {
    return false
  }

  const offset = getFixedHeaderOffset()
  const scrollToTarget = (element: HTMLElement) => {
    const top =
      element.getBoundingClientRect().top + window.scrollY - offset

    window.scrollTo({
      top: Math.max(0, top),
      behavior,
    })
  }

  scrollToTarget(target)

  // Related products hydrate after Suspense — fine-tune once heading is ready.
  if (target.id !== "related-products-heading") {
    window.setTimeout(() => {
      const heading = document.getElementById("related-products-heading")
      if (heading) {
        scrollToTarget(heading)
      }
    }, 120)
  }

  return true
}
