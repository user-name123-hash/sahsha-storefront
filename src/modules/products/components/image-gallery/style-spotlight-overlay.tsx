"use client"

import { useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { useProductContext } from "@modules/products/context/product-context"
import { getStyleSpotlightEntries } from "@theme/slots/product/ProductActions/product-metadata-fields"

type StyleSpotlightOverlayProps = {
  product?: HttpTypes.StoreProduct
  visible?: boolean
}

function getSelectedColorLabel(
  product: HttpTypes.StoreProduct | undefined,
  selectedOptions: Record<string, string | undefined>
): string | null {
  if (!product?.options?.length) return null

  const colorOption = product.options.find((option) => {
    const title = option.title?.toLowerCase() || ""
    return title.includes("color") || title.includes("colour")
  })

  if (!colorOption?.id) return null

  const selectedValue = selectedOptions[colorOption.id]
  if (selectedValue) return selectedValue

  return colorOption.values?.[0]?.value ?? null
}

export default function StyleSpotlightOverlay({
  product,
  visible = true,
}: StyleSpotlightOverlayProps) {
  const { selectedOptions } = useProductContext()

  const entries = useMemo(() => {
    const colorLabel = getSelectedColorLabel(product, selectedOptions)
    return getStyleSpotlightEntries(product?.metadata, colorLabel)
  }, [product, selectedOptions])

  if (!visible || entries.length === 0) return null

  return (
    <div className="product-gallery__spotlight pointer-events-none absolute inset-0 z-[15]">
      <div className="product-gallery__spotlight-scrim" aria-hidden />
      <div className="product-gallery__spotlight-content">
        <p className="product-gallery__spotlight-title">Specifications</p>
        <div className="product-gallery__spotlight-grid">
          {entries.map((entry) => (
            <div key={entry.label} className="product-gallery__spotlight-spec">
              <span className="product-gallery__spotlight-label">{entry.label}</span>
              <span className="product-gallery__spotlight-value">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
