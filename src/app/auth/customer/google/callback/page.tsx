"use client"

import { GoogleCallbackPage } from "@pradip1995/commerce-auth"
import { completeGoogleOAuthLogin } from "@core/data/customer"

export default function GoogleCallbackRoute() {
  return (
    <GoogleCallbackPage
      completeOAuthLogin={completeGoogleOAuthLogin}
      defaultCountryCode="in"
    />
  )
}
