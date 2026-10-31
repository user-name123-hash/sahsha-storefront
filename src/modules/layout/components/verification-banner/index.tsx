"use client"

import React, { useState } from "react"
import { usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { sendCustomerOTP, verifyCustomerOTP } from "@core/data/customer-registration"
import { updateCustomer } from "@core/data/customer"
import { XMark } from "@medusajs/icons"
import Envelope from "@modules/common/icons/envelope"
import OtpInput from "@modules/common/components/otp-input"
import { isNextRedirectError, safeErrorMessage } from "@lib/util/is-next-redirect"

interface VerificationBannerProps {
  customer: HttpTypes.StoreCustomer
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ customer }) => {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpToken, setOtpToken] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const countryCode = pathname.split("/")[1]
  const isHomePage =
    pathname === `/${countryCode}` ||
    pathname === `/${countryCode}/` ||
    pathname === "/"
  const isProductListing =
    pathname.includes(`/${countryCode}/store`) ||
    pathname.includes(`/${countryCode}/collections`) ||
    pathname.includes(`/${countryCode}/categories`)
  const isProductDetails = pathname.includes(`/${countryCode}/products`)

  const isVerified =
    (customer as any).email_verified === true ||
    (customer as any).email_verified === "true" ||
    customer.metadata?.email_verified === true ||
    customer.metadata?.email_verified === "true"

  if (
    !isVisible ||
    (isVerified && !isSuccess) ||
    isHomePage ||
    isProductListing ||
    isProductDetails
  ) {
    return null
  }

  const handleSendOtp = async () => {
    setIsSendingOtp(true)
    setOtpError(null)
    try {
      const res = await sendCustomerOTP(customer.id, "email_verification")
      if (res.success) {
        setOtpToken(res.token)
        setIsVerifying(true)
      } else {
        setOtpError(res.error || "Failed to send OTP")
      }
    } catch (err: any) {
      if (isNextRedirectError(err)) throw err
      setOtpError(safeErrorMessage(err, "An error occurred"))
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpToken || !otpCode) return

    setIsSubmittingOtp(true)
    setOtpError(null)
    try {
      const res = await verifyCustomerOTP(otpToken, otpCode)
      if (res.success) {
        setIsSuccess(true)
        setIsVerifying(false)

        const newMetadata = {
          ...((customer.metadata as Record<string, any>) || {}),
          email_verified: true,
        }
        await updateCustomer({ metadata: newMetadata })

        setTimeout(() => setIsVisible(false), 3000)
      } else {
        setOtpError(res.error || "Invalid OTP")
      }
    } catch (err: any) {
      if (isNextRedirectError(err)) throw err
      setOtpError(safeErrorMessage(err, "An error occurred"))
    } finally {
      setIsSubmittingOtp(false)
    }
  }

  const closeModal = () => {
    setIsVerifying(false)
    setOtpCode("")
    setOtpError(null)
  }

  return (
    <>
      <div className="verify-email-banner">
        <div className="verify-email-banner__inner">
          <div className="verify-email-banner__content">
            <span className="verify-email-banner__icon" aria-hidden>
              <Envelope size="14" color="currentColor" />
            </span>
            <p className="verify-email-banner__text">
              Verify your email to enjoy shopping at Sahsha.{" "}
              <span className="verify-email-banner__email">{customer.email}</span>
            </p>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp}
              className="verify-email-banner__action"
            >
              {isSendingOtp ? "Sending..." : "Verify Now"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="verify-email-banner__close"
            aria-label="Dismiss verification reminder"
          >
            <XMark size={18} />
          </button>
        </div>
      </div>

      {isVerifying ? (
        <div
          className="verify-email-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-email-modal-title"
        >
          <button
            type="button"
            className="verify-email-modal__backdrop"
            onClick={closeModal}
            aria-label="Close verification dialog"
          />

          <div className="verify-email-modal__card">
            <div className="verify-email-modal__accent" aria-hidden />

            <button
              type="button"
              onClick={closeModal}
              className="verify-email-modal__close"
              aria-label="Close"
            >
              <XMark size={18} />
            </button>

            <div className="verify-email-modal__header">
              <div className="verify-email-modal__icon-wrap">
                <Envelope size="22" color="currentColor" />
              </div>
              <div className="verify-email-modal__intro">
                <h3
                  id="verify-email-modal-title"
                  className="verify-email-modal__title"
                >
                  Verify your email
                </h3>
                <p className="verify-email-modal__subtitle">
                  Enter the 6-digit code sent to{" "}
                  <span className="verify-email-modal__email">
                    {customer.email}
                  </span>
                </p>
              </div>
            </div>

            <div className="verify-email-modal__body">
              <div className="verify-email-modal__otp">
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  autoFocus
                />
              </div>

              {otpError ? (
                <p className="verify-email-modal__error" role="alert">
                  {otpError}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isSubmittingOtp || otpCode.length < 6}
                className="verify-email-modal__submit"
              >
                {isSubmittingOtp ? "Verifying..." : "Verify & Continue"}
              </button>

              <div className="verify-email-modal__footer">
                <span className="verify-email-modal__footer-text">
                  Didn&apos;t receive the code?
                </span>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="verify-email-modal__resend"
                >
                  {isSendingOtp ? "Sending..." : "Resend code"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isSuccess ? (
        <div
          className="verify-email-modal verify-email-modal--success"
          role="status"
          aria-live="polite"
        >
          <div className="verify-email-modal__backdrop verify-email-modal__backdrop--static" />

          <div className="verify-email-modal__card verify-email-modal__card--success">
            <div className="verify-email-modal__success-hero" aria-hidden>
              <div className="verify-email-modal__success-glow" />
              <div className="verify-email-modal__success-badge">
                <svg
                  className="verify-email-modal__success-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className="verify-email-modal__success-body">
              <p className="verify-email-modal__success-eyebrow">All set</p>
              <h3 className="verify-email-modal__success-title">Email verified</h3>
              <p className="verify-email-modal__success-text">
                Your email is confirmed. You&apos;re ready to shop at Sahsha.
              </p>

              <div className="verify-email-modal__success-progress" aria-hidden>
                <span className="verify-email-modal__success-progress-bar" />
              </div>
              <p className="verify-email-modal__success-hint">
                Redirecting you back...
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default VerificationBanner
