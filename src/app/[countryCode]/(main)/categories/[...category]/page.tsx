import { getCategoryByHandle } from "@core/data/categories"
import { redirect } from "next/navigation"

export default async function CategoryPage(props: any) {
  const params = await props.params
  const category = await getCategoryByHandle(params.category)
  if (category) {
    redirect(`/${params.countryCode}/store?category=${category.id}`)
  }
  redirect(`/${params.countryCode}/store`)
}
