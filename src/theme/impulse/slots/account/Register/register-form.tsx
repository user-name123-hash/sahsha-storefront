"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { LOGIN_VIEW } from "@core/types/account"
import GoogleLogin from "@modules/account/components/google-login"
import {
  OtpIdentifierField,
  OtpVerifyStep,
  useOtpAuth,
  type IdentifierMethod,
} from "@modules/account/components/otp-auth"
import { verifyLoginOtp } from "@lib/data/customer-otp-login"
import { isNextRedirectMessage } from "@lib/util/is-next-redirect"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"
import { useServerAction } from "@lib/hooks/use-server-action"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

/**
 * Same OTP APIs as Login: send email_auth/phone_auth → verify → JWT.
 * Existing users log in; new users are created on verify.
 */
const Register = ({ setCurrentView }: Props) => {
  const params = useParams()
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
    execute: submitOtpRegister,
    isPending: isVerifyingOtp,
    result: otpVerifyMessage,
  } = useServerAction((formData: FormData) => verifyLoginOtp(null, formData))

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

  const countryCode = (params?.countryCode as string) || "in"
  const actionError =
    otpError ||
    (typeof otpVerifyMessage === "string" && !isNextRedirectMessage(otpVerifyMessage)
      ? otpVerifyMessage
      : null)

  return (
    <div className="w-full flex flex-col" data-testid="register-page">
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

          <div className="account-login-method-tabs mb-5">
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
        </>
      )}

      {otpStep === "identifier" ? (
        <div className="w-full">
          <div className="mb-4">
            <OtpIdentifierField
              identifier={identifier}
              onChange={setIdentifierValue}
              identifierMethod={identifierMethod}
            />
          </div>

          {actionError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{actionError}</p>
            </div>
          )}

          <div className="mb-4 min-[340px]:mb-5">
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

          <button
            type="button"
            disabled={isSendingOtp || !identifier.trim()}
            onClick={handleSendOtp}
            className="w-full py-2.5 min-[340px]:py-3 px-3 min-[340px]:px-4 bg-brand-accent text-sm min-[340px]:text-base text-inverse font-bold hover:bg-brand-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: "30px" }}
            data-testid="register-button"
          >
            {isSendingOtp ? "Sending OTP..." : "Send OTP"}
          </button>

          <button
            type="button"
            onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
            className="w-full mt-3 text-sm text-gray-600 hover:text-brand-accent"
          >
            Already have an account? Sign in
          </button>
        </div>
      ) : (
        <OtpVerifyStep
          identifier={identifier}
          identifierMethod={identifierMethod}
          otp={otp}
          onOtpChange={setOtp}
          otpToken={otpToken}
          countryCode={countryCode}
          isNewUser={isNewUser}
          firstName={firstName}
          onFirstNameChange={setFirstName}
          verifyError={
            isNextRedirectMessage(otpVerifyMessage) ? null : otpVerifyMessage
          }
          isVerifying={isVerifyingOtp}
          isSendingOtp={isSendingOtp}
          onSubmit={submitOtpRegister}
          onReset={resetOtpFlow}
          onResend={handleSendOtp}
          submitLabel={isNewUser ? "Verify & Create Account" : "Verify & Login"}
          verifyingLabel={isNewUser ? "Creating account..." : "Verifying..."}
        />
      )}
    </div>
  )
}

export default Register
