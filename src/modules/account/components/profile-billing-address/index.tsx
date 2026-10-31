"use client"

import React, { useEffect, useMemo, useActionState, useState, useRef } from "react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { addCustomerAddress, updateCustomerAddress } from "@core/data/customer"
import { loadCSC } from "@lib/util/country-state-city-loader"
import Select from "@modules/common/components/select"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
  regions: HttpTypes.StoreRegion[]
}

const ProfileBillingAddress: React.FC<MyInformationProps> = ({
  customer,
  regions,
}) => {
  const regionOptions = useMemo(() => {
    return (
      regions
        ?.map((region) => {
          return region.countries?.map((country) => ({
            value: country.iso_2,
            label: country.display_name,
          }))
        })
        .flat() || []
    )
  }, [regions])

  const [successState, setSuccessState] = useState(false)

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  const initialState: Record<string, any> = {
    isDefaultBilling: true,
    isDefaultShipping: false,
    error: false,
    success: false,
  }

  if (billingAddress) {
    initialState.addressId = billingAddress.id
  }

  const [state, formAction] = useActionState(
    billingAddress ? updateCustomerAddress : addCustomerAddress,
    initialState
  )

  // --- Controlled form state ---
  const [formData, setFormData] = useState({
    full_name: billingAddress?.first_name
      ? `${billingAddress.first_name} ${billingAddress.last_name === "." ? "" : billingAddress.last_name}`.trim()
      : customer?.first_name
      ? `${customer.first_name} ${customer.last_name === "." ? "" : customer.last_name}`.trim()
      : "",
    first_name: billingAddress?.first_name || customer?.first_name || "",
    last_name: billingAddress?.last_name || customer?.last_name || "",
    company: billingAddress?.company || "",
    phone: billingAddress?.phone || customer?.phone || "",
    address_1: billingAddress?.address_1 || "",
    address_2: billingAddress?.address_2 || "",
    postal_code: billingAddress?.postal_code || "",
    city: billingAddress?.city || "",
    province: billingAddress?.province || "",
    country_code: billingAddress?.country_code || "",
  })

  const countryCodeUpper = (formData.country_code || "").toUpperCase()

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
    if (!countryCodeUpper || !formData.province) {
      setCityOptions([])
      return
    }
    const selectedStateObj = stateOptions.find(
      (s) => s.value === formData.province
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
  }, [countryCodeUpper, formData.province, stateOptions])


  const [stateSearchOpen, setStateSearchOpen] = useState(false)
  const [citySearchOpen, setCitySearchOpen] = useState(false)
  const stateContainerRef = useRef<HTMLDivElement>(null)
  const cityContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stateContainerRef.current && !stateContainerRef.current.contains(event.target as Node)) {
        setStateSearchOpen(false)
      }
      if (cityContainerRef.current && !cityContainerRef.current.contains(event.target as Node)) {
        setCitySearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Sync customer name if not already set
  useEffect(() => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        full_name:
          prev.full_name && prev.full_name.trim() !== ""
            ? prev.full_name
            : customer.first_name
            ? `${customer.first_name} ${customer.last_name === "." ? "" : customer.last_name}`.trim()
            : "",
        first_name: prev.first_name || customer.first_name || "",
        last_name: prev.last_name || customer.last_name || "",
        phone: prev.phone || customer.phone || "",
      }))
    }
  }, [customer])

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  const clearState = () => {
    setSuccessState(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === "full_name") {
      const [first, ...rest] = value.split(" ")
      const last = rest.join(" ") || "."
      setFormData((prev) => ({ ...prev, full_name: value, first_name: first || "", last_name: last }))
      return
    }

    if (name === "country_code") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        province: "",
        city: "",
      }))
      return
    }

    if (name === "province") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        city: "",
      }))
      return
    }

    let sanitizedValue = value
    if (name === "postal_code") {
      sanitizedValue = value.replace(/\D/g, "").slice(0, 6)
    } else if (name === "city" || name === "province") {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, "")
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }))

    // Auto-fill City & State from Indian pincode
    if (name === "postal_code" && sanitizedValue.length === 6) {
      const fetchLocation = async () => {
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${sanitizedValue}`)
          const data = await response.json()
          if (data[0].Status === "Success") {
            const postOffice = data[0].PostOffice[0]
            setFormData((prev) => ({
              ...prev,
              city: postOffice.District,
              province: postOffice.State,
            }))
          }
        } catch (e) {}
      }
      fetchLocation()
    }
  }

  const currentInfo = useMemo(() => {
    if (!billingAddress) {
      return "No billing address"
    }

    const country =
      regionOptions?.find(
        (country) => country?.value === billingAddress.country_code
      )?.label || billingAddress.country_code?.toUpperCase()

    return (
      <div className="account-profile-billing__details" data-testid="current-info">
        <span className="account-profile-billing__name">
          {billingAddress.first_name} {billingAddress.last_name}
        </span>
        {billingAddress.phone && <span>{billingAddress.phone}</span>}
        {billingAddress.company && <span>{billingAddress.company}</span>}
        <span>
          {billingAddress.address_1}
          {billingAddress.address_2 ? `, ${billingAddress.address_2}` : ""}
        </span>
        <span>
          {billingAddress.postal_code}, {billingAddress.city}
        </span>
        <span>{country}</span>
      </div>
    )
  }, [billingAddress, regionOptions])

  return (
    <form action={formAction} onReset={() => clearState()} className="w-full">
      <input type="hidden" name="addressId" value={billingAddress?.id || ""} />
      <input type="hidden" name="first_name" value={formData.first_name} />
      <input type="hidden" name="last_name" value={formData.last_name} />
      <AccountInfo
        label="Billing address"
        currentInfo={currentInfo}
        isSuccess={successState}
        isError={!!state.error}
        clearState={clearState}
        data-testid="account-billing-address-editor"
      >
        <div className="account-profile-billing__fields">
          {/* Full Name */}
          <div className="account-profile-form__field">
            <label className="account-profile-form__label">Full name<span className="account-profile-form__required">*</span></label>
            <input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="account-profile-form__input"
              data-testid="billing-full-name-input"
            />
          </div>

          {/* Phone */}
           <div className="account-profile-form__field">
            <label className="account-profile-form__label">Phone</label>
            <div className="account-profile-form__phone account-profile-form__phone--plain">
              <PhoneInput
                country={"in"}
                value={formData.phone}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, phone: `+${value}` }));
                }}
                inputStyle={{
                  width: "100%",
                  height: "46px",
                  fontSize: "14px",
                  paddingLeft: "52px",
                  borderRadius: "0",
                  border: "1px solid #e5e5e5",
                  backgroundColor: "#ffffff",
                  transition: "all 0.2s",
                  color: "#1a1a1a"
                }}
                buttonStyle={{
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "0",
                  paddingLeft: "8px"
                }}
                containerStyle={{
                  width: "100%",
                  height: "46px"
                }}
                dropdownStyle={{
                  width: "280px",
                  borderRadius: "0",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}
              />
            </div>
          </div>

          {/* Address */}
          <div className="account-profile-form__field">
            <label className="account-profile-form__label">Address<span className="account-profile-form__required">*</span></label>
            <input
              name="address_1"
              value={formData.address_1}
              onChange={handleChange}
              required
              className="account-profile-form__input"
              data-testid="billing-address-1-input"
            />
          </div>

          {/* Postal Code, City, State */}
          <div className="account-profile-form__grid account-profile-form__grid--triple">
            <div className="account-profile-form__field">
              <label className="account-profile-form__label">Postal code<span className="account-profile-form__required">*</span></label>
              <input
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                required
                maxLength={6}
                className="account-profile-form__input"
                data-testid="billing-postcal-code-input"
              />
            </div>
            <div className="account-profile-form__field" ref={cityContainerRef}>
              <label className="account-profile-form__label">City<span className="account-profile-form__required">*</span></label>
              <div className="account-profile-form__select-wrap">
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  onFocus={() => setCitySearchOpen(true)}
                  autoComplete="off"
                  className="account-profile-form__input account-profile-form__input--select"
                  data-testid="billing-city-input"
                />
                <span className="account-profile-form__select-icon" aria-hidden="true">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </span>
                
                {citySearchOpen && cityOptions.length > 0 && (
                  <div className="account-profile-form__dropdown">
                    {cityOptions
                      .filter(opt => opt.label.toLowerCase().includes((formData.city || "").toLowerCase()))
                      .map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            handleChange({ target: { name: "city", value: opt.value } } as any)
                            setCitySearchOpen(false)
                          }}
                          className="account-profile-form__dropdown-item"
                        >
                          {opt.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div className="account-profile-form__field" ref={stateContainerRef}>
              <label className="account-profile-form__label">Province</label>
              <div className="account-profile-form__select-wrap">
                <input
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  onFocus={() => setStateSearchOpen(true)}
                  autoComplete="off"
                  className="account-profile-form__input account-profile-form__input--select"
                  data-testid="billing-province-input"
                />
                <span className="account-profile-form__select-icon" aria-hidden="true">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </span>

                {stateSearchOpen && stateOptions.length > 0 && (
                  <div className="account-profile-form__dropdown">
                    {stateOptions
                      .filter(opt => opt.label.toLowerCase().includes((formData.province || "").toLowerCase()))
                      .map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            handleChange({ target: { name: "province", value: opt.value } } as any)
                            setStateSearchOpen(false)
                          }}
                          className="account-profile-form__dropdown-item"
                        >
                          {opt.label}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Country */}
          <div className="account-profile-form__field">
            <label className="account-profile-form__label">Country<span className="account-profile-form__required">*</span></label>
            <NativeSelect
              name="country_code"
              value={formData.country_code}
              onChange={handleChange}
              required
              className="account-profile-form__select-native"
              data-testid="billing-country-code-select"
            >
              <option value="">-</option>
              {regionOptions.map((option, i) => (
                <option key={i} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileBillingAddress
