import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listContactRequests } from "@lib/data/contact"
import { retrieveCustomer } from "@core/data/customer"
import ContactHistoryTemplate from "@modules/account/templates/contact-history-template"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Contact History",
  description: "View your past enquiries and our responses.",
}

export default async function ContactHistoryPage() {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    notFound()
  }

  const result = await listContactRequests().catch(() => null)

  // If result is null, plugin may be unavailable — show empty state.
  const contactRequests = result?.requests || []

  return (
    <div className="w-full" data-testid="contact-history-page-wrapper">
      <ContactHistoryTemplate contactRequests={contactRequests} />
    </div>
  )
}
