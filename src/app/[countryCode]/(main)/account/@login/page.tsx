import { Metadata } from "next"

import { loadAccountData } from "@controllers/account/load-account-data"
import { LoginPage } from "@controllers/account/login-page"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Sahsha account.",
}

export default async function Login(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const data = await loadAccountData(countryCode)

  return <LoginPage data={data} />
}
