import { Metadata } from "next"

import { getBaseURL } from "@core/util/env"
import { MainLayout } from "@controllers/layout/main-layout"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
}

/** Children stream immediately — chrome (nav/cart) loads in Suspense inside MainLayout. */
export default function PageLayout(props: { children: React.ReactNode }) {
  return <MainLayout>{props.children}</MainLayout>
}
