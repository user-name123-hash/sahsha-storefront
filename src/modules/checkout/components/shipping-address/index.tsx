import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import React, { useEffect, useMemo, useRef, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

/** Native mapKeys — removes the lodash dependency from this file. */
function mapKeys<T extends object>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => string
): Record<string, T[keyof T]> {
  return Object.fromEntries(
    (Object.entries(obj) as [keyof T, T[keyof T]][]).map(([k, v]) => [fn(v, k), v])
  )
}

import { loadCSC } from "@lib/util/country-state-city-loader"
import Select from "@modules/common/components/select"
import SplitPhoneInput from "@modules/common/components/split-phone-input"
import { isValidIndianPhone, normalizeIndianPhone, isValidEmail, toFormPhoneValue } from "@core/util/phone"
import {
  CHECKOUT_SYNC_EVENTS,
  dispatchCheckoutSyncEvent,
} from "@core/util/checkout-sync-events"

const normalizePhone = toFormPhoneValue

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  clearForm = false,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  clearForm?: boolean
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.full_name": clearForm ? "" : (cart?.shipping_address?.first_name ? `${cart.shipping_address.first_name} ${cart.shipping_address.last_name === "." ? "" : cart.shipping_address.last_name}`.trim() : ""),
    "shipping_address.first_name": clearForm ? "" : (cart?.shipping_address?.first_name || ""),
    "shipping_address.last_name": clearForm ? "" : (cart?.shipping_address?.last_name || ""),
    "shipping_address.address_1": clearForm ? "" : (cart?.shipping_address?.address_1 || ""),
    "shipping_address.company": clearForm ? "" : (cart?.shipping_address?.company || ""),
    "shipping_address.postal_code": clearForm ? "" : (cart?.shipping_address?.postal_code || ""),
    "shipping_address.city": clearForm ? "" : (cart?.shipping_address?.city || ""),
    "shipping_address.country_code": clearForm ? "" : (cart?.shipping_address?.country_code || ""),
    "shipping_address.province": clearForm ? "" : (cart?.shipping_address?.province || ""),
    "shipping_address.phone": clearForm ? "" : normalizePhone(cart?.shipping_address?.phone),
    email: clearForm ? "" : (cart?.email || ""),
  })

  const countryCodeUpper = (formData["shipping_address.country_code"] || "").toUpperCase()

  // Load state/city data lazily — avoids bundling the 9.2 MB city JSON on initial load.
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
    const province = formData["shipping_address.province"]
    if (!countryCodeUpper || !province) {
      setCityOptions([])
      return
    }
    const selectedStateObj = stateOptions.find((s) => s.value === province)
    if (!selectedStateObj) {
      setCityOptions([])
      return
    }
    loadCSC().then(({ City }) => {
      try {
        const cities = City.getCitiesOfState(countryCodeUpper, selectedStateObj.isoCode)
        const uniqueNames = Array.from(new Set(cities.map((c) => c.name)))
        setCityOptions(uniqueNames.map((name) => ({ value: name, label: name })))
      } catch {
        setCityOptions([])
      }
    })
  }, [countryCodeUpper, formData["shipping_address.province"], stateOptions])

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    address &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        "shipping_address.full_name": address?.first_name ? `${address.first_name} ${address.last_name === "." ? "" : address.last_name}`.trim() : "",
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": normalizePhone(address?.phone),
      }))

    email &&
      setFormData((prevState: Record<string, any>) => ({
        ...prevState,
        email: email,
      }))
  }

  // Unified Sync Watcher: Handles clean-form, cart-sync, and customer-sync with local priority
  useEffect(() => {
    if (clearForm) {
      setFormData({
        "shipping_address.full_name": "",
        "shipping_address.first_name": "",
        "shipping_address.last_name": "",
        "shipping_address.address_1": "",
        "shipping_address.company": "",
        "shipping_address.postal_code": "",
        "shipping_address.city": "",
        "shipping_address.country_code": "",
        "shipping_address.province": "",
        "shipping_address.phone": "",
        email: "",
      })
      return
    }

    if (cart && cart.shipping_address) {
      const shipping = cart.shipping_address
      setFormData((prev: any) => ({
        ...prev,
        email: prev.email || cart.email || "",
        "shipping_address.full_name": prev["shipping_address.full_name"] || (shipping.first_name ? `${shipping.first_name} ${shipping.last_name === "." ? "" : shipping.last_name}`.trim() : ""),
        "shipping_address.first_name": prev["shipping_address.first_name"] || shipping.first_name || "",
        "shipping_address.last_name": prev["shipping_address.last_name"] || shipping.last_name || "",
        "shipping_address.address_1": prev["shipping_address.address_1"] || shipping.address_1 || "",
        "shipping_address.company": prev["shipping_address.company"] || shipping.company || "",
        "shipping_address.postal_code": prev["shipping_address.postal_code"] || shipping.postal_code || "",
        "shipping_address.city": prev["shipping_address.city"] || shipping.city || "",
        "shipping_address.province": prev["shipping_address.province"] || shipping.province || "",
        "shipping_address.phone": prev["shipping_address.phone"] || normalizePhone(shipping.phone),
        "shipping_address.country_code": prev["shipping_address.country_code"] || shipping.country_code || "",
      }))
    }

    if (customer && !formData.email && !formData["shipping_address.first_name"]) {
      setFormData((prev) => ({
        ...prev,
        "shipping_address.full_name": prev["shipping_address.full_name"] || (customer.first_name ? `${customer.first_name} ${customer.last_name === "." ? "" : customer.last_name}`.trim() : ""),
        "shipping_address.first_name": prev["shipping_address.first_name"] || customer.first_name || "",
        "shipping_address.last_name": prev["shipping_address.last_name"] || customer.last_name || "",
        "shipping_address.phone": prev["shipping_address.phone"] || normalizePhone(customer.phone),
        email: prev.email || customer.email || "",
      }))
    }
  }, [cart?.id, cart?.shipping_address?.id, clearForm, customer]) 

  // 1) Pincode-only sync → shipping charge (single API call)
  const lastShippingSyncRef = useRef<string>("")
  // 2) Batched address/contact sync → one debounced call for address + phone + email
  const lastCheckoutSyncRef = useRef<string>("")

  useEffect(() => {
    const pincode = formData["shipping_address.postal_code"]
    if (pincode?.length !== 6) {
      lastShippingSyncRef.current = ""
      return
    }

    const currentShipping = cart?.shipping_address
    const pending = {
      postal_code: pincode.trim(),
      city: (formData["shipping_address.city"] || "").trim(),
      province: (formData["shipping_address.province"] || "").trim(),
    }

    const onCart = {
      postal_code: (currentShipping?.postal_code || "").trim(),
      city: (currentShipping?.city || "").trim(),
      province: (currentShipping?.province || "").trim(),
    }

    const needsSync =
      pending.postal_code !== onCart.postal_code ||
      (pending.city && pending.city !== onCart.city) ||
      (pending.province && pending.province !== onCart.province)

    if (!needsSync) return

    const dispatchKey = JSON.stringify(pending)
    if (lastShippingSyncRef.current === dispatchKey) return

    if ((window as any).shippingSyncTimeout) {
      clearTimeout((window as any).shippingSyncTimeout)
    }

    ;(window as any).shippingSyncTimeout = setTimeout(() => {
      lastShippingSyncRef.current = dispatchKey
      dispatchCheckoutSyncEvent(CHECKOUT_SYNC_EVENTS.SHIPPING_SYNC, {
        postal_code: pincode,
        city: formData["shipping_address.city"],
        province: formData["shipping_address.province"],
      })
    }, 500)
  }, [
    formData["shipping_address.postal_code"],
    formData["shipping_address.city"],
    formData["shipping_address.province"],
    cart?.shipping_address?.postal_code,
    cart?.shipping_address?.city,
    cart?.shipping_address?.province,
  ])

  useEffect(() => {
    const pincode = formData["shipping_address.postal_code"]
    if (pincode?.length !== 6) {
      lastCheckoutSyncRef.current = ""
      return
    }

    const currentShipping = cart?.shipping_address
    const phoneRaw = formData["shipping_address.phone"]
    const normalizedPhone = isValidIndianPhone(phoneRaw)
      ? normalizeIndianPhone(phoneRaw)
      : undefined
    const validEmail = isValidEmail(formData.email) ? formData.email.trim() : undefined
    const address1 = (formData["shipping_address.address_1"] || "").trim()
    const firstName = (formData["shipping_address.first_name"] || "").trim()

    const onCart = {
      address_1: (currentShipping?.address_1 || "").trim(),
      first_name: (currentShipping?.first_name || "").trim(),
      email: (cart?.email || "").trim(),
      phone: normalizeIndianPhone(currentShipping?.phone) || "",
    }

    const addressChanged = address1.length > 0 && address1 !== onCart.address_1
    const phoneChanged = !!normalizedPhone && normalizedPhone !== onCart.phone
    const emailChanged = !!validEmail && validEmail !== onCart.email
    const nameChanged = firstName.length > 0 && firstName !== onCart.first_name
    const formComplete =
      address1.length > 0 && !!normalizedPhone && !!validEmail

    // Only sync when payment-relevant fields change — not name alone
    if (!addressChanged && !phoneChanged && !emailChanged && !nameChanged) return

    const pending = {
      address_1: address1,
      first_name: firstName,
      last_name: (formData["shipping_address.last_name"] || "").trim(),
      email: validEmail || "",
      phone: normalizedPhone || "",
      company: (formData["shipping_address.company"] || "").trim(),
    }

    const dispatchKey = JSON.stringify(pending)
    if (lastCheckoutSyncRef.current === dispatchKey) return

    if ((window as any).checkoutSyncTimeout) {
      clearTimeout((window as any).checkoutSyncTimeout)
    }

    const debounceMs = formComplete ? 400 : 1200

    ;(window as any).checkoutSyncTimeout = setTimeout(() => {
      lastCheckoutSyncRef.current = dispatchKey
      dispatchCheckoutSyncEvent(CHECKOUT_SYNC_EVENTS.CHECKOUT_FIELDS_SYNC, {
        postal_code: pincode,
        city: formData["shipping_address.city"],
        province: formData["shipping_address.province"],
        address_1: address1,
        first_name: firstName,
        last_name: formData["shipping_address.last_name"],
        company: formData["shipping_address.company"],
        email: validEmail || formData.email,
        phone: normalizedPhone || phoneRaw,
      })
    }, debounceMs)
  }, [
    formData["shipping_address.postal_code"],
    formData["shipping_address.address_1"],
    formData["shipping_address.first_name"],
    formData.email,
    formData["shipping_address.phone"],
    cart?.email,
    cart?.shipping_address?.address_1,
    cart?.shipping_address?.phone,
    cart?.shipping_address?.first_name,
  ])

  useEffect(() => {
    const pincode = formData["shipping_address.postal_code"]
    const address1 = (formData["shipping_address.address_1"] || "").trim()
    const phoneOk = isValidIndianPhone(formData["shipping_address.phone"])
    const emailOk = isValidEmail(formData.email)
    const formComplete =
      pincode?.length === 6 && address1.length > 0 && phoneOk && emailOk

    dispatchCheckoutSyncEvent(CHECKOUT_SYNC_EVENTS.CHECKOUT_FORM_READY, {
      ready: formComplete,
    })
  }, [
    formData["shipping_address.postal_code"],
    formData["shipping_address.address_1"],
    formData["shipping_address.phone"],
    formData.email,
  ])

  useEffect(() => {
    const onSyncFailed = (e: Event) => {
      const syncType = (e as CustomEvent).detail?.syncType
      if (syncType === "shipping" || !syncType) {
        lastShippingSyncRef.current = ""
      }
      if (syncType === "checkout" || !syncType) {
        lastCheckoutSyncRef.current = ""
      }
    }
    window.addEventListener("address-sync-failed", onSyncFailed)
    return () => window.removeEventListener("address-sync-failed", onSyncFailed)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let sanitizedValue = value

    // Handle full name specifically
    if (name === "shipping_address.full_name") {
        const [first, ...rest] = value.split(" ")
        const last = rest.join(" ") || "."
        setFormData((prev) => ({
            ...prev,
            [name]: value,
            "shipping_address.first_name": first || "",
            "shipping_address.last_name": last,
        }))
        return
    }

    // Reset province/city when country changes
    if (name === "shipping_address.country_code") {
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
        "shipping_address.province": "",
        "shipping_address.city": "",
      }))
      return
    }

    // Reset city when province changes
    if (name === "shipping_address.province") {
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue,
        "shipping_address.city": "",
      }))
      return
    }

    // 1. Sanitize names and locations
    if (name.includes("first_name") || name.includes("last_name") || name.includes("city") || name.includes("province")) {
      sanitizedValue = value.replace(/[^A-Za-z\s]/g, "")
    }

    // 2. Sanitize pincode
    if (name.includes("postal_code")) {
      sanitizedValue = value.replace(/\D/g, "").slice(0, 6)
    }

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }))

    // 3. Immediate City/State fetch for Pincode
    if (name === "shipping_address.postal_code" && sanitizedValue.length === 6) {
        const fetchLocation = async () => {
          try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${sanitizedValue}`)
            const data = await response.json()
            if (data[0].Status === "Success") {
              const postOffice = data[0].PostOffice[0]
              setFormData((prev) => ({
                ...prev,
                "shipping_address.city": postOffice.District,
                "shipping_address.province": postOffice.State,
              }))
            }
          } catch (e) {}
        }
        fetchLocation()
    }
  }

  const [phoneError, setPhoneError] = useState(false)

  useEffect(() => {
    const handleTrigger = () => {
      setPhoneError(!isValidIndianPhone(formData["shipping_address.phone"]))
    }
    window.addEventListener("trigger-checkout-step", handleTrigger)
    return () => window.removeEventListener("trigger-checkout-step", handleTrigger)
  }, [formData["shipping_address.phone"]])

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Hi ${customer.first_name}, do you want to use one of your saved addresses?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      {/* Full Name */}
      <div className="mb-4">
        <Input
          label="Full name"
          name="shipping_address.full_name"
          id="shipping_full_name_field"
          autoComplete="name"
          value={formData["shipping_address.full_name"]}
          onChange={handleChange}
          required
          maxLength={60}
          data-testid="shipping-full-name-input"
        />
        {/* Hidden inputs to feed Medusa's first/last name fields */}
        <input type="hidden" name="shipping_address.first_name" value={formData["shipping_address.first_name"]} />
        <input type="hidden" name="shipping_address.last_name" value={formData["shipping_address.last_name"]} />
      </div>

      {/* Address */}
      <div className="mb-4">
        <Input
          label="Address"
          name="shipping_address.address_1"
          id="shipping_address_1_field"
          autoComplete="off"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
        />
      </div>

      {/* Postal, City, State Flattened Grid */}
      <div className="grid grid-cols-1 min-[550px]:grid-cols-3 gap-4 mb-4">
        <Input
          label="Postal code*"
          name="shipping_address.postal_code"
          id="shipping_postal_code_field"
          autoComplete="off"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          maxLength={formData["shipping_address.country_code"] === "in" ? 6 : 10}
          data-testid="shipping-postal-code-input"
        />
        {cityOptions.length > 0 ? (
          <Select
            label="City*"
            name="shipping_address.city"
            id="shipping_city_field"
            value={formData["shipping_address.city"]}
            onChange={handleChange}
            required
            options={cityOptions}
            data-testid="shipping-city-input"
          />
        ) : (
          <Input
            label="City*"
            name="shipping_address.city"
            id="shipping_city_field"
            autoComplete="off"
            value={formData["shipping_address.city"]}
            onChange={handleChange}
            required
            data-testid="shipping-city-input"
          />
        )}
        {stateOptions.length > 0 ? (
          <Select
            label="State / Province*"
            name="shipping_address.province"
            id="shipping_province_field"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            required
            options={stateOptions}
            data-testid="shipping-province-input"
          />
        ) : (
          <Input
            label="State / Province*"
            name="shipping_address.province"
            id="shipping_province_field"
            autoComplete="off"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            maxLength={30}
            data-testid="shipping-province-input"
          />
        )}
      </div>

      {/* Country Select */}
      <div className="mb-4">
        <CountrySelect
          name="shipping_address.country_code"
          id="shipping_country_code_field"
          autoComplete="off"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
        />
      </div>
      <div className="my-6 min-[550px]:my-8">
        <Checkbox
          label="Billing address same as shipping address"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
      </div>
      {/* Email and Phone at bottom left - Single column for 340px-550px */}
      <div className="grid grid-cols-1 min-[550px]:grid-cols-2 gap-4 mb-4 mt-4">
        <Input
          label="Email"
          name="email"
          id="shipping_email_field"
          type="email"
          title="Enter a valid email address."
          autoComplete="off"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <div className="relative w-full" suppressHydrationWarning>
          <SplitPhoneInput
            value={formData["shipping_address.phone"]}
            onChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                "shipping_address.phone": value,
              }))
              if (isValidIndianPhone(value)) {
                setPhoneError(false)
              }
            }}
            label="Phone"
            required
            error={phoneError}
            numberInputId="shipping_phone_field"
            hiddenInputId="shipping_phone_field_internal"
            hiddenInputName="shipping_address.phone"
            data-testid="shipping-phone-input"
          />
        </div>
      </div>
    </>
  )
}

export default ShippingAddress
