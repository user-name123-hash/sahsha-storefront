"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect, useTransition } from "react"
import { clx } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "./sort-products"
import FilterCheckboxGroup from "@modules/common/components/filter-checkbox-group"
import {
  getMetadataFieldLabel,
  SHOP_METADATA_FILTER_KEYS,
} from "@lib/store-filter-config"

type MetadataFilter = {
  param: string
  title: string
  options: { value: string; label: string }[]
}

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  "data-testid"?: string
  collections?: HttpTypes.StoreCollection[]
  collectionValue?: string | string[]
  genderValue?: string | string[]
  typeValue?: string | string[]
  materialValue?: string | string[]
  colorValue?: string | string[]
  sizeValue?: string | string[]
  categoryValue?: string | string[]
  metadataValues?: Record<string, string | string[] | undefined>
  metadataFilters?: MetadataFilter[]
  minPrice?: string
  maxPrice?: string
  genderOptions?: { value: string; label: string }[]
  typeOptions?: { value: string; label: string }[]
  materialOptions?: { value: string; label: string }[]
  colorOptions?: { value: string; label: string; hex?: string }[]
  sizeOptions?: { value: string; label: string }[]
  categoryOptions?: { value: string; label: string }[]
  hideTitle?: boolean
  q?: string
}

const METADATA_FILTER_ORDER = ["fabric", "occasion", "neck"] as const
const MIN_PRICE = 0
const MAX_PRICE = 10000

const parsePrice = (value: string, fallback: number) => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return fallback

  return Math.min(MAX_PRICE, Math.max(MIN_PRICE, Math.round(parsed)))
}

function toValueArray(value: string | string[] | undefined): string[] {
  if (typeof value === "string") return value.split(",").filter(Boolean)
  if (Array.isArray(value)) return value
  return []
}

