import { Metadata } from "next"
import { notFound } from "next/navigation"

import { loadCartData } from "@controllers/cart/load-cart-data"
import { CartPage } from "@controllers/cart/cart-page"

type Props = {
  params: Promise<{ countryCode: string }>
}

export const metadata: Metadata = {
  title: "Bag",
  description: "View your bag",
}

export default async function Cart(props: Props) {
  const params = await props.params
  const { countryCode } = params

  const data = await loadCartData(countryCode).catch(() => notFound())

  return <CartPage data={data} />
}
