"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"
import { Fragment, useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type SearchPanelProps = {
  countryCode: string
}

const SearchPanel = ({ countryCode }: SearchPanelProps) => {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") || ""
  const [searchQuery, setSearchQuery] = useState(q)
  const prevOpenRef = useRef(false)

  useEffect(() => {
    setSearchQuery(q)
  }, [q])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => {
            // Lock body scroll when panel opens/closes
            if (open !== prevOpenRef.current) {
              prevOpenRef.current = open
              if (open) {
                document.body.style.overflow = "hidden"
              } else {
                document.body.style.overflow = "unset"
              }
            }

            return (
              <>
                <Popover.Button
                  data-testid="search-panel-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:opacity-80"
                >
                  <Image
                    src="/Search.svg"
                    alt="Search"
                    width={26}
                    height={26}
                    className="w-5 h-5"
                  />
                </Popover.Button>

                {open && (
                  <div
                    className="fixed inset-0 z-[50] bg-black/20 backdrop-blur-sm pointer-events-auto"
                    onClick={close}
                    data-testid="search-panel-backdrop"
                  />
                )}

                <Transition
                  show={open}
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="translate-x-full opacity-0"
                  enterTo="translate-x-0 opacity-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="translate-x-0 opacity-100"
                  leaveTo="translate-x-full opacity-0"
                >
                  <PopoverPanel className="fixed right-0 top-0 h-full w-full max-w-[400px] min-[300px]:max-w-[300px] min-[400px]:max-w-[320px] min-[640px]:max-w-[400px] bg-page-bg shadow-2xl z-[51] flex flex-col">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                        <h2 className="text-xl font-bold text-heading">Search</h2>
                        <button
                          data-testid="close-search-button"
                          onClick={close}
                          className="p-2 hover:bg-surface-muted transition-colors"
                        >
                          <XMark className="w-5 h-5 text-muted" />
                        </button>
                      </div>

                      <div className="p-6 border-b border-[var(--color-border)]">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-12 py-3 border border-[var(--color-border)] bg-surface-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-accent transition-all"
                            autoFocus
                          />
                          <LocalizedClientLink
                            href={`/store?q=${encodeURIComponent(searchQuery)}`}
                            onClick={close}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-surface-muted transition-colors"
                          >
                            <Image
                              src="/Search.svg"
                              alt="Search"
                              width={20}
                              height={20}
                              className="w-5 h-5"
                            />
                          </LocalizedClientLink>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6">
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <p className="text-muted">Start typing to search...</p>
                        </div>
                      </div>
                    </div>
                  </PopoverPanel>
                </Transition>
              </>
            )
          }}
        </Popover>
      </div>
    </div>
  )
}

export default SearchPanel

