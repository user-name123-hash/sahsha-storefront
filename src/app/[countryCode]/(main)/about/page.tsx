import { Metadata } from "next"

import AboutTemplate from "@modules/about/templates"
import { getFoundersFromConfig } from "@lib/data/founders"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "You deserve to look beautiful without the compromise. Meet Sahil and Manisha — the siblings behind SAHSHA ethnic wear.",
}

export default async function AboutPage() {
  const { photo, founders } = await getFoundersFromConfig()

  return <AboutTemplate founderPhoto={photo} founders={founders} />
}
