import React from "react"

import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"
import { HttpTypes } from "@medusajs/types"

type AddressBookProps = {
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
}

const AddressBook: React.FC<AddressBookProps> = ({ customer, region }) => {
  const { addresses } = customer

  const sortedAddresses = [...addresses].sort((a, b) => {
    // Check for native default flag or metadata default flag
    const aIsDefault = a.is_default_shipping || a.metadata?.is_default === "true" || a.metadata?.is_default === true
    const bIsDefault = b.is_default_shipping || b.metadata?.is_default === "true" || b.metadata?.is_default === true

    if (aIsDefault && !bIsDefault) return -1
    if (!aIsDefault && bIsDefault) return 1

    // Secondary sort by date (newest first)
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })
  return (
    <div className="account-address-book">
      <h2 className="account-address-book__title">Shipping Addresses</h2>

      {sortedAddresses.length > 0 ? (
        <div className="account-address-book__list">
          {sortedAddresses.map((address) => {
            return (
              <EditAddress region={region} address={address} key={address.id} />
            )
          })}

          <div className="account-address-book__add">
            <AddAddress region={region} addresses={addresses} />
          </div>
        </div>
      ) : (
        <div
          className="account-address-book__empty"
          data-testid="no-addresses-container"
        >
          <img
            src="/add-location.png"
            alt=""
            className="account-address-book__empty-icon-img"
            width={140}
            height={140}
          />
          <h3 className="account-address-book__empty-title">
            Save your addresses now
          </h3>
          <p className="account-address-book__empty-text">
            Add your home and office addresses and enjoy faster checkout
          </p>
          <AddAddress
            region={region}
            addresses={addresses}
            variant="empty"
          />
        </div>
      )}
    </div>
  )
}

export default AddressBook
