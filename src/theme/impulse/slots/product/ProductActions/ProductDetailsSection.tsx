"use client"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import RatingsTab from "@modules/products/components/product-tabs/ratings-tab"
import {
  getProductDetailsNarratives,
  getProductMetadataEntries,
} from "./product-metadata-fields"
import { ProductTrustSignals } from "./ProductTrustSignals"

function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="product-accordion__item border-t border-[var(--color-header-border)]">
      <button
        onClick={onToggle}
        className="product-accordion__trigger flex items-center justify-between w-full py-4 text-left"
      >
        <h3 className="product-accordion__title">{title}</h3>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform text-heading ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-5 text-sm text-body leading-relaxed">{children}</div>
      )}
    </div>
  )
}

function NarrativeBlock({
  title,
  items,
}: {
  title: string
  items: string[]
}) {
  return (
    <div className="product-details__block">
      <h4 className="product-details__block-title">{title}</h4>
      {items.length === 1 ? (
        <p className="product-details__block-text">{items[0]}</p>
      ) : (
        <ul className="product-details__list">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ProductDetailsSection({ product }: { product: HttpTypes.StoreProduct }) {
  const metadataEntries = getProductMetadataEntries(product.metadata)
  const narrativeSections = getProductDetailsNarratives(product.metadata)
  const careGuide = product.metadata?.care_guide
  const hasCareGuide =
    careGuide !== null &&
    careGuide !== undefined &&
    String(careGuide).trim() !== ""
  const showProductDetailsAccordion =
    narrativeSections.length > 0 || Boolean(product.title?.trim())
  const showSpecGrid = metadataEntries.length > 0
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)
  const [isCareGuideOpen, setIsCareGuideOpen] = useState(false)

  return (
    <div className="product-details-section mt-2">
      {showProductDetailsAccordion && (
        <AccordionItem
          title="Product details"
          isOpen={isDetailsOpen}
          onToggle={() => setIsDetailsOpen(!isDetailsOpen)}
        >
          {product.title && (
            <p className="product-details__product-title">{product.title}</p>
          )}

          {narrativeSections.map((section) => (
            <NarrativeBlock
              key={section.key}
              title={section.title}
              items={section.items}
            />
          ))}
        </AccordionItem>
      )}

      {showSpecGrid && (
        <div className="product-details__grid border-t border-[var(--color-header-border)]">
          {metadataEntries.map((entry) => (
            <div key={entry.key} className="product-details__item">
              <span className="product-details__label">{entry.label}</span>
              <span className="product-details__value">{entry.value}</span>
            </div>
          ))}
        </div>
      )}

      {product.description && (
        <AccordionItem
          title="Description"
          isOpen={isDescriptionOpen}
          onToggle={() => setIsDescriptionOpen(!isDescriptionOpen)}
        >
          <div
            className="mb-3 whitespace-pre-line"
            dangerouslySetInnerHTML={{
              __html: product.description
                ? product.description.replace(/\n/g, "<br />")
                : "",
            }}
          />
          {(() => {
            const features = product.metadata?.features
            if (!features) return null

            if (typeof features === "string") {
              return (
                <ul className="list-disc list-inside space-y-1">
                  {features.split(",").map((feature: string, index: number) => (
                    <li key={index}>{feature.trim()}</li>
                  ))}
                </ul>
              )
            }

            if (Array.isArray(features)) {
              return (
                <ul className="list-disc list-inside space-y-1">
                  {(features as string[]).map((feature: string, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              )
            }

            return null
          })()}
        </AccordionItem>
      )}

      {hasCareGuide && (
        <AccordionItem
          title="Care guide"
          isOpen={isCareGuideOpen}
          onToggle={() => setIsCareGuideOpen(!isCareGuideOpen)}
        >
          {(() => {
            const careGuideStr =
              typeof careGuide === "string" ? careGuide : String(careGuide)

            const items = careGuideStr.includes(",")
              ? careGuideStr.split(",").map((item) => item.trim()).filter(Boolean)
              : careGuideStr.includes("\n")
                ? careGuideStr.split("\n").map((item) => item.trim()).filter(Boolean)
                : [careGuideStr]

            if (items.length > 1) {
              return (
                <ul className="list-disc list-inside space-y-1">
                  {items.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              )
            }

            return <p>{careGuideStr}</p>
          })()}
        </AccordionItem>
      )}

      <ProductTrustSignals />

      <div className="product-reviews-section border-t border-[var(--color-header-border)] pt-4 pb-2">
        <RatingsTab product={product} />
      </div>
    </div>
  )
}
