"use client"

import Image from "next/image"
import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { useSearchContext } from "@modules/layout/components/desktop-search"
import { useSmartSearchDiscovery } from "./use-smart-search-discovery"

type SmartSearchDiscoveryProps = {
  countryCode: string
}

const MAX_TRENDING = 4

export default function SmartSearchDiscovery({
  countryCode,
}: SmartSearchDiscoveryProps) {
  const { setIsSearchOpen } = useSearchContext()
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const { data, isLoading } = useSmartSearchDiscovery(
    countryCode,
    true,
    activeCategoryId
  )

  const handleClose = () => setIsSearchOpen(false)

  return (
    <div className="search-discovery search-discovery--popup">
      {data.categories.length > 0 && (
        <section className="search-discovery__section">
          <nav
            className="search-discovery__categories"
            role="tablist"
            aria-label="Filter trending products by category"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeCategoryId === null}
              onClick={() => setActiveCategoryId(null)}
              className={`search-discovery__category-tab${
                activeCategoryId === null ? " is-active" : ""
              }`}
            >
              All
            </button>
            {data.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategoryId === category.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={`search-discovery__category-tab${
                  activeCategoryId === category.id ? " is-active" : ""
                }`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        </section>
      )}

      <section className="search-discovery__section">
        <h2 className="search-discovery__eyebrow">Trending now</h2>

        {isLoading && data.products.length === 0 ? (
          <p className="search-discovery__empty">Loading trending products...</p>
        ) : data.products.length > 0 ? (
          <div className="search-discovery__products search-discovery__products--popup">
            {data.products.slice(0, MAX_TRENDING).map((product) => (
              <LocalizedClientLink
                key={product.id}
                href={`/products/${product.handle}`}
                onClick={handleClose}
                className="search-discovery__product"
              >
                <div className="search-discovery__product-media">
                  {product.thumbnail ? (
                    <Image
                      src={product.thumbnail}
                      alt={product.title || "Product"}
                      fill
                      sizes="120px"
                      className="search-discovery__product-image"
                    />
                  ) : (
                    <div className="search-discovery__product-placeholder">
                      <PlaceholderImage size={24} />
                    </div>
                  )}
                </div>
                <p className="search-discovery__product-title">{product.title}</p>
                {product.price && (
                  <p className="search-discovery__product-price">{product.price}</p>
                )}
              </LocalizedClientLink>
            ))}
          </div>
        ) : (
          <p className="search-discovery__empty">No products in this category yet.</p>
        )}
      </section>
    </div>
  )
}
