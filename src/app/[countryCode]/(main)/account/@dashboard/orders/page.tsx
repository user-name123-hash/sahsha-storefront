import { Metadata } from "next"

import OrderOverview from "@modules/account/components/order-overview"
import { notFound } from "next/navigation"
import { listOrders } from "@core/data/orders"
import Divider from "@modules/common/components/divider"


export const metadata: Metadata = {
  title: "Orders",
  description: "Overview of your previous orders.",
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return (
    <div className="account-orders-page-wrap" data-testid="orders-page-wrapper">
      <OrderOverview orders={orders} />
    </div>
  )
}
