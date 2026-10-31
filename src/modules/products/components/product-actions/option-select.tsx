import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  error?: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const isSize = title.toLowerCase().includes("size")

  return (
    <div className="flex flex-col gap-y-3">
      <div
        className={clx({
          "product-option-btn__group--size": isSize,
          "flex flex-wrap gap-2": !isSize,
        })}
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const isSelected = v === current

          return (
            <button
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx("product-option-btn transition-all", {
                "product-option-btn--size": isSize,
                "product-option-btn--pill": !isSize,
                "product-option-btn--active": isSelected,
              })}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
