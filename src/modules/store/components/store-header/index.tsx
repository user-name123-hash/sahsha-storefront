"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { clx } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SortProducts, { SortOptions } from "../refinement-list/sort-products"
import MobileFilters from "../mobile-filters"

type StoreHeaderProps = {
  sortBy: SortOptions
  productCount?: number
  q?: string
  filterProps?: Record<string, unknown>
}

export default function StoreHeader({
  sortBy,
  productCount,
  filterProps,
}: StoreHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    startTransition(() => {
      router.replace(`${pathname}?${query}`, { scroll: false })
    })
  }

  return (
    <>
      <div className="store-page__breadcrumb-row lg:hidden">
        <nav className="store-page__breadcrumb" aria-label="Breadcrumb">
          <LocalizedClientLink href="/">Home</LocalizedClientLink>
          <span aria-hidden>/</span>
          <span>Shop</span>
        </nav>
        {productCount !== undefined && (
          <p className="store-page__breadcrumb-count">
            <span>{productCount}</span> products
          </p>
        )}
      </div>

      <div
        className={clx(
          "store-page__toolbar border-b border-[#e5e5e5] transition-opacity duration-200",
          isPending ? "opacity-50 pointer-events-none" : "opacity-100"
        )}
      >
        {productCount !== undefined && (
          <p className="store-page__toolbar-count hidden lg:block text-sm text-[var(--color-text-muted)]">
            <span className="font-semibold text-heading">{productCount}</span> products
          </p>
        )}

        <div className="store-page__toolbar-actions">
          {filterProps && (
            <div className="store-page__toolbar-filters">
              <MobileFilters {...filterProps} hideMargin={true} />
            </div>
          )}
          <div className="store-page__toolbar-sort">
            <span className="hidden lg:inline text-xs uppercase tracking-[var(--letter-spacing-nav)] text-[var(--color-text-muted)]">
              Sort by
            </span>
            <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} />
          </div>
        </div>
      </div>
    </>
  )
}
