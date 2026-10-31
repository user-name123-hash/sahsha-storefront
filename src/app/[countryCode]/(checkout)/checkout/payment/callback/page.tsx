"use client"

import { isNextRedirectError } from "@lib/util/is-next-redirect"
import { placeOrderWithSizeFallback as placeOrder } from "@lib/data/cart/place-order-with-fallback"
import ProcessingOverlay from "@modules/checkout/components/processing-overlay"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const orderStatus = searchParams.get("order_status")?.toUpperCase()
    const isFailed =
      orderStatus === "FAILED" ||
      orderStatus === "CANCELLED" ||
      orderStatus === "USER_DROPPED"

    if (isFailed) {
      setError("Payment was not completed. Please try again.")
      return
    }

    placeOrder().catch((err) => {
      if (isNextRedirectError(err)) {
        throw err
      }
      setError(err.message || "Could not complete your order. Please contact support.")
    })
  }, [searchParams])

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="max-w-md rounded-xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <a
            href="../"
            className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline"
          >
            Back to payment
          </a>
        </div>
      </div>
    )
  }

  return <ProcessingOverlay isOpen={true} variant="order" />
}
