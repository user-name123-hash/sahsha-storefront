import React, { Suspense } from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import ImageGallery from "@modules/products/components/image-gallery"
import RelatedProducts from "@modules/products/components/related-products"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import Breadcrumb from "@modules/common/components/breadcrumb"
import { ProductProvider } from "@modules/products/context/product-context"
import ProductActionsWrapper from "@controllers/product/product-actions-wrapper"
import { resolveComponent } from "@registry/resolve-component"
import { storefrontConfig } from "@storefront-config"

type ProductPageProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

async function ProductActionsFallback({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) {
  const mod = await resolveComponent(storefrontConfig.slots.product.ProductActions)
  const ProductActions = mod.default

  return <ProductActions disabled product={product} region={region} />
}

export async function ProductPage({
  product,
  region,
  countryCode,
  images,
}: ProductPageProps) {
  if (!product?.id) {
    return notFound()
  }

  const ProductInfo = (
    await resolveComponent(storefrontConfig.slots.product.ProductInfo)
  ).default

  return (
    <>
      <div className="product-page bg-page-bg min-h-screen">
        <ProductProvider>
          <div
            className="product-page__inner mx-auto px-4 sm:px-6 py-4 lg:py-6"
            style={{ maxWidth: "var(--container-max)" }}
          >
            <Breadcrumb product={product} />

            <div
              className="product-page__grid flex flex-col lg:flex-row gap-3 lg:gap-4 mt-2 lg:mt-4"
              data-testid="product-container"
            >
              <div
                id="product-gallery-container"
                className="product-page__gallery w-full lg:w-[55%] lg:sticky lg:top-28 lg:self-start"
              >
                <ImageGallery images={images} product={product} />
              </div>

              <div className="product-page__details w-full lg:flex-1 lg:max-w-[45%] min-w-0 flex flex-col gap-3 lg:gap-4">
                <ProductInfo product={product} region={region} />
                <Suspense
                  fallback={
                    <ProductActionsFallback product={product} region={region} />
                  }
                >
                  <ProductActionsWrapper
                    id={product.id}
                    product={product}
                    region={region}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </ProductProvider>
      </div>

      <div
        id="related-products"
        className="related-products-section"
        data-testid="related-products-container"
      >
        <div
          className="related-products-section__inner related-products-section__inner--page mx-auto"
          style={{ maxWidth: "var(--container-max)" }}
        >
          <h2
            id="related-products-heading"
            className="cart-you-may-also-like__title font-display text-2xl md:text-3xl text-heading"
          >
            You may also like
          </h2>
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </>
  )
}
