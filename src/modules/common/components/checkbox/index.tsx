import { Label } from "@medusajs/ui"
import React from "react"
import Color from "color"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  color?: string
  hex?: string
  'data-testid'?: string
  'data-ga-event'?: string
  'data-ga-label'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  color,
  hex,
  'data-testid': dataTestId,
  'data-ga-event': dataGaEvent,
  'data-ga-label': dataGaLabel
}) => {
  const colorHex = React.useMemo(() => {
    if (hex) return hex
    if (!color) return null

    try {
      // Try parsing the original color name (handles things like "darkgreen")
      return Color(color.toLowerCase().replace(/\s+/g, '')).hex()
    } catch (e) {
      try {
        // Try parsing without modification (handles things like "rgb(0,0,0)")
        return Color(color).hex()
      } catch (e2) {
        // Final fallback to the color string itself (might be a valid CSS name or hex already)
        return color
      }
    }
  }, [hex, color])

  return (
    <div className="flex items-center space-x-2 px-1 py-0.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onChange}
        name={name}
        data-testid={dataTestId}
        data-ga-event={dataGaEvent}
        data-ga-label={dataGaLabel}
        className="filter-checkbox w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
      >
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        )}
      </button>
      <Label
        htmlFor={name || "checkbox"}
        className="!transform-none !txt-medium cursor-pointer flex items-center gap-2"
        size="large"
        onClick={onChange}
      >
        {colorHex && (
          <div
            className="w-4 h-4 rounded-full border border-gray-100 shadow-sm"
            style={{ backgroundColor: colorHex }}
          />
        )}
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
