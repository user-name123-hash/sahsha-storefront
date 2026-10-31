import { sdk } from "@core/config"
import { getCacheOptions } from "@core/data/cookies"
import { HttpTypes } from "@medusajs/types"

type ProductWithCategories = HttpTypes.StoreProduct & {
  categories?: HttpTypes.StoreProductCategory[]
}

async function fetchProductCategories(
  productId: string
): Promise<HttpTypes.StoreProductCategory[]> {
  try {
    const next = await getCacheOptions("categories")

    const { product } = await sdk.client.fetch<{
      product: ProductWithCategories
    }>(`/store/products/${productId}`, {
      query: {
        fields: "*categories,+categories.metadata",
      },
      next: {
        ...next,
        revalidate: 300,
      },
      cache: "force-cache",
    })

    return product?.categories ?? []
  } catch {
    return []
  }
}

async function fetchCategoryWithMetadata(
  categoryId: string
): Promise<HttpTypes.StoreProductCategory | null> {
  try {
    const next = await getCacheOptions("categories")

    const { product_categories } = await sdk.client.fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
    }>("/store/product-categories", {
      query: {
        id: categoryId,
        fields: "+metadata,*parent_category,+parent_category.metadata",
      },
      next: {
        ...next,
        revalidate: 300,
      },
      cache: "force-cache",
    })

    return product_categories?.[0] ?? null
  } catch {
    return null
  }
}

function categoryHasSizeChart(
  category: HttpTypes.StoreProductCategory | null | undefined
): boolean {
  const raw = category?.metadata?.size_chart
  return typeof raw === "string" && raw.trim().length > 0
}

/**
 * Resolve the best category for size-chart fallback.
 * Prefer a category that already has size_chart; otherwise first linked category.
 * Walks parent categories if the leaf has no chart.
 */
export async function getProductPrimaryCategory(
  product: HttpTypes.StoreProduct
): Promise<HttpTypes.StoreProductCategory | null> {
  let categories = product.categories ?? []

  if (!categories.length && product.id) {
    categories = await fetchProductCategories(product.id)
  }

  if (!categories.length) return null

  for (const category of categories) {
    const full = categoryHasSizeChart(category)
      ? category
      : (await fetchCategoryWithMetadata(category.id)) ?? category

    if (categoryHasSizeChart(full)) return full

    const parent = (full as HttpTypes.StoreProductCategory & {
      parent_category?: HttpTypes.StoreProductCategory | null
    }).parent_category

    if (parent) {
      const fullParent = categoryHasSizeChart(parent)
        ? parent
        : parent.id
          ? await fetchCategoryWithMetadata(parent.id)
          : null

      if (categoryHasSizeChart(fullParent)) return fullParent
    }
  }

  const first = categories[0]
  if (categoryHasSizeChart(first)) return first

  return (await fetchCategoryWithMetadata(first.id)) ?? first
}

export function mergeProductPrimaryCategoryMetadata(
  product: HttpTypes.StoreProduct,
  category: HttpTypes.StoreProductCategory | null
): HttpTypes.StoreProduct {
  if (!category) return product

  const existing = product.categories ?? []
  const alreadyLinked = existing.some((c) => c.id === category.id)

  const categories = alreadyLinked
    ? existing.map((c) =>
        c.id === category.id
          ? {
              ...c,
              metadata: {
                ...(c.metadata || {}),
                ...(category.metadata || {}),
              },
            }
          : c
      )
    : [category, ...existing]

  return {
    ...product,
    categories,
  }
}
