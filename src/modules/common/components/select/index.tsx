import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import React, { useState, useRef, useEffect } from "react"

type SelectProps = {
  label: string
  name: string
  value: string
  onChange: (e: any) => void
  options: { value: string; label: string }[]
  required?: boolean
  id?: string
  "data-testid"?: string
}

const Select: React.FC<SelectProps> = ({
  name,
  label,
  value,
  onChange,
  options,
  required,
  id,
  "data-testid": dataTestId,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(value || "")
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync internal query state with value prop
  useEffect(() => {
    setQuery(value || "")
  }, [value])

  // Filter options based on query
  const filteredOptions =
    query === ""
      ? options
      : options.filter((opt) =>
          opt.label.toLowerCase().includes(query.toLowerCase())
        )

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    setIsOpen(true)
    onChange({
      target: {
        name,
        value: val,
      },
    })
  }

  const handleSelectOption = (optValue: string, optLabel: string) => {
    setQuery(optLabel)
    setIsOpen(false)
    onChange({
      target: {
        name,
        value: optValue,
      },
    })
  }

  const hasValue = query !== ""

  return (
    <div className="flex flex-col w-full relative" ref={containerRef}>
      <div className="flex relative z-0 w-full txt-compact-medium overflow-visible">
        <input
          type="text"
          id={id || name}
          name={name}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          required={required}
          autoComplete="off"
          placeholder=" "
          data-testid={dataTestId}
          className="peer pt-6 pb-2 block w-full h-12 px-4 pr-10 mt-0 bg-white border border-[var(--color-border)] rounded-md appearance-none focus:outline-none focus:border-brand-accent focus:ring-0 hover:bg-surface-muted transition-colors duration-200 antialiased"
        />

        {label && (
          <label
            htmlFor={id || name}
            className={clx(
              "flex items-center justify-center absolute left-4 px-1 transition-all duration-300 top-1/2 -translate-y-1/2 origin-0 text-muted pointer-events-none peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-brand-accent peer-focus:z-10",
              {
                "top-2 translate-y-0 text-[11px] z-10": hasValue,
              }
            )}
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-4 inset-y-0 flex items-center text-muted hover:text-brand-accent transition-colors"
        >
          <ChevronUpDown />
        </button>
      </div>

      {/* Dropdown Options List */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute left-0 right-0 top-14 z-[100] max-h-60 overflow-y-auto bg-white border border-[var(--color-border)] rounded-lg shadow-md py-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[var(--color-border)] [&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectOption(opt.value, opt.label)}
              className={clx(
                "w-full text-left px-4 py-2 text-sm text-body hover:bg-brand-accent-muted hover:text-brand-accent transition-colors flex items-center justify-between",
                {
                  "bg-brand-accent-muted text-brand-accent font-medium": value === opt.value,
                }
              )}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <svg
                  className="w-4 h-4 text-brand-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Select
