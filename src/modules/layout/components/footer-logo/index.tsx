import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getLogoFromAdminConfig } from "@lib/data/logo-config"
import { getThemeDefaultAssets } from "@lib/theme-default-assets"

const FooterLogo = async () => {
  // Prefer Admin → Company Logo; theme default only if admin has none.
  const logoUrl =
    (await getLogoFromAdminConfig()) || getThemeDefaultAssets().logo

  return (
    <LocalizedClientLink href="/" className="block mb-3 sm:mb-4">
      <Image
        src={logoUrl}
        alt="Sahsha"
        width={180}
        height={48}
        sizes="(max-width: 640px) 8rem, (max-width: 768px) 10rem, 180px"
        className="h-auto object-contain w-32 sm:w-40 md:w-44 lg:w-[180px]"
      />
    </LocalizedClientLink>
  )
}

export default FooterLogo
