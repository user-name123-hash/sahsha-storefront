import { cache } from "react"
import { getBestsellerProducts } from "@lib/data/bestsellers"
import { HttpTypes } from "@medusajs/types"

export const getCachedBestsellerProducts = cache(
  async (
    countryCode: string,
    limit: number
  ): Promise<HttpTypes.StoreProduct[]> => {
    return getBestsellerProducts(countryCode, limit).catch(() => [])
  }
)
