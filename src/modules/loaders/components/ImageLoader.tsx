"use client"

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ComponentProps,
  type CSSProperties,
  type SyntheticEvent,
} from "react"
import Image from "next/image"
import { clx } from "@lib/util/clx"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"
import { IMAGE_LOADER_REVEAL_MS, IMAGE_SKELETON_COLOR } from "../constants"

type NextImageProps = ComponentProps<typeof Image>

type ImageLoaderProps = Omit<NextImageProps, "onLoad" | "onLoadingComplete"> & {
  /** Extra classes for the outer frame (reserves layout space). */
  containerClassName?: string
  /** Border radius in px. Default 0 — match existing sharp product cards. */
  radius?: number
  /** Skip skeleton (e.g. hover swap image). */
  showSkeleton?: boolean
  onLoad?: NextImageProps["onLoad"]
  onLoadingComplete?: NextImageProps["onLoadingComplete"]
}

/**
 * Product image reveal: skeleton shimmer → blur/opacity fade-in (CSS, no framer-motion).
 * Parent must establish size (aspect-ratio or fill) to avoid CLS.
 */
export default function ImageLoader({
  className,
  containerClassName,
  radius = 0,
  showSkeleton = true,
  onLoad,
  onLoadingComplete,
  alt,
  src,
  priority,
  loading,
  decoding = "async",
  fetchPriority,
  unoptimized,
  ...imageProps
}: ImageLoaderProps) {
  const isPriority = priority === true
  const resolvedLoading = isPriority
    ? loading && loading !== "lazy"
      ? loading
      : undefined
    : (loading ?? "lazy")
  const resolvedFetchPriority =
    fetchPriority ?? (isPriority ? "high" : "low")
  const resolvedUnoptimized =
    unoptimized ?? shouldUnoptimizeImage(typeof src === "string" ? src : "")
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const markLoaded = useCallback(() => {
    setLoaded(true)
  }, [])

  useEffect(() => {
    setLoaded(false)
  }, [src])

  // Cached / already-decoded images often skip onLoad — check after paint + short retry.
  useEffect(() => {
    if (loaded) return

    const check = () => {
      const el = imgRef.current
      if (el?.complete && el.naturalWidth > 0) {
        markLoaded()
        return true
      }
      return false
    }

    if (check()) return

    const raf = requestAnimationFrame(() => {
      if (check()) return
      window.setTimeout(check, 50)
    })

    return () => cancelAnimationFrame(raf)
  }, [src, loaded, markLoaded])

  const handleLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      markLoaded()
      onLoad?.(event)
    },
    [markLoaded, onLoad]
  )

  const handleLoadingComplete = useCallback(
    (img: HTMLImageElement) => {
      markLoaded()
      onLoadingComplete?.(img)
    },
    [markLoaded, onLoadingComplete]
  )

  const radiusStyle = radius > 0 ? { borderRadius: radius } : undefined
  // Hover-swap & priority images: never gate behind opacity:0 reveal (was blank until hydration).
  const useReveal = showSkeleton && !isPriority

  return (
    <div
      className={clx(
        // isolate keeps internal z-index (skeleton / reveal) from covering siblings
        // like product-card Quick Add.
        "relative isolate overflow-hidden",
        imageProps.fill && "absolute inset-0 h-full w-full",
        containerClassName
      )}
      style={{
        backgroundColor: IMAGE_SKELETON_COLOR,
        ...radiusStyle,
      }}
    >
      {useReveal && !loaded && (
        <div
          className="sahsha-image-skeleton absolute inset-0 z-[1]"
          style={{
            backgroundColor: IMAGE_SKELETON_COLOR,
            ...radiusStyle,
          }}
          aria-hidden
        />
      )}

      <div
        className={clx(
          useReveal && "sahsha-image-reveal",
          useReveal && loaded && "sahsha-image-reveal--loaded",
          imageProps.fill
            ? "absolute inset-0 h-full w-full"
            : "relative h-full w-full",
          "z-[2]"
        )}
        style={
          {
            ...(useReveal
              ? { "--sahsha-image-reveal-ms": `${IMAGE_LOADER_REVEAL_MS}ms` }
              : null),
            ...radiusStyle,
          } as CSSProperties
        }
      >
        <Image
          {...imageProps}
          ref={imgRef}
          src={src}
          alt={alt}
          priority={priority}
          {...(resolvedLoading ? { loading: resolvedLoading } : {})}
          decoding={decoding}
          fetchPriority={resolvedFetchPriority}
          unoptimized={resolvedUnoptimized}
          onLoad={handleLoad}
          onLoadingComplete={handleLoadingComplete}
          className={clx("h-full w-full", className)}
          style={{
            ...imageProps.style,
            ...radiusStyle,
          }}
        />
      </div>
    </div>
  )
}
