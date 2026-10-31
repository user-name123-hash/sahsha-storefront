"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { useSearchContext } from "@modules/layout/components/desktop-search"
import SmartSearchDiscovery from "./smart-search-discovery"
import { HighlightMatch } from "./highlight-match"
import { SmartSearchPanel } from "./smart-search-panel"
import { SMART_SEARCH_MIN_CHARS, useSmartSearch } from "./use-smart-search"

type SmartSearchResultsProps = {
  countryCode: string
}

const MAX_PRODUCTS = 6

export default function SmartSearchResults({
  countryCode,
}: SmartSearchResultsProps) {
  const { isSearchOpen, setIsSearchOpen, searchQuery } = useSearchContext()
  const router = useRouter()
  const { results, isLoading } = useSmartSearch(
    searchQuery,
    countryCode,
    isSearchOpen
  )

  if (!isSearchOpen) return null

  const trimmed = (searchQuery ?? "").trim()
  const hasQuery = trimmed.length >= SMART_SEARCH_MIN_CHARS
  const hasResults =
    results.suggestions.length > 0 ||
    results.products.length > 0 ||
    results.collections.length > 0

  const handleClose = () => setIsSearchOpen(false)

  const goToStore = () => {
    const query = (searchQuery ?? "").trim()
    if (!query) return
    router.push(`/store?q=${encodeURIComponent(query)}`)
    handleClose()
  }

  const products = results.products.slice(0, MAX_PRODUCTS)

  return (
    <SmartSearchPanel label="Search" onClose={handleClose}>
      {!hasQuery ? (
        <SmartSearchDiscovery countryCode={countryCode} />
      ) : isLoading && !hasResults ? (
        <p className="smart-search-popup__status">Searching...</p>
      ) : !hasResults ? (
        <p className="smart-search-popup__status">
          No results found for &ldquo;{trimmed}&rdquo;
        </p>
      ) : (
        <div className="smart-search-popup__results">
          {products.length > 0 ? (
            <ul className="smart-search-popup__product-list">
              {products.map((product) => (
                <li key={product.id}>
                  <LocalizedClientLink
                    href={`/products/${product.handle}`}
                    onClick={handleClose}
                    className="smart-search-popup__product"
                  >
                    <div className="smart-search-popup__product-media">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.title || "Product"}
                          fill
                          sizes="64px"
                          className="smart-search-popup__product-image"
                        />
                      ) : (
                        <div className="smart-search-popup__product-placeholder">
                          <PlaceholderImage size={20} />
                        </div>
                      )}
                    </div>
                    <div className="smart-search-popup__product-info">
                      <p className="smart-search-popup__product-title">
                        <HighlightMatch
                          text={product.title || ""}
                          query={searchQuery}
                        />
                      </p>
                      {product.price && (
                        <p className="smart-search-popup__product-price">
                          {product.price}
                        </p>
                      )}
                    </div>
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="smart-search-popup__suggestion-list">
              {results.suggestions.slice(0, MAX_PRODUCTS).map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => goToStore()}
                    className="smart-search-popup__suggestion"
                  >
                    <HighlightMatch text={suggestion} query={searchQuery} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => goToStore()}
            className="smart-search-popup__view-all"
          >
            View all results
          </button>
        </div>
      )}
    </SmartSearchPanel>
  )
}
