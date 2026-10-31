import { getCollectionByHandle } from "@core/data/collections"
import { redirect } from "next/navigation"

export default async function CollectionPage(props: any) {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)
  if (collection) {
    redirect(`/${params.countryCode}/store?collection=${collection.id}`)
  }
  redirect(`/${params.countryCode}/store`)
}
