"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"

type NavItem = {
  id: string
  href: string
  label: string
  isActive: (path: string) => boolean
  icon: (active: boolean) => ReactNode
}

function stripCountryCode(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 1) return "/"
  return `/${segments.slice(1).join("/")}`
}

function isHomePath(path: string) {
  return path === "/" || path === ""
}

function isShopPath(path: string) {
  return (
    path.startsWith("/store") ||
    path.startsWith("/categories") ||
    path.startsWith("/collections") ||
    path.startsWith("/products")
  )
}

function iconSpan(src: string) {
  return (
    <span
      className="mobile-bottom-nav__img"
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
      }}
      aria-hidden
    />
  )
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "home",
    href: "/",
    label: "Home",
    isActive: isHomePath,
    icon: () => iconSpan("/home.svg"),
  },
  {
    id: "shop",
    href: "/store",
    label: "Shop",
    isActive: isShopPath,
    icon: () => iconSpan("/shopping-bag.svg"),
  },
  {
    id: "cart",
    href: "/cart",
    label: "Cart",
    isActive: (path) => path.startsWith("/cart"),
    icon: () => iconSpan("/shopping-cart.svg"),
  },
  {
    id: "account",
    href: "/account",
    label: "Account",
    isActive: (path) => path.startsWith("/account"),
    icon: () => iconSpan("/user.svg"),
  },
]

type MobileBottomNavClientProps = {
  cartCount?: number
}

export default function MobileBottomNavClient({
  cartCount = 0,
}: MobileBottomNavClientProps) {
  const pathname = usePathname() || ""
  const path = stripCountryCode(pathname)

  if (path.startsWith("/checkout")) {
    return null
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <ul className="mobile-bottom-nav__list">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(path)

          return (
            <li key={item.id} className="mobile-bottom-nav__item">
              <LocalizedClientLink
                href={item.href}
                className={clx(
                  "mobile-bottom-nav__link",
                  active && "mobile-bottom-nav__link--active"
                )}
                aria-current={active ? "page" : undefined}
                data-testid={`mobile-bottom-nav-${item.id}`}
              >
                <span className="mobile-bottom-nav__icon-wrap">
                  {item.icon(active)}
                  {item.id === "cart" && cartCount > 0 && (
                    <span className="mobile-bottom-nav__badge" aria-hidden>
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </span>
                <span className="mobile-bottom-nav__label">{item.label}</span>
              </LocalizedClientLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
