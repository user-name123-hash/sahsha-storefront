import type { HeroBlockData } from "@core/types/home"
import { HeroCopy } from "./hero-cta"
import HeroPicture from "./hero-picture"

const Hero = ({ homeBanner, appBanner }: HeroBlockData) => {
  const desktopImage = homeBanner.image!
  const mobileImage = appBanner.image || desktopImage
  const sameCopy =
    homeBanner.title === appBanner.title &&
    homeBanner.subtitle === appBanner.subtitle &&
    homeBanner.description === appBanner.description &&
    homeBanner.buttonName === appBanner.buttonName &&
    (homeBanner.buttonLink || "/store") === (appBanner.buttonLink || "/store")

  const desktopAlt =
    homeBanner.subtitle || homeBanner.title || "Hero banner"
  const mobileAlt = appBanner.subtitle || appBanner.title || "Hero banner"

  return (
    <section className="w-full impulse-hero-nav-overlap">
      <div className="impulse-hero impulse-hero--desktop impulse-hero--mobile relative">
        <HeroPicture
          desktopSrc={desktopImage}
          mobileSrc={mobileImage}
          desktopAlt={desktopAlt}
          mobileAlt={mobileAlt}
        />

        <div className="hidden min-[551px]:contents">
          <HeroCopy banner={homeBanner} ctaGa />
        </div>
        <div className="contents min-[551px]:hidden">
          <HeroCopy banner={sameCopy ? homeBanner : appBanner} />
        </div>
      </div>
    </section>
  )
}

export default Hero
