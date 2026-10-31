"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { clx } from "@medusajs/ui"

export function Pagination({
  page,
  totalPages,
  "data-testid": dataTestid,
}: {
  page: number
  totalPages: number
  "data-testid"?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else if (page <= 3) {
      pages.push(1, 2, 3, 4, "ellipsis", totalPages)
    } else if (page >= totalPages - 2) {
      pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="store-page__pagination" data-testid={dataTestid}>
      <p className="store-page__pagination-info">
        Page <span>{page}</span> of <span>{totalPages}</span>
      </p>

      <div className="store-page__pagination-controls">
        <button
          type="button"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          className="store-page__pagination-btn store-page__pagination-btn--nav"
          aria-label="Previous page"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="store-page__pagination-pages">
          {pageNumbers.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <span key={`ellipsis-${idx}`} className="store-page__pagination-ellipsis">
                  •••
                </span>
              )
            }

            const isCurrent = p === page

            return (
              <button
                key={p}
                type="button"
                onClick={() => handlePageChange(p)}
                disabled={isCurrent}
                className={clx(
                  "store-page__pagination-btn",
                  isCurrent && "store-page__pagination-btn--active"
                )}
              >
                {p}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
          className="store-page__pagination-btn store-page__pagination-btn--nav"
          aria-label="Next page"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
