import { cache } from "react"
import { listCategories } from "@core/data/categories"
import { listCollections } from "@core/data/collections"
import { HttpTypes } from "@medusajs/types"

const STOREFRONT_COLLECTIONS_QUERY = {
  limit: "100",
  fields: "id,handle,title,metadata",
} as const

/** Nav + home share one collections list per RSC request (dedupes duplicate HTTP). */
export const listStorefrontCollections = cache(
  async (): Promise<HttpTypes.StoreCollection[]> => {
    const result = await listCollections(STOREFRONT_COLLECTIONS_QUERY).catch(
      () => ({
        collections: [] as HttpTypes.StoreCollection[],
      })
    )
    return result.collections ?? []
  }
)

/** Union of nav hierarchy + home tile fields — one category fetch for layout + homepage. */
export const STOREFRONT_CATEGORY_FIELDS =
  "id,name,handle,parent_category_id,metadata,*products.id,*products.thumbnail,*category_children.id,*category_children.products.id,*category_children,*parent_category,*parent_category.parent_category"

export const listStorefrontCategories = cache(
  async (): Promise<HttpTypes.StoreProductCategory[]> => {
    const categories = await listCategories({
      limit: 100,
      fields: STOREFRONT_CATEGORY_FIELDS,
    }).catch(() => [])

    return (categories || []) as HttpTypes.StoreProductCategory[]
  }
)
