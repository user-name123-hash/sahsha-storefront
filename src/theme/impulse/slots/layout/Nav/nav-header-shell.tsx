"use client"

import { useSearchContext } from "@modules/layout/components/desktop-search"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

function isHomePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  return segments.length <= 1
}

export default function NavHeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || ""
  const isHome = isHomePath(pathname)
  const { isSearchOpen } = useSearchContext()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      return
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 24)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isHome])

  const isTransparent = isHome && !scrolled && !isSearchOpen

  return (
    <>
      <div
        className="nav-header-fixed"
        data-nav-transparent={isTransparent ? "true" : "false"}
        data-search-open={isSearchOpen ? "true" : "false"}
      >
        {children}
      </div>
      <div className="nav-header-spacer" aria-hidden />
    </>
  )
}
