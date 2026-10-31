import { Label } from "@medusajs/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, name, label, touched, required, topLabel, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)

    useEffect(() => {
      if (type === "password" && showPassword) {
        setInputType("text")
      }

      if (type === "password" && !showPassword) {
        setInputType("password")
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        {topLabel && (
          <Label className="mb-2 txt-compact-medium-plus">{topLabel}</Label>
        )}
        <div className="flex relative z-0 w-full txt-compact-medium overflow-visible">
          <input
            type={inputType}
            name={name}
            placeholder=" "
            required={required}
            className="peer pt-6 pb-2 block w-full h-12 px-4 mt-0 bg-white border rounded-md appearance-none focus:outline-none focus:border-[#8B5AB1] focus:ring-0 hover:bg-gray-50 transition-colors duration-200 antialiased"
            style={{ borderColor: '#C0C0C0' }}
            {...props}
            ref={inputRef}
          />
          {label && (
            <label
              htmlFor={name}
              onClick={() => inputRef.current?.focus()}
              className="flex items-center justify-center absolute left-4 px-1 transition-all duration-300 top-1/2 -translate-y-1/2 origin-0 text-ui-fg-subtle pointer-events-none peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-[#8B5AB1] peer-focus:z-10 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:z-10"
            >
              {label}
              {required && <span className="text-rose-500">*</span>}
            </label>
          )}
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-ui-fg-subtle px-4 focus:outline-none transition-all duration-150 outline-none focus:text-ui-fg-base absolute right-0 top-3"
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
