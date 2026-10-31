'use client'

import { useState, useMemo, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { ImageLoader } from "@modules/loaders"
import { getDefaultImageIndexForSelection } from "@core/util/product"
import { getProductGalleryImagesForSelection } from "@lib/product-gallery-images"
import {
  productGalleryImageProps,
  productGalleryThumbImageProps,
  productGalleryZoomImageProps,
} from "@lib/product-image"
import { Sparkles } from "lucide-react"
import { scrollToRelatedProducts } from "@lib/scroll-to-related-products"
import StyleSpotlightOverlay from "./style-spotlight-overlay"
import ProductGalleryOverlayActions from "@modules/products/components/product-gallery-overlay-actions"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
  product?: HttpTypes.StoreProduct
}

import { useRef } from "react"
import { useProductContext } from "@modules/products/context/product-context"

const MAX_VISIBLE_THUMBS = 4

const ImageGallery = ({ images: initialImages, product }: ImageGalleryProps) => {
  const { selectedOptions, hasUserChangedOptions } = useProductContext()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const hasOptionSelection = useMemo(
    () => Object.values(selectedOptions).some(Boolean),
    [selectedOptions]
  )

  // Keep server gallery until the shopper changes color/size (auto-preselect must not swap images).
  const images = useMemo(() => {
    if (product && hasOptionSelection && hasUserChangedOptions) {
      return getProductGalleryImagesForSelection(product, selectedOptions)
    }
    return initialImages
  }, [
    product,
    selectedOptions,
    hasOptionSelection,
    hasUserChangedOptions,
    initialImages,
  ])

  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showRightButton, setShowRightButton] = useState(false)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const defaultGalleryAspect =
    productGalleryImageProps.width / productGalleryImageProps.height
  const [galleryAspect, setGalleryAspect] = useState(defaultGalleryAspect)

  // Check if scrolling is needed
  const isVerticalThumbs = () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches

  const getThumbElements = () => {
    const container = scrollContainerRef.current
    if (!container) return []
    return Array.from(container.querySelectorAll<HTMLElement>(".product-gallery__thumb"))
  }

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container || images.length <= MAX_VISIBLE_THUMBS) {
      setShowLeftButton(false)
      setShowRightButton(false)
      return
    }

    const threshold = 2

    if (isVerticalThumbs()) {
      const canScrollUp = container.scrollTop > threshold
      const canScrollDown =
        container.scrollTop + container.clientHeight <
        container.scrollHeight - threshold
      setShowLeftButton(canScrollUp)
      setShowRightButton(canScrollDown)
      return
    }

    const canScrollLeft = container.scrollLeft > threshold
    const canScrollRight =
      container.scrollLeft + container.clientWidth <
      container.scrollWidth - threshold
    setShowLeftButton(canScrollLeft)
    setShowRightButton(canScrollRight)
  }

  const getThumbStep = () => {
    const container = scrollContainerRef.current
    if (!container) return 118

    const thumb = container.querySelector<HTMLElement>(".product-gallery__thumb")
    if (!thumb) return 118

    const styles = window.getComputedStyle(container)
    const gap =
      parseFloat(styles.rowGap || "0") ||
      parseFloat(styles.columnGap || "0") ||
      parseFloat(styles.gap || "0") ||
      6

    return isVerticalThumbs()
      ? thumb.offsetHeight + gap
      : thumb.offsetWidth + gap
  }

  const scrollThumbIntoView = (
    index: number,
    behavior: ScrollBehavior = "smooth"
  ) => {
    const container = scrollContainerRef.current
    const thumbs = getThumbElements()
    const thumb = thumbs[index]
    if (!container || !thumb) return

    if (isVerticalThumbs()) {
      const thumbTop = thumb.offsetTop
      const thumbBottom = thumbTop + thumb.offsetHeight
      const viewTop = container.scrollTop
      const viewBottom = viewTop + container.clientHeight

      if (thumbTop < viewTop) {
        container.scrollTo({ top: thumbTop, behavior })
      } else if (thumbBottom > viewBottom) {
        container.scrollTo({
          top: thumbBottom - container.clientHeight,
          behavior,
        })
      }
      return
    }

    const thumbLeft = thumb.offsetLeft
    const thumbRight = thumbLeft + thumb.offsetWidth
    const viewLeft = container.scrollLeft
    const viewRight = viewLeft + container.clientWidth

    if (thumbLeft < viewLeft) {
      container.scrollTo({ left: thumbLeft, behavior })
    } else if (thumbRight > viewRight) {
      container.scrollTo({
        left: thumbRight - container.clientWidth,
        behavior,
      })
    }
  }

  const scrollTo = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    const step = getThumbStep()
    const isBack = direction === "left"

    if (isVerticalThumbs()) {
      const nextTop = container.scrollTop + (isBack ? -step : step)
      container.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" })
    } else {
      const nextLeft = container.scrollLeft + (isBack ? -step : step)
      container.scrollTo({ left: Math.max(0, nextLeft), behavior: "smooth" })
    }

    window.setTimeout(checkScroll, 320)
  }

  // Select the variant's assigned image when the shopper changes options manually.
  useEffect(() => {
    if (!hasUserChangedOptions) {
      setSelectedImageIndex(0)
      return
    }

    const defaultIndex = product
      ? getDefaultImageIndexForSelection(product, selectedOptions, images)
      : 0

    setSelectedImageIndex(defaultIndex)
  }, [selectedOptions, images, product, hasUserChangedOptions])

  useEffect(() => {
    setGalleryAspect(defaultGalleryAspect)
  }, [selectedImageIndex, images, defaultGalleryAspect])

  const handleStageImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (naturalWidth > 0 && naturalHeight > 0) {
      setGalleryAspect(naturalWidth / naturalHeight)
    }
  }

  useEffect(() => {
    if (images.length > MAX_VISIBLE_THUMBS) {
      scrollThumbIntoView(selectedImageIndex)
    }
    const timer = window.setTimeout(checkScroll, 320)
    return () => window.clearTimeout(timer)
  }, [selectedImageIndex, images.length])

  useEffect(() => {
    const runCheck = () => {
      checkScroll()
      window.requestAnimationFrame(checkScroll)
    }

    runCheck()
    window.addEventListener("resize", runCheck)

    const container = scrollContainerRef.current
    const observer =
      container && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(runCheck)
        : null
    if (container && observer) {
      observer.observe(container)
    }

    return () => {
      window.removeEventListener("resize", runCheck)
      observer?.disconnect()
    }
  }, [images.length])

  const [zoomPosition, setZoomPosition] = useState({
    relX: 0.5,
    relY: 0.5,
    lensLeft: 0,
    lensTop: 0,
    lensWidth: 0,
    lensHeight: 0,
    panWidth: 0,
    panHeight: 0,
    panLeft: 0,
    panTop: 0,
  })
  const [isZooming, setIsZooming] = useState(false)
  const [isPageScrolling, setIsPageScrolling] = useState(false)
  const [canHoverZoom, setCanHoverZoom] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stageInnerRef = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)

  const ZOOM_FACTOR = 2.75

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px) and (hover: hover)")
    const sync = () => setCanHoverZoom(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  const getImageRenderRect = (
    containerWidth: number,
    containerHeight: number
  ) => {
    const imageAspect = galleryAspect > 0 ? galleryAspect : defaultGalleryAspect
    const containerAspect = containerWidth / containerHeight

    if (containerAspect > imageAspect) {
      const height = containerHeight
      const width = height * imageAspect
      return {
        left: (containerWidth - width) / 2,
        top: 0,
        width,
        height,
      }
    }

    const width = containerWidth
    const height = width / imageAspect
    return {
      left: 0,
      top: (containerHeight - height) / 2,
      width,
      height,
    }
  }

  const updateZoomPosition = (clientX: number, clientY: number) => {
    const stage = stageInnerRef.current
    const flyout = flyoutRef.current
    if (!stage) return

    const stageRect = stage.getBoundingClientRect()
    const imageRect = getImageRenderRect(stageRect.width, stageRect.height)

    const pointerX = clientX - stageRect.left
    const pointerY = clientY - stageRect.top

    const relX = Math.min(
      1,
      Math.max(0, (pointerX - imageRect.left) / imageRect.width)
    )
    const relY = Math.min(
      1,
      Math.max(0, (pointerY - imageRect.top) / imageRect.height)
    )

    const lensWidth = imageRect.width / ZOOM_FACTOR
    const lensHeight = imageRect.height / ZOOM_FACTOR
    const lensLeft = imageRect.left + relX * imageRect.width - lensWidth / 2
    const lensTop = imageRect.top + relY * imageRect.height - lensHeight / 2

    const panWidth = imageRect.width * ZOOM_FACTOR
    const panHeight = imageRect.height * ZOOM_FACTOR
    const flyoutWidth = flyout?.clientWidth ?? imageRect.width
    const flyoutHeight = flyout?.clientHeight ?? imageRect.height

    setZoomPosition({
      relX,
      relY,
      lensLeft: Math.min(
        imageRect.left + imageRect.width - lensWidth,
        Math.max(imageRect.left, lensLeft)
      ),
      lensTop: Math.min(
        imageRect.top + imageRect.height - lensHeight,
        Math.max(imageRect.top, lensTop)
      ),
      lensWidth,
      lensHeight,
      panWidth,
      panHeight,
      panLeft: flyoutWidth / 2 - relX * panWidth,
      panTop: flyoutHeight / 2 - relY * panHeight,
    })

    lastPointerRef.current = { x: clientX, y: clientY }
  }

  useEffect(() => {
    if (!isZooming || !canHoverZoom || !lastPointerRef.current) return

    const frame = window.requestAnimationFrame(() => {
      const pointer = lastPointerRef.current
      if (pointer) {
        updateZoomPosition(pointer.x, pointer.y)
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isZooming, selectedImageIndex, canHoverZoom])

  useEffect(() => {
    const handleScroll = () => {
      setIsPageScrolling(true)
      setIsZooming(false) // Force reset zoom instantly when scrolling starts
      
      // If the entire page reaches the top, reset the gallery scroll too
      if (window.scrollY === 0) {
        const scrollContainer = document.getElementById('product-gallery-container')
        if (scrollContainer && scrollContainer.scrollTop > 0) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsPageScrolling(false)
      }, 300)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const container = document.getElementById("product-gallery-container")
    if (!container) return

    const isActive = isZooming && canHoverZoom && !isPageScrolling
    container.classList.toggle("product-gallery-container--zooming", isActive)

    return () => {
      container.classList.remove("product-gallery-container--zooming")
    }
  }, [isZooming, canHoverZoom, isPageScrolling])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPageScrolling || !canHoverZoom) {
      if (isZooming) setIsZooming(false)
      return
    }

    updateZoomPosition(e.clientX, e.clientY)

    if (!isZooming) setIsZooming(true)
  }

  const handleZoomEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPageScrolling || !canHoverZoom) return
    updateZoomPosition(e.clientX, e.clientY)
    setIsZooming(true)
  }

  const selectedImage = images[selectedImageIndex]

  const hasMultipleImages = images.length > 1
  const needsThumbNav = images.length > MAX_VISIBLE_THUMBS

  return (
    <div
      className={`product-gallery${hasMultipleImages ? "" : " product-gallery--single"}`}
    >
      {hasMultipleImages && (
        <div
          className={`product-gallery__thumbs${
            needsThumbNav
              ? " product-gallery__thumbs--scrollable"
              : " product-gallery__thumbs--static"
          }`}
        >
          {needsThumbNav && (
          <button
            type="button"
            onClick={() => scrollTo("left")}
            disabled={!showLeftButton}
            className="product-gallery__nav-slot product-gallery__nav-slot--back"
            aria-label="Scroll thumbnails back"
          >
            <svg
              className="product-gallery__nav-icon product-gallery__nav-icon--horizontal w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <svg
              className="product-gallery__nav-icon product-gallery__nav-icon--vertical w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={needsThumbNav ? checkScroll : undefined}
            className="product-gallery__thumbs-track flex flex-row md:flex-col gap-1.5 no-scrollbar scroll-smooth"
          >
            {images.map((image, index) => (
              <div
                key={image.id ? `${image.id}-${index}` : `thumb-${index}`}
                onClick={() => {
                  setSelectedImageIndex(index)
                  if (needsThumbNav) {
                    scrollThumbIntoView(index)
                  }
                  const scrollContainer = document.getElementById("product-gallery-container")
                  if (scrollContainer) {
                    scrollContainer.scrollTo({ top: 0, behavior: "smooth" })
                  }
                }}
                className={`product-gallery__thumb relative overflow-hidden cursor-pointer flex-shrink-0 snap-start${selectedImageIndex === index ? " product-gallery__thumb--active" : ""}`}
                id={image.id}
              >
                {!!image.url && (
                  <Image
                    {...productGalleryThumbImageProps}
                    src={image.url}
                    loading={index < 4 ? "eager" : "lazy"}
                    fetchPriority="low"
                    className="product-gallery__thumb-img"
                    alt={`Product image ${index + 1}`}
                    fill
                    onLoad={checkScroll}
                  />
                )}
              </div>
            ))}
          </div>

          {needsThumbNav && (
          <button
            type="button"
            onClick={() => scrollTo("right")}
            disabled={!showRightButton}
            className="product-gallery__nav-slot product-gallery__nav-slot--forward"
            aria-label="Scroll thumbnails forward"
          >
            <svg
              className="product-gallery__nav-icon product-gallery__nav-icon--horizontal w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <svg
              className="product-gallery__nav-icon product-gallery__nav-icon--vertical w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          )}
        </div>
      )}

      {selectedImage && (
        <div className="product-gallery__stage relative z-0 w-full">
          {!!selectedImage.url && (
            <div
              className={`product-gallery__stage-zoom-wrap w-full${
                isZooming && canHoverZoom && !isPageScrolling
                  ? " product-gallery__stage-zoom-wrap--zooming"
                  : ""
              }`}
            >
              <div
                ref={stageInnerRef}
                className="product-gallery__stage-inner relative w-full"
                style={
                  {
                    aspectRatio: galleryAspect,
                    "--gallery-aspect": galleryAspect,
                  } as React.CSSProperties
                }
              >
                {images.map((image, index) => {
                  if (!image.url) return null
                  const isCurrent = selectedImageIndex === index
                  const isFirst = index === 0

                  return (
                    <div
                      key={image.id ? `stage-${image.id}` : `stage-${index}`}
                      className={`absolute inset-0 transition-opacity duration-200 ${
                        isCurrent
                          ? "opacity-100 z-10 pointer-events-auto"
                          : "opacity-0 z-0 pointer-events-none"
                      }`}
                      aria-hidden={!isCurrent}
                    >
                      <ImageLoader
                        src={image.url}
                        priority={isFirst}
                        loading={isFirst ? undefined : "lazy"}
                        fill
                        sizes={productGalleryImageProps.sizes}
                        quality={productGalleryImageProps.quality}
                        className="product-gallery__stage-img"
                        alt={isFirst ? "Product main image" : `Product image ${index + 1}`}
                        onLoad={(e) => {
                          if (index === selectedImageIndex) {
                            handleStageImageLoad(e)
                          }
                        }}
                      />
                    </div>
                  )
                })}
                {product && <ProductGalleryOverlayActions product={product} />}
                <StyleSpotlightOverlay
                  product={product}
                  visible={selectedImageIndex === 1 && !isZooming}
                />

                <div
                  className="product-gallery__zoom-trigger absolute inset-0 z-20"
                  onMouseEnter={handleZoomEnter}
                  onMouseLeave={() => setIsZooming(false)}
                  onMouseMove={handleMouseMove}
                  onWheel={() => setIsZooming(false)}
                />

                {isZooming && canHoverZoom && !isPageScrolling && (
                  <div
                    className="product-gallery__zoom-lens"
                    style={{
                      width: `${zoomPosition.lensWidth}px`,
                      height: `${zoomPosition.lensHeight}px`,
                      left: `${zoomPosition.lensLeft}px`,
                      top: `${zoomPosition.lensTop}px`,
                    }}
                  />
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    scrollToRelatedProducts()
                  }}
                  className="product-gallery__similar-btn absolute z-30 pointer-events-auto"
                  aria-label="View similar"
                >
                  <Sparkles
                    className="product-gallery__similar-btn-icon shrink-0"
                    aria-hidden="true"
                    strokeWidth={1.75}
                  />
                  <span className="product-gallery__similar-btn-label">
                    View similar
                  </span>
                </button>
              </div>

              {isZooming && canHoverZoom && !isPageScrolling && (
                <div
                  ref={flyoutRef}
                  className="product-gallery__zoom-flyout"
                  aria-hidden="true"
                >
                  <div className="product-gallery__zoom-flyout-viewport">
                    <div
                      className="product-gallery__zoom-flyout-pan"
                      style={{
                        width: `${zoomPosition.panWidth}px`,
                        height: `${zoomPosition.panHeight}px`,
                        left: `${zoomPosition.panLeft}px`,
                        top: `${zoomPosition.panTop}px`,
                      }}
                    >
                      <Image
                        {...productGalleryZoomImageProps}
                        src={selectedImage.url}
                        fill
                        loading="lazy"
                        fetchPriority="low"
                        className="product-gallery__zoom-flyout-img"
                        alt=""
                        draggable={false}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
