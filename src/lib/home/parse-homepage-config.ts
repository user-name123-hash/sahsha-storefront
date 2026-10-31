import type { BannerData } from "@core/types/home"
import type { TestimonialsData } from "@lib/data/testimonials"
import type { WhyChooseUsFeatures } from "@lib/data/why-choose-us"
import { sanitizePublicMediaUrl } from "@lib/media-url"

function nonEmpty(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

type HomepageConfig = Record<string, unknown> | null | undefined

export function parseHomeBanners(homepage: HomepageConfig): BannerData[] | null {
  const bannerArray = homepage?.["homepage-banner-array"]
  if (!Array.isArray(bannerArray) || !bannerArray.length) return null

  return bannerArray
    .map((item) => {
      const banner = (item as Record<string, unknown>)?.["homepage-banner"] as
        | Record<string, string>
        | undefined
      return {
        image: nonEmpty(banner?.["homepage-banner-image"]) ?? undefined,
        title: nonEmpty(banner?.["homepage-banner-title"]) ?? undefined,
        subtitle: nonEmpty(banner?.["homepage-banner-subtitle"]) ?? undefined,
        description:
          nonEmpty(banner?.["homepage-banner-description"]) ?? undefined,
        buttonName:
          nonEmpty(banner?.["homepage-banner-button-name"]) ?? undefined,
        buttonLink:
          nonEmpty(banner?.["homepage-banner-button-link"]) ?? undefined,
      }
    })
    .filter((b) => b.image || b.title || b.subtitle)
}

export function parseAppBanners(homepage: HomepageConfig): BannerData[] | null {
  const bannerArray = homepage?.["app-banner-array"]
  if (!Array.isArray(bannerArray) || !bannerArray.length) return null

  return bannerArray
    .map((item) => {
      const banner = (item as Record<string, unknown>)?.["app-banner"] as
        | Record<string, string>
        | undefined
      return {
        image: nonEmpty(banner?.["app-banner-image"]) ?? undefined,
        title: nonEmpty(banner?.["app-banner-title"]) ?? undefined,
        subtitle: nonEmpty(banner?.["app-banner-subtitle"]) ?? undefined,
        description: nonEmpty(banner?.["app-banner-description"]) ?? undefined,
        buttonName: nonEmpty(banner?.["app-banner-button-name"]) ?? undefined,
        buttonLink: nonEmpty(banner?.["app-banner-button-link"]) ?? undefined,
      }
    })
    .filter((b) => b.image || b.title || b.subtitle)
}

export function parseWhyChooseUs(homepage: HomepageConfig): WhyChooseUsFeatures {
  const title =
    nonEmpty(homepage?.["why-choose-us-title"] as string) || "Why Choose Sahsha?"
  const featuresRaw = homepage?.["why-choose-us-features"]

  if (!Array.isArray(featuresRaw)) {
    return { title, features: [] }
  }

  const features = featuresRaw
    .map((item: Record<string, unknown>) => {
      const feature = (item?.feature ?? item) as Record<string, string>
      const name = nonEmpty(feature?.["feature-name"]) || ""
      const icon =
        sanitizePublicMediaUrl(nonEmpty(feature?.["feature-icon"])) || ""
      return { name, icon }
    })
    .filter((f) => Boolean(f.name && f.icon))

  return { title, features }
}

export function parseTestimonials(homepage: HomepageConfig): TestimonialsData {
  if (!homepage) return null

  const ratings = homepage["ratings"]
  const testimonials = Array.isArray(ratings)
    ? ratings
        .map((item: Record<string, unknown>, index: number) => {
          if (item == null || typeof item !== "object") return null
          const review = (item?.review ?? item) as Record<string, string>
          const text = nonEmpty(review?.["review-description"])
          const name = nonEmpty(review?.["review-user-name"])
          if (!text || !name) return null
          return {
            id: `review-${index}`,
            text,
            name,
            rating: parseFloat(review?.["review-rating"] || "5") || 5,
            avatar: nonEmpty(review?.["review-profile-image"]) || undefined,
          }
        })
        .filter(Boolean)
    : []

  const title =
    nonEmpty(homepage["rating-title"] as string) ||
    (testimonials.length > 0 ? "What Our Customers Are Saying" : null)
  const eyebrow = nonEmpty(homepage["rating-eyebrow"] as string) || undefined
  const description =
    nonEmpty(homepage["rating-description"] as string) || undefined

  if (!title && !eyebrow && !description && testimonials.length === 0) {
    return null
  }

  return {
    title: title || "What Our Customers Are Saying",
    eyebrow,
    description,
    testimonials: testimonials as NonNullable<TestimonialsData>["testimonials"],
  }
}
