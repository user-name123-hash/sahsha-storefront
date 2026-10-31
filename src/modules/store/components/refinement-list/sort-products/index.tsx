"use client"

import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from "@headlessui/react"
import { Fragment, useMemo } from "react"
import ChevronDown from "@modules/common/icons/chevron-down"
import { clx } from "@medusajs/ui"

export type SortOptions = "price_asc" | "price_desc" | "created_at_desc" | "created_at_asc" | "bestsellers" | "created_at"

type SortProductsProps = {
  sortBy: SortOptions
  setQueryParams: (name: string, value: SortOptions) => void
  "data-testid"?: string
}

const sortOptions = [
  {
    value: "created_at_desc",
    label: "Latest Arrivals",
  },
  {
    value: "created_at_asc",
    label: "Oldest First",
  },
  {
    value: "price_asc",
    label: "Price: Low to High",
  },
  {
    value: "price_desc",
    label: "Price: High to Low",
  },
  {
    value: "bestsellers",
    label: "Bestsellers",
  },
]

const SortProducts = ({
  "data-testid": dataTestId,
  sortBy,
  setQueryParams,
}: SortProductsProps) => {
  const handleChange = (value: string) => {
    setQueryParams("sortBy", value as SortOptions)
  }

  const selectedOption = useMemo(() => {
    return sortOptions.find((o) => o.value === sortBy) || sortOptions[0]
  }, [sortBy])

  return (
    <div className="store-page__sort">
      <Listbox value={sortBy} onChange={handleChange}>
        <div className="relative w-auto">
          <ListboxButton className="store-page__sort-btn" data-testid={dataTestId}>
            <span className="store-page__sort-btn-label">
              <span className="store-page__sort-btn-prefix">Sort:</span>
              <span className="store-page__sort-btn-value">{selectedOption.label}</span>
            </span>
            <ChevronDown className="store-page__sort-btn-icon" aria-hidden="true" />
          </ListboxButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <ListboxOptions className="store-page__sort-menu">
              {sortOptions.map((option) => (
                <ListboxOption
                  key={option.value}
                  className={({ active, selected }) =>
                    clx(
                      "store-page__sort-option",
                      active && "store-page__sort-option--active",
                      selected && "store-page__sort-option--selected"
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <div className="store-page__sort-option-inner">
                      <span className="store-page__sort-option-label">{option.label}</span>
                      {selected && (
                        <span className="store-page__sort-option-check" aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </div>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default SortProducts
