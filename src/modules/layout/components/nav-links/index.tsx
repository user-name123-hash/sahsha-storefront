"use client"

import { usePathname } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const NavLinks = () => {
  const pathname = usePathname() || ""

  const isActive = (href: string) => {
    // Remove country code from pathname for comparison
    const path = pathname ? pathname.split("/").slice(2).join("/") || "/" : "/"
    const linkPath = href === "/" ? "/" : href.replace(/^\//, "")

    // For home page
    if (href === "/") {
      return path === "" || path === "/"
    }

    // For other pages, check if path starts with linkPath
    return path === linkPath || path.startsWith(linkPath + "/")
  }

  const linkClass = (href: string) => {
    const active = isActive(href)
    return `text-sm xl:text-base transition-colors whitespace-nowrap ${active
      ? "text-brand-accent"
      : "text-muted hover:text-brand-accent"
      }`
  }

  return (
    <>
      <LocalizedClientLink
        href="/"
        className={linkClass("/")}
        data-testid="nav-home-link"
      >
        Home
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/store"
        className={linkClass("/store")}
        data-testid="nav-shop-link"
      >
        Shop
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/contact"
        className={linkClass("/contact")}
        data-testid="nav-contact-link"
      >
        Contact Us
      </LocalizedClientLink>
      <LocalizedClientLink
        href="/help"
        className={linkClass("/help")}
        data-testid="nav-help-link"
      >
        Help
      </LocalizedClientLink>
    </>
  )
}

export default NavLinks

