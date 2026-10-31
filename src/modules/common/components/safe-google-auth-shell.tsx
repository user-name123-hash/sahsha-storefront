"use client"

import { useEffect, useState, type ReactNode } from "react"
import { GoogleAuthShell } from "@pradip1995/commerce-auth"
import { isMetaInAppBrowser } from "@lib/util/safe-browser"

type Props = {
  isAuthenticated: boolean
  children?: ReactNode
}

/**
 * Skip Google One Tap / FedCM inside Instagram & Facebook WebViews —
 * those APIs throw or hang on iOS and take down the whole client tree.
 */
export default function SafeGoogleAuthShell({
  isAuthenticated,
  children = null,
}: Props) {
  const [enableOneTap, setEnableOneTap] = useState(false)
  useEffect(() => {
    if (isMetaInAppBrowser()) return
    // Defer Google One Tap until the main thread is idle
    // so it does not block FCP or cause high Total Blocking Time (TBT).
    const enable = () => setEnableOneTap(true)
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (window as any).requestIdleCallback(enable, { timeout: 3000 })
      return () => (window as any).cancelIdleCallback(handle)
    } else {
      const timer = window.setTimeout(enable, 2000)
      return () => window.clearTimeout(timer)
    }
  }, [])

  if (!enableOneTap) {
    return <>{children}</>
  }

  return (
    <GoogleAuthShell isAuthenticated={isAuthenticated}>
      {children}
    </GoogleAuthShell>
  )
}
