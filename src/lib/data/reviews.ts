"use server"

import {
  submitReview as kitSubmitReview,
  updateReview as kitUpdateReview,
} from "@core/data/reviews"
import { getCacheTag } from "@core/data/cookies"
import { revalidateTag } from "next/cache"

type SubmitReviewParams = {
  product_id: string
  rating: number
  title: string
  description: string
  images?: string[]
}

type UpdateReviewParams = {
  id: string
  rating?: number
  title?: string
  description?: string
  images?: string[]
}

async function invalidateReviewCaches() {
  // Bulk /store/ratings is patched with tags: ["ratings"] (120s TTL).
  revalidateTag("ratings")

  // Product list embeds average_rating / total_rating_count (60s TTL).
  const productsCacheTag = await getCacheTag("products")
  if (productsCacheTag) {
    revalidateTag(productsCacheTag)
  }
}

export async function submitReview(params: SubmitReviewParams) {
  const result = await kitSubmitReview(params)
  if (result.success) {
    await invalidateReviewCaches()
  }
  return result
}

export async function updateReview(params: UpdateReviewParams) {
  const result = await kitUpdateReview(params)
  if (result.success) {
    await invalidateReviewCaches()
  }
  return result
}
