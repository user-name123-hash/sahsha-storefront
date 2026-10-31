"use client"

import { HttpTypes } from "@medusajs/types"
import { PencilSquare } from "@medusajs/icons"
import React from "react"
import { clx } from "@medusajs/ui"

type AddressCardProps = {
  address: HttpTypes.StoreCustomerAddress | any
  isSelected: boolean
  isDefault?: boolean
  onSelect: () => void
  onEdit: () => void
  onRemove: () => void
}

const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected,
  onSelect,
  onEdit,
}) => {
  const addressType = address.metadata?.address_type || "HOME"

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest("button")) {
      return
    }
    onSelect()
  }

  return (
    <div
      className={clx(
        "checkout-page__address-card",
        isSelected && "checkout-page__address-card--selected"
      )}
      onClick={handleCardClick}
    >
      <div className="checkout-page__address-card-row">
        <div
          className={clx(
            "checkout-page__address-radio",
            isSelected && "checkout-page__address-radio--selected"
          )}
          aria-hidden="true"
        >
          {isSelected && <div className="checkout-page__address-radio-dot" />}
        </div>

        <div className="checkout-page__address-card-body">
          <div className="checkout-page__address-card-head">
            <div className="checkout-page__address-card-head-main">
              <h3 className="checkout-page__address-name">
                {address.first_name}{" "}
                {address.last_name === "." ? "" : address.last_name}
              </h3>
              <span className="checkout-page__address-type-tag">{addressType}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit()
              }}
              className="checkout-page__btn-icon"
              aria-label="Edit address"
            >
              <PencilSquare />
            </button>
          </div>

          <div className="checkout-page__address-lines">
            <p>{address.address_1}</p>
            {address.address_2 && <p>{address.address_2}</p>}
            <p>
              {address.city}
              {address.province && `, ${address.province}`}
              {address.postal_code && ` - ${address.postal_code}`}
              {address.country_code && `, ${address.country_code.toUpperCase()}`}
            </p>
          </div>

          {address.phone && (
            <div className="checkout-page__address-phone">
              <span className="checkout-page__address-phone-label">Mobile</span>
              <span className="checkout-page__address-phone-value">
                {address.phone}
              </span>
            </div>
          )}

          <div className="checkout-page__address-note">
            <span className="checkout-page__address-note-pill">
              Pay on Delivery available
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddressCard
