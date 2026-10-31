import { Metadata } from "next"

import ProfileForm from "@modules/account/components/profile-form"
import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import ProfilePassword from "@modules/account/components/profile-password"

import { notFound } from "next/navigation"
import { listRegions } from "@core/data/regions"
import { retrieveCustomer } from "@core/data/customer"

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your Sahsha profile.",
}


export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="account-profile-page" data-testid="profile-page-wrapper">
      <h1 className="account-profile-page__title">Account Details</h1>
      <div className="account-profile-page__content">
        <ProfileForm customer={customer} />

        <div className="account-profile-page__billing">
          <ProfileBillingAddress customer={customer} regions={regions} />
        </div>
      </div>
    </div>
  )
}
