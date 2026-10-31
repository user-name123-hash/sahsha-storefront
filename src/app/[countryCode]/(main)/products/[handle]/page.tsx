import { cache } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts } from "@core/data/products"
import { getRegion, listRegions } from "@core/data/regions"
import { ProductPage as ProductPageView } from "@controllers/product/product-page"
import { getProductGalleryImages } from "@lib/product-gallery-images"
import {
  getProductPrimaryCategory,
  mergeProductPrimaryCategoryMetadata,
} from "@lib/load-product-primary-category"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

// PDP uses client-side history.replaceState for variant (?v_id=).
// Keep dynamic so those URL syncs do not trigger repeating RSC/server-action POSTs.
export const dynamic = "force-dynamic"
export const dynamicParams = true

const getProductByHandle = cache(
  async (countryCode: string, handle: string) => {
    const { response } = await listProducts({
      countryCode,
      queryParams: { handle },
    })
    return response.products[0] ?? null
  }
)

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch {
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  try {
    const params = await props.params
    const { handle } = params
    const region = await getRegion(params.countryCode)

    if (!region) {
      if (process.env.NODE_ENV === "production" || process.env.CI) {
        return {
          title: "Product | Sahsha",
          description: "Product",
        }
      }
      notFound()
    }

    const product = await getProductByHandle(params.countryCode, handle)

    if (!product) {
      if (process.env.NODE_ENV === "production" || process.env.CI) {
        return {
          title: "Product | Sahsha",
          description: "Product",
        }
      }
      notFound()
    }

    return {
      title: `${product.title} | Sahsha`,
      description: `${product.title}`,
      openGraph: {
        title: `${product.title} | Sahsha`,
        description: `${product.title}`,
        images: product.thumbnail ? [product.thumbnail] : [],
      },
    }
  } catch {
    if (process.env.NODE_ENV === "production" || process.env.CI) {
      return {
        title: "Product | Sahsha",
        description: "Product",
      }
    }
    notFound()
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams

  const [region, pricedProduct] = await Promise.all([
    getRegion(params.countryCode),
    getProductByHandle(params.countryCode, params.handle),
  ])

  if (!region) {
    notFound()
  }

  const selectedVariantId = searchParams.v_id
  const images = getProductGalleryImages(pricedProduct, selectedVariantId)

  if (!pricedProduct) {
    notFound()
  }

  const primaryCategory = await getProductPrimaryCategory(pricedProduct)
  const product = mergeProductPrimaryCategoryMetadata(
    pricedProduct,
    primaryCategory
  )

  const firstImageUrl = images?.[0]?.url
  let imageOrigin: string | null = null
  if (firstImageUrl && (firstImageUrl.startsWith("http://") || firstImageUrl.startsWith("https://"))) {
    try {
      imageOrigin = new URL(firstImageUrl).origin
    } catch {
      imageOrigin = null
    }
  }

  return (
    <>
      {imageOrigin && (
        <link rel="preconnect" href={imageOrigin} crossOrigin="anonymous" />
      )}
      <ProductPageView
        product={product}
        region={region}
        countryCode={params.countryCode}
        images={images || []}
      />
    </>
  )
}
