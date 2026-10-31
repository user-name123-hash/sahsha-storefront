"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"

const ProcessingOverlay = ({
  isOpen,
  title,
  subtitle = "Please do not refresh or close this window",
  variant = "payment",
}: {
  isOpen: boolean
  title?: string
  subtitle?: string
  variant?: "payment" | "order"
}) => {
  const [messageIndex, setMessageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  const paymentMessages = [
    "Securing your transaction...",
    "Verifying with payment provider...",
    "Finalizing your order...",
    "Almost there...",
    "Finishing up...",
  ]

  const orderMessages = [
    "Placing your order...",
    "Preparing your confirmation...",
    "Almost there...",
    "Finalizing details...",
    "Finishing up...",
  ]

  const messages = variant === "payment" ? paymentMessages : orderMessages
  const displayTitle =
    title || (variant === "payment" ? "Processing Payment" : "Placing Order")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isOpen, messages.length])

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="checkout-processing-overlay">
      <div className="checkout-processing-overlay__panel">
        <div className="checkout-processing-overlay__visual">
          {variant === "order" ? (
            <Image
              src="/shop-window.gif"
              alt="Placing order..."
              width={224}
              height={224}
              sizes="7rem"
              unoptimized
              className="checkout-processing-overlay__img checkout-processing-overlay__img--order"
            />
          ) : (
            <div className="checkout-processing-overlay__payment-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </div>
          )}
        </div>

        <h3 className="checkout-processing-overlay__title">{displayTitle}</h3>

        <div className="checkout-processing-overlay__message-wrap">
          <p
            key={messageIndex}
            className="checkout-processing-overlay__message"
          >
            {messages[messageIndex]}
          </p>
        </div>

        <div className="checkout-processing-overlay__progress">
          <div className="checkout-processing-overlay__progress-bar" />
        </div>

        <p className="checkout-processing-overlay__subtitle">{subtitle}</p>
      </div>
    </div>,
    document.body
  )
}

export default ProcessingOverlay
