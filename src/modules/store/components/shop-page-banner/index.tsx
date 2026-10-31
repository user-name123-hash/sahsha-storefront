import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getShopPageBannerFromConfig } from "@lib/data/shop-page-banner"

export default async function ShopPageBanner() {
  const banner = await getShopPageBannerFromConfig()

  if (!banner?.image) {
    return null
  }

  const image = (
    <Image
      src={banner.image}
      alt="Shop banner"
      className="store-page__banner-media"
      width={2400}
      height={686}
      sizes="100vw"
      quality={90}
      priority
      style={{ width: "100%", height: "auto" }}
    />
  )

  return (
    <section className="store-page__banner" aria-label="Shop promotion">
      {banner.link ? (
        <LocalizedClientLink href={banner.link} className="block w-full">
          {image}
        </LocalizedClientLink>
      ) : (
        image
      )}
    </section>
  )
}
