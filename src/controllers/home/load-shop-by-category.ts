import { cache } from "react"
import { listStorefrontCategories } from "@lib/data/cached-catalog"
import { slimCategoriesForHome } from "@lib/slim-home-payload"
import type { HomePageData } from "@core/types/home"

/** Categories only — shares cached Medusa fetch with layout + loadHomeData. */
export const loadShopByCategoryBlock = cache(
  async (): Promise<HomePageData["shopByCategory"]> => {
    const raw = await listStorefrontCategories().catch(() => [])
    return {
      categories: slimCategoriesForHome(raw),
    }
  }
)
