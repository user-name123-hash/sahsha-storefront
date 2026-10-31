
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrieveOrder } from "@core/data/orders"
import { sdk } from "@core/config"
import ExchangeRequestTemplate from "@modules/account/templates/exchange-request-template"

type Props = {
    params: Promise<{ id: string; countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params
    return {
        title: `Exchange Order #${params.id}`,
        description: "Request an exchange for your order.",
    }
}

export default async function ExchangePage(props: Props) {
    const params = await props.params

    const order = await retrieveOrder(params.id).catch(() => null)

    if (!order) {
        return notFound()
    }

    // Fetch return reasons
    const { return_reasons } = await sdk.client.fetch<any>(
        "/store/return-reasons",
        {
            method: "GET",
            query: { fields: "id,value,label" },
            next: { tags: ["return_reasons"] },
        }
    )

    return (
        <div className="bg-gray-50 min-h-screen">
            <ExchangeRequestTemplate
                order={order as any}
                returnReasons={return_reasons || []}
            />
        </div>
    )
}
