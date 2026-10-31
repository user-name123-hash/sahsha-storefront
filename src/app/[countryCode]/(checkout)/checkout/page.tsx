import { Metadata } from "next"
import { notFound } from "next/navigation"

import { loadCheckoutData } from "@controllers/checkout/load-checkout-data"
import { CheckoutPage } from "@controllers/checkout/checkout-page"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function Checkout(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const cartIdFromUrl = searchParams.cart_id as string | undefined

  const data = await loadCheckoutData(cartIdFromUrl)
  if (!data) {
    return notFound()
  }

  return (
    <div className="checkout-page">
      <CheckoutPage data={data} />
    </div>
  )
}
