
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveOrder } from "@core/data/orders"
import { listReturnReasons, listReturnShippingOptions } from "@core/data/returns"
import ReturnRequestTemplate from "@modules/account/templates/return-request-template"
import { hasReturnableItems } from "@core/util/returns"

export const metadata: Metadata = {
    title: "Request Return",
    description: "Request a return for your order",
}

type Props = {
    params: Promise<{ id: string }>
}

export default async function GuestReturnRequestPage(props: Props) {
    const params = await props.params;

    // retrieveOrder already handles guest tokens
    const order = await retrieveOrder(params.id).catch(() => null)

    if (!order) {
        notFound()
    }

    // Check eligibility
    if (!hasReturnableItems(order)) {
        return (
            <div className="max-w-4xl mx-auto py-16 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Return Not Available</h1>
                <p className="text-gray-600 mb-8">This order matches no returnable items. Items might be past the return window or already returned.</p>
                <a href={`/orders/${order.id}`} className="text-blue-600 hover:underline text-lg font-medium">Back to Order Details</a>
            </div>
        )
    }

    // Get cart ID for shipping options
    const cartId = (order as any).cart_id

    // Extract product IDs for context
    const productIds = order.items?.map((item: any) => item.product_id).filter(Boolean) as string[]

    // Fetch return shipping options and return reasons
    const [shippingOptions, returnReasons] = await Promise.all([
        listReturnShippingOptions(cartId || "", (order as any).region_id, productIds),
        listReturnReasons(),
    ])

    return (
        <div className="bg-page-bg min-h-screen">
            <ReturnRequestTemplate
                order={order}
                shippingOptions={shippingOptions}
                returnReasons={returnReasons}
            />
        </div>
    )
}
