"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { useProductVariant } from "@lib/hooks/use-product-variant"
import { useProductActions } from "@lib/hooks/use-product-actions"
import { getDisplayPrice } from "@core/domain/product/pricing"
import { resolveSizeChartUrl } from "@lib/resolve-size-chart-url"
import LoginPopup from "@modules/common/components/login-popup"
import { useProductContext } from "@modules/products/context/product-context"
import { ProductPriceSection } from "./ProductPriceSection"
import { ProductOptionsSection } from "./ProductOptionsSection"
import { ProductCTASection } from "./ProductCTASection"
import { ProductTrustBar } from "./ProductTrustBar"
import { ProductTrustSection } from "./ProductTrustSection"
import { ProductFeaturePanel } from "./ProductFeaturePanel"
import { ProductDetailsSection } from "./ProductDetailsSection"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region?: HttpTypes.StoreRegion
  disabled?: boolean
  cart?: HttpTypes.StoreCart | null
}

export default function ProductActions({
  product,
  region,
  disabled,
  cart,
}: ProductActionsProps) {
  const countryCode = useParams().countryCode as string
  const actionsRef = useRef<HTMLDivElement>(null)
  const { markUserChangedOptions } = useProductContext()

  const {
    options,
    setOptionValue: setOptionValueBase,
    setColorValue: setColorValueBase,
    selectedVariant,
    isValidVariant,
    validationErrors,
    validateOptions,
    colorOption,
    sizeOption,
    otherOptions,
    colorVariants,
    selectedColorValue,
  } = useProductVariant({ product })

  const setOptionValue = useCallback(
    (optionId: string, value: string) => {
      markUserChangedOptions()
      setOptionValueBase(optionId, value)
    },
    [markUserChangedOptions, setOptionValueBase]
  )

  const setColorValue = useCallback(
    (colorOptionId: string, value: string) => {
      markUserChangedOptions()
      setColorValueBase(colorOptionId, value)
    },
    [markUserChangedOptions, setColorValueBase]
  )

  const displayPrice = useMemo(
    () => getDisplayPrice(product, selectedVariant),
    [product, selectedVariant]
  )

  const sizeChartImageUrl = useMemo(
    () => resolveSizeChartUrl(product),
    [product]
  )

  const {
    quantity,
    setQuantity,
    isAdding,
    isBuyingNow,
    variantInCart,
    quantityInCart,
    inStock,
    inventoryLimit,
    handleAddToCart,
    handleBuyNow,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
  } = useProductActions({
    product,
    region,
    cart,
    selectedVariant,
    options,
    isValidVariant,
    displayPrice,
    validateOptions,
  })

  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [showNotifyMessage, setShowNotifyMessage] = useState(false)

  useEffect(() => {
    setShowNotifyMessage(false)
  }, [options])

  return (
    <>
      <div
        className="product-page__purchase flex flex-col gap-3 w-full"
        ref={actionsRef}
      >
        {displayPrice && (
          <ProductPriceSection
            displayPrice={displayPrice}
            quantityInCart={quantityInCart}
          />
        )}

        <ProductOptionsSection
          product={product}
          disabled={disabled}
          isAdding={isAdding}
          options={options}
          setOptionValue={setOptionValue}
          setColorValue={setColorValue}
          validationErrors={validationErrors}
          colorOption={colorOption}
          sizeOption={sizeOption}
          otherOptions={otherOptions}
          colorVariants={colorVariants}
          selectedColorValue={selectedColorValue}
          onOpenSizeChart={() => setActiveFeature("size_chart")}
        />

        <ProductTrustBar className="lg:hidden" />

        <ProductCTASection
          product={product}
          selectedVariant={selectedVariant}
          options={options}
          isValidVariant={isValidVariant}
          disabled={disabled}
          inStock={inStock}
          inventoryLimit={inventoryLimit}
          quantity={quantity}
          setQuantity={setQuantity}
          quantityInCart={quantityInCart}
          variantInCart={variantInCart}
          isAdding={isAdding}
          isBuyingNow={isBuyingNow}
          showNotifyMessage={showNotifyMessage}
          setShowNotifyMessage={setShowNotifyMessage}
          handleAddToCart={handleAddToCart}
          handleBuyNow={handleBuyNow}
          handleIncreaseQuantity={handleIncreaseQuantity}
          handleDecreaseQuantity={handleDecreaseQuantity}
        />

        <ProductTrustBar className="hidden lg:flex" />

        <ProductTrustSection
          selectedVariantId={selectedVariant?.id}
          onOpenFeature={setActiveFeature}
        />

        <ProductFeaturePanel
          activeFeature={activeFeature}
          onClose={() => setActiveFeature(null)}
          sizeChartImageUrl={sizeChartImageUrl}
        />

        <ProductDetailsSection product={product} />
      </div>

      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        countryCode={countryCode}
      />
    </>
  )
}
