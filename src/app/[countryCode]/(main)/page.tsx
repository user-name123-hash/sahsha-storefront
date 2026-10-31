import { Metadata } from "next"

import { HomePageStreamed } from "@controllers/home/home-page"
import { loadHeroData } from "@controllers/home/load-hero-data"
import HeroPreload from "@modules/home/components/hero-preload"
import { getHomePageDescription, getHomePageTitle } from "@lib/site-metadata"

/** ISR — reuse anonymous homepage HTML between visits when the route stays cacheable. */
export const revalidate = 60

/** Home SEO Title / Description from dynamic-config (public 5 min cache). */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await getHomePageTitle(),
    description: await getHomePageDescription(),
    alternates: {
      canonical: "/",
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params

  // Hero only — catalog/new-arrivals load in streamed Suspense so HTML + LCP preload are not blocked.
  const hero = await loadHeroData()
  const desktopImage = hero.homeBanner.image
  const mobileImage = hero.appBanner.image || desktopImage

  return (
    <>
      {desktopImage ? (
        <HeroPreload
          desktopImage={desktopImage}
          mobileImage={mobileImage || desktopImage}
        />
      ) : null}
      <HomePageStreamed countryCode={countryCode} hero={hero} />
    </>
  )
}
