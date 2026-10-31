import { loadAccountData } from "@controllers/account/load-account-data"
import { LoginPage } from "@controllers/account/login-page"

export default async function DefaultLogin(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const data = await loadAccountData(countryCode)

  return <LoginPage data={data} />
}
