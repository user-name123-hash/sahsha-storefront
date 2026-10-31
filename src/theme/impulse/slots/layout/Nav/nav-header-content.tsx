"use client"

import { type ReactNode } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MobileMenu from "@modules/layout/components/mobile-menu"
import {
  DesktopSearchIcon,
  useSearchContext,
} from "@modules/layout/components/desktop-search"
import AccountDropdown from "@modules/layout/components/account-dropdown"
import WishlistCounter from "@modules/layout/components/wishlist-counter"
import SmartSearchResults from "@modules/layout/components/smart-search/smart-search-results"
import SmartSearchInline from "@modules/layout/components/smart-search/smart-search-inline"
import NavLinkLuxury from "./nav-link-luxury"
import NavCategoriesDropdown from "./nav-categories-dropdown"
import NavCollectionsDropdown from "./nav-collections-dropdown"

type NavHeaderContentProps = {
  currentLocale: string
  customer: HttpTypes.StoreCustomer | null
  categories: HttpTypes.StoreProductCategory[]
  collections: HttpTypes.StoreCollection[]
  logo: ReactNode
  cartButton: ReactNode
}

export default function NavHeaderContent({
  currentLocale,
  customer,
  categories,
  collections,
  logo,
  cartButton,
}: NavHeaderContentProps) {
  const { isSearchOpen } = useSearchContext()

  return (
    <div
      className="nav-header-search-wrap relative"
      data-search-open={isSearchOpen ? "true" : "false"}
    >
      <header className="nav-header">
        <div className="nav-header-inner">
          <div className="nav-header-mobile relative flex h-full w-full items-center lg:hidden">
            {isSearchOpen ? (
              <div className="nav-header-search-inline">
                <SmartSearchInline />
              </div>
            ) : (
              <>
                <div className="nav-header-mobile__start flex flex-1 items-center justify-start min-w-0">
                  <MobileMenu
                    customer={customer}
                    countryCode={currentLocale || "in"}
                    categories={categories}
                    collections={collections}
                  />
                </div>

                <div className="nav-header-mobile__logo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="nav-header-logo-wrap pointer-events-auto flex justify-center">
                    {logo}
                  </div>
                </div>

                <div className="nav-header-mobile__end flex flex-1 items-center justify-end min-w-0">
                  <div className="nav-header-icons flex items-center justify-end gap-2 min-w-0">
                    <DesktopSearchIcon />

                    {!customer ? (
                      <LocalizedClientLink
                        href="/account"
                        className="nav-header-profile-link"
                        data-testid="nav-login-link"
                      >
                        <span className="sr-only">Login</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/Account.svg"
                          alt="Login"
                          width={22}
                          height={22}
                          className="nav-header-icon w-[22px] h-[22px]"
                          decoding="async"
                          fetchPriority="low"
                        />
                      </LocalizedClientLink>
                    ) : (
                      <AccountDropdown customer={customer} />
                    )}

                    <div className="nav-header-cart flex items-center max-[450px]:hidden">{cartButton}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {isSearchOpen ? (
            <div className="nav-header-search-inline nav-header-search-inline--desktop">
              <SmartSearchInline />
            </div>
          ) : (
          <div className="hidden lg:grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="flex items-center justify-start min-w-0">
                  <nav
                    className="nav-header-menu flex items-center gap-8 xl:gap-10"
                    aria-label="Main"
                  >
                    <NavLinkLuxury href="/" label="Home" />
                    <NavLinkLuxury href="/store" label="Shop" />
                    <NavCategoriesDropdown categories={categories} />
                    <NavCollectionsDropdown collections={collections} />
                    <NavLinkLuxury href="/help" label="Help" />
                  </nav>
                </div>

                <div className="nav-header-logo-wrap flex justify-center px-2">
                  {logo}
                </div>

                <div className="nav-header-actions flex items-center justify-end h-full w-full min-w-0">
                  <div className="nav-header-icons flex items-center justify-end gap-5 min-w-0">
                    <DesktopSearchIcon />

                    {!customer ? (
                      <LocalizedClientLink
                        href="/account"
                        className="nav-header-login-btn"
                        data-testid="nav-login-link"
                      >
                        Login
                      </LocalizedClientLink>
                    ) : (
                      <AccountDropdown customer={customer} />
                    )}

                    <LocalizedClientLink
                      href="/wishlist"
                      className="nav-header-icon-link inline-flex items-center relative"
                      data-testid="nav-wishlist-link"
                    >
                      <span className="sr-only">Wishlist</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/Wishlist.svg"
                        alt="Wishlist"
                        width={22}
                        height={22}
                        className="nav-header-icon w-[22px] h-[22px]"
                        aria-hidden
                        decoding="async"
                        fetchPriority="low"
                      />
                      <WishlistCounter />
                    </LocalizedClientLink>

                    <div className="nav-header-cart flex items-center">{cartButton}</div>
                  </div>
                </div>
              </div>
          )}
        </div>
      </header>

      <SmartSearchResults countryCode={currentLocale || "in"} />
    </div>
  )
}
