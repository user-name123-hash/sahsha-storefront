"use client"

import { useCallback, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { trackAddToCart } from "@core/analytics/ga4-ecommerce"
import { buildAddToCartPayload } from "@core/analytics/mappers"
import {
  type ProductOptions,
  isValidVariantSelection,
} from "@core/domain/product/variant-selection"
import { type VariantPrice } from "@core/domain/product/pricing"
import { addToCartWithSizeFallback } from "@lib/data/cart/add-to-cart-with-fallback"
import { buyNowWithSizeFallback } from "@lib/data/cart/buy-now-with-fallback"
import { updateLineItem, deleteLineItem } from "@core/data/cart"
import {
  findCartLineForSelection,
  getAddToCartPayloadFromResolution,
  isVariantPurchasable,
  resolveSizeFallback,
} from "@lib/util/size-fallback"

type UseProductActionsOptions = {
  product: HttpTypes.StoreProduct
  region?: HttpTypes.StoreRegion
  cart?: HttpTypes.StoreCart | null
  selectedVariant?: HttpTypes.StoreProductVariant
  options: ProductOptions
  isValidVariant: boolean
  displayPrice: VariantPrice | null
  validateOptions: () => boolean
}

export function useProductActions({
  product,
  region,
  cart,
  selectedVariant,
  options,
  isValidVariant,
  displayPrice,
  validateOptions,
}: UseProductActionsOptions) {
  const { countryCode } = useParams() as { countryCode: string }
  const [isAdding, setIsAdding] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const variantInCart = useMemo(
    () => findCartLineForSelection(cart, product, selectedVariant, options),
    [cart, product, selectedVariant, options]
  )

  const quantityInCart = useMemo(() => variantInCart?.quantity || 0, [variantInCart])

  const inStock = useMemo(
    () =>
      isVariantPurchasable({
        product,
        selectedVariant,
        options,
        quantity,
        cart,
      }),
    [product, selectedVariant, options, quantity, cart]
  )

  const inventoryLimit = useMemo(() => {
    if (!selectedVariant) {
      return null
    }

    const resolution = resolveSizeFallback({
      product,
      selectedVariant,
      options,
      quantity,
      cart,
    })

    if (resolution.status === "out_of_stock") {
      return 0
    }

    const stockVariant = resolution.variant

    if (!stockVariant.manage_inventory || stockVariant.allow_backorder) {
      return null
    }

    const totalInventory = stockVariant.inventory_quantity || 0
    const qtyInCart =
      cart?.items?.find((item) => item.variant_id === stockVariant.id)?.quantity ??
      0

    return totalInventory - qtyInCart
  }, [selectedVariant, product, options, quantity, cart])

  const trackCartAdd = useCallback(
    (variant: HttpTypes.StoreProductVariant) => {
      if (!variant.id) {
        return
      }

      trackAddToCart(
        buildAddToCartPayload({
          itemId: variant.id,
          itemName: product.title ?? "",
          itemVariant: selectedVariant?.title ?? variant.title ?? undefined,
          quantity,
          unitPriceMinor: displayPrice?.calculated_price_number ?? 0,
          currency: region?.currency_code ?? "USD",
        })
      )
    },
    [selectedVariant, region, displayPrice, quantity, product.title]
  )

  const resolveAndValidate = useCallback(() => {
    if (!validateOptions() || !selectedVariant?.id) {
      return null
    }

    const resolution = resolveSizeFallback({
      product,
      selectedVariant,
      options,
      quantity,
      cart,
    })

    if (resolution.status === "out_of_stock") {
      return null
    }

    return resolution
  }, [validateOptions, selectedVariant, product, options, quantity, cart])

  const handleAddToCart = useCallback(async () => {
    const resolution = resolveAndValidate()
    if (!resolution) {
      return null
    }

    setIsAdding(true)

    try {
      const payload = getAddToCartPayloadFromResolution(resolution, quantity)

      await addToCartWithSizeFallback({
        ...payload,
        countryCode,
      })

      trackCartAdd(selectedVariant!)
    } finally {
      setIsAdding(false)
    }
  }, [
    resolveAndValidate,
    quantity,
    countryCode,
    trackCartAdd,
    selectedVariant,
  ])

  const handleBuyNow = useCallback(async () => {
    const resolution = resolveAndValidate()
    if (!resolution) {
      return null
    }

    setIsBuyingNow(true)

    try {
      const payload = getAddToCartPayloadFromResolution(resolution, quantity)

      await buyNowWithSizeFallback({
        ...payload,
        countryCode,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsBuyingNow(false)
    }
  }, [resolveAndValidate, quantity, countryCode])

  const handleIncreaseQuantity = useCallback(async () => {
    if (!variantInCart || isAdding) {
      return
    }

    setIsAdding(true)
    try {
      await updateLineItem({
        lineId: variantInCart.id,
        quantity: variantInCart.quantity + 1,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsAdding(false)
    }
  }, [variantInCart, isAdding])

  const handleDecreaseQuantity = useCallback(async () => {
    if (!variantInCart || isAdding) {
      return
    }

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
    } catch (error) {
      console.error(error)
    } finally {
      setIsAdding(false)
    }
  }, [variantInCart, isAdding])

  const canAddToCart = useMemo(() => {
    const allOptionsSelected = product.options?.every((opt) => options[opt.id])
    return (
      inStock &&
      isValidVariant &&
      isValidVariantSelection(product, options) &&
      (!product.options?.length || allOptionsSelected)
    )
  }, [inStock, isValidVariant, product, options])

  return {
    quantity,
    setQuantity,
    isAdding,
    isBuyingNow,
    variantInCart,
    quantityInCart,
    inStock,
    inventoryLimit,
    handleAddToCart,
    handleBuyNow,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    canAddToCart,
  }
}
