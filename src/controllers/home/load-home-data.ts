import { getRegion } from "@core/data/regions"
import {
  listStorefrontCategories,
  listStorefrontCollections,
} from "@lib/data/cached-catalog"
import { getCachedBestsellerProducts } from "@lib/data/cached-bestsellers"
import { getCachedNewArrivalProducts } from "@lib/data/cached-new-arrivals"
import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"
import { buildHeroBlockData } from "@lib/home/build-hero-data"
import {
  fetchCollectionProducts,
  pickFeaturedCollections,
} from "@lib/home/featured-collections"
import {
  parseAppBanners,
  parseHomeBanners,
  parseTestimonials,
  parseWhyChooseUs,
} from "@lib/home/parse-homepage-config"
import {
  slimCategoriesForHome,
  slimProductsForCard,
  slimRegion,
} from "@lib/slim-home-payload"
import type { HomePageData } from "@core/types/home"
import { HttpTypes } from "@medusajs/types"

const HOME_RAIL_LIMIT = 8

export async function loadHomeData(countryCode: string): Promise<HomePageData | null> {
  const resolvedCountryCode = countryCode?.trim().toLowerCase() || "in"
  const region = await getRegion(resolvedCountryCode)
  if (!region) {
    return null
  }

  const compactRegion = slimRegion(region)

  const [collections, homepageConfig] = await Promise.all([
    listStorefrontCollections(),
    getPublicHomepageConfig(),
  ])
  const featuredCollections = pickFeaturedCollections(collections)

  const whyChooseUs = parseWhyChooseUs(homepageConfig)
  const testimonialsData = parseTestimonials(homepageConfig)

  const [
    categoriesResult,
    newArrivalsResult,
    bestsellersResult,
    featuredProductGroups,
  ] = await Promise.all([
    listStorefrontCategories().catch(() => []),
    getCachedNewArrivalProducts(resolvedCountryCode, HOME_RAIL_LIMIT),
    getCachedBestsellerProducts(resolvedCountryCode, HOME_RAIL_LIMIT),
    Promise.all(
      featuredCollections.map(async (collection) => ({
        collectionId: collection.id,
        products: await fetchCollectionProducts(collection.id, region.id),
      }))
    ),
  ])

  const categories = slimCategoriesForHome(
    (categoriesResult || []) as HttpTypes.StoreProductCategory[]
  )
  const newArrivals = slimProductsForCard(
    (newArrivalsResult || []) as HttpTypes.StoreProduct[]
  )
  const bestsellers = slimProductsForCard(
    (bestsellersResult || []) as HttpTypes.StoreProduct[]
  )

  const productsByCollection = featuredProductGroups.reduce<
    Record<string, HttpTypes.StoreProduct[]>
  >((acc, group) => {
    acc[group.collectionId] = slimProductsForCard(group.products)
    return acc
  }, {})

  return {
    // Hero is rendered by HomeHero (loadHeroData) — placeholder only for HomePageData shape.
    hero: buildHeroBlockData(null, null),
    shopByAge: Object.assign(
      {
        collections: featuredCollections,
        productsByCollection,
        ratings: [],
      },
      {
        region: compactRegion,
        countryCode: resolvedCountryCode,
      }
    ),
    shopByCategory: {
      categories,
    },
    whyChooseUs: {
      title: whyChooseUs.title,
      features: whyChooseUs.features,
    },
    newArrivals: {
      products: newArrivals,
      region: compactRegion,
      ratings: [],
    },
    lovedByMoms: {
      products: bestsellers,
      region: compactRegion,
      ratings: [],
    },
    testimonials: { initialData: testimonialsData },
    features: {},
  }
}
