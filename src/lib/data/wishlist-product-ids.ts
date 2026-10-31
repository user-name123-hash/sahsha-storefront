"use server"

import { getWishlist } from "../../../node_modules/@pradip1995/commerce-core/src/data/wishlist"

/**
 * Product IDs only. Never fall back to wishlist row `id` — that caused
 * phantom badge counts when product_id was missing and the wishlist page
 * filtered those rows out as empty.
 */
export async function getWishlistProductIds(): Promise<string[]> {
  try {
    const result = await getWishlist(false)
    if (!result.success || !Array.isArray(result.data)) {
      return []
    }

    return result.data
      .map((item: any) => {
        if (typeof item === "string") return item
        if (typeof item?.product_id === "string" && item.product_id.trim()) {
          return item.product_id.trim()
        }
        if (typeof item?.product?.id === "string" && item.product.id.trim()) {
          return item.product.id.trim()
        }
        return null
      })
      .filter((id: string | null): id is string => {
        if (!id) return false
        if (id === "null" || id === "undefined") return false
        return true
      })
  } catch {
    return []
  }
}
