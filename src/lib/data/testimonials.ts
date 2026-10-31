import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"
import type { ReviewItem } from "@theme/blocks/home/Testimonials/reviews-scroll"

export type TestimonialsData = {
  title: string
  eyebrow?: string
  description?: string
  testimonials: ReviewItem[]
} | null

function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function mapRatingsToTestimonials(ratings: unknown): ReviewItem[] {
  if (!Array.isArray(ratings) || ratings.length === 0) {
    return []
  }

  return ratings
    .map((item: Record<string, unknown>, index: number) => {
      if (item == null || typeof item !== "object") {
        return null
      }

      const review = (item?.review ?? item) as Record<string, string>
      const text = nonEmpty(review?.["review-description"])
      const name = nonEmpty(review?.["review-user-name"])

      if (!text || !name) {
        return null
      }

      return {
        id: `review-${index}`,
        text,
        name,
        rating: parseFloat(review?.["review-rating"] || "5") || 5,
        avatar: nonEmpty(review?.["review-profile-image"]) || undefined,
      }
    })
    .filter((item): item is ReviewItem => Boolean(item))
}

/**
 * Homepage testimonials from Admin dynamic-config (public path).
 * Header copy (title / eyebrow / description) can show even when Ratings
 * items are incomplete — review cards still require description + user name.
 */
export async function getTestimonialsFromPublicConfig(): Promise<TestimonialsData> {
  try {
    const homepageConfig = await getPublicHomepageConfig()
    if (!homepageConfig) {
      return null
    }

    const testimonials = mapRatingsToTestimonials(homepageConfig["ratings"])
    const title =
      nonEmpty(homepageConfig["rating-title"]) ||
      (testimonials.length > 0 ? "What Our Customers Are Saying" : null)
    const eyebrow = nonEmpty(homepageConfig["rating-eyebrow"]) || undefined
    const description =
      nonEmpty(homepageConfig["rating-description"]) || undefined

    if (!title && !eyebrow && !description && testimonials.length === 0) {
      return null
    }

    return {
      title: title || "What Our Customers Are Saying",
      eyebrow,
      description,
      testimonials,
    }
  } catch {
    return null
  }
}

/** Merge/refresh block props from Admin — public path, same mapping. */
export async function enrichTestimonialsData(
  initialData?: TestimonialsData
): Promise<TestimonialsData> {
  if (
    initialData &&
    (initialData.testimonials.length > 0 ||
      initialData.title ||
      initialData.eyebrow ||
      initialData.description)
  ) {
    return initialData
  }

  try {
    const fromAdmin = await getTestimonialsFromPublicConfig()
    if (
      fromAdmin &&
      (fromAdmin.testimonials.length > 0 ||
        fromAdmin.title ||
        fromAdmin.eyebrow ||
        fromAdmin.description)
    ) {
      return fromAdmin
    }

    if (
      initialData &&
      (initialData.testimonials.length > 0 ||
        initialData.title ||
        initialData.eyebrow ||
        initialData.description)
    ) {
      return initialData
    }

    return null
  } catch {
    return initialData ?? null
  }
}
