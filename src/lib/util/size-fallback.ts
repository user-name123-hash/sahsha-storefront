import { HttpTypes } from "@medusajs/types"
import {
  findSizeOption,
  findVariantByOptions,
  isVariantInStock,
  type ProductOptions,
} from "@core/domain/product/variant-selection"

export const SIZE_FALLBACK_METADATA = {
  customerSelectedSize: "customer_selected_size",
  actualInventorySize: "actual_inventory_size",
} as const

export const ORDER_FALLBACK_METADATA = {
  summary: "size_fallback_summary",
  details: "size_fallback_details",
} as const

export const DEFAULT_SIZE_ORDER = ["S", "M", "L", "XL", "XXL", "XXS", "XS", "2XL", "3XL"]

export type SizeFallbackLineMetadata = {
  [SIZE_FALLBACK_METADATA.customerSelectedSize]: string
  [SIZE_FALLBACK_METADATA.actualInventorySize]: string
}

export type SizeFallbackResolution =
  | {
      status: "direct"
      variant: HttpTypes.StoreProductVariant
      metadata?: undefined
    }
  | {
      status: "fallback"
      variant: HttpTypes.StoreProductVariant
      metadata: SizeFallbackLineMetadata
    }
  | { status: "out_of_stock" }

export type SizeFallbackOrderDetail = {
  product: string
  customer_size: string
  actual_size: string
  variant_id: string
}

export function parseSizeOrder(product: HttpTypes.StoreProduct): string[] {
  const raw = product.metadata?.size_order

  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  }

  if (Array.isArray(raw)) {
    return raw.map((value) => String(value).trim()).filter(Boolean)
  }

  const sizeOption = findSizeOption(product)
  if (sizeOption?.values?.length) {
    return sizeOption.values
      .map((value) => value.value)
      .filter((value): value is string => Boolean(value))
  }

  return DEFAULT_SIZE_ORDER
}

export function getSizeFromVariant(
  variant: HttpTypes.StoreProductVariant | undefined,
  product: HttpTypes.StoreProduct
): string | null {
  const sizeOption = findSizeOption(product)
  if (!sizeOption || !variant) {
    return null
  }

  return (
    variant.options?.find((option) => option.option_id === sizeOption.id)?.value ??
    null
  )
}

export function getImmediateNextSize(
  currentSize: string,
  sizeOrder: string[]
): string | null {
  const normalized = currentSize.trim().toLowerCase()
  const index = sizeOrder.findIndex(
    (size) => size.trim().toLowerCase() === normalized
  )

  if (index === -1 || index >= sizeOrder.length - 1) {
    return null
  }

  return sizeOrder[index + 1]
}

export function getVariantQuantityInCart(
  cart: HttpTypes.StoreCart | null | undefined,
  variantId: string | undefined
): number {
  if (!cart?.items?.length || !variantId) {
    return 0
  }

  return (
    cart.items.find((item) => item.variant_id === variantId)?.quantity ?? 0
  )
}

export function findCartLineForSelection(
  cart: HttpTypes.StoreCart | null | undefined,
  product: HttpTypes.StoreProduct,
  selectedVariant?: HttpTypes.StoreProductVariant,
  options?: ProductOptions
): HttpTypes.StoreCartLineItem | null {
  if (!cart?.items?.length) {
    return null
  }

  const sizeOption = findSizeOption(product)
  const customerSize =
    (sizeOption && options?.[sizeOption.id]) ||
    getSizeFromVariant(selectedVariant, product)

  if (customerSize) {
    const metadataMatch = cart.items.find(
      (item) =>
        item.product_id === product.id &&
        item.metadata?.[SIZE_FALLBACK_METADATA.customerSelectedSize] ===
          customerSize
    )

    if (metadataMatch) {
      return metadataMatch
    }
  }

  if (selectedVariant?.id) {
    return cart.items.find((item) => item.variant_id === selectedVariant.id) ?? null
  }

  return null
}

