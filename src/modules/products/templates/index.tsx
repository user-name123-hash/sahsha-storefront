import { ProductPage } from "@controllers/product/product-page"
import { HttpTypes } from "@medusajs/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  selectedVariantId?: string | null
}

export default async function ProductTemplate({
  product,
  region,
  countryCode,
  images,
}: ProductTemplateProps) {
  return (
    <ProductPage
      product={product}
      region={region}
      countryCode={countryCode}
      images={images}
    />
  )
}
