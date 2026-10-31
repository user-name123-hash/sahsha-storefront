"use client"

import {
  getPaymentGatewayKind,
  isHostedCheckoutProvider,
} from "@core/constants"
import { HttpTypes } from "@medusajs/types"
import { RazorpayPaymentButton } from "./razorpay-payment-button"

type HostedPaymentButtonProps = {
  session: HttpTypes.StorePaymentSession
  notReady: boolean
  cart: HttpTypes.StoreCart
  providerId?: string
  onBeforeOpen?: () => void
}

/** Renders Razorpay checkout UI for the active payment session. */
export function HostedPaymentButton({
  session,
  notReady,
  cart,
  providerId,
  onBeforeOpen,
}: HostedPaymentButtonProps) {
  const resolvedProviderId = providerId ?? session.provider_id
  const kind = getPaymentGatewayKind(resolvedProviderId)

  if (kind === "razorpay") {
    return (
      <div
        onClick={() => {
          onBeforeOpen?.()
        }}
      >
        <RazorpayPaymentButton
          session={session}
          notReady={notReady}
          cart={cart}
        />
      </div>
    )
  }

  return null
}

export function isHostedPaymentProvider(providerId?: string): boolean {
  return isHostedCheckoutProvider(providerId)
}