export function getCartExcludingLineItem(
  cart: HttpTypes.StoreCart | null | undefined,
  lineItemId: string
): HttpTypes.StoreCart | null {
  if (!cart) {
    return null
  }

  return {
    ...cart,
    items: cart.items?.filter((lineItem) => lineItem.id !== lineItemId) ?? [],
  }
}

export function mergeFreshProductInventory(
  product: HttpTypes.StoreProduct,
  freshProduct?: HttpTypes.StoreProduct | null
): HttpTypes.StoreProduct {
  if (!freshProduct?.variants?.length || !product.variants?.length) {
    return product
  }

  const inventoryById = new Map(
    freshProduct.variants
      .filter((variant) => variant.id)
      .map((variant) => [variant.id!, variant])
  )

  return {
    ...product,
    variants: product.variants.map((variant) => {
      const freshVariant = variant.id ? inventoryById.get(variant.id) : undefined
      return freshVariant ? { ...variant, ...freshVariant } : variant
    }),
  }
}

export function getCustomerFacingCartOptions(
  item: HttpTypes.StoreCartLineItem,
  product?: HttpTypes.StoreProduct | null
): Record<string, string> {
  const variantOptions = item.variant?.options
    ? item.variant.options.reduce((acc: Record<string, string>, option) => {
        if (option.option_id && option.value) {
          acc[option.option_id] = option.value
        }
        return acc
      }, {})
    : {}

  const sizeOption = product ? findSizeOption(product) : undefined
  const customerSize = item.metadata?.[SIZE_FALLBACK_METADATA.customerSelectedSize]

  if (
    sizeOption &&
    typeof customerSize === "string" &&
    customerSize &&
    variantOptions[sizeOption.id]
  ) {
    variantOptions[sizeOption.id] = customerSize
  }

  return variantOptions
}

export function hasSizeFallbackMetadata(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  return Boolean(
    metadata?.[SIZE_FALLBACK_METADATA.customerSelectedSize] &&
      metadata?.[SIZE_FALLBACK_METADATA.actualInventorySize]
  )
}

export function resolveSizeFallback({
  product,
  selectedVariant,
  options,
  quantity,
  cart,
}: {
  product: HttpTypes.StoreProduct
  selectedVariant: HttpTypes.StoreProductVariant
  options: ProductOptions
  quantity: number
  cart?: HttpTypes.StoreCart | null
}): SizeFallbackResolution {
  const selectedLine = findCartLineForSelection(
    cart,
    product,
    selectedVariant,
    options
  )
  const selectedQtyInCart = selectedLine?.quantity ?? 0

  if (
    isVariantInStock(
      selectedVariant,
      product,
      quantity,
      selectedQtyInCart
    )
  ) {
    return { status: "direct", variant: selectedVariant }
  }

  const sizeOption = findSizeOption(product)
  if (!sizeOption) {
    return { status: "out_of_stock" }
  }

  const customerSize =
    options[sizeOption.id] ?? getSizeFromVariant(selectedVariant, product)

  if (!customerSize) {
    return { status: "out_of_stock" }
  }

  const nextSize = getImmediateNextSize(customerSize, parseSizeOrder(product))
  if (!nextSize) {
    return { status: "out_of_stock" }
  }

  const fallbackOptions: ProductOptions = {
    ...options,
    [sizeOption.id]: nextSize,
  }

  const fallbackVariant = findVariantByOptions(product, fallbackOptions)
  if (!fallbackVariant) {
    return { status: "out_of_stock" }
  }

  const fallbackQtyInCart = getVariantQuantityInCart(cart, fallbackVariant.id)

  if (
    !isVariantInStock(
      fallbackVariant,
      product,
      quantity,
      fallbackQtyInCart
    )
  ) {
    return { status: "out_of_stock" }
  }

  return {
    status: "fallback",
    variant: fallbackVariant,
    metadata: {
      [SIZE_FALLBACK_METADATA.customerSelectedSize]: customerSize,
      [SIZE_FALLBACK_METADATA.actualInventorySize]: nextSize,
    },
  }
}

