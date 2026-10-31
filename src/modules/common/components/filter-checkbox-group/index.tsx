import { clx } from "@medusajs/ui"
import CheckboxWithLabel from "@modules/common/components/checkbox"
import React from "react"

type FilterItem = {
  value: string
  label: string
  hex?: string
}

type FilterCheckboxGroupProps = {
  title: string
  items: FilterItem[]
  values: string[]
  handleChange: (value: string) => void
  onClear?: () => void
  variant?: "default" | "color" | "size"
  defaultOpen?: boolean
  "data-testid"?: string
}

const FilterCheckboxGroup = ({
  title,
  items,
  values,
  handleChange,
  onClear,
  variant = "default",
  defaultOpen = false,
  "data-testid": dataTestId,
}: FilterCheckboxGroupProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [showAll, setShowAll] = React.useState(false)
  const [optimisticValues, setOptimisticValues] = React.useState<string[]>(values)

  React.useEffect(() => {
    setOptimisticValues(values)
  }, [values])

  const initialItemsCount = variant === "color" ? 12 : variant === "size" ? 10 : 6
  const hasMore = items?.length > initialItemsCount

  React.useEffect(() => {
    if (values && values.length > 0 && hasMore && items) {
      const hiddenItems = items.slice(initialItemsCount)
      const isAnyHiddenItemSelected = hiddenItems.some((item) =>
        values.includes(item.value)
      )
      if (isAnyHiddenItemSelected) {
        setShowAll(true)
      }
    }
  }, [values, items, hasMore, initialItemsCount])

  const handleOptimisticChange = (value: string) => {
    setOptimisticValues((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
    handleChange(value)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOptimisticValues([])
    onClear?.()
  }

  const displayedItems = showAll ? items : items?.slice(0, initialItemsCount)
  const selectedCount = optimisticValues.length

  return (
    <div
      className={clx(
        "store-page__filter-group",
        isOpen && "store-page__filter-group--open",
        selectedCount > 0 && "store-page__filter-group--active"
      )}
    >
      <div className="store-page__filter-group-header">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="store-page__filter-group-toggle"
          aria-expanded={isOpen}
        >
          <span className="store-page__filter-group-heading">
            <h3 className="store-page__filter-group-title">{title}</h3>
            {selectedCount > 0 && (
              <span className="store-page__filter-count">{selectedCount}</span>
            )}
          </span>
        </button>
        {selectedCount > 0 && onClear && (
          <button
            type="button"
            className="store-page__filter-section-clear"
            onClick={handleClear}
            data-ga-event="filter_section_clear_click"
            data-ga-label={`Clear ${title}`}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          className={clx(
            "store-page__filter-group-chevron",
            isOpen && "store-page__filter-group-chevron--open"
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
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
          isOpen && "store-page__filter-group-body--open"
        )}
        style={isOpen ? { maxHeight: showAll ? "1200px" : "360px" } : undefined}
      >
        {variant === "color" ? (
          <div className="store-page__color-grid">
            {displayedItems?.map((item) => {
              const checked = optimisticValues.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  className={clx(
                    "store-page__color-swatch",
                    checked && "store-page__color-swatch--active"
                  )}
                  onClick={() => handleOptimisticChange(item.value)}
                  title={item.label}
                  aria-pressed={checked}
                  data-testid={dataTestId}
                  data-ga-event="filter_checkbox_click"
                  data-ga-label={`${title} - ${item.label}`}
                >
                  <span
                    className="store-page__color-swatch-dot"
                    style={{
                      backgroundColor: item.hex || item.value,
                    }}
                  />
                  <span className="store-page__color-swatch-label">{item.label}</span>
                </button>
              )
            })}
          </div>
        ) : variant === "size" ? (
          <div className="store-page__size-grid">
            {displayedItems?.map((item) => {
              const checked = optimisticValues.includes(item.value)
              return (
                <button
                  key={item.value}
                  type="button"
                  className={clx(
                    "store-page__size-chip",
                    checked && "store-page__size-chip--active"
                  )}
                  onClick={() => handleOptimisticChange(item.value)}
                  aria-pressed={checked}
                  data-testid={dataTestId}
                  data-ga-event="filter_checkbox_click"
                  data-ga-label={`${title} - ${item.label}`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        ) : (
          displayedItems?.map((item) => (
            <CheckboxWithLabel
              key={item.value}
              label={item.label}
              checked={optimisticValues.includes(item.value)}
              onChange={() => handleOptimisticChange(item.value)}
              data-testid={dataTestId}
              data-ga-event="filter_checkbox_click"
              data-ga-label={`${title} - ${item.label}`}
            />
          ))
        )}

        {hasMore && isOpen && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="store-page__filter-more-btn"
          >
            {showAll
              ? "View Less"
              : `+ ${items.length - initialItemsCount} more`}
          </button>
        )}
      </div>
    </div>
  )
}

export default FilterCheckboxGroup
