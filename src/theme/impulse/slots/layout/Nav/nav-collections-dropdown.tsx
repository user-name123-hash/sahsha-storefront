"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { getCollectionImage } from "@lib/category-collection-images"
import { categoryTileImageProps } from "@lib/category-tile-image-props"

type NavCollectionsDropdownProps = {
  collections: HttpTypes.StoreCollection[]
}

export default function NavCollectionsDropdown({
  collections,
}: NavCollectionsDropdownProps) {
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
    closeTimerRef.current = setTimeout(() => setOpen(false), 200)
  }

  if (!collections.length) {
    return (
      <LocalizedClientLink href="/collections" className="nav-luxury-link group">
        <span className="nav-luxury-link-label">Collections</span>
        <span className="nav-luxury-link-line" aria-hidden />
      </LocalizedClientLink>
    )
  }

  return (
    <div
      className={`nav-collections${open ? " nav-collections--open" : ""}`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      <button
        type="button"
        className="nav-luxury-link nav-collections__trigger group"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="nav-luxury-link-label">Collections</span>
        <span className="nav-luxury-link-line" aria-hidden />
      </button>

      <div className="nav-collections__panel" aria-hidden={!open}>
        <div className="nav-collections__grid">
          {collections.map((collection) => {
            const imageUrl = getCollectionImage(collection)
            const title = collection.title || "Collection"

            return (
              <LocalizedClientLink
                key={collection.id}
                href={`/store?collection=${collection.id}`}
                className="nav-collections__card"
                onClick={() => setOpen(false)}
              >
                <div className="nav-collections__card-media">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      className="nav-collections__card-image"
                      {...categoryTileImageProps(imageUrl, {
                        sizes: "160px",
                      })}
                    />
                  ) : (
                    <div className="nav-collections__card-placeholder">
                      <PlaceholderImage size={28} />
                    </div>
                  )}
                </div>
                <span className="nav-collections__card-title">{title}</span>
              </LocalizedClientLink>
            )
          })}
        </div>

        <div className="nav-collections__footer">
          <LocalizedClientLink
            href="/collections"
            className="nav-collections__view-all"
            onClick={() => setOpen(false)}
          >
            View all collections
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
