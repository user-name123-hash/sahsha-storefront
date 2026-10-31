import { cache } from "react"
import { getNewArrivalProducts } from "@lib/data/new-arrivals"
import { HttpTypes } from "@medusajs/types"

/** Dedupes new-arrivals product-helper call when home streams the block + loadHomeData. */
export const getCachedNewArrivalProducts = cache(
  async (
    countryCode: string,
    limit: number
  ): Promise<HttpTypes.StoreProduct[]> => {
    return getNewArrivalProducts(countryCode, limit).catch(() => [])
  }
)
