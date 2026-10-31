"use client"

import { useEffect, useMemo, useState } from "react"

export type PromoMessage = {
  text: string
  highlight?: string
}

const DEFAULT_COUPON_CODE = "WELCOME10"

const DEFAULT_LINES = [
  "Free Shipping on Orders Above ₹999",
  "New Arrivals Are Live • Shop The Latest Saree Collection",
  "Handpicked Sarees Crafted For Every Celebration",
  "Free Shipping • Easy Returns • Secure Payments",
] as const

const HOLD_MS = 1000
const ANIMATION_MS = 280

function PromoMessageItem({ text, highlight }: PromoMessage) {
  if (!highlight || !text.includes(highlight)) {
    return <span>{text}</span>
  }

  const [before, after] = text.split(highlight)

  return (
    <span>
      {before}
      <span className="promo-bar__highlight">{highlight}</span>
      {after}
    </span>
  )
}

type PromoBarContentProps = {
  text?: string
  code?: string | null
  value?: string | null
  lines?: [string | null, string | null, string | null, string | null]
}

function buildCouponMessage(
  text: string | undefined,
  code: string | null | undefined,
  value: string | null | undefined
): PromoMessage {
  const couponCode = code?.trim() || DEFAULT_COUPON_CODE
  const configuredText = text?.trim()
  const configuredValue = value?.trim()

  if (!configuredText) {
    const discountLabel = configuredValue || "Flat 10% OFF"
    return {
      text: `${discountLabel} On Your First Order • Use Code: ${couponCode}`,
      highlight: couponCode,
    }
  }

  // Admin often sets short promo text + code separately — combine them for display.
  let displayText = configuredText

  if (configuredValue && !displayText.includes(configuredValue)) {
    displayText = `${displayText} • ${configuredValue}`
  }

  if (couponCode && !displayText.includes(couponCode)) {
    displayText = `${displayText} • Use Code: ${couponCode}`
  }

  return {
    text: displayText,
    highlight: couponCode,
  }
}

export default function PromoBarContent({
  text = "",
  code = null,
  value = null,
  lines,
}: PromoBarContentProps) {
  const messages = useMemo(() => {
    const lineMessages: PromoMessage[] = DEFAULT_LINES.map((fallback, index) => ({
      text: lines?.[index]?.trim() || fallback,
    }))

    const couponMessage = buildCouponMessage(text, code, value)

    // Lines 1–4, then coupon as line 5
    return [...lineMessages, couponMessage]
  }, [text, code, value, lines])

  const [activeIndex, setActiveIndex] = useState(0)
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("enter")

  useEffect(() => {
    let holdTimer: ReturnType<typeof setTimeout>
    let exitTimer: ReturnType<typeof setTimeout>
    let enterTimer: ReturnType<typeof setTimeout>

    const scheduleNext = () => {
      holdTimer = setTimeout(() => {
        setPhase("exit")

        exitTimer = setTimeout(() => {
          setActiveIndex((i) => (i + 1) % messages.length)
          setPhase("enter")

          enterTimer = setTimeout(() => {
            setPhase("idle")
            scheduleNext()
          }, ANIMATION_MS)
        }, ANIMATION_MS)
      }, HOLD_MS)
    }

    const startTimer = setTimeout(() => {
      setPhase("idle")
      scheduleNext()
    }, ANIMATION_MS)

    return () => {
      clearTimeout(startTimer)
      clearTimeout(holdTimer)
      clearTimeout(exitTimer)
      clearTimeout(enterTimer)
    }
  }, [messages.length])

  const message = messages[activeIndex]

  return (
    <div className="promo-bar__viewport" aria-live="polite">
      <div
        key={activeIndex}
        className={`promo-bar__slide promo-bar__slide--${phase}`}
      >
        <span className="promo-bar__text">
          <PromoMessageItem {...message} />
        </span>
      </div>
    </div>
  )
}
