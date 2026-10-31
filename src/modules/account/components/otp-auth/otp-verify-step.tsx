"use client"

import ErrorMessage from "@modules/checkout/components/error-message"
import OtpInput from "@modules/common/components/otp-input"
import type { IdentifierMethod } from "./use-otp-auth"

type OtpVerifyStepProps = {
  identifier: string
  identifierMethod: IdentifierMethod
  otp: string
  onOtpChange: (value: string) => void
  otpToken: string | null
  countryCode: string
  redirectUrl?: string | null
  isNewUser: boolean
  firstName?: string
  onFirstNameChange?: (value: string) => void
  forceNewUser?: boolean
  verifyError?: string | null
  isVerifying: boolean
  isSendingOtp: boolean
  onSubmit: (formData: FormData) => void
  onReset: () => void
  onResend: () => void
  submitLabel?: string
  verifyingLabel?: string
  skipRedirect?: boolean
}

const OtpVerifyStep = ({
  identifier,
  identifierMethod,
  otp,
  onOtpChange,
  otpToken,
  countryCode,
  redirectUrl,
  isNewUser,
  firstName = "",
  onFirstNameChange,
  forceNewUser = false,
  verifyError,
  isVerifying,
  isSendingOtp,
  onSubmit,
  onReset,
  onResend,
  submitLabel = "Verify & Login",
  verifyingLabel = "Verifying...",
  skipRedirect = false,
}: OtpVerifyStepProps) => {
  const requiresName = forceNewUser || isNewUser

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        formData.set("otp_code", otp)
        onSubmit(formData)
      }}
    >
      <input type="hidden" name="otp_token" value={otpToken || ""} />
      <input type="hidden" name="identifier" value={identifier} />
      <input type="hidden" name="country_code" value={countryCode} />
      {redirectUrl && (
        <input type="hidden" name="redirect_url" value={redirectUrl} />
      )}
      {skipRedirect && (
        <input type="hidden" name="skip_redirect" value="true" />
      )}
      <input type="hidden" name="otp_code" value={otp} />
      <input
        type="hidden"
        name="is_new_user"
        value={requiresName ? "true" : "false"}
      />

      <p className="text-sm text-gray-600 text-center mb-4">
        Enter the 6-digit code sent to{" "}
        <span className="font-semibold text-heading">{identifier}</span>
      </p>

      {requiresName && onFirstNameChange ? (
        <div className="mb-4">
          <input
            type="text"
            name="first_name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="First name"
            required
            className="w-full px-4 py-3 text-sm min-[340px]:text-base border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition-all shadow-sm"
            style={{ borderRadius: "30px" }}
          />
          {!forceNewUser && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              New account detected — enter your name to finish sign in.
            </p>
          )}
        </div>
      ) : requiresName ? (
        <input type="hidden" name="first_name" value={firstName} />
      ) : null}

      <div className="mb-6">
        <OtpInput value={otp} onChange={onOtpChange} autoFocus={!requiresName} />
      </div>

      <ErrorMessage error={verifyError} data-testid="otp-login-error-message" />

      <button
        type="submit"
        disabled={
          isVerifying ||
          otp.length < 6 ||
          (requiresName && !firstName.trim() && Boolean(onFirstNameChange))
        }
        className="w-full py-2.5 min-[340px]:py-3 px-3 min-[340px]:px-4 bg-brand-accent text-sm min-[340px]:text-base text-inverse font-bold hover:bg-brand-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        style={{ borderRadius: "30px" }}
      >
        {isVerifying ? verifyingLabel : submitLabel}
      </button>

      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={onReset}
          className="text-gray-600 hover:text-brand-accent"
        >
          Change {identifierMethod === "email" ? "email" : "number"}
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={isSendingOtp}
          className="text-brand-accent font-semibold hover:underline disabled:opacity-50"
        >
          {isSendingOtp ? "Resending..." : "Resend OTP"}
        </button>
      </div>
    </form>
  )
}

export default OtpVerifyStep
