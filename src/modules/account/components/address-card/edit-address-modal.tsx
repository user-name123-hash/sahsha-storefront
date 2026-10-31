"use client"

import React, { useEffect, useState, useActionState, useMemo } from "react"
import { clx } from "@medusajs/ui"

import useToggleState from "@core/hooks/use-toggle-state"
import CountrySelect from "@modules/checkout/components/country-select"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import Spinner from "@modules/common/icons/spinner"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { HttpTypes } from "@medusajs/types"
import { updateCustomerAddress } from "@core/data/customer"
import { loadCSC } from "@lib/util/country-state-city-loader"
import Select from "@modules/common/components/select"
import SplitPhoneInput from "@modules/common/components/split-phone-input"
import { isValidIndianPhone, toFormPhoneValue } from "@core/util/phone"
import {
  deleteCustomerAddress,
  setDefaultAddress,
} from "@core/data/customer"

type EditAddressProps = {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
  isActive?: boolean
}

const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address,
  isActive = false,
}) => {
  const [removing, setRemoving] = useState(false)
  const [settingDefault, setSettingDefault] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [fullName, setFullName] = useState(address.first_name ? `${address.first_name} ${address.last_name === "." ? "" : address.last_name}`.trim() : "")
  const [firstName, setFirstName] = useState(address.first_name || "")
  const [lastName, setLastName] = useState(address.last_name || "")
  const [postalCode, setPostalCode] = useState(address.postal_code || "")
  const [city, setCity] = useState(address.city || "")
  const [province, setProvince] = useState(address.province || "")
  const [phone, setPhone] = useState(toFormPhoneValue(address.phone))
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [countryCode, setCountryCode] = useState(address.country_code || "")

  const countryCodeUpper = (countryCode || "").toUpperCase()

  const [stateOptions, setStateOptions] = useState<
    { value: string; label: string; isoCode: string }[]
  >([])
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    if (!countryCodeUpper) {
      setStateOptions([])
      return
    }
    loadCSC().then(({ State }) => {
      try {
        setStateOptions(
          State.getStatesOfCountry(countryCodeUpper).map((s) => ({
            value: s.name,
            label: s.name,
            isoCode: s.isoCode,
          }))
        )
      } catch {
        setStateOptions([])
      }
    })
  }, [countryCodeUpper])

  useEffect(() => {
    if (!countryCodeUpper || !province) {
      setCityOptions([])
      return
    }
    const selectedStateObj = stateOptions.find(
      (s) => s.value === province
    )
    if (!selectedStateObj) {
      setCityOptions([])
      return
    }
    loadCSC().then(({ City }) => {
      try {
        const cities = City.getCitiesOfState(countryCodeUpper, selectedStateObj.isoCode)
        const uniqueNames = Array.from(new Set(cities.map((c) => c.name)))
        setCityOptions(
          uniqueNames.map((name) => ({
            value: name,
            label: name,
          }))
        )
      } catch {
        setCityOptions([])
      }
    })
  }, [countryCodeUpper, province, stateOptions])

  const [formState, formAction] = useActionState(updateCustomerAddress, {
    success: false,
    error: null,
    addressId: address.id,
  })

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10)
    setPhone(val)
  }

  const handleTextOnlyChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^A-Za-z\s]/g, "")
    setter(val)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!isValidIndianPhone(phone)) {
      e.preventDefault()
      setPhoneError("Please enter a valid 10-digit phone number.")
      return
    }
    setPhoneError(null)
  }

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  const removeAddress = async () => {
    setRemoving(true)
    await deleteCustomerAddress(address.id)
    setRemoving(false)
  }

  const handleSetDefault = async () => {
    setSettingDefault(true)
    await setDefaultAddress(address.id)
    setSettingDefault(false)
  }

  return (
    <>
      <div
        className={clx("account-address-card", {
          "account-address-card--default": isActive || address.is_default_shipping,
        })}
        data-testid="address-container"
      >
        <div className="account-address-card__content">
          <div className="account-address-card__header">
            <div className="account-address-card__identity">
              <h3 className="account-address-card__name" data-testid="address-name">
                {address.first_name} {address.last_name}
              </h3>
            </div>
            <div className="account-address-card__badges">
              {address.is_default_shipping && (
                <span className="account-address-card__badge account-address-card__badge--default">
                  Default
                </span>
              )}
              <span className="account-address-card__badge account-address-card__badge--type">
                {String(address.metadata?.address_type || "HOME")}
              </span>
            </div>
          </div>

          <div className="account-address-card__body">
            <p className="account-address-card__text">
              {address.address_1}
            </p>
            <p className="account-address-card__text account-address-card__text--muted">
              {[address.city, address.province, address.postal_code]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p className="account-address-card__mobile">
              <span className="account-address-card__mobile-label">Mobile</span>
              <span className="account-address-card__mobile-value">{address.phone}</span>
            </p>
          </div>
        </div>

        <div className="account-address-card__actions">
          <button
            type="button"
            className="account-address-card__btn account-address-card__btn--edit"
            onClick={open}
            data-testid="address-edit-button"
          >
            Edit
          </button>

          {!address.is_default_shipping && (
            <button
              type="button"
              className="account-address-card__btn account-address-card__btn--default"
              onClick={handleSetDefault}
              disabled={settingDefault}
              data-testid="address-default-button"
            >
              {settingDefault && <Spinner className="animate-spin mr-2" />}
              Set as Default
            </button>
          )}

          <button
            type="button"
            className="account-address-card__btn account-address-card__btn--remove"
            onClick={removeAddress}
            data-testid="address-delete-button"
            disabled={removing}
          >
            {removing && <Spinner className="animate-spin mr-2" />}
            Remove
          </button>
        </div>
      </div>

      <Modal isOpen={state} close={close} data-testid="edit-address-modal" size="xsmall">
        <div className="checkout-page__modal checkout-page__modal--address">
          <div className="checkout-page__modal-header">
            <h2 className="checkout-page__modal-title">Edit Address</h2>
            <button
              type="button"
              onClick={close}
              className="checkout-page__modal-close"
              aria-label="Close"
              data-testid="close-modal-button"
            >
              ×
            </button>
          </div>

          <form
            action={formAction}
            onSubmit={handleSubmit}
            className="checkout-page__modal-form"
          >
            <input type="hidden" name="addressId" value={address.id} />
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
                      name="full_name"
                      required
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => {
                        const val = e.target.value
                        setFullName(val)
                        const [first, ...rest] = val.split(" ")
                        setFirstName(first || "")
                        setLastName(rest.join(" ") || ".")
                      }}
                      data-testid="full-name-input"
                    />
                    <input type="hidden" name="first_name" value={firstName} />
                    <input type="hidden" name="last_name" value={lastName} />
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
                      hiddenInputName="phone"
                      data-testid="edit-address-phone-input"
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
                      name="postal_code"
                      required
                      autoComplete="postal-code"
                      data-testid="postal-code-input"
                      value={postalCode}
                      onChange={handlePincodeChange}
                    />
                  </div>
                  <div>
                    <label className="checkout-page__field-label">
                      Address (locality, building, street)
                      <span className="checkout-page__required">*</span>
                    </label>
                    <Input
                      label=""
                      name="address_1"
                      required
                      autoComplete="address-line1"
                      defaultValue={address.address_1 || undefined}
                      data-testid="address-1-input"
                    />
                  </div>
                  <div>
                    <label className="checkout-page__field-label">
                      Locality / Town<span className="checkout-page__required">*</span>
                    </label>
                    {cityOptions.length > 0 ? (
                      <Select
                        label=""
                        name="city"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        options={cityOptions}
                        data-testid="city-input"
                      />
                    ) : (
                      <Input
                        label=""
                        name="city"
                        required
                        autoComplete="locality"
                        data-testid="city-input"
                        value={city}
                        onChange={handleTextOnlyChange(setCity)}
                      />
                    )}
                  </div>
                  <div className="checkout-page__modal-grid">
                    <div>
                      <label className="checkout-page__field-label">Country</label>
                      <CountrySelect
                        name="country_code"
                        region={region}
                        required
                        autoComplete="country"
                        value={countryCode}
                        onChange={(e) => {
                          setCountryCode(e.target.value)
                          setProvince("")
                          setCity("")
                        }}
                        data-testid="country-select"
                      />
                    </div>
                    <div>
                      <label className="checkout-page__field-label">
                        State<span className="checkout-page__required">*</span>
                      </label>
                      {stateOptions.length > 0 ? (
                        <Select
                          label=""
                          name="province"
                          required
                          value={province}
                          onChange={(e) => {
                            setProvince(e.target.value)
                            setCity("")
                          }}
                          options={stateOptions}
                          data-testid="state-input"
                        />
                      ) : (
                        <Input
                          label=""
                          name="province"
                          autoComplete="address-level1"
                          data-testid="state-input"
                          value={province}
                          onChange={handleTextOnlyChange(setProvince)}
                        />
                      )}
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
                      defaultChecked={(address.metadata?.address_type as string) !== "OFFICE"}
                      className="sr-only"
                    />
                    <span>Home</span>
                  </label>
                  <label className="checkout-page__radio-option">
                    <input
                      type="radio"
                      name="address_type"
                      value="OFFICE"
                      defaultChecked={(address.metadata?.address_type as string) === "OFFICE"}
                      className="sr-only"
                    />
                    <span>Office</span>
                  </label>
                </div>
              </div>

              {formState.error && (
                <div className="checkout-page__field-error" data-testid="address-error">
                  {formState.error}
                </div>
              )}
            </div>

            <div className="checkout-page__modal-footer">
              <button
                type="reset"
                onClick={close}
                className="checkout-page__btn checkout-page__btn--outline flex-1"
                data-testid="cancel-button"
              >
                Cancel
              </button>
              <SubmitButton
                data-testid="save-button"
                className="checkout-page__btn checkout-page__btn--primary flex-1"
              >
                Update Address
              </SubmitButton>
            </div>
          </form>
        </div>
      </Modal>
    </>
  )
}

export default EditAddress
