"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Check, Copy } from "lucide-react"
import type { WelcomeCouponConfig } from "@lib/data/welcome-coupon"
import {
  clearWelcomeCouponPending,
  isWelcomeCouponPending,
  WELCOME_COUPON_EVENT,
} from "@lib/welcome-coupon-pending"
import { notifyAuthSessionChanged } from "@lib/auth-session-events"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"
import "./login-popup-phone.css"

type WelcomeCouponPopupProps = {
  config: WelcomeCouponConfig
  logoSrc: string
}

export default function WelcomeCouponPopup({
  config,
  logoSrc,
}: WelcomeCouponPopupProps) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const closeRef = useRef(() => {})

  useEffect(() => {
    setMounted(true)
    setIsOpen(isWelcomeCouponPending())

    const sync = () => setIsOpen(isWelcomeCouponPending())
    window.addEventListener(WELCOME_COUPON_EVENT, sync)
    window.addEventListener("storage", sync)

    return () => {
      window.removeEventListener(WELCOME_COUPON_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const handleClose = () => {
    clearWelcomeCouponPending()
    setIsOpen(false)
    setCopied(false)
    notifyAuthSessionChanged()
    router.refresh()
  }

  closeRef.current = handleClose

  useEffect(() => {
    if (!isOpen || !mounted) return

    document.documentElement.classList.add("login-popup-open")
    document.body.classList.add("login-popup-open")

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeRef.current()
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.documentElement.classList.remove("login-popup-open")
      document.body.classList.remove("login-popup-open")
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen, mounted])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(config.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be blocked
    }
  }

  if (!config.enabled || !config.code || !isOpen || !mounted) {
    return null
  }

  return createPortal(
    <div
      className="login-popup login-popup--welcome-coupon"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-coupon-title"
    >
      <button
        type="button"
        className="login-popup__backdrop"
        onClick={handleClose}
        aria-label="Close welcome coupon"
      />

      <div className="login-popup__dialog login-popup__dialog--coupon">
        <button
          type="button"
          className="login-popup__close login-popup__close--inside"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="login-popup__panel login-popup__panel--coupon-only">
          <div className="login-popup__coupon">
            <div className="login-popup__logo-wrap">
              <Image
                src={logoSrc}
                alt="Sahsha"
                width={520}
                height={175}
                className="login-popup__logo"
                loading="lazy"
                unoptimized={shouldUnoptimizeImage(logoSrc)}
              />
            </div>

            <p className="login-popup__coupon-eyebrow">You&apos;re in</p>

            <h2 id="welcome-coupon-title" className="login-popup__form-title login-popup__coupon-title">
              {config.title}
            </h2>

            {config.discount ? (
              <span className="login-popup__coupon-badge">{config.discount}</span>
            ) : null}

            {config.description ? (
              <p className="login-popup__form-subtext login-popup__coupon-desc">
                {config.description}
              </p>
            ) : null}

            <button
              type="button"
              className={`login-popup__coupon-ticket${copied ? " is-copied" : ""}`}
              onClick={handleCopyCode}
              aria-label={copied ? "Coupon code copied" : "Copy coupon code"}
            >
              <span className="login-popup__coupon-ticket-label">Your code</span>
              <span className="login-popup__coupon-ticket-main">
                <span className="login-popup__coupon-code">{config.code}</span>
                <span className="login-popup__coupon-copy" aria-hidden>
                  {copied ? (
                    <Check size={18} strokeWidth={2.5} />
                  ) : (
                    <Copy size={18} strokeWidth={2} />
                  )}
                </span>
              </span>
              <span className="login-popup__coupon-ticket-hint">
                {copied ? "Copied — apply at checkout" : "Tap to copy"}
              </span>
            </button>

            <button
              type="button"
              className="login-popup__btn login-popup__btn--primary"
              onClick={handleClose}
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
