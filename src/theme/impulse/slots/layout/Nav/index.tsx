import { Suspense } from "react"
import type { NavLayoutData } from "@controllers/layout/load-layout-data"
import { HttpTypes } from "@medusajs/types"
import DesktopSearch from "@modules/layout/components/desktop-search"
import DynamicLogo from "@modules/layout/components/dynamic-logo"
import CartButton from "@modules/layout/components/cart-button"
import NavHeaderShell from "./nav-header-shell"
import NavHeaderContent from "./nav-header-content"

type NavProps = NavLayoutData & {
  cart: HttpTypes.StoreCart | null
}

export default function Nav({
  currentLocale,
  customer,
  categories,
  collections,
  cart,
}: NavProps) {
  const cartButton = <CartButton cart={cart} />

  return (
    <Suspense fallback={null}>
      <DesktopSearch countryCode={currentLocale || "in"} hideNavLinks>
        <NavHeaderShell>
          <NavHeaderContent
            currentLocale={currentLocale || "in"}
            customer={customer}
            categories={categories}
            collections={collections}
            logo={<DynamicLogo />}
            cartButton={cartButton}
          />
        </NavHeaderShell>
      </DesktopSearch>
    </Suspense>
  )
}
