import { NextRequest, NextResponse } from "next/server"
import { listCategories } from "@core/data/categories"
import { listCollections } from "@core/data/collections"
import { listProducts } from "@core/data/products"
import { getProductPrice } from "@core/util/get-product-price"
import { getCollectionImage } from "@lib/category-collection-images"

export const TRENDING_PRODUCT_LIMIT = 12
export const COLLECTION_LIMIT = 100

export async function GET(req: NextRequest) {
  const countryCode = req.nextUrl.searchParams.get("countryCode") || "in"
  const categoryId = req.nextUrl.searchParams.get("categoryId")?.trim() || ""

  try {
    const [categories, collectionsResult, productsResult] = await Promise.all([
      listCategories(),
      listCollections({ limit: String(COLLECTION_LIMIT) }),
      listProducts({
        countryCode,
        queryParams: {
          limit: TRENDING_PRODUCT_LIMIT,
          order: "-created_at",
          ...(categoryId ? { category_id: categoryId } : {}),
        },
      }),
    ])

    const categoryOptions = categories
      .filter((category) => !category.parent_category_id)
      .map((category) => ({
        id: category.id,
        name: category.name || "Category",
      }))

    const products = productsResult.response.products.map((product) => {
      const price = getProductPrice({ product })
      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        thumbnail: product.thumbnail,
        price: price.cheapestPrice?.calculated_price ?? null,
      }
    })

    const collections = (collectionsResult.collections ?? []).map((collection) => ({
      id: collection.id,
      title: collection.title || "Collection",
      imageUrl: getCollectionImage(collection),
    }))

    return NextResponse.json({
      categories: categoryOptions,
      collections,
      products,
    })
  } catch {
    return NextResponse.json({
      categories: [],
      collections: [],
      products: [],
    })
  }
}
