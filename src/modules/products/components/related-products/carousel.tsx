"use client"

import React, { useState, useEffect, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import type { ProductCardRating } from "@core/types/product-card"
import ProductCard from "@registry/components/product-card"

type RelatedProductsCarouselProps = {
  region: HttpTypes.StoreRegion
  products: HttpTypes.StoreProduct[]
  ratings?: ProductCardRating[]
}

function getItemsPerView(width: number) {
  if (width >= 1024) return 4
  if (width >= 768) return 3
  return 2
}

export default function RelatedProductsCarousel({
  region,
  products: allProducts,
  ratings = [],
}: RelatedProductsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(4)

  const updateItemsPerView = useCallback(() => {
    setItemsPerView(getItemsPerView(window.innerWidth))
  }, [])

  useEffect(() => {
    updateItemsPerView()
    window.addEventListener("resize", updateItemsPerView)
    return () => window.removeEventListener("resize", updateItemsPerView)
  }, [updateItemsPerView])

  useEffect(() => {
    setCurrentIndex(0)
  }, [itemsPerView, allProducts.length])

  const useMobileScroll = itemsPerView === 2
  const maxIndex = Math.max(0, allProducts.length - itemsPerView)
  const currentProducts = allProducts.slice(
    currentIndex,
    currentIndex + itemsPerView
  )
  const productsToRender = useMobileScroll ? allProducts : currentProducts

  if (!allProducts.length) {
    return null
  }

  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < maxIndex
  const showNav = allProducts.length > 1

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canGoPrevious) return
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!canGoNext) return
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  return (
    <div className="bestsellers-carousel related-products-carousel">
      {showNav && !useMobileScroll && (
        <>
          <button
            type="button"
            onClick={handlePrevious}
            onPointerDown={(e) => e.stopPropagation()}
            className={`bestsellers-carousel__nav bestsellers-carousel__nav--prev${
              canGoPrevious ? "" : " is-disabled"
            }`}
            aria-label="Previous products"
            aria-disabled={!canGoPrevious}
            tabIndex={canGoPrevious ? 0 : -1}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            onPointerDown={(e) => e.stopPropagation()}
            className={`bestsellers-carousel__nav bestsellers-carousel__nav--next${
              canGoNext ? "" : " is-disabled"
            }`}
            aria-label="Next products"
            aria-disabled={!canGoNext}
            tabIndex={canGoNext ? 0 : -1}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      <ul
        className={`product-card-grid related-products-section__grid${
          useMobileScroll ? " related-products-section__grid--mobile-scroll" : ""
        }`}
        style={
          {
            "--related-visible": itemsPerView,
          } as React.CSSProperties
        }
      >
        {productsToRender.map((relatedProduct) => {
          const rating = ratings.find(
            (item) => item.product_id === relatedProduct.id
          )
          return (
            <li key={relatedProduct.id} className="product-card-grid__cell">
              <ProductCard
                region={region}
                product={relatedProduct}
                className="h-full"
                imageClassName="shop-grid__card-image"
                showWishlistIcon
                rating={rating}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
