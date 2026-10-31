'use client'

import React, { useState, useEffect, useCallback } from "react"
import { listProducts } from "@core/data/products"
import { getRegion } from "@core/data/regions"
import { HttpTypes } from "@medusajs/types"
import ProductCard from "@registry/components/product-card"

type YouMayAlsoLikeProps = {
  cart: HttpTypes.StoreCart | null
  countryCode: string
}

function getItemsPerView(width: number) {
  if (width >= 1024) return 4
  if (width >= 768) return 3
  return 2
}

export default function YouMayAlsoLike({
  cart,
  countryCode,
}: YouMayAlsoLikeProps) {
  const [region, setRegion] = useState<HttpTypes.StoreRegion | null>(null)
  const [allProducts, setAllProducts] = useState<HttpTypes.StoreProduct[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [itemsPerView, setItemsPerView] = useState(4)

  const cartProductIds = cart?.items?.map((item) => item.product_id) || []

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

  useEffect(() => {
    async function fetchData() {
      const fetchedRegion = await getRegion(countryCode)
      if (!fetchedRegion) {
        return
      }
      setRegion(fetchedRegion)

      const queryParams: HttpTypes.StoreProductListParams = {
        limit: 20,
        is_giftcard: false,
        region_id: fetchedRegion.id,
        fields:
          "*variants.calculated_price,*images,+variants.inventory_quantity,+metadata,+tags",
      }

      const fetchedProducts = await listProducts({
        queryParams,
        countryCode,
      }).then(({ response }) =>
        response.products.filter(
          (product) => !cartProductIds.includes(product.id)
        )
      )

      setAllProducts(fetchedProducts)
    }
    fetchData()
  }, [cart, countryCode, cartProductIds.join(",")])

  const useMobileScroll = itemsPerView === 2
  const maxIndex = Math.max(0, allProducts.length - itemsPerView)
  const currentProducts = allProducts.slice(
    currentIndex,
    currentIndex + itemsPerView
  )
  const productsToRender = useMobileScroll ? allProducts : currentProducts

  if (!region || !allProducts.length) {
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
    <section
      className="cart-you-may-also-like"
      aria-labelledby="cart-you-may-also-like"
    >
      <h2
        id="cart-you-may-also-like"
        className="cart-you-may-also-like__title font-display text-2xl md:text-3xl text-heading"
      >
        You may also like
      </h2>

      <div className="bestsellers-carousel related-products-carousel cart-you-may-also-like__carousel">
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
          className={`product-card-grid related-products-section__grid cart-you-may-also-like__grid${
            useMobileScroll ? " related-products-section__grid--mobile-scroll" : ""
          }`}
          style={
            {
              "--related-visible": itemsPerView,
            } as React.CSSProperties
          }
        >
          {productsToRender.map((product) => (
            <li key={product.id} className="product-card-grid__cell">
              <ProductCard
                region={region}
                product={product}
                className="h-full"
                imageClassName="shop-grid__card-image"
                showWishlistIcon
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
