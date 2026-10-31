"use client"

import { verifyLoginOtp } from "@lib/data/customer-otp-login"
import { isNextRedirectMessage } from "@lib/util/is-next-redirect"
import { LOGIN_VIEW } from "@core/types/account"
import GoogleLogin from "@modules/account/components/google-login"
import DeletionPendingModal from "@modules/account/components/deletion-pending-modal"
import GuestOrderModal from "@modules/account/components/guest-order-modal"
import {
  OtpIdentifierField,
  OtpVerifyStep,
  useOtpAuth,
  type IdentifierMethod,
} from "@modules/account/components/otp-auth"
import Spinner from "@modules/common/icons/spinner"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useServerAction } from "@lib/hooks/use-server-action"
import { listGuestOrders } from "@core/data/guest"
import { clx } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [checkingGuest, setCheckingGuest] = useState(false)
  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const [emailForCancellation, setEmailForCancellation] = useState("")
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [firstName, setFirstName] = useState("")

  const {
    identifierMethod,
    setIdentifierMethod,
    identifier,
    setIdentifierValue,
    otpToken,
    otp,
    setOtp,
    otpStep,
    isNewUser,
    otpError,
    setOtpError,
    isSendingOtp,
    resetOtpFlow,
    sendOtp,
  } = useOtpAuth()

  const {
    execute: submitOtpLogin,
    isPending: isVerifyingOtp,
    result: otpVerifyMessage,
  } = useServerAction((formData: FormData) => verifyLoginOtp(null, formData))

  useEffect(() => {
    const storedRedirect = localStorage.getItem("loginRedirectUrl")
    if (storedRedirect) {
      setRedirectUrl(storedRedirect)
    }
  }, [])

  useEffect(() => {
    if (otpVerifyMessage === "ACCOUNT_DELETION_PENDING") {
      setEmailForCancellation(identifier)
      setShowDeletionModal(true)
    }
  }, [otpVerifyMessage, identifier])

  useEffect(() => {
    const view = searchParams.get("view")
    const email = searchParams.get("email")

    if (view === "guest" && email && email !== "undefined") {
      setShowGuestModal(true)
    }
  }, [searchParams])

  const handleMethodChange = (method: IdentifierMethod) => {
    setIdentifierMethod(method)
    setIdentifierValue("")
    setOtpError(null)
  }

  const handleSendOtp = async () => {
    const sent = await sendOtp()
    if (sent) {
      setFirstName("")
    }
  }

  const handleTrackGuestOrder = async () => {
    const getCookie = (name: string) => {
      if (typeof document === "undefined") return null
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(";").shift()
      return null
    }

    const token = getCookie("_medusa_guest_token")

    if (token) {
      setCheckingGuest(true)
      try {
        await listGuestOrders(token)
        const countryCode = (params?.countryCode as string) || "in"
        router.push(`/${countryCode}/guest-orders`)
        return
      } catch {
        document.cookie =
          "_medusa_guest_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      } finally {
        setCheckingGuest(false)
      }
    }

    setShowGuestModal(true)
  }

  const countryCode = (params?.countryCode as string) || "in"

  return (
    <div className="w-full flex flex-col" data-testid="login-page">
      {otpStep === "identifier" && (
        <>
          <div className="mb-5">
            <GoogleLogin />
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="px-3 bg-page-bg text-gray-400 font-bold">
                Or continue with email / mobile
              </span>
            </div>
          </div>
        </>
      )}

      <div className="w-full">
        {otpStep === "identifier" ? (
          <>
            <div className="account-login-method-tabs mb-4">
              <button
                type="button"
                onClick={() => handleMethodChange("phone")}
                className={clx(
                  "account-login-method-tabs__btn",
                  identifierMethod === "phone" && "is-active"
                )}
              >
                Mobile
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange("email")}
                className={clx(
                  "account-login-method-tabs__btn",
                  identifierMethod === "email" && "is-active"
                )}
              >
                Email
              </button>
            </div>

            <div className="mb-4">
              <OtpIdentifierField
                identifier={identifier}
                onChange={setIdentifierValue}
                identifierMethod={identifierMethod}
              />
            </div>

            {otpError && (
              <p className="text-red-500 text-sm text-center mb-4">{otpError}</p>
            )}

            <button
              type="button"
              disabled={isSendingOtp || !identifier.trim()}
              onClick={handleSendOtp}
              className="w-full py-2.5 min-[340px]:py-3 px-3 min-[340px]:px-4 bg-brand-accent text-sm min-[340px]:text-base text-inverse font-bold hover:bg-brand-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              style={{ borderRadius: "30px" }}
            >
              {isSendingOtp ? "Sending OTP..." : "Send OTP"}
            </button>

            {/* OTP-only login — forgot password not needed
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => setCurrentView(LOGIN_VIEW.FORGOT_PASSWORD)}
                className="text-xs min-[340px]:text-sm text-gray-700 hover:text-brand-accent"
              >
                Forgot password?
              </button>
            </div>
            */}
          </>
        ) : (
          <OtpVerifyStep
            identifier={identifier}
            identifierMethod={identifierMethod}
            otp={otp}
            onOtpChange={setOtp}
            otpToken={otpToken}
            countryCode={countryCode}
            redirectUrl={redirectUrl}
            isNewUser={isNewUser}
            firstName={firstName}
            onFirstNameChange={setFirstName}
            verifyError={
              otpVerifyMessage === "ACCOUNT_DELETION_PENDING" ||
              isNextRedirectMessage(otpVerifyMessage)
                ? null
                : otpVerifyMessage
            }
            isVerifying={isVerifyingOtp}
            isSendingOtp={isSendingOtp}
            onSubmit={submitOtpLogin}
            onReset={resetOtpFlow}
            onResend={handleSendOtp}
          />
        )}
      </div>

      <div className="mb-4 min-[340px]:mb-5 mt-2">
        <span className="text-center text-gray-700 text-xs min-[340px]:text-sm">
          By continuing, you agree to Sahsha&apos;s{" "}
          <LocalizedClientLink
            href="/privacy-policy"
            className="text-brand-accent font-semibold hover:underline"
          >
            Privacy Policy
          </LocalizedClientLink>{" "}
          and{" "}
          <LocalizedClientLink
            href="/terms-of-use"
            className="text-brand-accent font-semibold hover:underline"
          >
            Terms of Use
          </LocalizedClientLink>
          .
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleTrackGuestOrder}
          disabled={checkingGuest}
          className="w-full py-2.5 px-4 rounded-full border border-brand-accent text-brand-accent text-sm font-bold hover:bg-brand-accent-muted transition-colors flex items-center justify-center gap-2"
        >
          {checkingGuest ? <Spinner className="animate-spin" /> : <span>📦</span>}
          {checkingGuest ? "Checking..." : "Track Guest Order"}
        </button>
      </div>

      <DeletionPendingModal
        isOpen={showDeletionModal}
        close={() => setShowDeletionModal(false)}
        email={emailForCancellation}
        countryCode={params.countryCode as string}
      />

      <GuestOrderModal
        isOpen={showGuestModal}
        close={() => setShowGuestModal(false)}
        initialEmail={searchParams.get("email") || ""}
        autoStart={
          searchParams.get("view") === "guest" && !!searchParams.get("email")
        }
        onVerified={() => {
          router.push(`/${countryCode}/guest-orders`)
        }}
      />
    </div>
  )
}

export default Login
