import { NextRequest, NextResponse } from "next/server"
import { listProducts } from "@core/data/products"
import { listCollections } from "@core/data/collections"
import { getProductPrice } from "@core/util/get-product-price"

const MIN_QUERY_LENGTH = 2
const MAX_PRODUCTS = 8
const MAX_COLLECTIONS = 8
const MAX_SUGGESTIONS = 8
const SEARCH_FETCH_LIMIT = 40

function matchScore(text: string, query: string): number {
  const t = text.toLowerCase().trim()
  const q = query.toLowerCase().trim()
  if (!t || !q) return 0

  if (t === q) return 200
  if (t.startsWith(q)) return 150

  const words = t.split(/\s+/)
  if (words.some((w) => w.startsWith(q))) return 120

  const queryWords = q.split(/\s+/).filter(Boolean)
  const allWordsMatch = queryWords.every((qw) =>
    words.some((w) => w.startsWith(qw) || w.includes(qw))
  )
  if (allWordsMatch) return 90

  if (t.includes(q)) return 40
  return 0
}

function productMatchScore(
  product: {
    title?: string | null
    description?: string | null
    subtitle?: string | null
    handle?: string | null
    tags?: { value?: string | null }[] | null
  },
  query: string
): number {
  const fields = [
    product.title || "",
    product.description || "",
    product.subtitle || "",
    product.handle?.replace(/-/g, " ") || "",
    ...(product.tags?.map((tag) => tag.value || "") || []),
  ]

  return Math.max(...fields.map((field) => matchScore(field, query)), 0)
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || ""
  const countryCode = req.nextUrl.searchParams.get("countryCode") || "in"

  if (!q || q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({
      suggestions: [],
      products: [],
      collections: [],
    })
  }

  try {
    const [productsResult, collectionsResult] = await Promise.all([
      listProducts({
        countryCode,
        queryParams: { q, limit: SEARCH_FETCH_LIMIT },
      }),
      listCollections({ limit: "100" }),
    ])

    const rankedProducts = productsResult.response.products
      .map((product) => ({
        product,
        score: productMatchScore(product, q),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PRODUCTS)
      .map(({ product }) => {
        const price = getProductPrice({ product })
        return {
          id: product.id,
          title: product.title,
          handle: product.handle,
          thumbnail: product.thumbnail,
          price: price.cheapestPrice?.calculated_price ?? null,
        }
      })

    const rankedCollections = collectionsResult.collections
      .map((collection) => ({
        collection,
        score: matchScore(collection.title || "", q),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_COLLECTIONS)
      .map(({ collection }) => {
        const metadata = (collection.metadata || {}) as Record<string, string>
        return {
          id: collection.id,
          title: collection.title,
          handle: collection.handle,
          image:
            metadata.image || (collection as { thumbnail?: string }).thumbnail || null,
        }
      })

    const suggestionSet = new Map<string, number>()
    for (const p of rankedProducts) {
      if (p.title) suggestionSet.set(p.title, matchScore(p.title, q))
    }
    for (const c of rankedCollections) {
      if (c.title) {
        const score = matchScore(c.title, q)
        const existing = suggestionSet.get(c.title) || 0
        if (score > existing) suggestionSet.set(c.title, score)
      }
    }

    const suggestions = Array.from(suggestionSet.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SUGGESTIONS)
      .map(([title]) => title)

    return NextResponse.json({
      suggestions,
      products: rankedProducts,
      collections: rankedCollections,
    })
  } catch {
    return NextResponse.json({
      suggestions: [],
      products: [],
      collections: [],
    })
  }
}
