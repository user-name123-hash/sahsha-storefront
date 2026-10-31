import { loadOrderData } from "@controllers/order/load-order-data"
import { OrderDetailsController } from "@controllers/order/order-details-controller"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await loadOrderData(params.id)

  if (!order) {
    notFound()
  }

  return {
    title: `Order #${order.display_id}`,
    description: `View your order`,
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const order = await loadOrderData(params.id)

  if (!order) {
    notFound()
  }

  return <OrderDetailsController order={order} />
}
