"use client"

import { useMemo } from "react"
import Color from "color"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@lib/util/clx"

const MAX_VISIBLE_SWATCHES = 5

type ProductCardColorSwatchesProps = {
  product: HttpTypes.StoreProduct
  selectedVariantId: string | null
  onSelectVariant: (variantId: string) => void
}

function getColorOption(product: HttpTypes.StoreProduct) {
  return product.options?.find(
    (option) =>
      option.title?.toLowerCase().includes("color") ||
      option.title?.toLowerCase().includes("colour")
  )
}

function getVariantColorValue(
  variant: HttpTypes.StoreProductVariant,
  colorOptionId: string
) {
  return variant.options?.find((option) => option.option_id === colorOptionId)
    ?.value
}

function getVariantColorHex(
  variant: HttpTypes.StoreProductVariant,
  colorValue?: string | null
) {
  const fromMetadata = variant.metadata?.color_hex as string | undefined
  if (fromMetadata) {
    return fromMetadata
  }

  if (!colorValue) {
    return "#d4d4d4"
  }

  try {
    return Color(colorValue.toLowerCase().replace(/\s+/g, "")).hex()
  } catch {
    try {
      return Color(colorValue).hex()
    } catch {
      return "#d4d4d4"
    }
  }
}

export function getVariantCardImage(
  variant: HttpTypes.StoreProductVariant,
  product: HttpTypes.StoreProduct
) {
  const metadata = variant.metadata as Record<string, unknown> | undefined

  return (
    (metadata?.image as string | undefined) ||
    (metadata?.thumbnail as string | undefined) ||
    (metadata?.color_image as string | undefined) ||
    (metadata?.variant_image as string | undefined) ||
    variant.thumbnail ||
    variant.images?.[0]?.url ||
    product.thumbnail ||
    null
  )
}

export function getProductColorVariants(product: HttpTypes.StoreProduct) {
  const colorOption = getColorOption(product)

  if (!colorOption?.id || !product.variants?.length) {
    return []
  }

  const uniqueColors = new Map<string, HttpTypes.StoreProductVariant>()

  product.variants.forEach((variant) => {
    const colorValue = getVariantColorValue(variant, colorOption.id!)

    if (colorValue && !uniqueColors.has(colorValue)) {
      uniqueColors.set(colorValue, variant)
    }
  })

  return Array.from(uniqueColors.values())
}

export default function ProductCardColorSwatches({
  product,
  selectedVariantId,
  onSelectVariant,
}: ProductCardColorSwatchesProps) {
  const colorOption = useMemo(() => getColorOption(product), [product])
  const colorVariants = useMemo(
    () => getProductColorVariants(product),
    [product]
  )

  if (!colorOption || colorVariants.length <= 1) {
    return null
  }

  const visibleVariants = colorVariants.slice(0, MAX_VISIBLE_SWATCHES)
  const hiddenCount = colorVariants.length - visibleVariants.length

  return (
    <div
      className="product-card__swatches"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      {visibleVariants.map((variant) => {
        const colorValue = getVariantColorValue(variant, colorOption.id!)
        const isActive = variant.id === selectedVariantId
        const swatchColor = getVariantColorHex(variant, colorValue)

        return (
          <button
            key={variant.id}
            type="button"
            className={clx(
              "product-card__swatch",
              isActive && "product-card__swatch--active"
            )}
            style={{ backgroundColor: swatchColor }}
            aria-label={colorValue ? `Show ${colorValue}` : "Show color variant"}
            aria-pressed={isActive}
            onClick={() => onSelectVariant(variant.id)}
          />
        )
      })}

      {hiddenCount > 0 && (
        <span className="product-card__swatch-more">+{hiddenCount}</span>
      )}
    </div>
  )
}
