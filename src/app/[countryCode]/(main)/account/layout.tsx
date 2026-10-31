import { retrieveCustomer } from "@core/data/customer"
import { Toaster } from "@medusajs/ui"
import AccountLayout from "@modules/account/templates/account-layout"

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  const isPendingDeletion = customer?.id === "pending_deletion"

  return (
    <AccountLayout customer={isPendingDeletion ? null : customer}>
      {customer && !isPendingDeletion ? dashboard : login}
      <Toaster />
    </AccountLayout>
  )
}
