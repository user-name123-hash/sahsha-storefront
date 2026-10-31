import { Metadata } from "next"
import { listCollections } from "@core/data/collections"
import CollectionsPage from "@theme/templates/CollectionsPage"

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse all Sahsha collections.",
}

export default async function CollectionsIndexPage() {
  const { collections } = await listCollections({
    limit: "100",
    fields: "id,handle,title,metadata",
  })

  return <CollectionsPage collections={collections ?? []} />
}
