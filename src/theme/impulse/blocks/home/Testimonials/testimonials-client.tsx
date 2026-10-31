"use client"

import ReviewsScroll, { type ReviewItem } from "./reviews-scroll"

interface TestimonialsClientProps {
  initialData?: {
    title: string
    eyebrow?: string
    description?: string
    testimonials: ReviewItem[]
  } | null
}

const DEFAULT_TITLE_LINE_1 = "What Our Customers"
const DEFAULT_TITLE_LINE_2 = "Are Saying"

function HeaderStars() {
  return (
    <div className="customer-reviews__header-stars" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className="customer-reviews__star customer-reviews__star--filled"
        >
          ★
        </span>
      ))}
    </div>
  )
}

function ReviewTitle({ title }: { title: string }) {
  const normalized = title.trim()
  const upper = normalized.toUpperCase()

  if (upper === "WHAT OUR CUSTOMERS ARE SAYING") {
    return (
      <h2 className="customer-reviews__title">
        <span className="customer-reviews__title-line">{DEFAULT_TITLE_LINE_1}</span>
        <span className="customer-reviews__title-line">{DEFAULT_TITLE_LINE_2}</span>
      </h2>
    )
  }

  const areIndex = upper.indexOf(" ARE ")
  if (areIndex > 0) {
    return (
      <h2 className="customer-reviews__title">
        <span>{normalized.slice(0, areIndex + 1)}</span>
        <span>{normalized.slice(areIndex + 1).trim()}</span>
      </h2>
    )
  }

  return <h2 className="customer-reviews__title">{normalized}</h2>
}

const TestimonialsClient = ({ initialData }: TestimonialsClientProps) => {
  const testimonials = (initialData?.testimonials ?? [])
    .filter((item) => item?.text?.trim() && item?.name?.trim())
    .map((testimonial, index) => ({
      ...testimonial,
      id: testimonial.id || `testimonial-${index}`,
      rating: Number.isFinite(testimonial.rating) ? testimonial.rating : 5,
    }))

  const title =
    initialData?.title?.trim() ||
    `${DEFAULT_TITLE_LINE_1} ${DEFAULT_TITLE_LINE_2}`
  const eyebrow = initialData?.eyebrow?.trim() || ""
  const description = initialData?.description?.trim() || ""
  const hasHeader = Boolean(
    initialData?.title?.trim() || eyebrow || description
  )

  // Admin copy and/or Ratings cards — no hardcoded sample reviews.
  if (!hasHeader && testimonials.length === 0) {
    return null
  }

  return (
    <section className="customer-reviews w-full bg-white">
      <div className="customer-reviews__inner">
        <div className="customer-reviews__layout">
          <div className="customer-reviews__intro">
            <div className="customer-reviews__intro-top">
              <HeaderStars />
              {eyebrow ? (
                <p className="customer-reviews__eyebrow">{eyebrow}</p>
              ) : null}
            </div>

            <ReviewTitle title={title} />
            {description ? (
              <p className="customer-reviews__description">{description}</p>
            ) : null}
          </div>

          {testimonials.length > 0 ? (
            <ReviewsScroll items={testimonials} />
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsClient
