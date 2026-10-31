import LocalizedClientLink from "@modules/common/components/localized-client-link"

type NavLinkLuxuryProps = {
  href: string
  label: string
}

export default function NavLinkLuxury({ href, label }: NavLinkLuxuryProps) {
  return (
    <LocalizedClientLink href={href} className="nav-luxury-link group">
      <span className="nav-luxury-link-label">{label}</span>
      <span className="nav-luxury-link-line" aria-hidden />
    </LocalizedClientLink>
  )
}
