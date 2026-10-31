import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getAppBannerFromConfig, getHomeBannerFromConfig } from "@lib/data/banner-config"

const DynamicBanner = async () => {
  const homeBannerConfig = await getHomeBannerFromConfig()
  const appBannerConfig = await getAppBannerFromConfig()

  // Default data for fallback
  const defaultBanner = {
    image: "/newbanner.png",
    title: "Premium Kids Shop",
    subtitle: "Little Trends, Quality Kids Wear",
    description: "Shop stylish kids wear for little ones and children of all years—from newborn up to 15 years. Crafted for play, absolute comfort, and everyday magic.",
    buttonName: "Shop Kids Wear",
    buttonLink: "/store"
  }

  const homeBanner = (homeBanners && homeBanners.length > 0) ? homeBanners[0] : defaultBanner

  // Use config image if available, otherwise use fallback
  const homeBannerImage = homeBanner.image || "/newbanner.png"

  // Robust fallback logic for app banner
  const firstAppBanner = (appBanners && appBanners.length > 0) ? appBanners[0] : null
  const appBanner = {
    image: firstAppBanner?.image || "/appbanner.png",
    title: firstAppBanner?.title || homeBanner.title,
    subtitle: firstAppBanner?.subtitle || homeBanner.subtitle,
    description: firstAppBanner?.description || homeBanner.description,
    buttonName: firstAppBanner?.buttonName || homeBanner.buttonName,
    buttonLink: firstAppBanner?.buttonLink || homeBanner.buttonLink
  }

  return (
    <div className="w-full relative overflow-hidden">
      {/* Desktop & Tablet Banner View (Visible on 551px and up) */}
      <div className="hidden min-[551px]:block relative w-full">
        {homeBannerImage ? (
          <Image
            src={homeBannerImage}
            alt={homeBanner.title || "Home Banner"}
            width={1920}
            height={800}
            sizes="100vw"
            className="w-full h-auto object-cover"
            priority
          />
        ) : (
          <div className="w-full h-[400px] md:h-[500px] lg:h-[600px] bg-[#E9DFFF]"></div>
        )}

        {/* Content Overlay with Responsive Gaps and Sizes */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-[1440px] mx-auto w-full 
            px-12    /* 551px to 767px */
            md:px-20 /* 768px to 1023px */
            lg:px-32 /* 1024px to 1439px */
            xl:px-40 /* 1440px+ */
          ">
            <div className="
              max-w-[240px] /* 551px to 767px */
              md:max-w-sm   /* 768px to 1023px */
              lg:max-w-md   /* 1024px+ */
              space-y-2 md:space-y-4
            ">
              <div className="space-y-0.5 md:space-y-1">
                {homeBanner.title && (
                  <span className="text-[#333] font-bold tracking-tight block
                    text-sm    /* 551px to 767px */
                    md:text-lg /* 768px to 1023px */
                    lg:text-xl /* 1024px+ */
                  ">
                    {homeBanner.title}
                  </span>
                )}
                {homeBanner.subtitle && (
                  <h1 className="font-bold text-[#8B5AB1] leading-[1.1]
                    text-2xl   /* 551px to 767px */
                    md:text-4xl /* 768px to 1023px */
                    lg:text-5xl /* 1024px+ */
                  ">
                    {homeBanner.subtitle}
                  </h1>
                )}
              </div>

              {homeBanner.description && (
                <p className="text-gray-600 leading-relaxed font-medium
                  text-[10px] /* 551px to 767px */
                  md:text-xs  /* 768px to 1023px */
                  lg:text-sm  /* 1024px+ */
                  line-clamp-2 md:line-clamp-none
                ">
                  {homeBanner.description}
                </p>
              )}

              {homeBanner.buttonName && (
                <div className="pt-1 md:pt-2">
                  <LocalizedClientLink href={homeBanner.buttonLink || "/store"}>
                    <button
                      data-ga-event="hero_banner_click"
                      data-ga-label={homeBanner.buttonName || "Shop Now"}
                      className="bg-[#8B5AB1] hover:bg-[#7a4e9d] text-white rounded-full font-bold flex items-center transition-all transform hover:scale-105 active:scale-95 shadow-[0_8px_16px_rgba(139,90,177,0.2)] group
                      px-6 py-2.5 text-xs     /* 551px to 767px */
                      md:px-10 md:py-4 md:text-base /* 768px+ */
                    ">
                      {homeBanner.buttonName}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        className="group-hover:translate-x-1 transition-transform ml-2
                        w-3 h-3 md:w-5 md:h-5
                      ">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </LocalizedClientLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Banner View (Visible below 551px) */}
      <div className="block min-[551px]:hidden relative w-full min-h-[400px]">
        {appBanner.image ? (
          <Image
            src={appBanner.image}
            alt={appBanner.title || "App Banner"}
            width={720}
            height={960}
            sizes="100vw"
            className="w-full h-auto min-h-[400px] object-cover"
            priority
          />
        ) : (
          <div className="w-full h-[450px] bg-[#E9DFFF]"></div>
        )}

        {/* Mobile Content Overlay */}
        <div className="absolute inset-0 flex items-center pt-40 min-[451px]:pt-48">
          <div className="w-full px-6 min-[451px]:px-12">
            <div className="max-w-[240px] min-[451px]:max-w-[300px] space-y-2.5">
              <div className="space-y-1">
                {appBanner.title && (
                  <span className="text-[#333] text-sm min-[451px]:text-lg font-bold tracking-tight block">
                    {appBanner.title}
                  </span>
                )}
                {appBanner.subtitle && (
                  <h1 className="text-2xl min-[451px]:text-3xl font-bold text-[#8B5AB1] leading-tight">
                    {appBanner.subtitle}
                  </h1>
                )}
              </div>

              {appBanner.description && (
                <p className="text-gray-600 text-xs min-[451px]:text-sm leading-relaxed font-medium line-clamp-3">
                  {appBanner.description}
                </p>
              )}

              {appBanner.buttonName && (
                <div className="pt-2">
                  <LocalizedClientLink href={appBanner.buttonLink || "/store"}>
                    <button
                      data-ga-event="hero_banner_click"
                      data-ga-label={appBanner.buttonName || "Shop Now"}
                      className="bg-[#8B5AB1] text-white rounded-full px-6 py-2.5 min-[451px]:px-8 min-[451px]:py-3.5 text-xs min-[451px]:text-sm font-bold flex items-center gap-2 shadow-[0_4px_12px_rgba(139,90,177,0.2)] active:scale-95"
                    >
                      {appBanner.buttonName}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </button>
                  </LocalizedClientLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicBanner
