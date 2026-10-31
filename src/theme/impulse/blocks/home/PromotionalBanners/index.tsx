import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getPromotionalBannersFromConfig } from "@lib/data/promotional-banners"
import { belowFoldImageProps } from "@lib/below-fold-image-props"

const PromotionalBanners = async () => {
  const banners = await getPromotionalBannersFromConfig()

  if (banners.length === 0) {
    return null
  }

  const isSingle = banners.length === 1

  return (
    <section className="promo-banners" aria-label="Promotions">
      <div
        className={
          isSingle ? "promo-banners__single" : "promo-banners__grid"
        }
      >
        {banners.slice(0, 2).map((banner, index) => {
          const content = (
            <>
              <Image
                src={banner.image}
                alt={banner.title || `Promotional banner ${index + 1}`}
                fill
                className="promo-banners__image"
                {...belowFoldImageProps(banner.image, {
                  sizes: isSingle
                    ? "100vw"
                    : "(max-width: 768px) 100vw, 50vw",
                })}
              />
              <div className="promo-banners__overlay" aria-hidden />
              <div className="promo-banners__content">
                {banner.title && (
                  <h3 className="promo-banners__title">{banner.title}</h3>
                )}
                {banner.description && (
                  <p className="promo-banners__description">
                    {banner.description}
                  </p>
                )}
                {banner.buttonName && (
                  <span className="promo-banners__cta">
                    {banner.buttonName}
                  </span>
                )}
              </div>
            </>
          )

          if (banner.link) {
            return (
              <LocalizedClientLink
                key={`${banner.image}-${index}`}
                href={banner.link}
                className="promo-banners__tile"
              >
                {content}
              </LocalizedClientLink>
            )
          }

          return (
            <div
              key={`${banner.image}-${index}`}
              className="promo-banners__tile"
            >
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default PromotionalBanners
