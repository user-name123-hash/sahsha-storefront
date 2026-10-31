"use client"

import { useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type NavCategoriesDropdownProps = {
  categories: HttpTypes.StoreProductCategory[]
}

export default function NavCategoriesDropdown({
  categories,
}: NavCategoriesDropdownProps) {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOpen = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(true)
  }

  const handleClose = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 180)
  }

  if (!categories.length) {
    return (
      <LocalizedClientLink href="/store" className="nav-luxury-link group">
        <span className="nav-luxury-link-label">Categories</span>
        <span className="nav-luxury-link-line" aria-hidden />
      </LocalizedClientLink>
    )
  }

  return (
    <div
      className={`nav-categories${open ? " nav-categories--open" : ""}`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      <button
        type="button"
        className="nav-luxury-link nav-categories__trigger group"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="nav-luxury-link-label">Categories</span>
        <span className="nav-luxury-link-line" aria-hidden />
      </button>

      <div className="nav-categories__panel" role="menu" aria-hidden={!open}>
        <ul className="nav-categories__list">
          {categories.map((category) => (
            <li key={category.id} role="none">
              <LocalizedClientLink
                href={`/store?category=${category.id}`}
                className="nav-categories__link"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <span className="nav-categories__link-text">{category.name}</span>
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
