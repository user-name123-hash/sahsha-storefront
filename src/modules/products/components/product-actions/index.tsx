"use client"

import { addToCart } from "@core/data/cart"
import { trackAddToCart } from "@core/analytics/ga4-ecommerce"
import { useIntersection } from "@core/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
// import { Button } from "@medusajs/ui" // Removed - unused import causing badge issue
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import React, { useEffect, useMemo, useRef, useState } from "react"
import Color from "color"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { getProductPrice, getPricesForVariant } from "@core/util/get-product-price"
import { convertToLocale } from "@core/util/money"
import RatingsTab from "../product-tabs/ratings-tab"
import PincodeChecker from "@modules/cart/components/pincode-checker"
import { addToWishlist, removeFromWishlist, getWishlistProductIds } from "@core/data/wishlist"
import LoginPopup from "@modules/common/components/login-popup"
import { updateLineItem, deleteLineItem, buyNow } from "@core/data/cart"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region?: HttpTypes.StoreRegion
  disabled?: boolean
  cart?: HttpTypes.StoreCart | null
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

import SidePanel from "@modules/common/components/side-panel"

import { useProductContext } from "@modules/products/context/product-context"
import { useWishlist } from "@core/context/wishlist-context"

// ... existing imports ...

/** Shallow equality for plain option objects \u2014 replaces lodash isEqual. */
function isEqual(
  a: Record<string, string | undefined> | undefined,
  b: Record<string, string | undefined> | undefined
): boolean {
  if (a === b) return true
  if (!a || !b) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every((k) => a[k] === b[k])
}

