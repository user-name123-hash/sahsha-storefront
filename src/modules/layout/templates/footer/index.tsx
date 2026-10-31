import { loadLayoutData } from "@controllers/layout/load-layout-data"
import { retrieveCustomer } from "@core/data/customer"
import Footer from "@theme/slots/layout/Footer"

export default async function FooterWithData() {
  const [layoutData, customer] = await Promise.all([
    loadLayoutData(),
    retrieveCustomer().catch(() => null),
  ])
  const isLoggedIn = Boolean(customer && customer.id !== "pending_deletion")

  return <Footer {...layoutData.footer} isLoggedIn={isLoggedIn} />
}
