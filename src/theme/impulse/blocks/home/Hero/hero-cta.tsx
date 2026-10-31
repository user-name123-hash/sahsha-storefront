"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { HeroBlockData } from "@core/types/home"

type BannerCopy = HeroBlockData["homeBanner"]

export function HeroCopy({
  banner,
  ctaGa = false,
}: {
  banner: BannerCopy
  ctaGa?: boolean
}) {
  return (
    <div className="impulse-hero__panel">
      <div className="impulse-hero__panel-inner">
        <div className="impulse-hero__overlay" aria-hidden />
        <div className="impulse-hero__content">
          {banner.title && (
            <p className="impulse-hero__eyebrow">{banner.title}</p>
          )}
          {banner.subtitle && (
            <h1 className="impulse-hero__title">{banner.subtitle}</h1>
          )}
          {banner.description && (
            <p className="impulse-hero__description">{banner.description}</p>
          )}
          {banner.buttonName && (
            <LocalizedClientLink href={banner.buttonLink || "/store"}>
              <span
                className="impulse-hero__cta"
                {...(ctaGa
                  ? {
                      "data-ga-event": "hero_banner_click",
                      "data-ga-label": banner.buttonName,
                    }
                  : {})}
              >
                <span className="impulse-hero__cta-label">{banner.buttonName}</span>
              </span>
            </LocalizedClientLink>
          )}
        </div>
      </div>
    </div>
  )
}
