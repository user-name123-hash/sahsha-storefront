"use client"

import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import type { ProductOptions } from "@core/domain/product/variant-selection"
import { shouldShowProductOption } from "@lib/util/should-show-product-option"

function shouldShowOptionSection(
  option: HttpTypes.StoreProductOption | undefined,
  colorVariants: HttpTypes.StoreProductVariant[] = []
): boolean {
  if (!option) return false

  const isColor =
    option.title?.toLowerCase().includes("color") ||
    option.title?.toLowerCase().includes("colour")

  if (isColor && colorVariants.length > 1) {
    return true
  }

  return shouldShowProductOption(option)
}

type ProductOptionsSectionProps = {
  product: HttpTypes.StoreProduct
  disabled?: boolean
  isAdding: boolean
  options: ProductOptions
  setOptionValue: (optionId: string, value: string) => void
  setColorValue: (optionId: string, value: string) => void
  validationErrors: Record<string, string>
  colorOption?: HttpTypes.StoreProductOption
  sizeOption?: HttpTypes.StoreProductOption
  otherOptions: HttpTypes.StoreProductOption[]
  colorVariants: HttpTypes.StoreProductVariant[]
  selectedColorValue?: string
  onOpenSizeChart: () => void
}

export function ProductOptionsSection({
  product,
  disabled,
  isAdding,
  options,
  setOptionValue,
  setColorValue,
  validationErrors,
  colorOption,
  sizeOption,
  otherOptions,
  colorVariants,
  selectedColorValue,
  onOpenSizeChart,
}: ProductOptionsSectionProps) {
  return (
    <>
      {shouldShowOptionSection(sizeOption) && sizeOption && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[11px] font-semibold text-heading uppercase tracking-[var(--letter-spacing-nav)]">
                Select Size
              </h3>
              {validationErrors[sizeOption.id] && (
                <span className="text-[10px] text-red-600 font-black uppercase tracking-wider animate-pulse border-l-2 border-red-600 pl-2">
                  Please Select {String(sizeOption.title || "")}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onOpenSizeChart}
              className="product-size-chart-link flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:opacity-80"
            >
              <Image
                src="/Size Chart.svg"
                alt=""
                width={16}
                height={16}
                className="product-size-chart-link__icon"
                aria-hidden
              />
              Size Chart
            </button>
          </div>
          <OptionSelect
            option={sizeOption}
            current={options[sizeOption.id]}
            updateOption={setOptionValue}
            title={sizeOption.title ?? ""}
            data-testid="product-options"
            disabled={!!disabled || isAdding}
            error={!!validationErrors[sizeOption.id]}
          />
        </div>
      )}

      {shouldShowOptionSection(colorOption, colorVariants) && colorOption && (
        <div className="product-color-variants flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[11px] font-semibold text-heading uppercase tracking-[var(--letter-spacing-nav)]">
              {colorVariants.length > 0
                ? "More Colors"
                : `Select ${colorOption.title}`}
            </h3>
            {validationErrors[colorOption.id] && (
              <span className="text-[10px] text-red-600 font-black uppercase tracking-wider animate-pulse border-l-2 border-red-600 pl-2">
                Please Select {String(colorOption.title || "")}
              </span>
            )}
          </div>
          {colorVariants.length > 0 ? (
            <div className="product-color-variants__list flex gap-2.5 sm:gap-3 overflow-x-auto pb-1">
              {colorVariants.map((variant) => {
                const variantImage =
                  (variant.metadata?.image as string) ||
                  variant.thumbnail ||
                  variant.images?.[0]?.url ||
                  product.thumbnail
                const variantColorValue = variant.options?.find(
                  (opt: HttpTypes.StoreProductOptionValue) =>
                    opt.option_id === colorOption.id
                )?.value
                const isSelected = variantColorValue === selectedColorValue

                return (
                  <button
                    key={variant.id}
                    type="button"
                    className={`product-color-variants__card flex-shrink-0${
                      isSelected ? " product-color-variants__card--active" : ""
                    }`}
                    onClick={() => {
                      if (colorOption && variantColorValue) {
                        setColorValue(colorOption.id, variantColorValue)
                      }
                    }}
                    title={variantColorValue}
                  >
                    {variantImage && (
                      <Image
                        src={variantImage}
                        alt={`Color variant: ${variantColorValue || "Unknown"}`}
                        fill
                        sizes="(max-width: 640px) 72px, 88px"
                        className="object-cover"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <OptionSelect
              option={colorOption}
              current={options[colorOption.id]}
              updateOption={setOptionValue}
              title={colorOption.title ?? ""}
              data-testid="product-options"
              disabled={!!disabled || isAdding}
              error={!!validationErrors[colorOption.id]}
            />
          )}
        </div>
      )}

      {otherOptions
        .filter((option) => shouldShowOptionSection(option))
        .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
        .map((option) => (
          <div key={option.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-semibold text-heading uppercase tracking-[var(--letter-spacing-nav)]">
                Select {String(option.title || "")}
              </h3>
              {validationErrors[option.id] && (
                <span className="text-[10px] text-red-600 font-black uppercase tracking-wider animate-pulse border-l-2 border-red-600 pl-2">
                  Please Select {String(option.title || "")}
                </span>
              )}
            </div>
            <OptionSelect
              option={option}
              current={options[option.id]}
              updateOption={setOptionValue}
              title={option.title ?? ""}
              data-testid="product-options"
              disabled={!!disabled || isAdding}
              error={!!validationErrors[option.id]}
            />
          </div>
        ))}

    </>
  )
}
