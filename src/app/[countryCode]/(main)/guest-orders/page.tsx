import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Guest Orders",
    description: "View your guest orders.",
}

import GuestOrdersTemplate from "@modules/account/templates/guest-orders-template"

export default function GuestOrdersPage() {
    return <GuestOrdersTemplate />
}
