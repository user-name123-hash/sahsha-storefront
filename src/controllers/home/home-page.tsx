import { Suspense } from "react"
import Hero from "@theme/blocks/home/Hero"
import { storefrontConfig } from "@storefront-config"
import { resolveComponent } from "@registry/resolve-component"
import type { HomePageData } from "@core/types/home"
import type { HomeBlockType } from "@storefront-config"
import { colorClasses } from "@theme/tokens"
import { getBaseURL } from "@core/util/env"
import { loadHomeData } from "@controllers/home/load-home-data"
import { loadShopByCategoryBlock } from "@controllers/home/load-shop-by-category"
import { loadNewArrivalsBlock } from "@controllers/home/load-new-arrivals"
import { HomePageBlocks } from "@controllers/home/home-page-blocks"
import ShopByCategoryFallback from "@theme/blocks/home/ShopByCategory/fallback"
import NewArrivalsFallback from "@theme/blocks/home/NewArrivals/fallback"

function getBlockProps(
  blockType: HomeBlockType,
  data: HomePageData
): Record<string, unknown> {
  switch (blockType) {
    case "hero":
      return data.hero
    case "shopByAge":
      return data.shopByAge
    case "shopByCategory":
      return data.shopByCategory
    case "whyChooseUs":
      return data.whyChooseUs
    case "newArrivals":
      return data.newArrivals
    case "lovedByMoms":
      return data.lovedByMoms
    case "testimonials":
      return data.testimonials
    case "features":
      return data.features
    default:
      return {}
  }
}

/** Reserve hero geometry so streaming does not shift layout. */
function HeroFallback() {
  return (
    <section className="w-full impulse-hero-nav-overlap" aria-hidden>
      <div className="hidden min-[551px]:block impulse-hero impulse-hero--desktop" />
      <div className="block min-[551px]:hidden impulse-hero impulse-hero--mobile" />
    </section>
  )
}

function HomeHero({ hero }: { hero: HomePageData["hero"] }) {
  return <Hero {...hero} />
}

async function HomeShopByCategory() {
  const { categories } = await loadShopByCategoryBlock()
  const ShopByCategory = (
    await resolveComponent("blocks/home/ShopByCategory")
  ).default

  return <ShopByCategory categories={categories} />
}

async function HomeNewArrivals({ countryCode }: { countryCode: string }) {
  const block = await loadNewArrivalsBlock(countryCode)
  if (!block) {
    return null
  }

  const NewArrivals = (
    await resolveComponent("blocks/home/NewArrivals")
  ).default

  return (
    <NewArrivals
      products={block.products}
      region={block.region}
      ratings={block.ratings}
      countryCode={countryCode}
    />
  )
}

async function HomePageDeferred({ countryCode }: { countryCode: string }) {
  const data = await loadHomeData(countryCode)
  if (!data) {
    return null
  }

  return (
    <HomePageBlocks
      data={data}
      excludeBlockTypes={["shopByCategory", "newArrivals"]}
    />
  )
}

/** Legacy entry — renders full page when all data is already available. */
export async function HomePage({ data }: { data: HomePageData }) {
  const blocks = storefrontConfig.blocks.home
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME?.trim() || "Sahsha"
  const baseUrl = getBaseURL().replace(/\/$/, "")

  const resolvedBlocks = await Promise.all(
    blocks.map(async (block) => {
      const mod = await resolveComponent(block.component)
      return {
        block,
        Component: mod.default,
      }
    })
  )

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shopName,
    url: baseUrl,
  }

  return (
    <div className={`${colorClasses.pageBg} w-full`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {resolvedBlocks.map(({ block, Component }) => (
        <Component key={block.blockType} {...getBlockProps(block.blockType, data)} />
      ))}
    </div>
  )
}

/**
 * Streams shell + JSON-LD immediately for TTFB.
 * Hero and below-the-fold blocks resolve in Suspense — same UI, earlier first byte.
 */
export function HomePageStreamed({
  countryCode,
  hero,
}: {
  countryCode: string
  hero: HomePageData["hero"]
}) {
  const shopName = process.env.NEXT_PUBLIC_SHOP_NAME?.trim() || "Sahsha"
  const baseUrl = getBaseURL().replace(/\/$/, "")

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shopName,
    url: baseUrl,
  }

  return (
    <div className={`${colorClasses.pageBg} w-full`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<HeroFallback />}>
        <HomeHero hero={hero} />
      </Suspense>
      <Suspense fallback={<ShopByCategoryFallback />}>
        <HomeShopByCategory />
      </Suspense>
      <Suspense fallback={<NewArrivalsFallback />}>
        <HomeNewArrivals countryCode={countryCode} />
      </Suspense>
      <Suspense fallback={null}>
        <HomePageDeferred countryCode={countryCode} />
      </Suspense>
    </div>
  )
}
