"use client"

import { useState, createContext, useContext } from "react"
import NavLinks from "@modules/layout/components/nav-links"

type SearchContextType = {
  isSearchOpen: boolean
  setIsSearchOpen: (isOpen: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export const useSearchContext = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error("useSearchContext must be used within DesktopSearch")
  }
  return context
}

type DesktopSearchProps = {
  countryCode: string
  children?: React.ReactNode
  hideNavLinks?: boolean
}

const DesktopSearch = ({
  children,
  hideNavLinks = false,
}: DesktopSearchProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <SearchContext.Provider
      value={{ isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery }}
    >
      {!hideNavLinks && (
        <div
          className={`hidden sm:flex items-center gap-x-6 xl:gap-x-8 h-full transition-all duration-300 ${
            isSearchOpen
              ? "opacity-0 pointer-events-none w-0 overflow-hidden"
              : "opacity-100 w-auto"
          }`}
        >
          <NavLinks />
        </div>
      )}

      <div className="nav-header-root">{children}</div>
    </SearchContext.Provider>
  )
}

export const DesktopSearchIcon = () => {
  const { isSearchOpen, setIsSearchOpen } = useSearchContext()

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (!isSearchOpen) setIsSearchOpen(true)
      }}
      className="nav-search-btn flex items-center"
      data-testid="nav-search-button"
      aria-label={isSearchOpen ? "Close search" : "Open search"}
      aria-expanded={isSearchOpen}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Search.svg"
        alt="Search"
        width={22}
        height={22}
        className="nav-header-icon w-[22px] h-[22px]"
        aria-hidden
        decoding="async"
        fetchPriority="low"
      />
    </button>
  )
}

export default DesktopSearch
