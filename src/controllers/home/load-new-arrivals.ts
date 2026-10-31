import { cache } from "react"
import { getRegion } from "@core/data/regions"
import { getCachedNewArrivalProducts } from "@lib/data/cached-new-arrivals"
import { slimProductsForCard, slimRegion } from "@lib/slim-home-payload"
import type { HomePageData } from "@core/types/home"

const NEW_ARRIVALS_HOME_LIMIT = 8

export const loadNewArrivalsBlock = cache(
  async (
    countryCode: string
  ): Promise<HomePageData["newArrivals"] | null> => {
    const resolvedCountryCode = countryCode?.trim().toLowerCase() || "in"
    const region = await getRegion(resolvedCountryCode)
    if (!region) {
      return null
    }

    const products = await getCachedNewArrivalProducts(
      resolvedCountryCode,
      NEW_ARRIVALS_HOME_LIMIT
    )

    return {
      products: slimProductsForCard(products),
      region: slimRegion(region),
      ratings: [],
    }
  }
)
