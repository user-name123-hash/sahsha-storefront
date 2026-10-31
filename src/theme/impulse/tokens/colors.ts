/**
 * Semantic Tailwind classes mapped to CSS variables in theme.css.
 * Do not hardcode hex values here — edit theme.css instead.
 */
export const colorClasses = {
  pageBg: "bg-page-bg",
  surface: "bg-surface",
  surfaceMuted: "bg-surface-muted",
  brandAccent: "bg-brand-accent text-inverse",
  brandAccentText: "text-brand-accent",
  brandAccentBorder: "border-brand-accent",
  brandAccentMuted: "bg-brand-accent-muted",
  heading: "text-heading",
  headingSub: "text-heading-sub",
  body: "text-body",
  muted: "text-muted",
  inverse: "text-inverse",
  footerBg: "bg-brand-footer",
  promoGradient: "bg-promo-gradient",
  cartBorder: "bg-cart-border",
} as const
