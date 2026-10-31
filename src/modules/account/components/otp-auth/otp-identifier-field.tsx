"use client"

import Envelope from "@modules/common/icons/envelope"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import { type IdentifierMethod } from "./use-otp-auth"

type OtpIdentifierFieldProps = {
  identifier: string
  onChange: (value: string) => void
  identifierMethod: IdentifierMethod
  emailPlaceholder?: string
  phoneContainerClassName?: string
  autoFocus?: boolean
}

const OtpIdentifierField = ({
  identifier,
  onChange,
  identifierMethod,
  emailPlaceholder = "Enter Email Address",
  phoneContainerClassName = "phone-input-login",
  autoFocus = true,
}: OtpIdentifierFieldProps) => {
  if (identifierMethod === "phone") {
    return (
      <div
        className={`otp-identifier-field ${phoneContainerClassName} relative group`}
      >
        <PhoneInput
          country="in"
          value={identifier}
          onChange={onChange}
          inputProps={{ required: true, autoFocus }}
          placeholder="Enter Mobile Number"
          containerStyle={{ width: "100%" }}
        />
      </div>
    )
  }

  return (
    <div className="otp-identifier-field relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-brand-accent">
        <Envelope size="20" />
      </div>
      <input
        type="email"
        value={identifier}
        placeholder={emailPlaceholder}
        required
        autoFocus={autoFocus}
        autoComplete="email"
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      />
    </div>
  )
}

export default OtpIdentifierField
