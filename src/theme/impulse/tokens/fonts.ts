/**
 * Sitewide typography — only two families:
 * - Playfair Display: page titles, section headings (h1–h6, .font-display)
 * - Montserrat: body, paragraphs, buttons, product names, prices, labels, nav
 */
export const fontClasses = {
  sans: "font-sans",
  heading: "font-heading",
  display: "font-display",
  quote: "font-quote",
  mono: "font-sans",
  body: "font-sans leading-body tracking-body",
  pageTitle: "font-heading font-normal leading-heading tracking-heading",
  uiLabel: "font-sans text-xs font-semibold uppercase tracking-[var(--letter-spacing-nav)]",
  productName: "font-sans font-medium",
} as const
