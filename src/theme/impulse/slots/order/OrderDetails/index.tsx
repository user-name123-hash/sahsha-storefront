"use client"

import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import type { HttpTypes } from "@medusajs/types"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  return <OrderDetailsTemplate order={order} />
}
