import type { AccountPageData } from "@core/types/account"
import { getLoginPagePanelFromConfig } from "@lib/data/login-panel"

import LoginTemplateClient from "./login-template-client"

type LoginTemplateProps = Pick<AccountPageData, "countryCode">

export default async function LoginTemplate(_props: LoginTemplateProps) {
  const panel = await getLoginPagePanelFromConfig()

  return <LoginTemplateClient panel={panel} />
}
