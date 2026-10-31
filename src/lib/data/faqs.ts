import { getPublicHomepageConfig } from "@lib/data/public-dynamic-config"

export type FaqCategory = {
  category: string
  items: Array<{ q: string; a: string }>
}

function nonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Admin Help & FAQs — public config path (same as logo/SEO).
 * @core getFaqsFromConfig uses cookie getDynamicConfig which fails on prod CDN HTML.
 */
export async function getFaqsFromConfig(): Promise<FaqCategory[] | null> {
  try {
    const homepage = await getPublicHomepageConfig()
    const faqsRaw = homepage?.["faq-array"]

    if (!Array.isArray(faqsRaw) || faqsRaw.length === 0) return null

    const categoriesMap: Record<
      string,
      { displayCategory: string; items: Array<{ q: string; a: string }> }
    > = {}

    for (const item of faqsRaw) {
      const faq = ((item as Record<string, unknown>)?.["faq"] ??
        item) as Record<string, unknown>
      const displayCategory =
        nonEmpty(faq?.["faq-category"]) || "General Questions"
      const categoryKey = displayCategory.toLowerCase()
      const q = nonEmpty(faq?.["faq-question"])
      const a = nonEmpty(faq?.["faq-answer"])

      if (!q || !a) continue

      if (!categoriesMap[categoryKey]) {
        categoriesMap[categoryKey] = { displayCategory, items: [] }
      }
      categoriesMap[categoryKey].items.push({ q, a })
    }

    const faqs = Object.values(categoriesMap).map((catData) => ({
      category: catData.displayCategory,
      items: catData.items,
    }))

    return faqs.length > 0 ? faqs : null
  } catch {
    return null
  }
}
