import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  // If no customer, render login page without the account layout constraints
  if (!customer) {
    return <>{children}</>
  }

  return (
    <div className="flex-1 small:py-12 bg-page-bg" data-testid="account-page">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto bg-page-bg flex flex-col">
        <div className="w-full flex justify-center py-4">
          <h1 className="text-3xl font-bold text-heading">My Account</h1>
        </div>
        <div className="grid grid-cols-1 small:grid-cols-[300px_1fr] gap-x-12 py-6">
          <div>{customer && <AccountNav customer={customer} />}</div>
          <div className="flex-1">{children}</div>
        </div>

      </div>
    </div>
  )
}

export default AccountLayout
