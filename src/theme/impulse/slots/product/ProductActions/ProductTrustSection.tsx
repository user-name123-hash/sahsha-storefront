"use client"

import Image from "next/image"
import PincodeChecker from "@modules/cart/components/pincode-checker"

type ProductTrustSectionProps = {
  selectedVariantId?: string
  onOpenFeature: (feature: string) => void
}

export function ProductTrustSection({ selectedVariantId, onOpenFeature }: ProductTrustSectionProps) {
  return (
    <>
      <PincodeChecker variantId={selectedVariantId} />

      <div className="product-trust-features">
        <div className="product-trust-features__item">
          <div className="product-trust-features__icon">
            <Image src="/Return.svg" alt="" width={28} height={26} aria-hidden />
          </div>
          <div
            className="product-trust-features__link group"
            onClick={() => onOpenFeature("return")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onOpenFeature("return")}
          >
            <span>3 Days Easy Return</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="product-trust-features__chevron" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        <div className="product-trust-features__sep" aria-hidden />

        <div className="product-trust-features__item">
          <div className="product-trust-features__icon">
            <Image src="/delivery.svg" alt="" width={30} height={18} aria-hidden />
          </div>
          <div
            className="product-trust-features__link group"
            onClick={() => onOpenFeature("delivery")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onOpenFeature("delivery")}
          >
            <span>Free Shipping</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="product-trust-features__chevron" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>

        <div className="product-trust-features__sep" aria-hidden />

        <div className="product-trust-features__item">
          <div className="product-trust-features__icon">
            <Image src="/Cod.svg" alt="" width={30} height={18} aria-hidden />
          </div>
          <div
            className="product-trust-features__link group"
            onClick={() => onOpenFeature("cod")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onOpenFeature("cod")}
          >
            <span>Cash On Delivery Available</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" className="product-trust-features__chevron" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}
