"use client"

import Image from "next/image"
import { XMark } from "@medusajs/icons"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { useSearchContext } from "@modules/layout/components/desktop-search"

export default function SmartSearchInputBar() {
  const { setIsSearchOpen, searchQuery, setSearchQuery } = useSearchContext()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => setIsSearchOpen(false)

  const goToStore = () => {
    const query = (searchQuery ?? "").trim()
    if (!query) return
    router.push(`/store?q=${encodeURIComponent(query)}`)
    handleClose()
  }

  return (
    <div className="smart-search-popup__header">
      <div className="smart-search-popup__input-wrap">
        <Image
          src="/Search.svg"
          alt="Search"
          width={18}
          height={18}
          className="smart-search-popup__input-icon"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") goToStore()
            if (e.key === "Escape") handleClose()
          }}
          placeholder="Search our range..."
          className="smart-search-popup__input"
          data-testid="smart-search-input"
          autoComplete="off"
        />
        {(searchQuery ?? "").trim() && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="smart-search-popup__clear"
            data-testid="smart-search-clear"
          >
            Clear
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="smart-search-popup__close"
        aria-label="Close search"
        data-testid="smart-search-close"
      >
        <XMark className="w-5 h-5" />
      </button>
    </div>
  )
}
