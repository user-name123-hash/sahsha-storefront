"use client"

import { Heading, Text, clx } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams, usePathname } from "next/navigation"
import { useEffect } from "react"

const Review = ({ cart }: { cart: any }) => {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  // Check if we're on the payment page or if step=review query param exists
  const isOnPaymentPage = pathname.includes("/checkout/payment")
  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0
  const paymentReady = cart.payment_collection || paidByGiftcard
  const isOpen = searchParams.get("step") === "review" || (isOnPaymentPage && paymentReady)

  const previousStepsCompleted =
    cart.shipping_address &&
    cart.shipping_methods.length > 0 &&
    paymentReady

  if (!isOpen || !previousStepsCompleted) {
    return null
  }

  return (
    <div id="review-section" className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline text-heading font-bold"
        >
          Review
        </Heading>
      </div>
      <>
        <div className="flex items-start gap-x-1 w-full mb-6">
          <div className="w-full">
            <Text className="txt-medium-plus text-ui-fg-base mb-1">
              By clicking the Place Order button, you confirm that you have
              read, understand and accept our Terms of Use, Terms of Sale and
              Returns Policy and acknowledge that you have read Sahsha&apos;s Privacy Policy.
            </Text>
          </div>
        </div>
        <PaymentButton cart={cart} data-testid="submit-order-button" />
      </>
    </div>
  )
}

export default Review
