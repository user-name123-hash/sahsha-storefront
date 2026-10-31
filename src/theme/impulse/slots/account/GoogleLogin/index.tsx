"use client"

import { initiateGoogleAuth } from "@core/data/customer"
import { GoogleLoginButton } from "@pradip1995/commerce-auth/components/google-login"
import { useParams } from "next/navigation"

const BUTTON_CLASS =
  "w-full flex items-center justify-center gap-2.5 py-3 px-4 border border-gray-200 bg-surface hover:bg-gray-50 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"

type GoogleLoginProps = {
  countryCode?: string
}

export default function GoogleLogin({
  countryCode: countryCodeProp,
}: GoogleLoginProps = {}) {
  const params = useParams()

  return (
    <GoogleLoginButton
      countryCode={
        countryCodeProp ?? (params?.countryCode as string | undefined)
      }
      initiateAuth={initiateGoogleAuth}
      className={BUTTON_CLASS}
    />
  )
}
