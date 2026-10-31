import type { FooterSlotData } from "@core/types/layout"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FooterLogo from "@modules/layout/components/footer-logo"
import FooterNewsletter from "@modules/layout/components/footer-newsletter"
import FooterSocial from "@modules/layout/components/footer-social"
import FooterTrackOrderLink from "@modules/layout/components/footer-track-order-link"

const COMPANY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact Us" },
  { href: "/help", label: "Help" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/returns-refund-policy", label: "Return and Refund Policy" },
  { href: "/terms-of-use", label: "Terms of Use" },
] as const

type FooterProps = FooterSlotData & {
  isLoggedIn?: boolean
}

export default function Footer({ categories, socialLinks, isLoggedIn = false }: FooterProps) {
  return (
    <footer className="site-footer">
      <div
        className="site-footer__inner mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <FooterLogo />
            <p className="site-footer__text max-w-xs mt-4">
              Beautiful, well-crafted ethnic wear without the compromise —
              born from siblings SAHil and maniSHA. For the woman who loves her
              culture and lives a contemporary life.
            </p>
          </div>

          <div>
            <LocalizedClientLink href="/store" className="site-footer__label site-footer__label--link">
              Shop
            </LocalizedClientLink>
            <ul className="space-y-2.5">
              {(categories?.slice(0, 6) ?? []).map((cat) => (
                <li key={cat.id}>
                  <LocalizedClientLink
                    href={`/store?category=${cat.id}`}
                    className="site-footer__link"
                  >
                    {cat.name}
                  </LocalizedClientLink>
                </li>
              ))}
              {!categories?.length && (
                <li>
                  <LocalizedClientLink href="/store" className="site-footer__link">
                    All products
                  </LocalizedClientLink>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="site-footer__label">Company</h3>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <LocalizedClientLink href={link.href} className="site-footer__link">
                    {link.label}
                  </LocalizedClientLink>
                </li>
              ))}
              <li>
                <FooterTrackOrderLink isLoggedIn={isLoggedIn} />
              </li>
            </ul>
          </div>

          <div className="site-footer__newsletter">
            <h3 className="site-footer__label">Newsletter</h3>
            <p className="site-footer__text site-footer__newsletter-text">
              Subscribe for exclusive offers and new arrivals.
            </p>
            <FooterNewsletter />
            <FooterSocial links={socialLinks ?? []} />
          </div>
        </div>

        <div className="site-footer__divider mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="site-footer__copyright">
            © {new Date().getFullYear()} Sahsha. All rights reserved.
          </p>
          <div className="flex gap-6">
            <LocalizedClientLink href="/privacy-policy" className="site-footer__link text-xs">
              Privacy
            </LocalizedClientLink>
            <LocalizedClientLink href="/terms-of-use" className="site-footer__link text-xs">
              Terms
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </footer>
  )
}
