import { storefrontConfig as baseConfig } from "@pradip1995/storefront-registry/storefront.config"

/** Customize block order or enabled slots per brand. */
export const storefrontConfig = {
  ...baseConfig,
  /** Fallback home tabs if no admin metadata flags. Match Medusa collection handles. */
  homeFeaturedCollectionHandles: ["dailywear", "wedding", "festival"],
  /** Primary Medusa product tags — avoids sequential tag probe calls on home. */
  homeProductTags: {
    newArrivals: "New Arrivals",
    bestsellers: "bestseller",
  },
  loginPopup: {
    enabled: true,
    showDelayMs: 8000,
    storageKey: "sahsha_login_popup_seen",
    imageSrc: "",
    logoSrc: "/theme-defaults/sahsha/logo.svg",
    brandTitle: "Login now",
    headline: "Unlock Exclusive Deals",
    subtext: "",
    featureCards: [
      {
        title: "Customer-first",
        text: "Putting you in the center",
      },
      {
        title: "Transparent",
        text: "Honest from the inside out",
      },
      {
        title: "Innovative",
        text: "Getting the absolute best for you",
      },
    ],
  },
  blocks: {
    ...baseConfig.blocks,
    home: [
      { blockType: "hero", component: "blocks/home/Hero" },
      { blockType: "shopByCategory", component: "blocks/home/ShopByCategory" },
      { blockType: "newArrivals", component: "blocks/home/NewArrivals" },
      { blockType: "shopByAge", component: "blocks/home/ShopByAge" },
      { blockType: "whyChooseUs", component: "blocks/home/WhyChooseUs" },
      { blockType: "lovedByMoms", component: "blocks/home/LovedByMoms" },
      { blockType: "testimonials", component: "blocks/home/Testimonials" },
      { blockType: "features", component: "blocks/home/Features" },
    ],
  },
} as const

export type { HomeBlockType } from "@pradip1995/storefront-registry/storefront.config"
