"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import { useParams, useRouter } from "next/navigation"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OtpInput from "@modules/common/components/otp-input"
import ErrorMessage from "@modules/checkout/components/error-message"
import GoogleLogin from "@modules/account/components/google-login"
import {
  OtpIdentifierField,
  useOtpAuth,
  type IdentifierMethod,
} from "@modules/account/components/otp-auth"
import { useServerAction } from "@lib/hooks/use-server-action"
import { verifyLoginOtp } from "@lib/data/customer-otp-login"
import { markWelcomeCouponPending } from "@lib/welcome-coupon-pending"
import { notifyAuthSessionChanged } from "@lib/auth-session-events"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"
import "./login-popup-phone.css"
import { useLoginPopup } from "./login-popup-context"

type PopupStep = "identifier" | "verify"

export default function LoginPopup() {
  const {
    isPopupOpen,
    dismissPopup,
    popupConfig: config,
    welcomeCoupon,
  } = useLoginPopup()
  const params = useParams()
  const router = useRouter()
  const countryCode = (params?.countryCode as string) || "in"
  const [mounted, setMounted] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [uiStep, setUiStep] = useState<PopupStep>("identifier")

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

  const handleCloseRef = useRef(() => {})

  useEffect(() => {
    setMounted(true)
  }, [])

  const resetFlow = () => {
    resetOtpFlow()
    setFirstName("")
    setUiStep("identifier")
  }

  const handleClose = () => {
    dismissPopup()
    resetFlow()
  }

  handleCloseRef.current = handleClose

  useEffect(() => {
    if (!isPopupOpen || !mounted) return

    document.documentElement.classList.add("login-popup-open")
    document.body.classList.add("login-popup-open")

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        handleCloseRef.current()
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.documentElement.classList.remove("login-popup-open")
      document.body.classList.remove("login-popup-open")
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isPopupOpen, mounted])

  useEffect(() => {
    if (otpStep === "verify") {
      setUiStep("verify")
    }
  }, [otpStep])

  useEffect(() => {
    if (!otpVerifyMessage) return

    if (otpVerifyMessage === "NEW_USER_SUCCESS") {
      try {
        localStorage.setItem(config.storageKey, "1")
      } catch {
        // private mode / blocked storage
      }

      notifyAuthSessionChanged()

      // Hand off to WelcomeCouponPopup — stays until customer closes.
      // Do NOT refresh/navigate here or the coupon disappears.
      if (welcomeCoupon.enabled && welcomeCoupon.code) {
        markWelcomeCouponPending()
        dismissPopup()
        resetFlow()
      } else {
        dismissPopup()
        resetFlow()
        router.refresh()
      }
      return
    }

    if (otpVerifyMessage === "LOGIN_SUCCESS") {
      notifyAuthSessionChanged()
      dismissPopup()
      resetFlow()
      router.refresh()
    }
  }, [
    otpVerifyMessage,
    welcomeCoupon.enabled,
    welcomeCoupon.code,
    config.storageKey,
    dismissPopup,
    router,
  ])

  const handleMethodChange = (method: IdentifierMethod) => {
    setIdentifierMethod(method)
    setIdentifierValue("")
    setOtpError(null)
  }

  const handleSendOtp = async () => {
    const sent = await sendOtp()
    if (sent) {
      setFirstName("")
      setUiStep("verify")
    }
  }

  if (!config.enabled || !isPopupOpen || !mounted) {
    return null
  }

  const verifyError =
    otpVerifyMessage === "NEW_USER_SUCCESS" ||
    otpVerifyMessage === "LOGIN_SUCCESS"
      ? null
      : otpVerifyMessage

  return createPortal(
    <div
      className="login-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-popup-title"
    >
      <button
        type="button"
        className="login-popup__backdrop"
        onClick={handleClose}
        aria-label="Close login popup"
      />

      <div className="login-popup__dialog">
        <button
          type="button"
          className="login-popup__close"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="login-popup__panel">
          <aside
            className="login-popup__brand-col"
            aria-hidden={uiStep !== "identifier"}
          >
            {config.imageSrc ? (
              <div className="login-popup__panel-image-wrap">
                <Image
                  src={config.imageSrc}
                  alt=""
                  width={800}
                  height={500}
                  className="login-popup__panel-image"
                  loading="lazy"
                  unoptimized={shouldUnoptimizeImage(config.imageSrc)}
                />
              </div>
            ) : null}

            <div className="login-popup__brand-content">
              <h2 className="login-popup__brand-title">{config.brandTitle}</h2>

              {config.featureCards.length > 0 ? (
                <div className="login-popup__features">
                  {config.featureCards.map((card, index) => (
                    <div
                      key={`${card.title}-${index}`}
                      className="login-popup__feature-card"
                    >
                      {card.imageSrc ? (
                        <Image
                          src={card.imageSrc}
                          alt=""
                          width={32}
                          height={32}
                          className="login-popup__feature-image"
                          loading="lazy"
                          unoptimized={shouldUnoptimizeImage(card.imageSrc)}
                        />
                      ) : (
                        <span className="login-popup__feature-icon" aria-hidden>
                          ★
                        </span>
                      )}
                      <p className="login-popup__feature-title">{card.title}</p>
                      <p className="login-popup__feature-text">{card.text}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </aside>

          <div className="login-popup__form-col">
            {uiStep === "identifier" ? (
              <>
                <div className="login-popup__form-body">
                  <div className="login-popup__logo-wrap">
                    <Image
                      src={config.logoSrc}
                      alt="Sahsha"
                      width={520}
                      height={175}
                      className="login-popup__logo"
                      loading="lazy"
                      unoptimized={shouldUnoptimizeImage(config.logoSrc)}
                    />
                  </div>

                  <h2 id="login-popup-title" className="login-popup__form-title">
                    {config.headline}
                  </h2>

                  {config.subtext ? (
                    <p className="login-popup__form-subtext">{config.subtext}</p>
                  ) : null}

                  <div className="login-popup__google">
                    <GoogleLogin />
                  </div>

                  <div className="login-popup__divider">
                    <span>Or continue with email / mobile</span>
                  </div>

                  <div className="login-popup__form">
                    <div className="login-popup__method-tabs">
                      <button
                        type="button"
                        onClick={() => handleMethodChange("phone")}
                        className={clx(
                          "login-popup__method-tab",
                          identifierMethod === "phone" && "is-active"
                        )}
                      >
                        Mobile
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMethodChange("email")}
                        className={clx(
                          "login-popup__method-tab",
                          identifierMethod === "email" && "is-active"
                        )}
                      >
                        Email
                      </button>
                    </div>

                    <OtpIdentifierField
                      identifier={identifier}
                      onChange={setIdentifierValue}
                      identifierMethod={identifierMethod}
                      phoneContainerClassName="phone-input-login login-popup__phone"
                    />

                    {otpError && (
                      <p className="login-popup__message login-popup__message--error">
                        {otpError}
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={isSendingOtp || !identifier.trim()}
                      onClick={handleSendOtp}
                      className="login-popup__btn login-popup__btn--primary"
                    >
                      {isSendingOtp ? (
                        <span className="login-popup__spinner" />
                      ) : (
                        "Send OTP"
                      )}
                    </button>
                  </div>
                </div>

                <footer className="login-popup__legal">
                  By continuing, you agree to Sahsha&apos;s{" "}
                  <LocalizedClientLink
                    href="/privacy-policy"
                    className="login-popup__link"
                    onClick={handleClose}
                  >
                    Privacy Policy
                  </LocalizedClientLink>{" "}
                  and{" "}
                  <LocalizedClientLink
                    href="/terms-of-use"
                    className="login-popup__link"
                    onClick={handleClose}
                  >
                    Terms of Use
                  </LocalizedClientLink>
                  .
                </footer>
              </>
            ) : (
              <form
                className="login-popup__form login-popup__form--verify"
                onSubmit={(event) => {
                  event.preventDefault()
                  const formData = new FormData(event.currentTarget)
                  formData.set("otp_code", otp)
                  submitOtpLogin(formData)
                }}
              >
                <h2 id="login-popup-title" className="login-popup__form-title">
                  Verify OTP
                </h2>

                <input type="hidden" name="otp_token" value={otpToken || ""} />
                <input type="hidden" name="identifier" value={identifier} />
                <input type="hidden" name="country_code" value={countryCode} />
                <input type="hidden" name="otp_code" value={otp} />
                <input type="hidden" name="skip_redirect" value="true" />
                <input
                  type="hidden"
                  name="is_new_user"
                  value={isNewUser ? "true" : "false"}
                />

                <p className="login-popup__otp-hint">
                  Enter the 6-digit code sent to{" "}
                  <span className="login-popup__otp-target">{identifier}</span>
                </p>

                {isNewUser && (
                  <>
                    <input
                      type="text"
                      name="first_name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      required
                      className="login-popup__input"
                    />
                    <p className="login-popup__otp-hint">
                      New account detected — enter your name to finish sign in.
                    </p>
                  </>
                )}

                <div className="login-popup__otp">
                  <OtpInput value={otp} onChange={setOtp} autoFocus={!isNewUser} />
                </div>

                <ErrorMessage error={verifyError} />

                <button
                  type="submit"
                  disabled={
                    isVerifyingOtp ||
                    otp.length < 6 ||
                    (isNewUser && !firstName.trim())
                  }
                  className="login-popup__btn login-popup__btn--primary"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify & Login"}
                </button>

                <div className="login-popup__verify-actions">
                  <button
                    type="button"
                    className="login-popup__method-toggle"
                    onClick={() => {
                      resetOtpFlow()
                      setUiStep("identifier")
                    }}
                  >
                    Change {identifierMethod === "email" ? "email" : "number"}
                  </button>
                  <button
                    type="button"
                    className="login-popup__method-toggle"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? "Resending..." : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
