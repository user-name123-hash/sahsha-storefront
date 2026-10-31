import { loadLayoutData } from "@controllers/layout/load-layout-data"
import Nav from "@theme/slots/layout/Nav"

export default async function NavWithData() {
  const { nav, promoBar, cart } = await loadLayoutData()
  const PromoBar = (await import("@theme/slots/layout/PromoBar")).default

  return (
    <>
      <PromoBar {...promoBar} />
      <Nav {...nav} cart={cart} />
    </>
  )
}
