"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import type { ProductCardRating } from "@core/types/product-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCard from "@theme/slots/product/ProductCard"
import type { CollectionTab } from "./collections-showcase-types"

const VISIBLE_PRODUCT_COUNT = 4

type CollectionsShowcaseClientProps = {
  tabs: CollectionTab[]
  productsByCollection: Record<string, HttpTypes.StoreProduct[]>
  region: HttpTypes.StoreRegion
  ratings?: ProductCardRating[]
}

function getDefaultActiveTabId(tabs: CollectionTab[]) {
  if (!tabs.length) {
    return ""
  }

  const middleIndex = Math.floor(tabs.length / 2)
  return tabs[middleIndex]?.id ?? tabs[0].id
}

const CollectionsShowcaseClient = ({
  tabs,
  productsByCollection,
  region,
  ratings,
}: CollectionsShowcaseClientProps) => {
  const [activeId, setActiveId] = useState(() => getDefaultActiveTabId(tabs))
  const [contentAnimating, setContentAnimating] = useState(false)

  const activeProducts = (productsByCollection[activeId] ?? []).slice(
    0,
    VISIBLE_PRODUCT_COUNT
  )

  const handleTabClick = (tabId: string) => {
    if (tabId === activeId) return
    setActiveId(tabId)
    setContentAnimating(true)
  }

  useEffect(() => {
    if (!contentAnimating) return

    const timer = window.setTimeout(() => setContentAnimating(false), 360)
    return () => window.clearTimeout(timer)
  }, [contentAnimating, activeId])

  if (!tabs.length) {
    return null
  }

  return (
    <>
      <nav className="collections-showcase__tabs" aria-label="Collections">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId

          return (
            <button
              key={tab.id}
              type="button"
              className={`collections-showcase__tab${isActive ? " is-active" : ""}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="collections-showcase__tab-label">{tab.title}</span>
            </button>
          )
        })}
      </nav>

      <div className="collections-showcase__slider">
        <div className="collections-showcase__viewport">
          <div
            key={activeId}
            className={`collections-showcase__track${
              contentAnimating ? " collections-showcase__track--enter" : ""
            }`}
          >
            {activeProducts.length > 0 ? (
              activeProducts.map((product) => (
                <div key={product.id} className="collections-showcase__slide">
                  <ProductCard
                    product={product}
                    region={region}
                    rating={ratings?.find((r) => r.product_id === product.id)}
                    className="h-full"
                    imageClassName="shop-grid__card-image"
                    quickAddClassName="product-card__quick-add--hero"
                    showWishlistIcon
                  />
                </div>
              ))
            ) : (
              <p className="collections-showcase__empty">No products in this collection yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="collections-showcase__footer">
        <LocalizedClientLink href="/collections" className="collections-showcase__view-all">
          View all
        </LocalizedClientLink>
      </div>
    </>
  )
}

export default CollectionsShowcaseClient
