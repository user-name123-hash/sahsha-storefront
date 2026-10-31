import { Metadata } from "next"
import ContactTemplate from "@modules/contact/templates"
import { getContactInfoFromConfig } from "@lib/data/contact-info"

type Props = {
  params: Promise<{ countryCode: string }>
}

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Sahsha for help with kurtis, kurti sets, sarees, orders, sizing, and returns.",
}

export default async function ContactPage(props: Props) {
  const params = await props.params
  const countryCode = params.countryCode

  const contactInfo = await getContactInfoFromConfig()

  return <ContactTemplate countryCode={countryCode} contactInfo={contactInfo} />
}
