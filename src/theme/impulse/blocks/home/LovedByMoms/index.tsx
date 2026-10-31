import { HttpTypes } from "@medusajs/types"
import type { ProductCardRating } from "@core/types/product-card"
import LovedByMomsSection from "./loved-by-moms-section"

type LovedByMomsProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  ratings?: ProductCardRating[]
  countryCode?: string
}

/** Best seller products — data loaded by `loadHomeData`, shown in swipe carousel. */
const LovedByMoms = async ({
  products: fallbackProducts,
  region,
  ratings,
}: LovedByMomsProps) => {
  return (
    <LovedByMomsSection
      products={fallbackProducts ?? []}
      region={region}
      ratings={ratings}
    />
  )
}

export default LovedByMoms
