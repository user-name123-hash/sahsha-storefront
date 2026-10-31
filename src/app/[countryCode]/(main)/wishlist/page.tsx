import { Metadata } from "next"
import WishlistTemplate from "@modules/wishlist/templates"

type Props = {
  params: Promise<{ countryCode: string }>
}

export const metadata: Metadata = {
  title: "My Wishlist",
  description: "View your wishlist items",
}

export default async function WishlistPage(props: Props) {
  const params = await props.params
  const countryCode = params.countryCode

  return <WishlistTemplate countryCode={countryCode} />
}

