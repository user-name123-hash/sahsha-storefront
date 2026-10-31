"use client"

import { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import type { ProductCardRating } from "@core/types/product-card"
import { getAggregateRatingColor } from "@lib/util/rating-colors"
import { clx } from "@lib/util/clx"

type ProductCardRatingProps = {
  product: HttpTypes.StoreProduct
  rating?: ProductCardRating
  variant?: "inline" | "overlay"
  hidden?: boolean
}

const StarRow = ({
  averageRating,
  showScore,
}: {
  averageRating: number
  showScore: boolean
}) => (
  <div className="product-card__rating-stars" aria-hidden>
    {[1, 2, 3, 4, 5].map((star) => {
      const isFilled = showScore && star <= Math.round(averageRating)

      return (
        <svg
          key={star}
          className="product-card__rating-star"
          viewBox="0 0 24 24"
          fill={isFilled ? "#f5c518" : "none"}
          stroke={isFilled ? "#f5c518" : "#d1d5db"}
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      )
    })}
  </div>
)

export default function ProductCardRatingDisplay({
  product,
  rating: ratingProp,
  variant = "inline",
  hidden = false,
}: ProductCardRatingProps) {
  const extendedProduct = product as HttpTypes.StoreProduct & {
    average_rating?: number
    total_rating_count?: number
  }

  const averageRating = useMemo(() => {
    if (ratingProp && ratingProp.average_rating > 0) {
      return ratingProp.average_rating
    }

    return extendedProduct.average_rating || 0
  }, [ratingProp, extendedProduct.average_rating])

  const totalReviews = useMemo(() => {
    if (ratingProp && ratingProp.total_reviews > 0) {
      return ratingProp.total_reviews
    }

    return extendedProduct.total_rating_count || 0
  }, [ratingProp, extendedProduct.total_rating_count])

  const hasReviews = averageRating > 0 && totalReviews > 0
  const ratingColor = getAggregateRatingColor(averageRating)

  if (!hasReviews) {
    return null
  }

  if (variant === "overlay") {
    return (
      <div
        className={clx(
          "product-card__rating-badge",
          hidden && "product-card__rating-badge--hidden"
        )}
        data-testid="product-card-rating"
      >
        <span className="product-card__rating-badge-score">
          {averageRating.toFixed(1)}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={ratingColor}
          aria-hidden
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        <span className="product-card__rating-badge-divider">|</span>
        <span className="product-card__rating-badge-count">
          {totalReviews}
        </span>
      </div>
    )
  }

  return (
    <div className="product-card__rating" data-testid="product-card-rating">
      <StarRow averageRating={averageRating} showScore={hasReviews} />
      {hasReviews && (
        <span className="product-card__rating-meta">
          <span className="product-card__rating-avg">
            {averageRating.toFixed(1)}
          </span>
          <span className="product-card__rating-count">({totalReviews})</span>
        </span>
      )}
    </div>
  )
}
