"use client"

import { HttpTypes } from "@medusajs/types"
import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { clx } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import CountrySelect from "../country-select"
import Checkbox from "@modules/common/components/checkbox"
import SplitPhoneInput from "@modules/common/components/split-phone-input"
import { isValidIndianPhone, toFormPhoneValue } from "@core/util/phone"

import { useModal } from "@core/context/modal-context"

type AddAddressModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (formData: FormData) => void
  cart: HttpTypes.StoreCart | null
  editingAddress?: HttpTypes.StoreCustomerAddress | null
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cart,
  editingAddress,
}) => {
  const { setIsModalOpen } = useModal()
  const [addressType, setAddressType] = useState<"HOME" | "OFFICE">(
    (editingAddress?.metadata?.address_type as "HOME" | "OFFICE") || "HOME"
  )
  const [isDefault, setIsDefault] = useState(
    editingAddress?.is_default_shipping ||
    editingAddress?.metadata?.is_default === "true" ||
    editingAddress?.metadata?.is_default === true ||
    false
  )

  const [fullName, setFullName] = useState(editingAddress?.first_name || "")
  const [phone, setPhone] = useState(toFormPhoneValue(editingAddress?.phone))
  const [postalCode, setPostalCode] = useState(editingAddress?.postal_code || "")
  const [city, setCity] = useState(editingAddress?.city || "")
  const [province, setProvince] = useState(editingAddress?.province || "")
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6)
    setPostalCode(val)

    if (val.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${val}`)
        const data = await response.json()
        if (data[0].Status === "Success") {
          const postOffice = data[0].PostOffice[0]
          setCity(postOffice.District)
          setProvince(postOffice.State)
        }
      } catch (error) {
        // Silence error
      }
    }
  }

  const handleTextOnlyChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^A-Za-z\s]/g, "")
    setter(val)
  }

  React.useEffect(() => {
    setIsModalOpen(isOpen)
    if (isOpen) {
      document.documentElement.style.overflow = "hidden"
      document.body.style.overflow = "hidden"
      document.documentElement.classList.add("checkout-modal-open")
      document.body.classList.add("checkout-modal-open")
      setAddressType((editingAddress?.metadata?.address_type as "HOME" | "OFFICE") || "HOME")
      setIsDefault(
        editingAddress?.is_default_shipping ||
        editingAddress?.metadata?.is_default === "true" ||
        editingAddress?.metadata?.is_default === true ||
        false
      )
      setPostalCode(editingAddress?.postal_code || "")
      setCity(editingAddress?.city || "")
      setProvince(editingAddress?.province || "")
      setFullName(editingAddress?.first_name || "")
      setPhone(toFormPhoneValue(editingAddress?.phone))
    } else {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
      document.documentElement.classList.remove("checkout-modal-open")
      document.body.classList.remove("checkout-modal-open")
      setPhoneError(null)
    }
    return () => {
      document.documentElement.style.overflow = ""
      document.body.style.overflow = ""
      document.documentElement.classList.remove("checkout-modal-open")
      document.body.classList.remove("checkout-modal-open")
    }
  }, [isOpen, setIsModalOpen, editingAddress])

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div
      className="checkout-page__modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="checkout-page__modal checkout-page__modal--address">
        <div className="checkout-page__modal-header">
          <h2 className="checkout-page__modal-title">
            {editingAddress ? "Edit Address" : "Add New Address"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="checkout-page__modal-close"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          action={(formData) => {
            const digits = phone.replace(/\D/g, "")
            if (!isValidIndianPhone(phone)) {
              setPhoneError("Please enter a valid 10-digit mobile number")
              return
            }

            formData.append("address_type", addressType)
            formData.append("is_default", isDefault ? "true" : "false")
            formData.append("email", cart?.email || "")
            formData.append("same_as_billing", "on")
            formData.set("shipping_address.phone", phone)
            if (editingAddress?.id) {
              formData.append("address_id", editingAddress.id)
            }
            onSave(formData)
            onClose()
          }}
          className="checkout-page__modal-form"
        >
          <div className="checkout-page__modal-body">
            <div className="checkout-page__modal-section checkout-page__modal-section--contact">
              <h3 className="checkout-page__modal-section-title">
                <span className="checkout-page__modal-section-bar" />
                Contact Details
              </h3>
              <div className="checkout-page__modal-contact-grid">
                <div className="checkout-page__modal-field">
                  <label className="checkout-page__field-label">
                    Full Name<span className="checkout-page__required">*</span>
                  </label>
                  <Input
                    label=""
                    name="shipping_address.first_name"
                    value={fullName}
                    onChange={handleTextOnlyChange(setFullName)}
                    required
                  />
                </div>
                <div className="checkout-page__modal-field checkout-page__modal-field--phone">
                  <label className="checkout-page__field-label">
                    Mobile No<span className="checkout-page__required">*</span>
                  </label>
                  <SplitPhoneInput
                    value={phone}
                    onChange={(value) => {
                      setPhone(value)
                      if (isValidIndianPhone(value)) {
                        setPhoneError(null)
                      }
                    }}
                    label=""
                    required
                    error={!!phoneError}
                    errorMessage={phoneError || "Please enter a valid 10-digit mobile number"}
                    hiddenInputName="shipping_address.phone"
                    data-testid="add-address-phone-input"
                  />
                </div>
              </div>
            </div>

            <div className="checkout-page__modal-section">
              <h3 className="checkout-page__modal-section-title">
                <span className="checkout-page__modal-section-bar" />
                Address Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="checkout-page__field-label">
                    Pin Code<span className="checkout-page__required">*</span>
                  </label>
                  <Input
                    label=""
                    name="shipping_address.postal_code"
                    value={postalCode}
                    onChange={handlePincodeChange}
                    required
                  />
                </div>

                <div>
                  <label className="checkout-page__field-label">
                    Address (locality, building, street)
                    <span className="checkout-page__required">*</span>
                  </label>
                  <Input
                    label=""
                    name="shipping_address.address_1"
                    defaultValue={editingAddress?.address_1 || ""}
                    required
                  />
                </div>
                <div>
                  <label className="checkout-page__field-label">
                    Locality / Town<span className="checkout-page__required">*</span>
                  </label>
                  <Input
                    label=""
                    name="shipping_address.city"
                    value={city}
                    onChange={handleTextOnlyChange(setCity)}
                    required
                  />
                </div>
                <div className="checkout-page__modal-grid">
                  <div>
                    <label className="checkout-page__field-label">Country</label>
                    <CountrySelect
                      name="shipping_address.country_code"
                      region={cart?.region}
                      defaultValue={editingAddress?.country_code || undefined}
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="checkout-page__field-label">
                      State<span className="checkout-page__required">*</span>
                    </label>
                    <Input
                      label=""
                      name="shipping_address.province"
                      value={province}
                      onChange={handleTextOnlyChange(setProvince)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="checkout-page__modal-section">
              <h3 className="checkout-page__modal-section-title">
                <span className="checkout-page__modal-section-bar" />
                Address Type
              </h3>
              <div className="checkout-page__radio-group">
                <label className="checkout-page__radio-option">
                  <input
                    type="radio"
                    name="address_type"
                    value="HOME"
                    checked={addressType === "HOME"}
                    onChange={() => setAddressType("HOME")}
                    className="sr-only"
                  />
                  <div
                    className={clx(
                      "checkout-page__radio-circle",
                      addressType === "HOME" && "checkout-page__radio-circle--selected"
                    )}
                  >
                    {addressType === "HOME" && (
                      <div className="checkout-page__radio-circle-dot" />
                    )}
                  </div>
                  <span>Home</span>
                </label>
                <label className="checkout-page__radio-option">
                  <input
                    type="radio"
                    name="address_type"
                    value="OFFICE"
                    checked={addressType === "OFFICE"}
                    onChange={() => setAddressType("OFFICE")}
                    className="sr-only"
                  />
                  <div
                    className={clx(
                      "checkout-page__radio-circle",
                      addressType === "OFFICE" && "checkout-page__radio-circle--selected"
                    )}
                  >
                    {addressType === "OFFICE" && (
                      <div className="checkout-page__radio-circle-dot" />
                    )}
                  </div>
                  <span>Office</span>
                </label>
              </div>
            </div>

            <div className="checkout-page__modal-section checkout-page__modal-section--flat">
              <Checkbox
                label="Make this as my default address"
                name="is_default"
                checked={isDefault}
                onChange={() => setIsDefault(!isDefault)}
              />
            </div>
          </div>

          <div className="checkout-page__modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="checkout-page__btn checkout-page__btn--outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="checkout-page__btn checkout-page__btn--primary flex-1"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default AddAddressModal
