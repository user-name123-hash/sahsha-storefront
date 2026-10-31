import { getWebsiteDescriptionFromConfig } from "@lib/data/website-description"

const FOOTER_DESCRIPTION_FALLBACK =
  "Sahsha is an ethnic fashion brand crafting sarees and festive wear rooted in Indian aesthetics — designed for the modern woman."

const FooterDescription = async () => {
  const description =
    (await getWebsiteDescriptionFromConfig()) || FOOTER_DESCRIPTION_FALLBACK

  return (
    <p className="text-white text-xs sm:text-sm leading-relaxed">{description}</p>
  )
}

export default FooterDescription
