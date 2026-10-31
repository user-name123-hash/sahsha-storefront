"use client"

import { isNextRedirectError } from "@lib/util/is-next-redirect"
import {
  findPaymentSession,
  getPaymentButtonLabel,
  getPaymentGatewayKind,
  getProviderInitAttempts,
  isManual,
} from "@core/util/payment-providers"
import { initiatePaymentSession } from "@core/data/cart"
import { HttpTypes } from "@medusajs/types"

type CartLike = HttpTypes.StoreCart & {
  payment_collection?: {
    payment_sessions?: HttpTypes.StorePaymentSession[]
  } | null
}

function getRazorpayOrderId(
  session: HttpTypes.StorePaymentSession
): string | undefined {
  const data = session.data as Record<string, unknown> | undefined
  return (data?.razorpay_order_id ?? data?.order_id ?? data?.id) as
    | string
    | undefined
}

export async function initiatePaymentSessionWithFallback(
  cart: CartLike,
  providerId: string
): Promise<CartLike> {
  const attempts = getProviderInitAttempts(providerId)
  let lastError: unknown

  for (const attemptId of attempts) {
    try {
      return (await initiatePaymentSession(cart, {
        provider_id: attemptId,
      })) as CartLike
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error(`Could not initialize ${providerId}`)
}

export async function openHostedCheckout(options: {
  cart: CartLike
  providerId: string
  shopName?: string
  onDismiss?: () => void
  onPaymentSuccess?: () => void
}): Promise<void> {
  const { cart, providerId, shopName = "Store", onDismiss, onPaymentSuccess } = options
  const kind = getPaymentGatewayKind(providerId)

  const updatedCart = await initiatePaymentSessionWithFallback(cart, providerId)
  const session = findPaymentSession(updatedCart, providerId) as
    | HttpTypes.StorePaymentSession
    | undefined

  if (!session) {
    throw new Error(`Could not initialize ${getPaymentButtonLabel(providerId)}`)
  }

  if (kind === "razorpay") {
    await openRazorpayCheckout({
      cart: updatedCart,
      session,
      shopName,
      onDismiss,
      onPaymentSuccess,
    })
    return
  }

  throw new Error(`Unsupported hosted checkout provider: ${providerId}`)
}

async function openRazorpayCheckout(options: {
  cart: CartLike
  session: HttpTypes.StorePaymentSession
  shopName: string
  onDismiss?: () => void
  onPaymentSuccess?: () => void
}): Promise<void> {
  const { cart, session, shopName, onDismiss, onPaymentSuccess } = options
  const orderId = getRazorpayOrderId(session)

  if (!orderId) {
    throw new Error("Could not initialize Razorpay")
  }

  const { placeOrderWithSizeFallback: placeOrder } = await import(
    "@lib/data/cart/place-order-with-fallback"
  )

  await loadScript("https://checkout.razorpay.com/v1/checkout.js")

  const razorpayOptions = {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY ?? "",
    amount: session.amount,
    order_id: orderId,
    currency: (cart.currency_code ?? "inr").toUpperCase() as string,
    name: shopName,
    description: "Secure checkout for your order",
    handler: async () => {
      onPaymentSuccess?.()
      await placeOrder().catch((err: Error) => {
        if (isNextRedirectError(err)) throw err
        throw err
      })
    },
    prefill: {
      name: `${cart.billing_address?.first_name || ""} ${cart.billing_address?.last_name || ""}`.trim(),
      email: cart.email,
      contact:
        cart.shipping_address?.phone || cart.billing_address?.phone || undefined,
    },
    theme: { color: "var(--color-brand-accent, #5a2a43)" },
    modal: {
      ondismiss: () => {
        onDismiss?.()
      },
    },
  }

  const razorpay = new (window as any).Razorpay(razorpayOptions)
  razorpay.on("payment.failed", () => {
    onDismiss?.()
  })
  razorpay.open()
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }

    const script = document.createElement("script")
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.body.appendChild(script)
  })
}

export function partitionPaymentProviders(
  providers: Array<{ id: string }> | null | undefined
) {
  const manual: Array<{ id: string }> = []
  const hosted: Array<{ id: string }> = []
  const other: Array<{ id: string }> = []

  for (const provider of providers ?? []) {
    const kind = getPaymentGatewayKind(provider.id)
    if (kind === "manual") {
      manual.push(provider)
    } else if (kind === "razorpay") {
      hosted.push(provider)
    } else {
      other.push(provider)
    }
  }

  return { manual, hosted, other }
}

export { isManual, getPaymentButtonLabel }
