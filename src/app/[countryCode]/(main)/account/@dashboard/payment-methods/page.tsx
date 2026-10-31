import { Metadata } from "next"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@core/data/customer"
import PaymentMethodsTemplate from "@modules/account/templates/payment-methods-template"

export const metadata: Metadata = {
    title: "Payment Methods",
    description: "Manage your saved payment methods for refunds",
}

export default async function PaymentMethods() {
    const customer = await retrieveCustomer()

    if (!customer) {
        notFound()
    }

    return (
        <div className="w-full" data-testid="payment-methods-page-wrapper">
            <PaymentMethodsTemplate customer={customer} />
        </div>
    )
}
