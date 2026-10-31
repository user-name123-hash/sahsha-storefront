import { loadLayoutData } from "@controllers/layout/load-layout-data"
import PromoBar from "@theme/slots/layout/PromoBar"

export default async function PromoBarWithData() {
  const { promoBar } = await loadLayoutData()
  return <PromoBar {...promoBar} />
}
