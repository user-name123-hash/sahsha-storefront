"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import { usePathname } from "next/navigation"

export default function BackLink() {
  const pathname = usePathname()
  const isOnPaymentPage = pathname.includes("/checkout/payment")
  
  // LocalizedClientLink will handle country code automatically
  // So we just need to provide the path without country code
  const backHref = isOnPaymentPage ? "/checkout" : "/cart"
  const backText = isOnPaymentPage ? "Back to checkout" : "Back to shopping cart"
  
  return (
    <LocalizedClientLink
      href={backHref}
      className="text-small-semi text-ui-fg-base flex items-center gap-x-2 uppercase flex-1 basis-0"
      data-testid="back-to-cart-link"
    >
      <ChevronDown className="rotate-90" size={16} />
      <span className="mt-px hidden small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
        {backText}
      </span>
      <span className="mt-px block small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
        Back
      </span>
    </LocalizedClientLink>
  )
}

