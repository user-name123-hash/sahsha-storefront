import { Metadata } from "next"

import { listCollections } from "@core/data/collections"
import { listCategories } from "@core/data/categories"
import { getStoreFilters } from "@lib/data/store-filters"
import {
  metadataSearchParamsToStrings,
  pickMetadataSearchParams,
} from "@lib/store-filter-config"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse Sahsha's complete collection. Filter by collection, category, color, and product details.",
}

type Params = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const {
    sortBy,
    page,
    collection,
    category,
    color,
    size,
    min_price,
    max_price,
    q,
  } = searchParams

  const metadataSearchParams = pickMetadataSearchParams(searchParams)
  const metadataParams = metadataSearchParamsToStrings(metadataSearchParams)

  const [{ collections }, categories, storeFilters] = await Promise.all([
    listCollections(),
    listCategories({
      fields: "*category_children, *parent_category, *parent_category.parent_category",
    }),
    getStoreFilters(params.countryCode),
  ])

  const activeCollections = collections.filter((item) =>
    storeFilters.collectionIds.includes(item.id)
  )

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name || "",
  }))

  return (
    <StoreTemplate
      sortBy={sortBy as SortOptions | undefined}
      page={page as string | undefined}
      countryCode={params.countryCode}
      collections={activeCollections}
      collection={collection}
      category={category}
      categoryOptions={categoryOptions}
      color={color}
      size={size}
      metadataSearchParams={metadataSearchParams}
      metadataParams={metadataParams}
      minPrice={min_price as string | undefined}
      maxPrice={max_price as string | undefined}
      colorOptions={storeFilters.colors}
      sizeOptions={storeFilters.sizes}
      metadataFilters={storeFilters.metadataFilters}
      q={q as string | undefined}
    />
  )
}