export function isVariantPurchasable({
  product,
  selectedVariant,
  options,
  quantity,
  cart,
}: {
  product: HttpTypes.StoreProduct
  selectedVariant?: HttpTypes.StoreProductVariant
  options: ProductOptions
  quantity: number
  cart?: HttpTypes.StoreCart | null
}): boolean {
  if (!selectedVariant) {
    return Boolean(product.variants?.length)
  }

  return (
    resolveSizeFallback({
      product,
      selectedVariant,
      options,
      quantity,
      cart,
    }).status !== "out_of_stock"
  )
}

export function getCustomerFacingVariantTitle(
  lineItem:
    | HttpTypes.StoreCartLineItem
    | HttpTypes.StoreOrderLineItem
    | {
        variant?: HttpTypes.StoreProductVariant
        metadata?: Record<string, unknown> | null
        title?: string
        variant_title?: string | null
      }
): string {
  const metadata = lineItem.metadata
  const customerSize = metadata?.[SIZE_FALLBACK_METADATA.customerSelectedSize]
  const actualSize = metadata?.[SIZE_FALLBACK_METADATA.actualInventorySize]
  const variantTitle =
    lineItem.variant?.title ??
    ("variant_title" in lineItem && lineItem.variant_title
      ? lineItem.variant_title
      : undefined) ??
    lineItem.title ??
    ""

  if (
    typeof customerSize !== "string" ||
    !customerSize ||
    typeof actualSize !== "string" ||
    !actualSize
  ) {
    return variantTitle
  }

  if (variantTitle.includes(actualSize)) {
    return variantTitle.replace(actualSize, customerSize)
  }

  const sizeOptionValue = lineItem.variant?.options?.find((option) =>
    option.value?.toLowerCase() === actualSize.toLowerCase()
  )

  if (sizeOptionValue?.value) {
    return variantTitle.replace(sizeOptionValue.value, customerSize)
  }

  return variantTitle ? `${variantTitle} (${customerSize})` : customerSize
}

export function buildOrderSizeFallbackMetadata(
  items: Array<
    | HttpTypes.StoreCartLineItem
    | HttpTypes.StoreOrderLineItem
    | {
        product_title?: string
        title?: string
        variant_id?: string
        metadata?: Record<string, unknown> | null
      }
  >
): {
  summary: string | null
  details: SizeFallbackOrderDetail[]
} {
  const details: SizeFallbackOrderDetail[] = []

  for (const item of items) {
    if (!hasSizeFallbackMetadata(item.metadata)) {
      continue
    }

    const customerSize = String(
      item.metadata?.[SIZE_FALLBACK_METADATA.customerSelectedSize]
    )
    const actualSize = String(
      item.metadata?.[SIZE_FALLBACK_METADATA.actualInventorySize]
    )
    const productTitle =
      ("product_title" in item && item.product_title) ||
      item.title ||
      "Product"

    details.push({
      product: productTitle,
      customer_size: customerSize,
      actual_size: actualSize,
      variant_id: item.variant_id ?? "",
    })
  }

  if (!details.length) {
    return { summary: null, details: [] }
  }

  const summary = details
    .map(
      (entry) =>
        `${entry.product}: Customer selected ${entry.customer_size}, ship ${entry.actual_size}`
    )
    .join("\n")

  return { summary, details }
}

export function getAddToCartPayloadFromResolution(
  resolution: SizeFallbackResolution,
  quantity: number
): {
  variantId: string
  quantity: number
  metadata?: SizeFallbackLineMetadata
} {
  if (resolution.status === "out_of_stock") {
    throw new Error("Selected size is out of stock")
  }

  return {
    variantId: resolution.variant.id!,
    quantity,
    metadata: resolution.metadata,
  }
}
