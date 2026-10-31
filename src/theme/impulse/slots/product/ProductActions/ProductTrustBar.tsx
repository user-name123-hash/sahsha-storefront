"use client"

import Image from "next/image"

type ProductTrustBarProps = {
  className?: string
}

export function ProductTrustBar({ className = "" }: ProductTrustBarProps) {
  return (
    <div className={`product-trust-bar${className ? ` ${className}` : ""}`}>
      <div className="product-trust-bar__payments">
        <Image src="/Item.svg" alt="Mastercard" width={53} height={44} />
        <Image src="/Item (1).svg" alt="Amex" width={53} height={44} />
        <Image src="/Item (2).svg" alt="Diners" width={53} height={44} />
        <Image src="/visa.svg" alt="Visa" width={53} height={44} />
      </div>
      <div className="product-trust-bar__secure">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#156229"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span className="product-trust-bar__secure-text">Secure Payments</span>
      </div>
    </div>
  )
}
