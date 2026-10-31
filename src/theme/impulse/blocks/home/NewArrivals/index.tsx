import { Suspense } from "react"
import type { ProductCardRating } from "@core/types/product-card"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCarousel from "@theme/components/product-carousel"
import PromotionalBanners from "../PromotionalBanners"

type NewArrivalsProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  ratings?: ProductCardRating[]
  countryCode?: string
}

const NewArrivals = async ({
  products: fallbackProducts,
  region,
  ratings,
}: NewArrivalsProps) => {
  const products = fallbackProducts ?? []
  const allRatings: ProductCardRating[] = ratings ?? []
  const visibleProducts = products.slice(0, 12)

  return (
    <>
      <section className="new-arrivals w-full py-1 md:py-12 bg-page-bg">
        <div
          className="mx-auto px-2 sm:px-3 md:px-5 lg:px-4"
          style={{ maxWidth: "var(--container-max)" }}
        >
          <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
            <h2 className="font-display text-2xl md:text-3xl text-heading">
              New arrivals
            </h2>
            <LocalizedClientLink
              href="/store"
              className="text-[11px] font-semibold uppercase tracking-[var(--letter-spacing-nav)] text-heading border-b border-heading pb-0.5 hover:opacity-70 transition-opacity shrink-0"
            >
              View all
            </LocalizedClientLink>
          </div>

          {visibleProducts.length > 0 ? (
            <ProductCarousel
              products={visibleProducts}
              region={region}
              ratings={allRatings}
              prioritySlideCount={0}
            />
          ) : (
            <p className="text-center py-12 text-[var(--color-text-muted)]">
              No new arrivals at the moment. Check back soon!
            </p>
          )}
        </div>
      </section>

      <Suspense fallback={null}>
        <PromotionalBanners />
      </Suspense>
    </>
  )
}

export default NewArrivals
