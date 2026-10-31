import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Guest Orders",
    description: "View your guest orders.",
}

import { listGuestOrders } from "@core/data/guest"
import GuestOrdersTemplate from "@modules/account/templates/guest-orders-template"

export default function GuestOrdersPage() {
    return <GuestOrdersTemplate />
}
