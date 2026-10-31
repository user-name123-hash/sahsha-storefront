"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"

import Menu from "@modules/common/icons/menu"
import X from "@modules/common/icons/x"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import { Suspense } from "react"
import WishlistCounter from "@modules/layout/components/wishlist-counter"

import { signout } from "@core/data/customer"
import { notifyAuthSessionChanged } from "@lib/auth-session-events"
import { HttpTypes } from "@medusajs/types"

const MenuIcon = ({ src, className = "w-5 h-5" }: { src: string; className?: string }) => (
  <span
    aria-hidden
    className={`mobile-menu-icon ${className}`}
    style={{ WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }}
  />
)

// Helper function to get profile image URL from metadata
const getProfileImageUrl = (customer: HttpTypes.StoreCustomer | null): string | null => {
  if (!customer) {
    return null
  }
  const metadata = customer.metadata as Record<string, any> | undefined
  if (metadata?.profile_image_url) {
    return metadata.profile_image_url
  }
  return null
}

const MobileMenu = ({ customer, countryCode }: { customer: HttpTypes.StoreCustomer | null, countryCode: string }) => {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const scrollYRef = useRef(0)

  const isActive = (href: string) => {
    const path = pathname.split("/").slice(2).join("/") || "/"
    const linkPath = href === "/" ? "/" : href.replace(/^\//, "")

    if (href === "/") {
      return path === "" || path === "/"
    }

    return path === linkPath || path.startsWith(linkPath + "/")
  }

  const linkClass = (href: string) => {
    const active = isActive(href)
    return `flex items-center gap-3 py-3 px-4 text-base transition-colors ${active
      ? "text-brand-accent font-semibold bg-brand-accent-muted"
      : "text-body hover:text-brand-accent hover:bg-surface-muted"
      }`
  }

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("mobile-menu-open")

      // Save current scroll position
      scrollYRef.current = window.scrollY || document.documentElement.scrollTop || 0

      // Lock scroll on both html and body
      const body = document.body
      const html = document.documentElement

      // Apply styles to prevent scrolling
      body.style.position = "fixed"
      body.style.top = `-${scrollYRef.current}px`
      body.style.left = "0"
      body.style.right = "0"
      body.style.overflow = "hidden"
      body.style.width = "100%"

      html.style.overflow = "hidden"
      html.style.height = "100%"

      // Prevent touch scrolling on backdrop (but allow in menu panel)
      const preventScroll = (e: TouchEvent | WheelEvent) => {
        const target = e.target as Element
        // Allow scrolling inside the menu panel
        if (target.closest('[data-menu-panel]')) {
          return
        }
        e.preventDefault()
      }

      // Add event listeners
      document.addEventListener("touchmove", preventScroll as EventListener, { passive: false })
      document.addEventListener("wheel", preventScroll as EventListener, { passive: false })

      return () => {
        document.removeEventListener("touchmove", preventScroll as EventListener)
        document.removeEventListener("wheel", preventScroll as EventListener)
        document.body.classList.remove("mobile-menu-open")
      }
    } else {
      document.body.classList.remove("mobile-menu-open")

      // Restore scrolling
      const body = document.body
      const html = document.documentElement

      body.style.position = ""
      body.style.top = ""
      body.style.left = ""
      body.style.right = ""
      body.style.overflow = ""
      body.style.width = ""

      html.style.overflow = ""
      html.style.height = ""

      // Restore scroll position
      const savedScroll = scrollYRef.current
      if (savedScroll !== undefined && savedScroll !== null) {
        window.scrollTo({
          top: savedScroll,
          behavior: "auto"
        })
      }
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      document.body.classList.remove("mobile-menu-open")
    }
  }, [])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="nav-header-mobile-menu-btn lg:hidden p-2 hover:opacity-80 transition-opacity"
        aria-label="Toggle menu"
        data-testid="mobile-menu-button"
        type="button"
      >
        <Menu size={20} className="w-5 h-5" />
      </button>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay fixed inset-0 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeMenu}
        aria-hidden={isOpen ? "false" : "true"}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Menu Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-64 min-[350px]:w-72 min-[450px]:w-80 max-w-[85vw] bg-page-bg shadow-xl overflow-y-auto transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
          data-menu-panel
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] flex-none">
            <h2 className="text-lg font-semibold text-heading">Menu</h2>
            <button
              onClick={closeMenu}
              className="p-2 hover:opacity-80 transition-opacity"
              aria-label="Close menu"
              type="button"
            >
              <X size={24} className="text-heading" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="py-2 flex-1">
            <LocalizedClientLink
              href="/"
              className={linkClass("/")}
              onClick={closeMenu}
              data-testid="mobile-nav-home-link"
            >
              <MenuIcon src="/home.svg" />
              <span>Home</span>
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/store"
              className={linkClass("/store")}
              onClick={closeMenu}
              data-testid="mobile-nav-shop-link"
            >
              <MenuIcon src="/shopping-bag.svg" />
              <span>Shop</span>
            </LocalizedClientLink>

            {customer && (
              <LocalizedClientLink
                href="/wishlist"
                className={linkClass("/wishlist")}
                onClick={closeMenu}
                data-testid="mobile-nav-wishlist-link"
              >
                <div className="relative">
                  <MenuIcon src="/heart.svg" />
                  <WishlistCounter />
                </div>
                <span>Wishlist</span>
              </LocalizedClientLink>
            )}

            <LocalizedClientLink
              href="/contact"
              className={linkClass("/contact")}
              onClick={closeMenu}
              data-testid="mobile-nav-contact-link"
            >
              <MenuIcon src="/marker.svg" />
              <span>Contact Us</span>
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/help"
              className={linkClass("/help")}
              onClick={closeMenu}
              data-testid="mobile-nav-help-link"
            >
              <MenuIcon src="/interrogation.png" />
              <span>Help</span>
            </LocalizedClientLink>
            {customer && (
              <LocalizedClientLink
                href="/account"
                className={linkClass("/account")}
                onClick={closeMenu}
                data-testid="mobile-nav-account-link"
              >
                {getProfileImageUrl(customer) ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                    <Image
                      src={getProfileImageUrl(customer)!}
                      alt="Account"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <MenuIcon src="/user.svg" />
                )}
                <span>Account</span>
              </LocalizedClientLink>
            )}
          </nav>

          <div className="mt-auto border-t border-[var(--color-border)] flex-none bg-page-bg">
            {!customer ? (
              <LocalizedClientLink
                href="/account"
                className={linkClass("/account")}
                onClick={closeMenu}
                data-testid="mobile-nav-login-link"
              >
                <MenuIcon src="/user.svg" />
                <span>Login</span>
              </LocalizedClientLink>
            ) : (
              <button
                onClick={async () => {
                  closeMenu()
                  notifyAuthSessionChanged({ mode: "logout" })
                  await signout(countryCode)
                }}
                className="flex items-center gap-3 w-full py-4 px-4 text-base text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default MobileMenu

