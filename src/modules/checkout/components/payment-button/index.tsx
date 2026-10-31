"use client"

import { isManual, isStripeLike, isHostedCheckoutProvider } from "@core/constants"
import { placeOrderWithSizeFallback as placeOrder } from "@lib/data/cart/place-order-with-fallback"
import { trackAddPaymentInfo } from "@core/analytics/ga4-ecommerce"
import { HttpTypes } from "@medusajs/types"
import { Button, clx } from "@medusajs/ui"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { HostedPaymentButton } from "./hosted-payment-button"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isHostedCheckoutProvider(paymentSession?.provider_id):
      return (
        <HostedPaymentButton
          notReady={notReady}
          session={paymentSession!}
          cart={cart}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    const currency =
      (cart as any).currency_code?.toUpperCase() ??
      (cart as any).region?.currency_code?.toUpperCase() ??
      "USD"
    const value = ((cart as any).total ?? 0) / 100
    const items = (cart.items ?? []).map((item: any, index: number) => {
      const unitTotal = item.total && item.quantity ? item.total / item.quantity : 0
      return {
        item_id: item.variant_id ?? item.id,
        item_name: item.title ?? "",
        price: unitTotal / 100,
        quantity: item.quantity,
        index,
      }
    })
    trackAddPaymentInfo({ currency, value, items })

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <button
        disabled={disabled || notReady || submitting}
        onClick={handlePayment}
        className={clx(
          "w-full py-2.5 px-6 rounded-full font-semibold text-base transition-all shadow-sm flex items-center justify-center",
          {
            "bg-brand-accent text-inverse hover:bg-brand-accent-hover": !disabled && !notReady && !submitting,
            "bg-gray-300 text-gray-500 cursor-not-allowed": disabled || notReady || submitting,
          }
        )}
        data-testid={dataTestId}
      >
        {submitting ? "Processing..." : "Place order"}
      </button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({
  notReady,
  cart,
  "data-testid": dataTestId,
}: {
  notReady: boolean
  cart: HttpTypes.StoreCart
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder()
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const handlePayment = () => {
    setSubmitting(true)
    const currency =
      (cart as any).currency_code?.toUpperCase() ??
      (cart as any).region?.currency_code?.toUpperCase() ??
      "USD"
    const value = ((cart as any).total ?? 0) / 100
    const items = (cart.items ?? []).map((item: any, index: number) => {
      const unitTotal = item.total && item.quantity ? item.total / item.quantity : 0
      return {
        item_id: item.variant_id ?? item.id,
        item_name: item.title ?? "",
        price: unitTotal / 100,
        quantity: item.quantity,
        index,
      }
    })
    trackAddPaymentInfo({ currency, value, items })
    onPaymentCompleted()
  }

  return (
    <>
      <button
        disabled={notReady || submitting}
        onClick={handlePayment}
        className={clx(
          "w-full py-2.5 px-6 rounded-full font-semibold text-base transition-all shadow-sm flex items-center justify-center",
          {
            "bg-brand-accent text-inverse hover:bg-brand-accent-hover": !notReady && !submitting,
            "bg-gray-300 text-gray-500 cursor-not-allowed": notReady || submitting,
          }
        )}
        data-testid={dataTestId ?? "submit-order-button"}
      >
        {submitting ? "Processing..." : "Place order"}
      </button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
