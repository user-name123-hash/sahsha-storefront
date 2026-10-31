import { Metadata } from "next"
import HelpTemplate from "@modules/help/templates"
import { getContactInfoFromConfig } from "@lib/data/contact-info"
import { getFaqsFromConfig } from "@lib/data/faqs"

type Props = {
  params: Promise<{ countryCode: string }>
}

export const metadata: Metadata = {
  title: "Help & FAQs",
  description:
    "FAQs about kurtis, kurti sets, sarees, orders, delivery, returns, and payments at Sahsha.",
}

export default async function HelpPage(props: Props) {
  const params = await props.params
  const countryCode = params.countryCode

  let contactInfo = null
  let dynamicFaqs = null
  try {
    contactInfo = await getContactInfoFromConfig()
    dynamicFaqs = await getFaqsFromConfig()
  } catch {
    // fallback
  }

  return (
    <HelpTemplate
      countryCode={countryCode}
      contactInfo={contactInfo}
      dynamicFaqs={dynamicFaqs}
    />
  )
}
