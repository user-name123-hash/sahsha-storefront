"use client"

import { isNextRedirectError } from "@lib/util/is-next-redirect"
import { convertToLocale } from "@core/util/money"
import React from "react"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import ProcessingOverlay from "@modules/checkout/components/processing-overlay"
import { isValidIndianPhone, isValidEmail } from "@core/util/phone"
import { useCartShippingCheckout } from "@core/hooks/use-cart-shipping-checkout"
import { usePaymentProviders } from "@core/hooks/use-payment-providers"
import {
  getPaymentButtonLabel,
  openHostedCheckout,
  partitionPaymentProviders,
} from "@modules/checkout/util/open-hosted-checkout"
import { useShopName } from "@lib/context/shop-branding-context"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
  items?: HttpTypes.StoreCartLineItem[]
  checkoutStep?: string
  customer?: HttpTypes.StoreCustomer | null
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals, items = [], checkoutStep, customer }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const shopName = useShopName()
  const activeStep = searchParams.get("step")

  // Check if we're on the payment page, order page, or cart page
  const isOnPaymentPage = pathname.includes("/checkout/payment")
  const isOnOrderPage = pathname.includes("/order/")
  const isOnCartPage = pathname.includes("/cart")

  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  const cartTotals = totals as HttpTypes.StoreCart & {
    shipping_total?: number | null
    region_id?: string | null
  }

  const { providers: paymentProviders } = usePaymentProviders(cartTotals.region_id)
  const { manual: manualProviders, hosted: hostedProviders } =
    partitionPaymentProviders(paymentProviders)

  // Calculate Total MRP (sum of original_total from all items)
  const totalMRP = items.reduce((sum, item) => {
    return sum + (item.original_total || item.total || 0)
  }, 0)

  // Calculate total discount (difference between MRP and current subtotal)
  const calculatedDiscount = totalMRP > (item_subtotal || 0)
    ? totalMRP - (item_subtotal || 0)
    : (discount_subtotal || 0)

  // Use GST label for taxes (as shown in the image)
  const gstAmount = tax_total || 0
  const shippingAmount = shipping_subtotal ?? cartTotals.shipping_total ?? 0
  const finalTotal = total || 0
  const itemCount = items.length

  const [isRedirecting, setIsRedirecting] = React.useState(false)
  const [showOverlay, setShowOverlay] = React.useState(false)
  const [processingVariant, setProcessingVariant] = React.useState<"payment" | "order">("payment")

  const {
    isAutoSettingShipping,
    isSyncingAddress,
    formReady,
    ensureFormSavedToCart,
  } = useCartShippingCheckout({
    cart: cartTotals,
    pathname,
    activeStep,
    shippingAmount,
  })

  const syncLastEtdToCart = async () => {
    try {
      const cart = totals as any
      const cookiesArr = document.cookie.split('; ')
      const etdCookie = cookiesArr.find(row => row.startsWith('_medusa_last_etd='))
      const lastEtdValue = etdCookie ? etdCookie.split('=')[1] : null

      if (lastEtdValue && cart?.id && cart.metadata?.estimated_delivery !== lastEtdValue) {
        const { updateCartMetadataSilently } = await import("@core/data/cart")
        await updateCartMetadataSilently({
          ...cart.metadata,
          estimated_delivery: lastEtdValue
        })
      }
    } catch (e) {
      // Ignore sync failure as it's non-critical
    }
  }

  const handleProceedToCheckout = async () => {
    const countryCode = pathname.split('/')[1] || 'in'

    if (customer && customer.addresses.length > 0) {
      setIsRedirecting(true)
      const defaultAddress = customer.addresses.find(a => a.is_default_shipping || a.metadata?.is_default === "true" || a.metadata?.is_default === true) || customer.addresses[0]

      if (defaultAddress) {
        const formData = new FormData()
        formData.append("shipping_address.first_name", defaultAddress.first_name || "")
        formData.append("shipping_address.last_name", defaultAddress.last_name || "")
        formData.append("shipping_address.address_1", defaultAddress.address_1 || "")
        formData.append("shipping_address.address_2", defaultAddress.address_2 || "")
        formData.append("shipping_address.company", defaultAddress.company || "")
        formData.append("shipping_address.postal_code", defaultAddress.postal_code || "")
        formData.append("shipping_address.city", defaultAddress.city || "")
        formData.append("shipping_address.country_code", defaultAddress.country_code || "")
        formData.append("shipping_address.province", defaultAddress.province || "")
        formData.append("shipping_address.phone", defaultAddress.phone || "")
        formData.append("email", customer.email || "")
        formData.append("same_as_billing", "on")

        const { setAddresses } = await import("@core/data/cart")
        await setAddresses(null, formData)
        setIsRedirecting(false)
        
        if (isOnCartPage) {
          router.push(`/${countryCode}/checkout?step=payment`)
        }
      }
    } else {
      if (isOnCartPage) {
        router.push(`/${countryCode}/checkout?step=payment`)
      }
    }
  }

  return (
    <div className="w-full cart-page__summary">
      <ProcessingOverlay isOpen={showOverlay} variant={processingVariant} />
      <h3 className={clx(
        isOnCartPage
          ? "cart-page__summary-title cart-page__section-title"
          : "cart-page__summary-title checkout-page__panel-title mb-2.5 min-[550px]:mb-3 sm:mb-4 min-[1023px]:mb-3 min-[1150px]:mb-4 min-[1360px]:mb-4"
      )}>
        PRICE SUMMARY ({itemCount} {itemCount === 1 ? "ITEM" : "ITEMS"})
      </h3>

      <div className="flex flex-col gap-y-2 min-[550px]:gap-y-2.5 sm:gap-y-3 min-[1023px]:gap-y-2 min-[1150px]:gap-y-3 min-[1360px]:gap-y-3 text-xs min-[550px]:text-sm sm:text-base min-[1023px]:text-sm min-[1150px]:text-base min-[1360px]:text-base text-gray-900">
        <div className="flex items-center justify-between">
          <span>Total MRP</span>
          <span data-testid="cart-mrp" data-value={totalMRP}>
            {convertToLocale({ amount: totalMRP, currency_code })}
          </span>
        </div>

        {calculatedDiscount > 0 && (
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span
              className="text-gray-900"
              data-testid="cart-discount"
              data-value={calculatedDiscount}
            >
              {convertToLocale({
                amount: -calculatedDiscount,
                currency_code,
              })}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span>GST</span>
          <span data-testid="cart-taxes" data-value={gstAmount}>
            {convertToLocale({ amount: gstAmount, currency_code })}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span data-testid="cart-shipping" data-value={shippingAmount} className="flex items-center gap-x-2">
            {isAutoSettingShipping && (
              <span className="checkout-page__pay-spinner" />
            )}
            {convertToLocale({ amount: shippingAmount, currency_code })}
          </span>
        </div>
      </div>

      <div className="h-px w-full border-b border-gray-200 my-3 min-[550px]:my-4" />

      <div className="flex items-center justify-between text-xs min-[550px]:text-sm sm:text-base min-[1023px]:text-sm min-[1150px]:text-base min-[1360px]:text-base font-bold text-gray-900 mb-2.5 min-[550px]:mb-3 sm:mb-4 min-[1023px]:mb-3 min-[1150px]:mb-4 min-[1360px]:mb-4">
        <span>Total</span>
        <span
          className="text-sm min-[550px]:text-base sm:text-lg min-[1023px]:text-base min-[1150px]:text-lg min-[1360px]:text-lg"
          data-testid="cart-total"
          data-value={finalTotal}
        >
          {convertToLocale({ amount: finalTotal, currency_code })}
        </span>
      </div>

      {calculatedDiscount > 0 && (
        <>
          <div className="h-px w-full border-b border-dashed border-gray-300 my-2.5 min-[550px]:my-3 sm:my-4 min-[1023px]:my-3 min-[1150px]:my-4 min-[1360px]:my-4" />
          <div className="text-center">
            <p className="cart-page__savings-msg text-center">
              🎉 Yayy!!! You've saved {convertToLocale({ amount: calculatedDiscount, currency_code })}
            </p>
          </div>
        </>
      )}

      {/* No manual continue button needed as we are in one-step mode */}
      {isOnCartPage && (
        <button
          onClick={handleProceedToCheckout}
          disabled={isRedirecting}
          data-ga-event="proceed_to_checkout_click"
          data-ga-label={convertToLocale({ amount: finalTotal, currency_code })}
          className="cart-page__checkout-btn mt-4"
          data-testid="checkout-button"
        >
          {isRedirecting ? "Loading..." : "Proceed to Checkout"}
        </button>
      )}
      {!isOnCartPage && (
        <div className="w-full">
          {activeStep === "delivery" || activeStep === "payment" || !((totals as any)?.shipping_address?.address_1) || pathname.includes("/checkout") ? (
            <div className="checkout-page__pay-actions">
              {!isRedirecting ? (
                (() => {
                  const cartData = totals as any
                  const hasValidEmail = isValidEmail(cartData.email)
                  const hasValidPhone = isValidIndianPhone(cartData.shipping_address?.phone)
                  const hasShipping =
                    (cartData.shipping_methods?.length > 0) ||
                    (cartData.shipping_subtotal > 0) ||
                    (cartData.shipping_total > 0) ||
                    shippingAmount > 0
                  const cartReady =
                    hasShipping &&
                    !!cartData.shipping_address?.address_1 &&
                    cartData.shipping_address?.postal_code?.length >= 6 &&
                    hasValidEmail &&
                    hasValidPhone
                  const isCheckoutReady = cartReady || (formReady && hasShipping)
                  const isPaymentDisabled = isAutoSettingShipping || isSyncingAddress || !isCheckoutReady
                  
                  return (
                    <>
                  {(manualProviders.length > 0 ? manualProviders : [{ id: "pp_system_default" }]).map(
                    (provider) => (
                  <button
                    key={provider.id}
                    onClick={async () => {
                      setProcessingVariant("order")
                      setShowOverlay(true)
                      setIsRedirecting(true)
                      try {
                        // Saved-address checkout shows AddressCard, not form inputs —
                        // ensureFormSavedToCart reads DOM fields and fails even when cart is ready.
                        if (!cartReady) {
                          const saved = await ensureFormSavedToCart()
                          if (!saved) {
                            throw new Error("Please complete your delivery address.")
                          }
                        }
                        await syncLastEtdToCart()
                        const { initiatePaymentSession } = await import("@core/data/cart")
                        const { placeOrderWithSizeFallback: placeOrder } = await import(
                          "@lib/data/cart/place-order-with-fallback"
                        )
                        await initiatePaymentSession(totals as any, { provider_id: provider.id })
                        await placeOrder()
                      } catch (err: any) {
                        if (isNextRedirectError(err)) {
                          throw err // Next.js needs this error to perform the redirect
                        }
                        setIsRedirecting(false)
                        setShowOverlay(false)
                        alert("Oops! Something went wrong with Cash on Delivery. " + err.message)
                      }
                    }}
                    disabled={isPaymentDisabled}
                    className={clx(
                      "checkout-page__pay-btn checkout-page__pay-btn--outline",
                      {
                        "checkout-page__pay-btn--disabled": isPaymentDisabled,
                      }
                    )}
                  >
                    {getPaymentButtonLabel(provider.id)}
                  </button>
                    )
                  )}
                  {hostedProviders.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={async () => {
                      setIsRedirecting(true)
                      try {
                        if (!cartReady) {
                          const saved = await ensureFormSavedToCart()
                          if (!saved) {
                            throw new Error("Please complete your delivery address.")
                          }
                        }
                        await syncLastEtdToCart()
                        await openHostedCheckout({
                          cart: totals as HttpTypes.StoreCart,
                          providerId: provider.id,
                          shopName,
                          onPaymentSuccess: () => {
                            setProcessingVariant("order")
                            setShowOverlay(true)
                          },
                          onDismiss: () => {
                            setIsRedirecting(false)
                            setShowOverlay(false)
                          },
                        })
                      } catch (err: any) {
                        if (isNextRedirectError(err)) {
                          throw err
                        }
                        setIsRedirecting(false)
                        setShowOverlay(false)
                        alert(
                          `Oops! Something went wrong with ${getPaymentButtonLabel(provider.id)}. ${err.message}`
                        )
                      }
                    }}
                    disabled={isPaymentDisabled}
                    className={clx(
                      "checkout-page__pay-btn checkout-page__pay-btn--primary",
                      {
                        "checkout-page__pay-btn--disabled": isPaymentDisabled,
                      }
                    )}
                  >
                    {getPaymentButtonLabel(provider.id)}
                  </button>
                  ))}
                </>
              ); })()
              ) : (
                <button
                  disabled
                  className="checkout-page__pay-btn checkout-page__pay-btn--primary checkout-page__pay-btn--disabled"
                >
                  Processing...
                </button>
              )}
            </div>
          ) : activeStep === "address" ? (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('trigger-checkout-step'))
              }}
              className="checkout-page__pay-btn checkout-page__pay-btn--primary mt-3 min-[550px]:mt-4 sm:mt-6 min-[1023px]:mt-5 min-[1150px]:mt-6 min-[1360px]:mt-6"
              data-testid="checkout-button-address"
            >
              Continue to delivery
            </button>
          ) : (
            <button
              onClick={handleProceedToCheckout}
              disabled={isRedirecting}
              data-ga-event="proceed_to_checkout_click"
              data-ga-label={convertToLocale({ amount: finalTotal, currency_code })}
              className="cart-page__checkout-btn mt-3 min-[550px]:mt-4 sm:mt-6 min-[1023px]:mt-5 min-[1150px]:mt-6 min-[1360px]:mt-6"
              data-testid="checkout-button"
            >
              {isRedirecting ? "Loading..." : "Proceed to Checkout"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default CartTotals
