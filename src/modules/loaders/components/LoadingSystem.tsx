"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import WebsiteLoader from "./WebsiteLoader"
import PageLoader from "./PageLoader"
import {
  PAGE_LOADER_MAX_MS,
  WEBSITE_LOADER_SESSION_KEY,
} from "../constants"

function isInternalNavAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.target && anchor.target !== "_self") return false
  if (anchor.hasAttribute("download")) return false
  const href = anchor.getAttribute("href")
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false
  }
  try {
    const url = new URL(anchor.href, window.location.origin)
    if (url.origin !== window.location.origin) return false
    const next = url.pathname + url.search
    const current = window.location.pathname + window.location.search
    return next !== current
  } catch {
    return false
  }
}

/** Routes that already show their own loading.tsx — skip global PageLoader overlay. */
function destinationHasOwnLoading(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean)
  // /[cc]/cart, /[cc]/account/..., /[cc]/order/.../confirmed
  if (parts[1] === "cart") return true
  if (parts[1] === "account") return true
  if (parts[1] === "order" && parts.includes("confirmed")) return true
  return false
}

/**
 * WebsiteLoader once per session; thin top progress on in-app link navigations.
 * Never stacks with route-level loading.tsx full-page skeletons.
 */
export default function LoadingSystem() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = `${pathname}?${searchParams?.toString() ?? ""}`

  const [websiteDone, setWebsiteDone] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const skipNextRoute = useRef(true)
  const pageLoaderSafety = useRef<number | null>(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(WEBSITE_LOADER_SESSION_KEY)) {
        setWebsiteDone(true)
        document.documentElement.removeAttribute("data-sahsha-loader")
      }
    } catch {
      setWebsiteDone(true)
      document.documentElement.removeAttribute("data-sahsha-loader")
    }
  }, [])

  const clearPageLoaderSafety = useCallback(() => {
    if (pageLoaderSafety.current !== null) {
      window.clearTimeout(pageLoaderSafety.current)
      pageLoaderSafety.current = null
    }
  }, [])

  const stopPageLoader = useCallback(() => {
    clearPageLoaderSafety()
    // Hide on next paint so the new route can settle without a long delay.
    requestAnimationFrame(() => {
      setPageLoading(false)
    })
  }, [clearPageLoaderSafety])

  const startPageLoader = useCallback(() => {
    if (!websiteDone) return
    setPageLoading(true)
    clearPageLoaderSafety()
    pageLoaderSafety.current = window.setTimeout(() => {
      setPageLoading(false)
      pageLoaderSafety.current = null
    }, PAGE_LOADER_MAX_MS)
  }, [websiteDone, clearPageLoaderSafety])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      if (event.button !== 0) return
      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.("a") as HTMLAnchorElement | null
      if (!anchor) return
      if (!isInternalNavAnchor(anchor)) return
      try {
        const url = new URL(anchor.href, window.location.origin)
        if (destinationHasOwnLoading(url.pathname)) return
      } catch {
        /* start loader anyway */
      }
      startPageLoader()
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [startPageLoader])

  useEffect(() => {
    if (skipNextRoute.current) {
      skipNextRoute.current = false
      return
    }
    if (!websiteDone) return
    stopPageLoader()
  }, [routeKey, websiteDone, stopPageLoader])

  useEffect(() => {
    return () => clearPageLoaderSafety()
  }, [clearPageLoaderSafety])

  return (
    <>
      <WebsiteLoader onComplete={() => setWebsiteDone(true)} />
      <PageLoader visible={pageLoading && websiteDone} />
    </>
  )
}
