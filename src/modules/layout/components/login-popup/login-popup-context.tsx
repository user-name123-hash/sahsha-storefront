"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import type { LoginPopupConfig } from "@lib/data/login-popup"
import type { WelcomeCouponConfig } from "@lib/data/welcome-coupon"

type LoginPopupContextValue = {
  isPopupOpen: boolean
  dismissPopup: () => void
  popupConfig: LoginPopupConfig
  welcomeCoupon: WelcomeCouponConfig
}

const LoginPopupContext = createContext<LoginPopupContextValue | null>(null)

/** Paths where a first-visit login promo should never interrupt. */
function isBlockedPath(pathname: string | null): boolean {
  if (!pathname) return false
  return (
    pathname.includes("/account") ||
    pathname.includes("/checkout") ||
    pathname.includes("/order/confirmed")
  )
}

function hasSeenPopup(storageKey: string): boolean {
  if (typeof window === "undefined") return true
  try {
    return localStorage.getItem(storageKey) === "1"
  } catch {
    return true
  }
}

function isCookieBannerPending(): boolean {
  return (
    document.documentElement.getAttribute("data-cookie-banner") === "pending"
  )
}

function isSearchOpen(): boolean {
  return Boolean(document.querySelector('[data-search-open="true"]'))
}

export function LoginPopupProvider({
  children,
  popupConfig,
  welcomeCoupon,
  isLoggedIn,
}: {
  children: ReactNode
  popupConfig: LoginPopupConfig
  welcomeCoupon: WelcomeCouponConfig
  isLoggedIn: boolean
}) {
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  pathnameRef.current = pathname

  const dismissPopup = useCallback(() => {
    try {
      localStorage.setItem(popupConfig.storageKey, "1")
    } catch {
      // private mode / blocked storage
    }
    setIsPopupOpen(false)
  }, [popupConfig.storageKey])

  useEffect(() => {
    setHydrated(true)
    document.body.classList.remove("login-popup-open")
    document.documentElement.classList.remove("login-popup-open")
  }, [])

  useEffect(() => {
    if (!hydrated || !popupConfig.enabled || isLoggedIn) return
    if (hasSeenPopup(popupConfig.storageKey)) return

    let cancelled = false
    let retryTimer: number | undefined
    let opened = false

    const openPopup = () => {
      if (cancelled || opened) return
      opened = true
      setIsPopupOpen(true)
    }

    const tryOpen = () => {
      if (cancelled || opened) return

      // Wait until user leaves account/checkout — do not burn the “seen” flag.
      if (isBlockedPath(pathnameRef.current)) {
        retryTimer = window.setTimeout(tryOpen, 1000)
        return
      }

      // Cookie banner sits above the login popup (z-index) — wait for it.
      if (isCookieBannerPending()) {
        retryTimer = window.setTimeout(tryOpen, 400)
        return
      }

      if (isSearchOpen()) {
        retryTimer = window.setTimeout(tryOpen, 400)
        return
      }

      openPopup()
    }

    // Modern ecom: typically 3–8s after first paint. Respect admin delay, min 3s.
    // Pathname is intentionally NOT a dependency — client navigations must not reset the timer.
    const delayMs = Math.max(popupConfig.showDelayMs || 8000, 3000)
    const timer = window.setTimeout(tryOpen, delayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [
    hydrated,
    isLoggedIn,
    popupConfig.enabled,
    popupConfig.showDelayMs,
    popupConfig.storageKey,
  ])

  // If user logs in elsewhere, ensure popup cannot stay open.
  useEffect(() => {
    if (isLoggedIn) {
      setIsPopupOpen(false)
    }
  }, [isLoggedIn])

  const value = useMemo(
    () => ({
      isPopupOpen,
      dismissPopup,
      popupConfig,
      welcomeCoupon,
    }),
    [isPopupOpen, dismissPopup, popupConfig, welcomeCoupon]
  )

  return (
    <LoginPopupContext.Provider value={value}>{children}</LoginPopupContext.Provider>
  )
}

export function useLoginPopup() {
  const context = useContext(LoginPopupContext)
  if (!context) {
    throw new Error("useLoginPopup must be used within LoginPopupProvider")
  }
  return context
}
