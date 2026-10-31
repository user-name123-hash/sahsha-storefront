"use client"

import { useEffect, useState, type CSSProperties } from "react"
import Image from "next/image"
import PlaceholderImage from "@modules/common/icons/placeholder-image"

export type ReviewItem = {
  id: string
  text: string
  name: string
  rating: number
  avatar?: string
}

type ReviewsScrollProps = {
  items: ReviewItem[]
}

function CardStars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, rating))
  const fullStars = Math.floor(clamped)
  const hasHalf = clamped % 1 >= 0.5

  return (
    <div
      className="customer-reviews__card-stars"
      aria-label={`${clamped} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < fullStars || (index === fullStars && hasHalf)

        return (
          <span
            key={index}
            className={
              filled
                ? "customer-reviews__star customer-reviews__star--filled"
                : "customer-reviews__star"
            }
          >
            ★
          </span>
        )
      })}
    </div>
  )
}

function ReviewCard({ item }: { item: ReviewItem }) {
  return (
    <article className="customer-reviews__card">
      <div className="customer-reviews__card-media">
        {item.avatar ? (
          <Image
            src={item.avatar}
            alt={item.name}
            fill
            quality={75}
            loading="lazy"
            sizes="(max-width: 1024px) 78vw, 320px"
            className="customer-reviews__card-image"
          />
        ) : (
          <div className="customer-reviews__card-placeholder">
            <PlaceholderImage size={36} />
          </div>
        )}
      </div>

      <div className="customer-reviews__card-body">
        <p className="customer-reviews__card-quote">{item.text}</p>
        <CardStars rating={item.rating} />

        <p className="customer-reviews__card-meta">
          <span className="customer-reviews__card-name">{item.name}</span>
          <span className="customer-reviews__card-divider" aria-hidden>
            |
          </span>
          <span className="customer-reviews__card-verified">Verified</span>
        </p>
      </div>
    </article>
  )
}

const ReviewsScroll = ({ items }: ReviewsScrollProps) => {
  const [reduceMotion, setReduceMotion] = useState(false)
  const loopedItems = items.length > 1 ? [...items, ...items] : items
  const canAnimate = !reduceMotion && items.length > 1
  const duration = Math.max(items.length * 7, 18)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return (
    <div className="customer-reviews__scroll">
      <div className="customer-reviews__viewport">
        <div
          className={`customer-reviews__track${canAnimate ? " customer-reviews__track--animate" : ""}`}
          style={
            canAnimate
              ? ({ "--reviews-duration": `${duration}s` } as CSSProperties)
              : undefined
          }
        >
          {loopedItems.map((item, index) => (
            <ReviewCard key={`${item.id}-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReviewsScroll
