import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"
import { buildHeroBlockData } from "@lib/home/build-hero-data"
import {
  parseAppBanners,
  parseHomeBanners,
} from "@lib/home/parse-homepage-config"
import type { HomePageData } from "@core/types/home"

/** Fast path for LCP — one public homepage config read (deduped with loadHomeData). */
export async function loadHeroData(): Promise<HomePageData["hero"]> {
  const homepage = await getPublicHomepageConfig()

  return buildHeroBlockData(
    parseHomeBanners(homepage),
    parseAppBanners(homepage)
  )
}