export default function ProductActions({
  product,
  region,
  disabled,
  cart,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setSelectedVariantId, setSelectedOptions, markUserChangedOptions } =
    useProductContext()

  const [options, setOptions] = useState<Record<string, string | undefined>>(() => {
    const variantIdFromUrl = searchParams.get("v_id")

    // If there's a variant ID in URL, find and set its options
    if (variantIdFromUrl && product.variants) {
      const variantFromUrl = product.variants.find((v) => v.id === variantIdFromUrl)
      if (variantFromUrl) {
        return optionsAsKeymap(variantFromUrl.options) ?? {}
      }
    }

    // If there is only 1 variant, preselect the options
    if (product.variants?.length === 1) {
      return optionsAsKeymap(product.variants[0].options) ?? {}
    }

    // If there are multiple variants, check if any option has only one possible value
    // and auto-select it (e.g., if only one color is available)
    if (product.options) {
      const partialOptions: Record<string, string> = {}

      product.options.forEach((option) => {
        // Check unique values from option definition (what is shown to user)
        const uniqueValues = new Set(option.values?.map(v => v.value))

        if (uniqueValues.size === 1) {
          const uniqueValue = Array.from(uniqueValues)[0]
          if (uniqueValue) {
            partialOptions[option.id] = uniqueValue
          }
        }
      })

      if (Object.keys(partialOptions).length > 0) {
        return partialOptions
      }
    }
    
    return {}
  })
  const [isAdding, setIsAdding] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(true)
  const [isMaterialOpen, setIsMaterialOpen] = useState(false)
  const [isCareGuideOpen, setIsCareGuideOpen] = useState(false)
  const [isProductTypeOpen, setIsProductTypeOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({})
  const [showNotifyMessage, setShowNotifyMessage] = useState(false)
  const countryCode = useParams().countryCode as string

  // Keep effect to sync if URL params change externally
  useEffect(() => {
    const variantIdFromUrl = searchParams.get("v_id")
    if (variantIdFromUrl && product.variants) {
      const variantFromUrl = product.variants.find((v) => v.id === variantIdFromUrl)
      if (variantFromUrl) {
        const variantOptions = optionsAsKeymap(variantFromUrl.options)
        setOptions(variantOptions ?? {})
        return
      }
    }
  }, [product.variants, searchParams])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    setSelectedOptions(options)
  }, [options, setSelectedOptions])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    markUserChangedOptions()
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
    // Clear error for this option
    setValidationErrors((prev) => ({
      ...prev,
      [optionId]: false,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Reset notification message when options change
  useEffect(() => {
    setShowNotifyMessage(false)
  }, [options])
  useEffect(() => {
    const value = isValidVariant ? selectedVariant?.id : undefined
    const current = searchParams.get("v_id") ?? undefined

    // Update Context
    setSelectedVariantId(value)

    // null !== undefined was causing infinite replaceState → RSC refreshes
    if (current === value) {
      return
    }

    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    const qs = params.toString()
    if (qs === searchParams.toString()) {
      return
    }

    const newUrl = qs ? `${pathname}?${qs}` : pathname
    window.history.replaceState(null, "", newUrl)
  }, [selectedVariant, isValidVariant, pathname, searchParams, setSelectedVariantId])

  const variantInCart = useMemo(() => {
    if (!cart || !selectedVariant) {
      return null
    }

    const item = cart.items?.find((i) => i.variant_id === selectedVariant.id)
    return item || null
  }, [cart, selectedVariant])

  const quantityInCart = useMemo(() => {
    return variantInCart?.quantity || 0
  }, [variantInCart])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If no variant selected, check if product has any variants
    if (!selectedVariant) {
      return product.variants && product.variants.length > 0
    }

    // If we don't manage inventory, we can always add to cart
    if (!selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant.allow_backorder) {
      return true
    }

    // If there is inventory available AND it is >= the selected quantity
    // We treat the inventory as total - quantity already in cart
    const totalInventory = selectedVariant.inventory_quantity || 0
    const availableQuantity = totalInventory - quantityInCart
    
    if (availableQuantity >= quantity) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant, product.variants, quantity, quantityInCart])

  // Get current inventory limit for display
  const inventoryLimit = useMemo(() => {
    if (!selectedVariant || !selectedVariant.manage_inventory || selectedVariant.allow_backorder) {
      return null
    }
    const totalInventory = selectedVariant.inventory_quantity || 0
    return totalInventory - quantityInCart
  }, [selectedVariant, quantityInCart])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    // Check for missing options
    const missingOptions: Record<string, boolean> = {}
    product.options?.forEach(option => {
      if (!options[option.id]) {
        missingOptions[option.id] = true
      }
    })

    if (Object.keys(missingOptions).length > 0) {
      setValidationErrors(missingOptions)
      // Optional: scroll to the first error if many options
      return null
    }

    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: quantity,
      countryCode,
    })

    const currency = region?.currency_code?.toUpperCase() ?? "USD"
    const unitPrice = displayPrice?.calculated_price_number ?? 0
    const value = (unitPrice * quantity) / 100
    trackAddToCart({
      currency,
      value,
      items: [
        {
          item_id: selectedVariant.id,
          item_name: product.title ?? "",
          price: unitPrice / 100,
          quantity,
          item_variant: selectedVariant.title ?? undefined,
        },
      ],
    })

    setIsAdding(false)
  }

  const handleBuyNow = async () => {
    // Check for missing options
    const missingOptions: Record<string, boolean> = {}
    product.options?.forEach(option => {
      if (!options[option.id]) {
        missingOptions[option.id] = true
      }
    })

    if (Object.keys(missingOptions).length > 0) {
      setValidationErrors(missingOptions)
      return null
    }

    if (!selectedVariant?.id) return null
    
    setIsBuyingNow(true)

    try {
      await buyNow({
        variantId: selectedVariant.id,
        quantity: quantity,
        countryCode,
      })
    } catch (e) {
      const { isNextRedirectError } = await import("@lib/util/is-next-redirect")
      if (isNextRedirectError(e)) throw e
      console.error(e)
    } finally {
      setIsBuyingNow(false)
    }
  }

  const handleIncreaseQuantity = async () => {
    if (!variantInCart || isAdding) return
    setIsAdding(true)
    try {
      await updateLineItem({
        lineId: variantInCart.id,
        quantity: variantInCart.quantity + 1,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDecreaseQuantity = async () => {
    if (!variantInCart || isAdding) return
    setIsAdding(true)
    try {
      if (variantInCart.quantity > 1) {
        await updateLineItem({
          lineId: variantInCart.id,
          quantity: variantInCart.quantity - 1,
        })
      } else {
        await deleteLineItem(variantInCart.id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsAdding(false)
    }
  }

  // Get color option
  const colorOption = useMemo(() => {
    return product.options?.find(opt =>
      opt.title?.toLowerCase().includes('color') ||
      opt.title?.toLowerCase().includes('colour')
    )
  }, [product.options])

  // Get color variants for MORE COLORS section
  const colorVariants = useMemo(() => {
    if (!product.variants || !colorOption) return []

    const uniqueColors = new Map()
    product.variants.forEach(variant => {
      const colorValue = variant.options?.find(opt => opt.option_id === colorOption.id)?.value
      if (colorValue && !uniqueColors.has(colorValue)) {
        uniqueColors.set(colorValue, variant)
      }
    })
    return Array.from(uniqueColors.values())
  }, [product.variants, colorOption])

  // Get currently selected color value
  const selectedColorValue = useMemo(() => {
    if (!colorOption) return null
    return options[colorOption.id]
  }, [options, colorOption])

  // Get size option
  const sizeOption = useMemo(() => {
    return product.options?.find(opt =>
      opt.title?.toLowerCase().includes('size')
    )
  }, [product.options])

  // Get price for selected variant - updates when variant changes
  const displayPrice = useMemo(() => {
    // If a variant is selected, use its price
    if (selectedVariant) {
      const variantPrice = getPricesForVariant(selectedVariant)
      if (variantPrice) {
        return variantPrice
      }
    }

    // Fallback to getProductPrice for cheapest price
    const { cheapestPrice } = getProductPrice({ product })
    return cheapestPrice
  }, [selectedVariant, product])

  // Calculate discount if original price exists
  const originalPrice = displayPrice?.original_price_number
  const currentPrice = displayPrice?.calculated_price_number
  const discountPercentage = originalPrice && currentPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : null

  return (
    <>
      <div className="flex flex-col gap-4 sm:gap-5 min-[768px]:gap-4 min-[1023px]:gap-4 min-[1024px]:gap-6 min-[1200px]:gap-6 min-[1360px]:gap-6 w-full" ref={actionsRef}>
        {/* Price Display & In-Cart Status */}
        {displayPrice && (
          <div className="flex flex-col gap-2 pt-2 sm:pt-3 border-t border-gray-200">
            <div className="flex items-end justify-between flex-wrap gap-2">
              <div className="flex items-baseline gap-2 sm:gap-3 min-[768px]:gap-3 min-[1023px]:gap-3 min-[1360px]:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl min-[768px]:text-3xl min-[1023px]:text-3xl min-[1360px]:text-3xl font-bold text-gray-900">
                  {currentPrice !== undefined && currentPrice !== null
                    ? `₹${currentPrice.toLocaleString('en-IN')}`
                    : displayPrice.calculated_price}
                </span>
                {originalPrice && currentPrice && originalPrice > currentPrice && (
                  <>
                    <span className="text-base sm:text-lg min-[768px]:text-lg min-[1023px]:text-lg min-[1360px]:text-lg text-gray-700 line-through">
                      MRP ₹{originalPrice.toLocaleString('en-IN')}
                    </span>
                    {discountPercentage && (
                      <span className="text-base sm:text-lg min-[768px]:text-lg min-[1023px]:text-lg min-[1360px]:text-lg font-semibold" style={{ color: '#FE5FB7' }}>
                        ({discountPercentage}% OFF)
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Already in Bag Indicator - Premium Badge */}
              {quantityInCart > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-[11px] font-black rounded-full border border-green-100 shadow-sm animate-in fade-in zoom-in-95 duration-500 uppercase tracking-tighter">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>{quantityInCart} <span className="hidden sm:inline">ITEM{quantityInCart > 1 ? 'S' : ''}</span> IN BAG</span>
                </div>
              )}
            </div>
            <p className="text-sm sm:text-md" style={{ color: '#156229', fontWeight: 500 }}>inclusive of all taxes</p>
          </div>
        )}
        {/* COLOR Section */}
        {colorOption && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm min-[768px]:text-sm font-semibold text-gray-900 uppercase">
                {colorVariants.length > 0 ? "More Colors" : `Select ${colorOption.title}`}
              </h3>
              {validationErrors[colorOption.id] && (
                <span className="text-[10px] text-red-600 font-black uppercase tracking-wider animate-pulse border-l-2 border-red-600 pl-2">
                  Please Select {String(colorOption.title || "")}
                </span>
              )}
            </div>
            {colorVariants.length > 0 ? (
              <div className="flex gap-2 sm:gap-3 min-[768px]:gap-3 overflow-x-auto pb-2 transition-all duration-300">
                {colorVariants.map((variant) => {
                  const variantImage =
                    (variant.metadata?.image as string) ||
                    (variant.metadata?.thumbnail as string) ||
                    (variant.metadata?.color_image as string) ||
                    (variant.metadata?.variant_image as string) ||
                    variant.thumbnail ||
                    variant.images?.[0]?.url ||
                    product.thumbnail
                  const variantColorValue = variant.options?.find((opt: any) => opt.option_id === colorOption.id)?.value
                  const isSelected = variantColorValue === selectedColorValue

                  // Get color for the bottom strip using metadata or library
                  let stripColor = (variant.metadata?.color_hex as string) || null
                  if (!stripColor && variantColorValue) {
                    try {
                      // Try parsing the original color name (handles things like "darkgreen")
                      stripColor = Color(variantColorValue.toLowerCase().replace(/\s+/g, '')).hex()
                    } catch (e) {
                      try {
                        // Try parsing without modification
                        stripColor = Color(variantColorValue).hex()
                      } catch (e2) {
                        stripColor = null
                      }
                    }
                  }

                  return (
                    <button
                      key={variant.id}
                      className={`w-12 h-14 sm:w-16 sm:h-[4.5rem] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 flex flex-col ${isSelected
                        ? 'border-purple-600 ring-2 ring-purple-200'
                        : 'border-gray-200 hover:border-purple-400'
                        }`}
                      onClick={() => {
                        if (colorOption && variantColorValue) {
                          setOptionValue(colorOption.id, variantColorValue)
                        }
                      }}
                    >
                      <div className="flex-1 w-full relative overflow-hidden">
                        {variantImage && (
                          <Image
                            src={variantImage}
                            alt={`Color variant: ${variantColorValue || 'Unknown'}`}
                            fill
                            sizes="(max-width: 768px) 48px, 64px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      {stripColor && (
                        <div
                          className="h-2 w-full border-t border-gray-100"
                          style={{ backgroundColor: stripColor }}
                          title={variantColorValue}
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
                error={validationErrors[colorOption.id]}
              />
            )}
          </div>
        )}

        {/* SIZE Section */}
        {sizeOption && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm min-[768px]:text-sm font-semibold text-gray-900 uppercase">Select Size</h3>
                {validationErrors[sizeOption.id] && (
                  <span className="text-[10px] text-red-600 font-black uppercase tracking-wider animate-pulse border-l-2 border-red-600 pl-2">
                    Please Select {String(sizeOption.title || "")}
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveFeature('size_chart')}
                className="flex items-center gap-1.5 text-xs sm:text-sm min-[768px]:text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: '#8B5AB1' }}
              >
                <Image src="/Size Chart.svg" alt="Size Chart" width={16} height={16} />
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
              error={validationErrors[sizeOption.id]}
            />
          </div>
        )}

        {/* Other Options (if any) */}
        {(product.options || []).filter(opt => {
          const isColor = opt.title?.toLowerCase().includes('color') || opt.title?.toLowerCase().includes('colour')
          const isSize = opt.title?.toLowerCase().includes('size')
          return !isColor && !isSize
        })
          .sort((a, b) => (a.title || "").localeCompare(b.title || ""))
          .map((option) => {
            return (
              <div key={option.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm min-[768px]:text-sm font-semibold text-gray-900 uppercase">Select {String(option.title || "")}</h3>
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
                  error={validationErrors[option.id]}
                />
              </div>
            )
          })}

        {/* QUANTITY Section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm min-[768px]:text-sm font-semibold text-gray-900 uppercase">Quantity</h3>
            {inventoryLimit !== null && inventoryLimit > 0 && inventoryLimit <= 5 && (
              <div className="flex items-center gap-1.5 animate-pulse">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 2h4"></path>
                  <path d="M12 14v-4"></path>
                  <path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-8 7z"></path>
                  <path d="M2 9h3"></path>
                  <path d="M2 12h2"></path>
                  <path d="M2 15h3"></path>
                </svg>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-orange-600">
                  Hurry! Only {inventoryLimit} left in stock
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center border border-gray-300 rounded-[30px] overflow-hidden bg-white w-[141px]">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            <span className="flex-1 text-center font-semibold text-gray-900 py-2">{quantity}</span>
            <button
              onClick={() => {
                if (inventoryLimit === null || quantity < inventoryLimit) {
                  setQuantity(quantity + 1)
                }
              }}
              disabled={inventoryLimit !== null && quantity >= inventoryLimit}
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
          {inventoryLimit !== null && quantity >= inventoryLimit && inventoryLimit > 0 && (
            <p className="text-[10px] text-red-600 font-medium">Maximum available stock reached</p>
          )}
        </div>


        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-full">
          {!inStock && selectedVariant ? (
            <div className="flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Out of Stock Status Indicator */}
              <div className="flex items-center gap-3 text-[#8B5AB1] bg-[#FAF5FF] px-4 py-3 rounded-2xl border border-purple-100 shadow-sm">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-widest leading-none mb-0.5">Out of Stock</span>
                  <span className="text-[11px] text-purple-400 font-medium leading-none">Restocking soon for your little one! 🧸</span>
                </div>
              </div>

              {showNotifyMessage ? (
                /* Premium Success Box */
                <div className="bg-[#FAF5FF] p-6 rounded-2xl border-2 border-dashed border-purple-200 flex flex-col gap-4 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-purple-900 leading-none mb-1">Request Received!</h4>
                      <p className="text-[11px] text-purple-400 font-medium uppercase tracking-wider">Back-in-stock alert active</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: '#4B2A6B' }}>
                    Oops! This cute Sahsha favorite is currently out of stock. Don't worry — we'll notify you the moment it's back for your little one! 🧸✨
                  </p>
                  <button
                    onClick={() => {
                      const relatedSection = document.getElementById('related-products')
                      if (relatedSection) {
                        relatedSection.scrollIntoView({ behavior: 'smooth' })
                      } else {
                        router.push('/store')
                      }
                    }}
                    className="w-full sm:w-fit py-2.5 px-6 rounded-full bg-white border border-purple-200 text-sm font-bold text-purple-600 shadow-sm hover:shadow-md hover:bg-purple-50 transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>Find Similar Favorites</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-row gap-2.5 sm:gap-3 w-full">
                  <button
                    onClick={() => setShowNotifyMessage(true)}
                    className="h-12 rounded-[30px] font-bold text-white flex items-center justify-center gap-1.5 sm:gap-2 transition-all w-full shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transform px-2 sm:px-4"
                    style={{ backgroundColor: '#8B5AB1' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 sm:w-5 sm:h-5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span className="text-[12px] sm:text-base leading-tight truncate">
                      <span className="hidden sm:inline">Notify Me When Available</span>
                      <span className="inline sm:hidden">Notify Me</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-row gap-3 w-full items-end">
              {variantInCart ? (
                /* Flipkart Style Quantity Manager Button Container */
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="text-[11px] font-black text-[#8B5AB1] uppercase tracking-[0.1em] px-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8B5AB1]"></div>
                    Manage Quantity
                  </div>
                  <div 
                    className="h-12 rounded-[30px] font-semibold text-white flex items-center justify-between transition-all w-full overflow-hidden shadow-md"
                    style={{ backgroundColor: '#8B5AB1' }}
                  >
                    <button
                      onClick={handleDecreaseQuantity}
                      disabled={isAdding}
                      className="w-12 h-full flex items-center justify-center hover:bg-black/10 active:bg-black/20 transition-colors disabled:opacity-50"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    
                    <div className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-1 min-w-0">
                       <Image src="/cart.svg" alt="Cart" width={16} height={16} className="brightness-0 invert flex-shrink-0" />
                       <span className="text-[14px] sm:text-[16px] font-black tracking-tighter sm:tracking-tight truncate">
                         <span className="inline sm:hidden">{variantInCart.quantity} IN BAG</span>
                         <span className="hidden sm:inline">{variantInCart.quantity} {variantInCart.quantity > 1 ? 'ITEMS' : 'ITEM'} IN BAG</span>
                       </span>
                    </div>

                    <button
                      onClick={handleIncreaseQuantity}
                      disabled={isAdding || !inStock}
                      className="w-12 h-full flex items-center justify-center hover:bg-black/10 active:bg-black/20 transition-colors disabled:opacity-50"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={
                    !inStock ||
                    !!disabled ||
                    isAdding ||
                    isBuyingNow ||
                    (!isValidVariant && product.options?.every(opt => options[opt.id]))
                  }
                  className="h-12 rounded-[30px] font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 min-w-0"
                  style={{ backgroundColor: '#8B5AB1' }}
                  onMouseEnter={(e) => {
                    if (!disabled && !isAdding && !isBuyingNow && inStock && (isValidVariant || !product.options?.every(opt => options[opt.id]))) {
                      e.currentTarget.style.backgroundColor = '#7a4a9a'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !isAdding && !isBuyingNow && inStock) {
                      e.currentTarget.style.backgroundColor = '#8B5AB1'
                    }
                  }}
                  data-testid="add-product-button"
                  data-ga-event="add_to_bag_click"
                  data-ga-label={product.title || "Product"}
                >
                  {isAdding ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <Image src="/cart.svg" alt="Cart" width={20} height={20} className="brightness-0 invert" />
                      {!selectedVariant || !isValidVariant
                        ? product.options?.every(opt => options[opt.id]) ? "Not Available" : "Select variant"
                        : !inStock
                          ? (inventoryLimit !== null && (inventoryLimit + quantityInCart) > 0 && quantity > inventoryLimit) 
                            ? (inventoryLimit <= 0 ? "Out of stock" : "No More Stock") 
                            : "Out of stock"
                          : `Add to Bag${quantity > 1 ? ` (${quantity})` : ''}`}
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleBuyNow}
                disabled={
                  !inStock ||
                  !!disabled ||
                  isAdding ||
                  isBuyingNow ||
                  (!isValidVariant && product.options?.every(opt => options[opt.id]))
                }
                className="h-12 flex-1 rounded-[30px] font-semibold text-gray-900 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1)] text-base group min-w-0 border border-[#8B5AB1]"
                style={{
                  backgroundColor: '#FAF5FF',
                  opacity: (!inStock || !!disabled || isAdding || isBuyingNow) ? 0.6 : 1
                }}
              >
                {isBuyingNow ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <div className="bg-purple-50 p-1.5 rounded-full group-hover:scale-110 transition-transform border border-purple-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5AB1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1.5"></circle>
                        <circle cx="20" cy="21" r="1.5"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                    </div>
                    <span>Buy Now</span>
                  </>
                )}
              </button>
            </div>
            </>
          )}
        </div>

        {/* Payment & Trust Badges - Perfectly Balanced Gap */}
        <div className="flex items-center justify-between py-2 px-4 bg-gray-50/60 rounded-xl border border-gray-100/80 mt-0.5 sm:-mt-1.5 mb-1 sm:mb-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image src="/Item.svg" alt="Mastercard" width={53} height={44} className="h-6 sm:h-7 w-auto grayscale-[0.2]" />
            <Image src="/Item (1).svg" alt="Amex" width={53} height={44} className="h-6 sm:h-7 w-auto grayscale-[0.2]" />
            <Image src="/Item (2).svg" alt="Diners" width={53} height={44} className="h-7 sm:h-7 w-auto grayscale-[0.2]" />
            <Image src="/visa.svg" alt="Visa" width={53} height={44} className="h-5 sm:h-6 w-auto grayscale-[0.2]" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-0">
             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#156229" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
               <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
               <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
             </svg>
             <span className="text-[9px] sm:text-[11px] font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Secure Payments</span>
          </div>
        </div>

        {/* Pincode Checker Section */}
        <div className="mt-0.5 sm:-mt-1.5 mb-0">
          <PincodeChecker variantId={selectedVariant?.id} />
        </div>

        {/* Service Features Section */}
        <div className="flex flex-row overflow-x-auto no-scrollbar py-4 border-t border-gray-200 gap-4 min-[500px]:gap-0 min-[500px]:justify-between min-[500px]:overflow-visible">
          {/* 7 Days Easy Return */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[120px] min-[500px]:flex-1 min-[500px]:min-w-0 group">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image src="/Return.svg" alt="Return" width={28} height={26} />
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveFeature('return')}>
              <span className="text-xs text-gray-800 font-medium text-center whitespace-nowrap leading-none">3 Days Easy Return</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-gray-600 group-hover:text-purple-600 transition-colors relative top-[-0.5px]">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          {/* Separator */}
          <div className="hidden min-[500px]:block w-px h-12 bg-gray-200 flex-shrink-0"></div>

          {/* Free Shipping */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[120px] min-[500px]:flex-1 min-[500px]:min-w-0 group">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image src="/delivery.svg" alt="Delivery" width={30} height={18} />
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveFeature('delivery')}>
              <span className="text-xs text-gray-800 font-medium text-center whitespace-nowrap leading-none">Free Shipping</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-gray-600 group-hover:text-purple-600 transition-colors relative top-[-0.5px]">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          {/* Separator */}
          <div className="hidden min-[500px]:block w-px h-12 bg-gray-200 flex-shrink-0"></div>

          {/* Cash On Delivery Available */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0 min-w-[120px] min-[500px]:flex-1 min-[500px]:min-w-0 group">
            <div className="w-8 h-8 flex items-center justify-center">
              <Image src="/Cod.svg" alt="COD" width={30} height={18} />
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveFeature('cod')}>
              <span className="text-xs text-gray-800 font-medium text-center whitespace-nowrap leading-none">Cash On Delivery Available</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-gray-600 group-hover:text-purple-600 transition-colors relative top-[-0.5px]">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Product Highlights Section - Refined Design */}
        <div className="flex flex-col gap-6 py-10 border-t border-gray-100/80 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#8B5AB1] to-[#A885C9]"></div>
            <h3 className="text-sm sm:text-base font-black text-gray-800 uppercase tracking-[0.2em]">Product highlights</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
            {(() => {
              // Extract unique colors from variants/options instead of metadata
              const colorOpt = product.options?.find(opt => 
                opt.title?.toLowerCase().includes('color') || 
                opt.title?.toLowerCase().includes('colour')
              )
              const variantColors = colorOpt?.values?.map(v => v.value).filter(Boolean) || []
              const uniqueColors = Array.from(new Set(variantColors))
              const colorValue = uniqueColors.length > 0 ? uniqueColors.join(', ') : null

              const highlights = [
                { id: 'type', label: "Type", value: product.metadata?.product_type, icon: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z' },
                { id: 'occasion', label: "Occasion", value: product.metadata?.occasion, icon: 'M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z' },
                { id: 'material', label: "Material", value: product.metadata?.material, icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
                { id: 'gender', label: "Gender", value: product.metadata?.gender, icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
                { id: 'color', label: "Available Colors", value: colorValue, icon: 'M12 2.25l-7.5 12.13a6.75 6.75 0 1015 0L12 2.25z' },
              ].filter(h => h.value)

              return highlights.map((highlight) => (
                <div 
                  key={highlight.id} 
                  className={clx(
                    "group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(139,90,177,0.15)] hover:border-purple-100 hover:-translate-y-1 transition-all duration-300",
                    highlight.id === 'color' && "col-span-2"
                  )}
                >
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FAF5FF] flex items-center justify-center group-hover:bg-purple-50 transition-all duration-300 shadow-inner overflow-hidden">
                    {highlight.id === 'color' ? (
                      <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform group-hover:scale-110 transition-transform duration-300">
                        {/* Palette Body */}
                        <path d="M75 55c0 15-12 27-27 27S21 70 21 55s12-27 27-27 27 12 27 27z" fill="#E8B088" stroke="#333" strokeWidth="3" />
                        
                        {/* Color Dots */}
                        <circle cx="40" cy="45" r="5" fill="#FF4D4D" stroke="#333" strokeWidth="1.5" /> {/* Red */}
                        <circle cx="56" cy="46" r="5" fill="#2ECC71" stroke="#333" strokeWidth="1.5" /> {/* Green */}
                        <circle cx="42" cy="62" r="5" fill="#3498DB" stroke="#333" strokeWidth="1.5" /> {/* Blue */}
                        <circle cx="58" cy="64" r="5" fill="#F06292" stroke="#333" strokeWidth="1.5" /> {/* Pink */}
                        
                        {/* Brush */}
                        <g transform="rotate(25 70 40)">
                          <rect x="68" y="15" width="6" height="35" rx="3" fill="#F39C12" stroke="#333" strokeWidth="2" /> {/* Handle */}
                          <path d="M68 12c0-4 3-8 3-8s3 4 3 8H68z" fill="#AED6F1" stroke="#333" strokeWidth="2" /> {/* Tip */}
                          <rect x="68" y="45" width="6" height="4" fill="#BDC3C7" stroke="#333" strokeWidth="1.5" /> {/* Ferrule */}
                        </g>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] sm:w-5 sm:h-5 text-[#8B5AB1]">
                        <path d={highlight.icon} />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[9px] sm:text-[10px] font-black text-gray-800 uppercase tracking-widest mb-0.5 sm:mb-1">{highlight.label}</span>
                    <div className="flex items-center gap-2">
                      {highlight.id === 'color' ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {String(highlight.value || '').split(/[,\s]+/).map((color, i) => {
                            const trimmedColor = color.trim().toLowerCase()
                            if (!trimmedColor) return null
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <div 
                                  className="w-3.5 h-3.5 rounded-full border border-gray-100 shadow-sm"
                                  style={{ backgroundColor: trimmedColor }}
                                />
                                <span className="text-sm text-gray-800 font-semibold capitalize leading-none tracking-tight">{trimmedColor}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-800 font-semibold capitalize tracking-tight truncate">
                          {String(highlight.value || '').replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>

        {/* Feature Modal / Drawer */}
        <SidePanel
          isOpen={!!activeFeature}
          onClose={() => setActiveFeature(null)}
          title={
            activeFeature === 'return' ? '3 Days Easy Return' :
              activeFeature === 'delivery' ? 'Free Shipping' :
                activeFeature === 'cod' ? 'Cash On Delivery' :
                  activeFeature === 'size_chart' ? 'Size Guide' : ''
          }
        >
          {activeFeature === 'return' && (
            <div className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-900 leading-relaxed font-medium">
                  We offer a hassle-free 3-day return policy for all our customers. If you're not satisfied with your purchase, we're here to help!
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-gray-700">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Unused Conditions</h4>
                    <p className="text-sm text-gray-600">Items must be returned in their original condition, unused, and with all tags intact.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-gray-700">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Easy Process</h4>
                    <p className="text-sm text-gray-600">Raise a return request from your account or contact our support team directly.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-gray-700">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Quick Refund</h4>
                    <p className="text-sm text-gray-600">Once the quality check is completed, your refund will be processed within 24–48 hours. The amount may take a few business days to reflect in your account depending on your bank.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeature === 'delivery' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-900 leading-relaxed font-medium">
                  Enjoy free shipping on eligible orders! We ensure your purchase reaches you safely and on time.
                </p>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                      <path d="M12 2v20m10-10H2"></path>
                    </svg>
                    Order Processing
                  </h4>
                  <p className="text-sm text-gray-600 pl-7">Most orders are processed and dispatched within 24 hours of placement.</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Average Timelines
                  </h4>
                  <ul className="text-sm text-gray-600 pl-7 space-y-2 list-disc">
                    <li>Metro Cities: 2-3 business days</li>
                    <li>Tier 2 Cities: 4-5 business days</li>
                    <li>Rest of India: 5-7 business days</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Live Tracking
                  </h4>
                  <p className="text-sm text-gray-600 pl-7">You will receive a real-time tracking link via Email & WhatsApp once your order is shipped.</p>
                </div>
              </div>
            </div>
          )}

          {activeFeature === 'cod' && (
            <div className="space-y-6">
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-sm text-green-900 leading-relaxed font-medium">
                  Shop with confidence! Pay only when you receive your package at your doorstep.
                </p>
              </div>
              <div className="space-y-5">
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#FFFAFE] rounded-lg shadow-sm flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                      <line x1="2" y1="10" x2="22" y2="10"></line>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Zero Upfront Cost</h4>
                    <p className="text-xs text-gray-500">No need for credit cards or online payments to place your order.</p>
                  </div>
                </div>
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#FFFAFE] rounded-lg shadow-sm flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Safe & Secure</h4>
                    <p className="text-xs text-gray-500">Verify your package and then pay our delivery partner directly.</p>
                  </div>
                </div>
                <ul className="text-xs text-gray-500 italic space-y-1 pl-4 list-disc">
                  <li>Available for orders up to ₹10,000.</li>
                  <li>Please keep the exact change ready for a smoother experience.</li>
                  <li>Only cash payments are accepted for COD.</li>
                </ul>
              </div>
            </div>
          )}

          {activeFeature === 'size_chart' && (
            <div className="flex flex-col h-full">
              {/* Tip Section */}
              <div className="mb-8 bg-gradient-to-r from-purple-50 to-[#FFFAFE] p-4 rounded-xl border border-purple-100 flex gap-3 shadow-sm">
                <div className="text-xl">💡</div>
                <div className="flex-1">
                  <h4 className="text-purple-900 font-bold text-sm mb-1">Pro Tip</h4>
                  <p className="text-xs text-purple-700 leading-relaxed font-medium">
                    Kids grow fast! If your child is between sizes, we always recommend choosing the larger size for a longer-lasting fit.
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                {/* Infants Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#8B5AB1]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">Infants (0-24 Months)</h4>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="p-4 font-bold text-gray-900 text-xs uppercase tracking-wider">Age</th>
                          <th className="p-4 font-bold text-gray-900 text-xs uppercase tracking-wider text-center">Height</th>
                          <th className="p-4 font-bold text-gray-900 text-xs uppercase tracking-wider text-center">Weight</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-[#FFFAFE]">
                        {[
                          { age: 'Newborn', h: '45 - 52 cm', w: '2.5 - 3.5 kg' },
                          { age: '0-3 Months', h: '52 - 60 cm', w: '3.5 - 5.5 kg' },
                          { age: '3-6 Months', h: '60 - 68 cm', w: '5.5 - 7.5 kg' },
                          { age: '6-12 Months', h: '68 - 76 cm', w: '7.5 - 10 kg' },
                          { age: '12-18 Months', h: '76 - 83 cm', w: '10 - 12 kg' },
                          { age: '18-24 Months', h: '83 - 90 cm', w: '12 - 14 kg' },
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                            <td className="p-4 font-semibold text-gray-900">{row.age}</td>
                            <td className="p-4 text-center text-gray-600">{row.h}</td>
                            <td className="p-4 text-center text-gray-600 font-medium">{row.w}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Toddlers Section */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#8B5AB1]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">Toddlers (2-6 Years)</h4>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="p-4 font-bold text-gray-900 text-xs uppercase tracking-wider">Age</th>
                          <th className="p-4 font-bold text-gray-900 text-xs uppercase tracking-wider text-center">Height</th>
                          <th className="p-4 font-bold text-gray-900 text-xs uppercase tracking-wider text-center">Chest</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-[#FFFAFE]">
                        {[
                          { age: '2-3 Years', h: '90 - 98 cm', c: '52 - 54 cm' },
                          { age: '3-4 Years', h: '98 - 104 cm', c: '54 - 56 cm' },
                          { age: '4-5 Years', h: '104 - 110 cm', c: '56 - 58 cm' },
                          { age: '5-6 Years', h: '110 - 116 cm', c: '58 - 60 cm' },
                        ].map((row, i) => (
                          <tr key={i} className="hover:bg-purple-50/30 transition-colors">
                            <td className="p-4 font-semibold text-gray-900">{row.age}</td>
                            <td className="p-4 text-center text-gray-600">{row.h}</td>
                            <td className="p-4 text-center text-gray-600 font-medium">{row.c}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SidePanel>



        {/* Description Section */}
        {product.description && (
          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
            <button
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider">Description</h3>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${isDescriptionOpen ? 'rotate-45' : ''}`}
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            {isDescriptionOpen && (
              <div className="text-sm text-gray-800 leading-relaxed">
                <div
                  className="mb-3 whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: product.description
                      ? product.description.replace(/\n/g, '<br />')
                      : ''
                  }}
                />
                {(() => {
                  const features = product.metadata?.features
                  if (!features) return null

                  if (typeof features === 'string') {
                    return (
                      <ul className="list-disc list-inside space-y-1 text-gray-800">
                        {features.split(',').map((feature: string, index: number) => (
                          <li key={index}>{feature.trim()}</li>
                        ))}
                      </ul>
                    )
                  }

                  if (Array.isArray(features)) {
                    return (
                      <ul className="list-disc list-inside space-y-1 text-gray-800">
                        {(features as string[]).map((feature: string, index: number) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    )
                  }

                  return null
                })()}
              </div>
            )}
          </div>
        )}

        {/* Care Guide Section */}

        {/* Care Guide Section */}
        {product.metadata?.care_guide && (
          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
            <button
              onClick={() => setIsCareGuideOpen(!isCareGuideOpen)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider">Care Guide</h3>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${isCareGuideOpen ? 'rotate-45' : ''}`}
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            {isCareGuideOpen && (
              <div className="text-sm text-gray-800 leading-relaxed">
                {(() => {
                  const careGuide = product.metadata.care_guide
                  if (!careGuide) return null

                  const careGuideStr = typeof careGuide === 'string' ? careGuide : String(careGuide)

                  // Check if it's comma-separated or newline-separated
                  const items = careGuideStr.includes(',')
                    ? careGuideStr.split(',').map(item => item.trim()).filter(Boolean)
                    : careGuideStr.includes('\n')
                      ? careGuideStr.split('\n').map(item => item.trim()).filter(Boolean)
                      : [careGuideStr]

                  if (items.length > 1) {
                    return (
                      <ul className="list-disc list-inside space-y-1 text-gray-800">
                        {items.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    )
                  }

                  return <p>{careGuideStr}</p>
                })()}
              </div>
            )}
          </div>
        )}

        {/* Ratings Section */}
        <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-wider">Ratings</h3>
          <div className="text-sm text-gray-800 leading-relaxed">
            <RatingsTab product={product} />
          </div>
        </div>


      </div>

      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        countryCode={countryCode}
      />
    </>
  )
}