const RefinementList = ({
  "data-testid": dataTestId,
  collections,
  collectionValue,
  categoryValue,
  colorValue,
  sizeValue,
  metadataValues = {},
  metadataFilters = [],
  minPrice,
  maxPrice,
  colorOptions,
  sizeOptions,
  categoryOptions,
  hideTitle = false,
  q,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [minPriceLocal, setMinPriceLocal] = useState(
    parsePrice(minPrice || "", MIN_PRICE)
  )
  const [maxPriceLocal, setMaxPriceLocal] = useState(
    parsePrice(maxPrice || "", MAX_PRICE)
  )
  const [minPriceInput, setMinPriceInput] = useState(
    String(parsePrice(minPrice || "", MIN_PRICE))
  )
  const [maxPriceInput, setMaxPriceInput] = useState(
    String(parsePrice(maxPrice || "", MAX_PRICE))
  )
  const [isPriceOpen, setIsPriceOpen] = useState(true)

  useEffect(() => {
    const nextMin = parsePrice(minPrice || "", MIN_PRICE)
    const nextMax = Math.max(
      nextMin,
      parsePrice(maxPrice || "", MAX_PRICE)
    )
    setMinPriceLocal(nextMin)
    setMaxPriceLocal(nextMax)
    setMinPriceInput(String(nextMin))
    setMaxPriceInput(String(nextMax))
  }, [minPrice, maxPrice])

  useEffect(() => {
    setMinPriceInput(String(minPriceLocal))
  }, [minPriceLocal])

  useEffect(() => {
    setMaxPriceInput(String(maxPriceLocal))
  }, [maxPriceLocal])

  const clampMinPrice = (value: number) =>
    Math.min(Math.max(MIN_PRICE, value), maxPriceLocal)

  const clampMaxPrice = (value: number) =>
    Math.max(Math.min(MAX_PRICE, value), minPriceLocal)

  const commitMinPriceInput = () => {
    const next = clampMinPrice(parsePrice(minPriceInput, MIN_PRICE))
    setMinPriceLocal(next)
    setMinPriceInput(String(next))
  }

  const commitMaxPriceInput = () => {
    const next = clampMaxPrice(parsePrice(maxPriceInput, MAX_PRICE))
    setMaxPriceLocal(next)
    setMaxPriceInput(String(next))
  }

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }

      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    startTransition(() => {
      router.replace(`${pathname}?${query}`, { scroll: false })
    })
  }

  const handleFilterChange = (
    name: string,
    currentValues: string | string[] | undefined,
    value: string
  ) => {
    let values: string[] = []
    if (typeof currentValues === "string") {
      values = currentValues.split(",").filter(Boolean)
    } else if (Array.isArray(currentValues)) {
      values = currentValues
    }

    const newValues = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value]

    setQueryParams(name, newValues.join(","))
  }

  const clearFilterSection = (name: string) => {
    setQueryParams(name, "")
  }

  const handlePriceApply = () => {
    const nextMin = parsePrice(minPriceInput, MIN_PRICE)
    const nextMax = Math.max(
      nextMin,
      parsePrice(maxPriceInput, MAX_PRICE)
    )
    setMinPriceLocal(nextMin)
    setMaxPriceLocal(nextMax)
    setMinPriceInput(String(nextMin))
    setMaxPriceInput(String(nextMax))

    const params = new URLSearchParams(searchParams)
    params.set("min_price", nextMin.toString())
    params.set("max_price", nextMax.toString())
    params.delete("page")
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("collection")
    params.delete("category")
    params.delete("gender")
    params.delete("type")
    params.delete("material")
    params.delete("color")
    params.delete("size")
    params.delete("min_price")
    params.delete("max_price")
    params.delete("q")
    SHOP_METADATA_FILTER_KEYS.forEach((key) => params.delete(key))
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const hasMetadataFilters = SHOP_METADATA_FILTER_KEYS.some(
    (key) => metadataValues[key]
  )

  const hasFilters = !!(
    collectionValue ||
    categoryValue ||
    colorValue ||
    sizeValue ||
    minPrice ||
    maxPrice ||
    q ||
    hasMetadataFilters
  )

  const priceActive = !!(minPrice || maxPrice)

  const orderedMetadataFilters = METADATA_FILTER_ORDER.map((key) => {
    const found = metadataFilters.find((filter) => filter.param === key)
    if (!found) return null
    return {
      ...found,
      title: getMetadataFieldLabel(key),
    }
  }).filter(Boolean) as MetadataFilter[]

  const fabricFilter = orderedMetadataFilters.find((f) => f.param === "fabric")
  const occasionFilter = orderedMetadataFilters.find((f) => f.param === "occasion")
  const neckFilter = orderedMetadataFilters.find((f) => f.param === "neck")

  const firstOpenFilter =
    colorOptions && colorOptions.length > 0
      ? "color"
      : fabricFilter
        ? "fabric"
        : sizeOptions && sizeOptions.length > 0
          ? "size"
          : collections && collections.length > 0
            ? "collection"
            : categoryOptions && categoryOptions.length > 0
              ? "category"
              : occasionFilter
                ? "occasion"
                : neckFilter
                  ? "neck"
                  : null

  return (
    <div
      className={clx(
        "store-page__filters transition-opacity duration-75",
        isPending ? "opacity-90 pointer-events-none" : "opacity-100"
      )}
      data-testid={dataTestId}
    >
      {!hideTitle && (
        <div className="store-page__filters-head">
          <h2 className="store-page__filters-title">Filters</h2>
          <button
            type="button"
            onClick={clearAllFilters}
            className="store-page__clear-filters"
            disabled={!hasFilters}
            data-ga-event="filter_clear_all_click"
            data-ga-label="Clear All Filters"
          >
            Clear All
          </button>
        </div>
      )}

      {hideTitle && (
        <div className="store-page__filters-clear-row">
          <button
            type="button"
            onClick={clearAllFilters}
            className="store-page__clear-filters"
            disabled={!hasFilters}
            data-ga-event="filter_clear_all_click"
            data-ga-label="Clear All Filters"
          >
            Clear All
          </button>
        </div>
      )}

      {/* 1. Colours */}
      {colorOptions && colorOptions.length > 0 && (
        <FilterCheckboxGroup
          title="Colours"
          items={colorOptions}
          values={toValueArray(colorValue)}
          handleChange={(v) => handleFilterChange("color", colorValue, v)}
          onClear={() => clearFilterSection("color")}
          variant="color"
          defaultOpen={firstOpenFilter === "color"}
        />
      )}

      {/* 2. Fabric */}
      {fabricFilter && (
        <FilterCheckboxGroup
          title={fabricFilter.title}
          items={fabricFilter.options}
          values={toValueArray(metadataValues[fabricFilter.param])}
          handleChange={(v) =>
            handleFilterChange(
              fabricFilter.param,
              metadataValues[fabricFilter.param],
              v
            )
          }
          onClear={() => clearFilterSection(fabricFilter.param)}
          defaultOpen={firstOpenFilter === "fabric"}
        />
      )}

      {/* 3. Size */}
      {sizeOptions && sizeOptions.length > 0 && (
        <FilterCheckboxGroup
          title="Size"
          items={sizeOptions}
          values={toValueArray(sizeValue)}
          handleChange={(v) => handleFilterChange("size", sizeValue, v)}
          onClear={() => clearFilterSection("size")}
          variant="size"
          defaultOpen={firstOpenFilter === "size"}
        />
      )}

      {/* 4. By Collection */}
      {collections && collections.length > 0 && (
        <FilterCheckboxGroup
          title="By Collection"
          items={collections.map((c) => ({
            value: c.id,
            label: c.title || "",
          }))}
          values={toValueArray(collectionValue)}
          handleChange={(v) =>
            handleFilterChange("collection", collectionValue, v)
          }
          onClear={() => clearFilterSection("collection")}
          defaultOpen={firstOpenFilter === "collection"}
        />
      )}

      {/* 5. By Category */}
      {categoryOptions && categoryOptions.length > 0 && (
        <FilterCheckboxGroup
          title="By Category"
          items={categoryOptions}
          values={toValueArray(categoryValue)}
          handleChange={(v) =>
            handleFilterChange("category", categoryValue, v)
          }
          onClear={() => clearFilterSection("category")}
          defaultOpen={firstOpenFilter === "category"}
        />
      )}

      {/* 6. Occasion */}
      {occasionFilter && (
        <FilterCheckboxGroup
          title={occasionFilter.title}
          items={occasionFilter.options}
          values={toValueArray(metadataValues[occasionFilter.param])}
          handleChange={(v) =>
            handleFilterChange(
              occasionFilter.param,
              metadataValues[occasionFilter.param],
              v
            )
          }
          onClear={() => clearFilterSection(occasionFilter.param)}
          defaultOpen={firstOpenFilter === "occasion"}
        />
      )}

      {/* 7. Neck Style */}
      {neckFilter && (
        <FilterCheckboxGroup
          title={neckFilter.title}
          items={neckFilter.options}
          values={toValueArray(metadataValues[neckFilter.param])}
          handleChange={(v) =>
            handleFilterChange(
              neckFilter.param,
              metadataValues[neckFilter.param],
              v
            )
          }
          onClear={() => clearFilterSection(neckFilter.param)}
          defaultOpen={firstOpenFilter === "neck"}
        />
      )}

      {/* 8. Price — always last, open by default */}
      <div
        className={clx(
          "store-page__price-filter store-page__filter-group",
          isPriceOpen && "store-page__filter-group--open",
          priceActive && "store-page__filter-group--active"
        )}
      >
        <div className="store-page__filter-group-header">
          <button
            type="button"
            onClick={() => setIsPriceOpen(!isPriceOpen)}
            className="store-page__filter-group-toggle"
            aria-expanded={isPriceOpen}
          >
            <span className="store-page__filter-group-heading">
              <h3 className="store-page__filter-group-title">Price</h3>
              {priceActive && (
                <span className="store-page__filter-count">1</span>
              )}
            </span>
          </button>
          {priceActive && (
            <button
              type="button"
              className="store-page__filter-section-clear"
              onClick={() => {
                const params = new URLSearchParams(searchParams)
                params.delete("min_price")
                params.delete("max_price")
                startTransition(() => {
                  router.replace(`${pathname}?${params.toString()}`, {
                    scroll: false,
                  })
                })
              }}
              data-ga-event="filter_price_clear_click"
              data-ga-label="Clear Price Filter"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPriceOpen(!isPriceOpen)}
            className={clx(
              "store-page__filter-group-chevron",
              isPriceOpen && "store-page__filter-group-chevron--open"
            )}
            aria-label={isPriceOpen ? "Collapse Price" : "Expand Price"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        <div
          className={clx(
            "store-page__filter-group-body",
            isPriceOpen && "store-page__filter-group-body--open"
          )}
          style={isPriceOpen ? { maxHeight: "360px" } : undefined}
        >
          <div className="store-page__price-body">
            <div className="store-page__price-inputs">
              <label className="store-page__price-input-wrap">
                <span>Min</span>
                <input
                  type="number"
                  min={0}
                  max={maxPriceLocal}
                  step={1}
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  onBlur={commitMinPriceInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur()
                    }
                  }}
                />
              </label>
              <span className="store-page__price-input-sep">–</span>
              <label className="store-page__price-input-wrap">
                <span>Max</span>
                <input
                  type="number"
                  min={minPriceLocal}
                  max={MAX_PRICE}
                  step={1}
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  onBlur={commitMaxPriceInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur()
                    }
                  }}
                />
              </label>
            </div>
            <div
              className="store-page__price-range-track"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const percentage = Math.max(0, Math.min(1, x / rect.width))
                const value = Math.round(percentage * MAX_PRICE)

                if (
                  Math.abs(value - minPriceLocal) <
                  Math.abs(value - maxPriceLocal)
                ) {
                  setMinPriceLocal(Math.min(value, maxPriceLocal))
                } else {
                  setMaxPriceLocal(Math.max(value, minPriceLocal))
                }
              }}
            >
              <div
                className="store-page__price-range-fill"
                style={{
                  left: `${(minPriceLocal / MAX_PRICE) * 100}%`,
                  right: `${100 - (maxPriceLocal / MAX_PRICE) * 100}%`,
                }}
              />
              <input
                type="range"
                min="0"
                max={MAX_PRICE}
                step="1"
                value={minPriceLocal}
                onChange={(e) =>
                  setMinPriceLocal(
                    Math.min(parseInt(e.target.value), maxPriceLocal)
                  )
                }
                className={`store-page__price-slider ${
                  minPriceLocal > 5000 ? "z-10" : "z-20"
                }`}
                onClick={(e) => e.stopPropagation()}
              />
              <input
                type="range"
                min="0"
                max={MAX_PRICE}
                step="1"
                value={maxPriceLocal}
                onChange={(e) =>
                  setMaxPriceLocal(
                    Math.max(parseInt(e.target.value), minPriceLocal)
                  )
                }
                className={`store-page__price-slider ${
                  minPriceLocal > 5000 ? "z-20" : "z-10"
                }`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="store-page__price-range-labels">
              <span>₹{minPriceLocal.toLocaleString()}</span>
              <span>₹{maxPriceLocal.toLocaleString()}+</span>
            </div>
            <div className="store-page__price-actions">
              <button
                type="button"
                onClick={handlePriceApply}
                className="store-page__apply-btn"
                data-ga-event="filter_price_apply_click"
                data-ga-label="Apply Price Filter"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.delete("min_price")
                  params.delete("max_price")
                  startTransition(() => {
                    router.replace(`${pathname}?${params.toString()}`, {
                      scroll: false,
                    })
                  })
                }}
                className="store-page__reset-btn"
                data-ga-event="filter_price_reset_click"
                data-ga-label="Reset Price Filter"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RefinementList
