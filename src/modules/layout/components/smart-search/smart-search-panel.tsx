"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

type SmartSearchPanelProps = {
  label: string
  onClose: () => void
  header?: ReactNode
  children: ReactNode
}

export function SmartSearchPanel({
  label,
  onClose,
  header,
  children,
}: SmartSearchPanelProps) {
  const openedAtRef = useRef(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    openedAtRef.current = Date.now()
    setMounted(true)
  }, [])

  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = "0"
    document.body.style.right = "0"
    document.body.style.width = "100%"
    document.documentElement.style.overflow = "hidden"

    return () => {
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.left = ""
      document.body.style.right = ""
      document.body.style.width = ""
      document.documentElement.style.overflow = ""
      window.scrollTo(0, scrollY)
    }
  }, [])

  const handleBackdropClick = () => {
    if (Date.now() - openedAtRef.current < 300) return
    onClose()
  }

  if (!mounted) return null

  return createPortal(
    <>
      <button
        type="button"
        className="smart-search-backdrop"
        onClick={handleBackdropClick}
        aria-label="Close search"
      />
      <div className="smart-search-popup" role="dialog" aria-label={label}>
        <div className="smart-search-popup__card">
          {header ? header : null}
          <div className="smart-search-popup__body">{children}</div>
        </div>
      </div>
    </>,
    document.body
  )
}
