import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getNavLogosFromConfig } from "@lib/data/logo-config"

const logoImageClass =
  "h-11 sm:h-12 md:h-12 lg:h-14 xl:h-auto w-auto object-contain max-w-[150px] sm:max-w-[150px] md:max-w-[150px]"

const DynamicLogo = async () => {
  const { lightLogo, darkLogo } = await getNavLogosFromConfig()

  return (
    <LocalizedClientLink
      href="/"
      className="nav-header-logo"
      data-testid="nav-store-link"
    >
      <Image
        src={lightLogo}
        alt="Sahsha"
        width={180}
        height={48}
        sizes="150px"
        className={`nav-header-logo__light ${logoImageClass}`}
        // Visible logo: eager, but do not steal LCP bandwidth from the hero.
        priority
        fetchPriority="auto"
      />
      <Image
        src={darkLogo}
        alt="Sahsha"
        width={180}
        height={48}
        sizes="150px"
        className={`nav-header-logo__dark ${logoImageClass}`}
        // Hidden in light mode — do not preload (frees bandwidth for hero/FCP).
        loading="lazy"
      />
    </LocalizedClientLink>
  )
}

export default DynamicLogo
