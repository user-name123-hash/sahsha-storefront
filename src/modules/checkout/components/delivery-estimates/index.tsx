"use client"

import Image from "next/image"
import type { HttpTypes } from "@medusajs/types"
import { resolveDeliveryEstimateView } from "@core/util/shiprocket"
import type { ShiprocketDeliveryEstimate } from "@core/util/shiprocket"

type DeliveryEstimatesProps = {
  postalCode?: string | null
  firstItem?: HttpTypes.StoreCartLineItem | null
  productImage?: string | null
  deliveryEstimate: ShiprocketDeliveryEstimate
  formatDeliveryDate: (etd?: string | null) => string
  fallbackDeliveryDate: () => string
}

const DeliveryEstimates = ({
  postalCode,
  firstItem,
  productImage,
  deliveryEstimate,
  formatDeliveryDate,
  fallbackDeliveryDate,
}: DeliveryEstimatesProps) => {
  if (!firstItem) return null

  const view = resolveDeliveryEstimateView(
    postalCode,
    deliveryEstimate,
    formatDeliveryDate,
    fallbackDeliveryDate
  )

  return (
    <div className="checkout-page__delivery-panel">
      <h3 className="checkout-page__panel-title">Delivery Estimates</h3>
      <div className="checkout-page__delivery-row">
        {productImage && (
          <div className="checkout-page__delivery-thumb-wrap">
            <Image
              src={productImage}
              alt={firstItem.title || "Product"}
              width={112}
              height={112}
              sizes="56px"
              quality={65}
              className="checkout-page__delivery-thumb"
            />
          </div>
        )}
        <div className="checkout-page__delivery-copy">
          {view.kind === "needs-address" && (
            <p className="checkout-page__delivery-msg checkout-page__delivery-msg--muted">
              Please enter delivery address to see estimates
            </p>
          )}
          {view.kind === "loading" && (
            <p className="checkout-page__delivery-msg checkout-page__delivery-msg--loading">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Calculating delivery estimate...
            </p>
          )}
          {view.kind === "date" && (
            <>
              <p className="checkout-page__delivery-kicker">Estimated delivery by</p>
              <p className="checkout-page__delivery-msg">
                <strong>{view.label}</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeliveryEstimates
