"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { HttpTypes } from "@medusajs/types"
import type { ProductCardRating } from "@core/types/product-card"
import ProductCard from "@theme/slots/product/ProductCard"

type ProductCarouselProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  ratings?: ProductCardRating[]
  /** First N slides load images with high priority (above-the-fold rail). */
  prioritySlideCount?: number
}

const AUTO_PLAY_INTERVAL_MS = 3500
const AUTO_PLAY_PAUSE_AFTER_NAV_MS = 4000
const AUTO_PLAY_PAUSE_MS = 8000
const AUTO_SCROLL_SETTLE_MS = 600

const ProductCarousel = ({
  products,
  region,
  ratings,
  prioritySlideCount = 0,
}: ProductCarouselProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const autoPlayPausedUntilRef = useRef(0)
  const isAutoScrollingRef = useRef(false)
  const isHoveringRef = useRef(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [isInView, setIsInView] = useState(false)

  const getSlideStep = useCallback(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return 0

    const firstSlide = track.querySelector<HTMLElement>(".bestsellers-carousel__slide")
    if (!firstSlide) return viewport.clientWidth * 0.85

    const trackStyles = getComputedStyle(track)
    const gap =
      Number.parseFloat(trackStyles.columnGap || trackStyles.gap || "0") || 0

    return firstSlide.offsetWidth + gap
  }, [])

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const { scrollLeft, scrollWidth, clientWidth } = viewport
    const maxScroll = scrollWidth - clientWidth

    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft < maxScroll - 4)
  }, [])

  const pauseAutoPlay = useCallback((ms = AUTO_PLAY_PAUSE_MS) => {
    autoPlayPausedUntilRef.current = Date.now() + ms
  }, [])

  const canAutoPlay = useCallback(() => {
    if (Date.now() < autoPlayPausedUntilRef.current) return false
    if (isHoveringRef.current) return false

    const viewport = viewportRef.current
    if (!viewport) return false

    return viewport.scrollWidth - viewport.clientWidth > 4
  }, [])

  const scrollBySlide = useCallback(
    (direction: "prev" | "next") => {
      const viewport = viewportRef.current
      if (!viewport) return

      const slideStep = getSlideStep()
      viewport.scrollBy({
        left: direction === "next" ? slideStep : -slideStep,
        behavior: "smooth",
      })
    },
    [getSlideStep]
  )

  const autoAdvance = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || !canAutoPlay()) return

    const slideStep = getSlideStep()
    const { scrollLeft, scrollWidth, clientWidth } = viewport
    const maxScroll = scrollWidth - clientWidth

    isAutoScrollingRef.current = true

    if (scrollLeft >= maxScroll - 4) {
      viewport.scrollTo({ left: 0, behavior: "smooth" })
    } else {
      viewport.scrollBy({ left: slideStep, behavior: "smooth" })
    }

    window.setTimeout(() => {
      isAutoScrollingRef.current = false
    }, AUTO_SCROLL_SETTLE_MS)
  }, [canAutoPlay, getSlideStep])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: "200px 0px", threshold: 0.05 }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isInView || products.length < 2) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (prefersReducedMotion) return

    const intervalId = window.setInterval(autoAdvance, AUTO_PLAY_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [autoAdvance, isInView, products.length])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    updateScrollState()

    const onScroll = () => {
      updateScrollState()
      if (!isAutoScrollingRef.current) {
        pauseAutoPlay()
      }
    }

    viewport.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", updateScrollState)

    return () => {
      viewport.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", updateScrollState)
    }
  }, [pauseAutoPlay, products, updateScrollState])

  return (
    <div
      ref={rootRef}
      className="bestsellers-carousel"
      onMouseEnter={() => {
        isHoveringRef.current = true
      }}
      onMouseLeave={() => {
        isHoveringRef.current = false
      }}
    >
      <button
        type="button"
        className={`bestsellers-carousel__nav bestsellers-carousel__nav--prev${
          canScrollLeft ? "" : " is-hidden"
        }`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!canScrollLeft) return
          pauseAutoPlay(AUTO_PLAY_PAUSE_AFTER_NAV_MS)
          scrollBySlide("prev")
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Previous products"
        aria-hidden={!canScrollLeft}
        tabIndex={canScrollLeft ? 0 : -1}
      >
        <ChevronLeft size={18} strokeWidth={1.75} />
      </button>

      <div
        ref={viewportRef}
        className="bestsellers-carousel__viewport"
        onPointerDown={() => pauseAutoPlay()}
      >
        <div ref={trackRef} className="bestsellers-carousel__track">
          {products.map((product, index) => (
            <div key={product.id} className="bestsellers-carousel__slide">
              <ProductCard
                product={product}
                region={region}
                rating={ratings?.find((r) => r.product_id === product.id)}
                className="h-full"
                imageClassName="shop-grid__card-image"
                quickAddClassName="product-card__quick-add--hero"
                showWishlistIcon
                imagePriority={index < prioritySlideCount}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={`bestsellers-carousel__nav bestsellers-carousel__nav--next${
          canScrollRight ? "" : " is-hidden"
        }`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!canScrollRight) return
          pauseAutoPlay(AUTO_PLAY_PAUSE_AFTER_NAV_MS)
          scrollBySlide("next")
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Next products"
        aria-hidden={!canScrollRight}
        tabIndex={canScrollRight ? 0 : -1}
      >
        <ChevronRight size={18} strokeWidth={1.75} />
      </button>
    </div>
  )
}

export default ProductCarousel
