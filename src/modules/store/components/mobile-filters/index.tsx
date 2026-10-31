"use client"

import React, { useState, useEffect, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { clx } from "@medusajs/ui"
import RefinementList from "../refinement-list"
import { SortOptions } from "../refinement-list/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SHOP_METADATA_FILTER_KEYS } from "@lib/store-filter-config"

type MobileFiltersProps = {
  sortBy: SortOptions
  collections?: HttpTypes.StoreCollection[]
  collectionValue?: string | string[]
  categoryValue?: string | string[]
  colorValue?: string | string[]
  sizeValue?: string | string[]
  metadataValues?: Record<string, string | string[] | undefined>
  metadataFilters?: {
    param: string
    title: string
    options: { value: string; label: string }[]
  }[]
  minPrice?: string
  maxPrice?: string
  colorOptions?: { value: string; label: string; hex?: string }[]
  sizeOptions?: { value: string; label: string }[]
  categoryOptions?: { value: string; label: string }[]
  hideMargin?: boolean
  q?: string
}

const MobileFilters: React.FC<MobileFiltersProps> = ({
  hideMargin,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setIsOpen(false)
  }, [searchParams])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const hasFilters = !!(
    props.collectionValue ||
    props.categoryValue ||
    props.colorValue ||
    props.sizeValue ||
    props.minPrice ||
    props.maxPrice ||
    props.q ||
    SHOP_METADATA_FILTER_KEYS.some((key) => props.metadataValues?.[key])
  )

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("collection")
    params.delete("category")
    params.delete("gender")
    params.delete("type")
    params.delete("material")
    params.delete("color")
    params.delete("size")
    params.delete("min_price")
    params.delete("max_price")
    params.delete("q")
    SHOP_METADATA_FILTER_KEYS.forEach((key) => params.delete(key))
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div
      className={clx(
        "store-page__mobile-filters lg:hidden",
        !hideMargin && "mb-4 w-full"
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="store-page__mobile-filter-btn"
        data-ga-event="mobile_filter_open_click"
        data-ga-label="Open Filters"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
        <span>Filters</span>
      </button>

      <div
        className={clx(
          "store-page__mobile-backdrop",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      <div
        className={clx(
          "store-page__mobile-panel",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isPending && "store-page__mobile-panel--pending"
        )}
      >
        <div className="store-page__mobile-panel-head">
          <h2 className="store-page__mobile-panel-title">Filters</h2>
          <div className="store-page__mobile-panel-head-actions">
            <button
              type="button"
              onClick={clearAllFilters}
              className="store-page__clear-filters"
              disabled={!hasFilters}
              data-ga-event="filter_clear_all_click"
              data-ga-label="Clear All Filters"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="store-page__mobile-panel-close"
              data-ga-event="mobile_filter_close_click"
              data-ga-label="Close Filters"
              aria-label="Close filters"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="store-page__mobile-panel-body">
          <RefinementList {...props} hideTitle={true} />
        </div>
      </div>
    </div>
  )
}

export default MobileFilters
