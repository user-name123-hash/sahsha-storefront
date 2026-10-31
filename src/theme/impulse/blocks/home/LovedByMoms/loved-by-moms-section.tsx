"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import type { ProductCardRating } from "@core/types/product-card"
import BestsellersCarousel from "./bestsellers-carousel"

type LovedByMomsSectionProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  ratings?: ProductCardRating[]
}

const LovedByMomsSection = ({
  products,
  region,
  ratings,
}: LovedByMomsSectionProps) => {
  if (products.length === 0) {
    return null
  }

  return (
    <section className="bestsellers w-full bg-page-bg">
      <div className="bestsellers__inner">
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-8">
          <h2 className="bestsellers__title !mb-0">Best sellers</h2>
          <LocalizedClientLink
            href="/store?sortBy=bestsellers"
            className="bestsellers__link !mt-0"
          >
            View all
          </LocalizedClientLink>
        </div>

        <BestsellersCarousel
          products={products}
          region={region}
          ratings={ratings}
        />
      </div>
    </section>
  )
}

export default LovedByMomsSection
