"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import SimpleSpinner from "./SimpleSpinner"
import {
  WEBSITE_LOADER_FADE_OUT_MS,
  WEBSITE_LOADER_MAX_MS,
  WEBSITE_LOADER_SESSION_KEY,
} from "../constants"

type WebsiteLoaderProps = {
  onComplete?: () => void
}

/**
 * First-visit loader — hides once the document is interactive (or safety cap),
 * not after every image/script finishes (`window.load`).
 */
export default function WebsiteLoader({ onComplete }: WebsiteLoaderProps) {
  const [active, setActive] = useState(false)
  const [exiting, setExiting] = useState(false)
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true

    // Clear boot CSS cover immediately so the fade reveals real content (not white).
    document.documentElement.removeAttribute("data-sahsha-loader")
    document.body.style.overflow = ""

    setExiting(true)

    window.setTimeout(() => {
      try {
        sessionStorage.setItem(WEBSITE_LOADER_SESSION_KEY, "1")
      } catch {
        /* ignore */
      }
      setActive(false)
      onComplete?.()
    }, WEBSITE_LOADER_FADE_OUT_MS)
  }, [onComplete])

  useEffect(() => {
    try {
      if (sessionStorage.getItem(WEBSITE_LOADER_SESSION_KEY)) {
        document.documentElement.removeAttribute("data-sahsha-loader")
        onComplete?.()
        return
      }
    } catch {
      /* show once */
    }

    if (
      document.readyState === "interactive" ||
      document.readyState === "complete"
    ) {
      try {
        sessionStorage.setItem(WEBSITE_LOADER_SESSION_KEY, "1")
      } catch {
        /* ignore */
      }
      onComplete?.()
      return
    }

    setActive(true)
    document.body.style.overflow = "hidden"

    const onReady = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => finish())
      })
    }

    // Prefer interactive / DOMContentLoaded over full window "load"
    // so late images and third-party scripts don't block the site.
    if (
      document.readyState === "interactive" ||
      document.readyState === "complete"
    ) {
      onReady()
    } else {
      document.addEventListener("DOMContentLoaded", onReady, { once: true })
    }

    const safety = window.setTimeout(finish, WEBSITE_LOADER_MAX_MS)

    return () => {
      document.removeEventListener("DOMContentLoaded", onReady)
      window.clearTimeout(safety)
      document.body.style.overflow = ""
    }
  }, [finish, onComplete])

  if (!active) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`sahsha-website-loader fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-4 bg-white${
        exiting ? " sahsha-website-loader--exiting" : ""
      }`}
      style={
        {
          "--sahsha-loader-fade-ms": `${WEBSITE_LOADER_FADE_OUT_MS}ms`,
        } as CSSProperties
      }
    >
      <SimpleSpinner size={40} />
      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500">
        Loading
      </p>
    </div>
  )
}
