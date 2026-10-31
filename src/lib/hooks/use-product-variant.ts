"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import {
  type ProductOptions,
  getInitialOptions,
  findVariantByOptions,
  isValidVariantSelection,
  findColorOption,
  findSizeOption,
  getUniqueColorVariants,
  getOtherOptions,
  getMissingOptionIds,
} from "@core/domain/product/variant-selection"
import { useProductContext } from "@modules/products/context/product-context"

type UseProductVariantOptions = {
  product: HttpTypes.StoreProduct
}

/**
 * Local copy of @core/hooks/use-product-variant with a URL-sync guard.
 *
 * Next.js 15 syncs history.replaceState into useSearchParams. Comparing
 * `params.get("v_id") === value` fails when both are missing because
 * `null === undefined` is false — causing an infinite replaceState → RSC loop.
 */
export function useProductVariant({ product }: UseProductVariantOptions) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variantIdFromUrl = searchParams.get("v_id")
  const { setSelectedVariantId, setSelectedOptions } = useProductContext()

  const [options, setOptions] = useState<ProductOptions>(() =>
    getInitialOptions(product, variantIdFromUrl)
  )
  const [validationErrors, setValidationErrors] = useState<
    Record<string, boolean>
  >({})

  useEffect(() => {
    if (variantIdFromUrl && product.variants) {
      const variantFromUrl = product.variants.find(
        (v) => v.id === variantIdFromUrl
      )
      if (variantFromUrl) {
        setOptions(getInitialOptions(product, variantIdFromUrl))
      }
    }
  }, [product, variantIdFromUrl])

  const selectedVariant = useMemo(
    () => findVariantByOptions(product, options),
    [product, options]
  )

  const isValidVariant = useMemo(
    () => isValidVariantSelection(product, options),
    [product, options]
  )

  useEffect(() => {
    setSelectedOptions(options)
  }, [options, setSelectedOptions])

  const setOptionValue = useCallback((optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
    setValidationErrors((prev) => ({
      ...prev,
      [optionId]: false,
    }))
  }, [])

  const setColorValue = useCallback((colorOptionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [colorOptionId]: value,
    }))
    setValidationErrors((prev) => ({
      ...prev,
      [colorOptionId]: false,
    }))
  }, [])

  const validateOptions = useCallback(() => {
    const missing = getMissingOptionIds(product, options)
    if (Object.keys(missing).length > 0) {
      setValidationErrors(missing)
      return false
    }
    return true
  }, [product, options])

  useEffect(() => {
    const value = isValidVariant ? selectedVariant?.id : undefined
    // Normalize missing query to undefined — never compare null === undefined
    const current = variantIdFromUrl ?? undefined

    setSelectedVariantId(value)

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
  }, [
    selectedVariant,
    isValidVariant,
    pathname,
    searchParams,
    setSelectedVariantId,
    variantIdFromUrl,
  ])

  const colorOption = useMemo(() => findColorOption(product), [product])
  const sizeOption = useMemo(() => findSizeOption(product), [product])
  const otherOptions = useMemo(() => getOtherOptions(product), [product])

  const colorVariants = useMemo(() => {
    if (!colorOption) {
      return []
    }
    return getUniqueColorVariants(product, colorOption)
  }, [product, colorOption])

  const selectedColorValue = useMemo(() => {
    if (!colorOption) {
      return null
    }
    return options[colorOption.id]
  }, [options, colorOption])

  return {
    options,
    setOptions,
    setOptionValue,
    setColorValue,
    selectedVariant,
    isValidVariant,
    validationErrors,
    setValidationErrors,
    validateOptions,
    colorOption,
    sizeOption,
    otherOptions,
    colorVariants,
    selectedColorValue,
  }
}
