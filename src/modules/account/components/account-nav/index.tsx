"use client"

import { clx } from "@medusajs/ui"
import { useParams, usePathname } from "next/navigation"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@core/data/customer"
import LogoutModal from "./logout-modal"
import { useState } from "react"
import { formatCustomerDisplayName } from "@lib/util/customer-name"
import { notifyAuthSessionChanged } from "@lib/auth-session-events"

const ACCOUNT_NAV_ICON_SRC = {
  profile: "/profile-account.png",
  addresses: "/home-address.png",
  orders: "/order-delivery.png",
  paymentMethods: "/credit-card.png",
  contactHistory: "/chats.png",
  logout: "/logout%20(1).png",
} as const

const BRAND_ACCENT_HEX = "5a2a43"

// Helper function to get profile image URL from metadata
const getProfileImageUrl = (
  customer: HttpTypes.StoreCustomer | null,
  accentHex = BRAND_ACCENT_HEX
): string => {
  if (!customer) {
    return `https://ui-avatars.com/api/?name=J+W&background=${accentHex}&color=fff&size=256&bold=true`
  }
  const metadata = customer.metadata as Record<string, any> | undefined
  if (metadata?.profile_image_url) {
    return metadata.profile_image_url
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    formatCustomerDisplayName(customer.first_name, customer.last_name, "JW")
  )}&background=${accentHex}&color=fff&size=256&bold=true`
}

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const accentHex = BRAND_ACCENT_HEX

  const handleLogout = async () => {
    setIsLoggingOut(true)
    notifyAuthSessionChanged({ mode: "logout" })
    await signout(countryCode)
    setIsLoggingOut(false)
    setIsLogoutModalOpen(false)
  }

  return (
    <div>
      <div className="small:hidden" data-testid="mobile-account-nav">
        {route !== `/${countryCode}/account` ? (
          <div className="mb-6">
            <LocalizedClientLink
              href="/account"
              className="account-back-btn"
              data-testid="account-main-link"
            >
              <span className="account-back-btn__icon">
                <ChevronDown className="transform rotate-90 w-4 h-4" />
              </span>
              <span>Back to Account</span>
            </LocalizedClientLink>
          </div>
        ) : (
          <div className="flex flex-col gap-y-6">
            <div className="bg-page-bg rounded-3xl shadow-sm p-6 border border-gray-100 flex flex-row items-center gap-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                <img
                  src={getProfileImageUrl(customer, accentHex)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <h3 className="text-base font-bold text-heading truncate">
                  {formatCustomerDisplayName(
                    customer?.first_name,
                    customer?.last_name,
                    "Customer"
                  )}
                </h3>
                <p className="text-xs text-gray-500 truncate">{customer?.email}</p>
                <p className="text-xs text-gray-500 mt-0.5">{customer?.phone}</p>
              </div>
            </div>

            {/* Menu List - Mobile */}
            <div className="bg-page-bg rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <ul className="flex flex-col">
                <li className="border-b border-gray-100 last:border-0">
                  <LocalizedClientLink
                    href="/account/profile"
                    className="flex items-center justify-between py-5 px-6 group active:bg-gray-50 transition-colors"
                    data-testid="profile-link"
                  >
                    <div className="flex items-center gap-x-4">
                      <div className="w-[50px] h-[50px] rounded-full bg-brand-accent-muted flex items-center justify-center">
                        <img
                          src={ACCOUNT_NAV_ICON_SRC.profile}
                          alt="Account Details"
                          className="account-dashboard__menu-icon w-7 h-7 object-contain"
                          width={28}
                          height={28}
                        />
                      </div>
                      <span className="font-bold text-gray-700">Account Details</span>
                    </div>
                    <ChevronDown className="transform -rotate-90 text-gray-400" />
                  </LocalizedClientLink>
                </li>
                <li className="border-b border-gray-100 last:border-0">
                  <LocalizedClientLink
                    href="/account/addresses"
                    className="flex items-center justify-between py-5 px-6 group active:bg-gray-50 transition-colors"
                    data-testid="addresses-link"
                  >
                    <div className="flex items-center gap-x-4">
                      <div className="w-[50px] h-[50px] rounded-full bg-brand-accent-muted flex items-center justify-center">
                        <img
                          src={ACCOUNT_NAV_ICON_SRC.addresses}
                          alt="Addresses"
                          className="account-dashboard__menu-icon w-7 h-7 object-contain"
                          width={28}
                          height={28}
                        />
                      </div>
                      <span className="font-bold text-gray-700">Addresses</span>
                    </div>
                    <ChevronDown className="transform -rotate-90 text-gray-400" />
                  </LocalizedClientLink>
                </li>
                <li className="border-b border-gray-100 last:border-0">
                  <LocalizedClientLink
                    href="/account/orders"
                    className="flex items-center justify-between py-5 px-6 group active:bg-gray-50 transition-colors"
                    data-testid="orders-link"
                  >
                    <div className="flex items-center gap-x-4">
                      <div className="w-[50px] h-[50px] rounded-full bg-brand-accent-muted flex items-center justify-center">
                        <img
                          src={ACCOUNT_NAV_ICON_SRC.orders}
                          alt="Orders"
                          className="account-dashboard__menu-icon w-7 h-7 object-contain"
                          width={28}
                          height={28}
                        />
                      </div>
                      <span className="font-bold text-gray-700">Orders</span>
                    </div>
                    <ChevronDown className="transform -rotate-90 text-gray-400" />
                  </LocalizedClientLink>
                </li>
                <li className="border-b border-gray-100 last:border-0">
                  <LocalizedClientLink
                    href="/account/payment-methods"
                    className="flex items-center justify-between py-5 px-6 group active:bg-gray-50 transition-colors"
                    data-testid="payment-methods-link"
                  >
                    <div className="flex items-center gap-x-4">
                      <div className="w-[50px] h-[50px] rounded-full bg-brand-accent-muted flex items-center justify-center">
                        <img
                          src={ACCOUNT_NAV_ICON_SRC.paymentMethods}
                          alt="Payment Methods"
                          className="account-dashboard__menu-icon w-7 h-7 object-contain"
                          width={28}
                          height={28}
                        />
                      </div>
                      <span className="font-bold text-gray-700">Payment Methods</span>
                    </div>
                    <ChevronDown className="transform -rotate-90 text-gray-400" />
                  </LocalizedClientLink>
                </li>
                <li className="border-b border-gray-100 last:border-0">
                  <LocalizedClientLink
                    href="/account/contact-history"
                    className="flex items-center justify-between py-5 px-6 group active:bg-gray-50 transition-colors"
                    data-testid="contact-history-link"
                  >
                    <div className="flex items-center gap-x-4">
                      <div className="w-[50px] h-[50px] rounded-full bg-brand-accent-muted flex items-center justify-center">
                        <img
                          src={ACCOUNT_NAV_ICON_SRC.contactHistory}
                          alt="Contact History"
                          className="account-dashboard__menu-icon w-7 h-7 object-contain"
                          width={28}
                          height={28}
                        />
                      </div>
                      <span className="font-bold text-gray-700">Contact History</span>
                    </div>
                    <ChevronDown className="transform -rotate-90 text-gray-400" />
                  </LocalizedClientLink>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex items-center justify-between py-5 px-6 w-full text-left group active:bg-red-50 transition-colors"
                    onClick={() => setIsLogoutModalOpen(true)}
                    data-testid="logout-button"
                  >
                    <div className="flex items-center gap-x-4">
                      <div className="w-[50px] h-[50px] rounded-full bg-red-50 flex items-center justify-center">
                        <img
                          src={ACCOUNT_NAV_ICON_SRC.logout}
                          alt="Log out"
                          className="account-dashboard__menu-icon account-dashboard__menu-icon--logout w-7 h-7 object-contain"
                          width={28}
                          height={28}
                        />
                      </div>
                      <span className="font-bold text-red-500">Log out</span>
                    </div>
                    <ChevronDown className="transform -rotate-90 text-gray-400" />
                  </button>
                </li>

              </ul>
            </div>
          </div>
        )}
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <div className="bg-page-bg rounded-3xl shadow-sm border border-gray-100 min-w-[300px] min-h-[500px] flex flex-col justify-between overflow-hidden">
          <div className="px-6 pt-6">
            {/* User Profile Section */}
            <div className="flex flex-row items-center gap-x-4 mb-6">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                <img
                  src={getProfileImageUrl(customer, accentHex)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col overflow-hidden">
                <h3 className="text-base font-bold text-heading truncate">
                  {formatCustomerDisplayName(
                    customer?.first_name,
                    customer?.last_name,
                    "Customer"
                  )}
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-[180px]">{customer?.email}</p>
                <p className="text-xs text-gray-500 mt-0.5">{customer?.phone}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            <div className="text-base-regular">
              <ul className="flex mb-0 justify-start items-start flex-col gap-y-3">

                <li className="w-full">
                  <AccountNavLink
                    href="/account/profile"
                    route={route!}
                    data-testid="profile-link"
                    icon={() => (
                      <img
                        src={ACCOUNT_NAV_ICON_SRC.profile}
                        alt="Account Details"
                        className="account-dashboard__menu-icon w-7 h-7 object-contain"
                        width={28}
                        height={28}
                      />
                    )}
                  >
                    Account Details
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/addresses"
                    route={route!}
                    data-testid="addresses-link"
                    icon={() => (
                      <img
                        src={ACCOUNT_NAV_ICON_SRC.addresses}
                        alt="Addresses"
                        className="account-dashboard__menu-icon w-7 h-7 object-contain"
                        width={28}
                        height={28}
                      />
                    )}
                  >
                    Addresses
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/orders"
                    route={route!}
                    data-testid="orders-link"
                    icon={() => (
                      <img
                        src={ACCOUNT_NAV_ICON_SRC.orders}
                        alt="Orders"
                        className="account-dashboard__menu-icon w-7 h-7 object-contain"
                        width={28}
                        height={28}
                      />
                    )}
                  >
                    Orders
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/payment-methods"
                    route={route!}
                    data-testid="payment-methods-link"
                    icon={() => (
                      <img
                        src={ACCOUNT_NAV_ICON_SRC.paymentMethods}
                        alt="Payment Methods"
                        className="account-dashboard__menu-icon w-7 h-7 object-contain"
                        width={28}
                        height={28}
                      />
                    )}
                  >
                    Payment Methods
                  </AccountNavLink>
                </li>
                <li className="w-full">
                  <AccountNavLink
                    href="/account/contact-history"
                    route={route!}
                    data-testid="contact-history-link"
                    icon={() => (
                      <img
                        src={ACCOUNT_NAV_ICON_SRC.contactHistory}
                        alt="Contact History"
                        className="account-dashboard__menu-icon w-7 h-7 object-contain"
                        width={28}
                        height={28}
                      />
                    )}
                  >
                    Contact History
                  </AccountNavLink>
                </li>
              </ul>
            </div>
          </div>

          <div className="px-6 pt-4 mt-2 border-t border-gray-200 pb-6">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              data-testid="logout-button"
              className="flex items-center gap-x-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 transition-all font-medium group"
            >
              <div className="w-[50px] h-[50px] rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <img
                  src={ACCOUNT_NAV_ICON_SRC.logout}
                  alt="Log Out"
                  className="account-dashboard__menu-icon account-dashboard__menu-icon--logout w-7 h-7 object-contain"
                  width={28}
                  height={28}
                />
              </div>
              <span className="text-red-500">Log Out</span>
            </button>
          </div>



        </div>
      </div>
      <LogoutModal
        isOpen={isLogoutModalOpen}
        close={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  children: React.ReactNode
  "data-testid"?: string
  icon?: (active: boolean) => React.ReactNode
}

const AccountNavLink = ({
  href,
  route,
  children,
  "data-testid": dataTestId,
  icon,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href
  return (
    <LocalizedClientLink
      href={href}
      className={clx("flex items-center gap-x-3 w-full px-4 py-3 rounded-xl transition-all font-medium", {
        "text-inverse bg-brand-accent shadow-md": active,
        "text-body hover:bg-surface-muted": !active,
      })}
      data-testid={dataTestId}
    >
      <div className={clx("w-[50px] h-[50px] rounded-full flex items-center justify-center transition-colors", {
        "text-brand-accent bg-page-bg": active,
        "text-brand-accent bg-brand-accent-muted": !active
      })}>
        {icon && icon(active)}
      </div>
      <span>{children}</span>
    </LocalizedClientLink>
  )
}

export default AccountNav
