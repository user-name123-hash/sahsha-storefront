"use client"

import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const AccountDropdown = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer
}) => {
  const getProfileImageUrl = (
    customer: HttpTypes.StoreCustomer
  ): string | null => {
    const metadata = customer.metadata as Record<string, any> | undefined
    return metadata?.profile_image_url || null
  }

  const profileImageUrl = getProfileImageUrl(customer)

  return (
    <div className="h-full z-50 flex items-center">
      <LocalizedClientLink
        href="/account"
        className="nav-header-profile-link hover:opacity-80 transition-opacity flex items-center h-full"
        data-testid="nav-account-link"
      >
        <span className="sr-only">Account</span>
        {profileImageUrl ? (
          <span className="nav-header-profile-avatar rounded-full">
            <Image
              src={profileImageUrl}
              alt="Account"
              width={36}
              height={36}
              className="nav-header-profile-avatar__img"
              aria-hidden
            />
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/Account.svg"
            alt="Account"
            width={22}
            height={22}
            className="nav-header-icon w-[22px] h-[22px]"
            aria-hidden
            decoding="async"
            fetchPriority="low"
          />
        )}
      </LocalizedClientLink>
    </div>
  )
}

export default AccountDropdown
