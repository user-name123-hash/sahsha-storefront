"use client"

import { isNextRedirectError } from "@lib/util/is-next-redirect"
import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap, isHostedCheckoutProvider, requiresPaymentSessionInit, getPaymentButtonLabel } from "@core/constants"
import { HostedPaymentButton } from "../payment-button/hosted-payment-button"
import { initiatePaymentSession } from "@core/data/cart"
import { placeOrderWithSizeFallback as placeOrder } from "@lib/data/cart/place-order-with-fallback"
import ProcessingOverlay from "@modules/checkout/components/processing-overlay"
import { convertToLocale } from "@core/util/money"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Check if we're on the payment page or if step=payment query param exists
  const isOnPaymentPage = pathname.includes("/checkout/payment")
  const isReviewStep = searchParams.get("step") === "review"
  const isOpen = (searchParams.get("step") === "payment" || isOnPaymentPage) && !isReviewStep

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (requiresPaymentSessionInit(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [])

  // Get cart total for Pay button
  const cartTotal = cart?.total || 0
  const currencyCode = cart?.currency_code || "INR"

  return (
    <div className="bg-page-bg" >
      <div className={clx("flex flex-row items-center justify-between", { "mb-6": !isOpen && paymentReady, "hidden": isOpen })}>
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2 items-baseline hidden"
        >
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Edit
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {/* Smart Promotion Display - Dynamic based on count */}
          {cart.promotions && cart.promotions.length === 1 && (
            <div className="rounded-xl p-3 min-[550px]:p-4 mb-5 border border-brand-accent-border shadow-sm transition-all text-left" style={{ backgroundColor: 'var(--color-brand-accent-muted)' }}>
              {cart.promotions.map((promotion: any) => {
                const isPercentage = promotion.application_method?.type === "percentage"
                const discountValue = promotion.application_method?.value
                return (
                  <div key={promotion.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 min-[550px]:w-14 min-[550px]:h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-brand-accent-border p-1">
                          <span className={clx("font-bold text-brand-accent text-center leading-tight", isPercentage ? "text-base min-[550px]:text-lg" : "text-[11px] min-[550px]:text-sm")}>
                            {isPercentage ? `${discountValue}%` : convertToLocale({ amount: discountValue || 0, currency_code: cart.region?.currency_code })}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Heading level="h3" className="text-sm min-[550px]:text-base font-bold text-heading leading-tight">Offer Applied</Heading>
                            <span className="bg-brand-accent-muted text-brand-accent text-[10px] px-2 py-0.5 rounded font-bold uppercase">{promotion.code}</span>
                          </div>
                          <Text className="text-xs text-gray-500 mt-1 leading-tight">Savings applied to your cart</Text>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">You Saved</Text>
                        <Text className="text-lg min-[550px]:text-xl font-black text-brand-accent leading-none">
                          {convertToLocale({ amount: cart.discount_total || 0, currency_code: cart.region?.currency_code })}
                        </Text>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-brand-accent-border">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <Text className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Best value applied</Text>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {cart.promotions && cart.promotions.length > 1 && (
            <div className="rounded-xl p-3 mb-5 border border-brand-accent-border shadow-sm transition-all text-left" style={{ backgroundColor: 'var(--color-brand-accent-muted)' }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-brand-accent-border">
                    <span className="text-lg font-bold text-brand-accent">%</span>
                  </div>
                  <div>
                    <Heading level="h3" className="text-sm font-bold text-heading leading-tight">Offers Applied</Heading>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {cart.promotions.map((p: any) => (
                        <span key={p.id} className="bg-brand-accent-muted text-brand-accent text-[10px] px-2 py-0.5 rounded font-bold uppercase">{p.code}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Total Saved</Text>
                  <Text className="text-lg min-[550px]:text-xl font-black text-brand-accent leading-none">
                    {convertToLocale({ amount: cart.discount_total || 0, currency_code: cart.region?.currency_code })}
                  </Text>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-accent-border space-y-2.5 text-left">
                {cart.promotions.map((promotion: any) => {
                  const isPercentage = promotion.application_method?.type === "percentage"
                  const discountValue = promotion.application_method?.value
                  return (
                    <div key={promotion.id} className="flex items-center justify-between text-xs">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700 leading-tight">{promotion.is_automatic ? "Offer Applied" : `Coupon: ${promotion.code}`}</span>
                        <span className="text-gray-500 font-medium leading-tight text-[10px]">Savings added to your cart</span>
                      </div>
                      <div className="bg-white px-2 py-1 rounded border border-brand-accent-border font-bold text-brand-accent shadow-sm ml-4 whitespace-nowrap">
                        {isPercentage ? `${discountValue}% Off` : convertToLocale({ amount: discountValue || 0, currency_code: cart.region?.currency_code }) + " Off"}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-2.5 border-t border-brand-accent-border">
                <div className="flex items-center gap-1.5 text-left">
                  <div className="w-1 h-1 rounded-full bg-green-500"></div>
                  <Text className="text-[10px] font-semibold text-green-600 uppercase tracking-tight">Best value applied</Text>
                </div>
              </div>
            </div>
          )}

          {/* Payment Options Section - Only show when methods are available */}
          {availablePaymentMethods && availablePaymentMethods.length > 0 && (
            <>
              <Heading level="h3" className="text-lg min-[550px]:text-xl font-bold mb-3 min-[550px]:mb-4">
                Choose Payment Mode
              </Heading>

              {!paidByGiftcard && (
                <div className="flex flex-col min-[768px]:flex-row gap-4 min-[550px]:gap-5 sm:gap-6">
                  {/* Left Side - Payment Options Navigation */}
                  <div className="w-full min-[768px]:w-64 min-[768px]:flex-shrink-0">
                    <RadioGroup
                      value={selectedPaymentMethod}
                      onChange={(value: string) => setPaymentMethod(value)}
                      className="flex flex-col gap-2"
                    >
                      {availablePaymentMethods.map((paymentMethod) => (
                        <RadioGroup.Option
                          key={paymentMethod.id}
                          value={paymentMethod.id}
                          className={({ checked }) => clx(
                            "text-left p-3 min-[550px]:p-4 rounded-lg border-2 transition-all w-full cursor-pointer outline-none",
                            {
                              "border-brand-accent bg-brand-accent-muted": checked,
                              "border-gray-200 hover:border-gray-300": !checked,
                            }
                          )}
                        >
                          {({ checked }) => (
                            <div className="flex items-center gap-2 min-[550px]:gap-3">
                              <div className={clx(
                                "w-4 h-4 min-[550px]:w-5 min-[550px]:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                {
                                  "border-brand-accent": checked,
                                  "border-gray-300": !checked,
                                }
                              )}>
                                {checked && (
                                  <div className="w-2 h-2 min-[550px]:w-3 min-[550px]:h-3 rounded-full bg-brand-accent"></div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-base min-[550px]:text-lg flex-shrink-0">
                                  {paymentInfoMap[paymentMethod.id]?.icon || <CreditCard />}
                                </span>
                                <Text className="text-xs min-[550px]:text-sm font-medium truncate">
                                  {paymentInfoMap[paymentMethod.id]?.title || paymentMethod.id}
                                </Text>
                              </div>
                            </div>
                          )}
                        </RadioGroup.Option>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Right Side - Selected Payment Details */}
                  <div className="flex-1 min-w-0 max-w-[440px] w-full min-[768px]:ml-20">
                    {selectedPaymentMethod && (
                      <div className="bg-page-bg rounded-lg p-4 min-[550px]:p-5 sm:p-6 border shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
                        {isStripeLike(selectedPaymentMethod) ? (
                          <StripeCardContainer
                            paymentProviderId={selectedPaymentMethod}
                            selectedPaymentOptionId={selectedPaymentMethod}
                            paymentInfoMap={paymentInfoMap}
                            setCardBrand={setCardBrand}
                            setError={setError}
                            setCardComplete={setCardComplete}
                          />
                        ) : (
                          <div>
                            {selectedPaymentMethod.includes("manual") || selectedPaymentMethod.includes("system") ? (
                              <div className="flex flex-col">
                                <Heading level="h3" className="text-lg font-bold text-heading mb-6">
                                  Cash On Delivery (Cash/UPI)
                                </Heading>

                                <div className="flex flex-col gap-y-1">
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                      <div className="w-5 h-5 rounded-full border-2 border-brand-accent flex items-center justify-center flex-shrink-0">
                                        <div className="w-3 h-3 rounded-full bg-brand-accent"></div>
                                      </div>
                                      <Text className="text-base font-bold text-heading">
                                        Cash on Delivery (Cash/UPI)
                                      </Text>
                                    </div>
                                    <div className="text-2xl opacity-70">
                                      <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="0.5" y="0.5" width="23" height="15" rx="1.5" stroke="#333" />
                                        <circle cx="12" cy="8" r="3.5" stroke="#333" />
                                        <path d="M4 4L6 4M21 12H19" stroke="#333" strokeWidth="1.5" />
                                        <rect x="3.5" y="3.5" width="23" height="15" rx="1.5" stroke="#333" />
                                        <circle cx="15" cy="11" r="3" stroke="#333" />
                                        <path d="M14 11H16M15 10V12" stroke="#333" strokeWidth="0.5" />
                                        <path d="M15 11C15 11.5523 14.5523 12 14 12C13.4477 12 13 11.5523 13 11C13 10.4477 13.4477 10 14 10C14.5523 10 15 10.4477 15 11Z" fill="#333" />
                                        <text x="14" y="11.5" fontSize="4" textAnchor="middle" fill="#333" style={{ fontSize: '3px', fontWeight: 'bold' }}>₹</text>
                                      </svg>
                                    </div>
                                  </div>
                                  <Text className="text-sm text-gray-500 ml-8">
                                    You can pay via Cash/UPI on delivery.
                                  </Text>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2 min-[550px]:gap-3 mb-3 min-[550px]:mb-4">
                                  <div className="w-4 h-4 min-[550px]:w-5 min-[550px]:h-5 rounded-full border-2 border-brand-accent flex items-center justify-center flex-shrink-0">
                                    <div className="w-2 h-2 min-[550px]:w-3 min-[550px]:h-3 rounded-full bg-brand-accent"></div>
                                  </div>
                                  <Text className="text-base min-[550px]:text-lg font-semibold">
                                    {paymentInfoMap[selectedPaymentMethod]?.title || selectedPaymentMethod}
                                  </Text>
                                </div>
                                <Text className="text-sm min-[550px]:text-base text-gray-600">
                                  {paymentInfoMap[selectedPaymentMethod]?.title || "Payment method selected"}
                                </Text>
                              </div>
                            )}
                          </div>
                        )}

                        <ErrorMessage
                          error={error}
                          data-testid="payment-method-error-message"
                        />

                        {isStripeLike(selectedPaymentMethod) ? (
                          activeSession?.provider_id === selectedPaymentMethod ? (
                            <StripeButton
                              cart={cart}
                              activeSession={activeSession}
                              selectedPaymentMethod={selectedPaymentMethod}
                              cardComplete={cardComplete}
                              cartTotal={cartTotal}
                              currencyCode={currencyCode}
                              setError={setError}
                            />
                          ) : (
                            <button
                              disabled
                              className="w-full py-2 min-[550px]:py-2.5 px-4 min-[550px]:px-6 rounded-full font-semibold text-base transition-all mt-6 shadow-sm bg-gray-200 text-gray-400 cursor-not-allowed"
                            >
                              Pay with Stripe
                            </button>
                          )
                        ) : isHostedCheckoutProvider(selectedPaymentMethod) ? (
                          activeSession &&
                          isHostedCheckoutProvider(activeSession.provider_id) ? (
                            <div className="mt-6">
                              <HostedPaymentButton
                                session={activeSession}
                                notReady={false}
                                cart={cart}
                                providerId={selectedPaymentMethod}
                                onBeforeOpen={() => {
                                  window.dispatchEvent(
                                    new CustomEvent("submit-address-for-payment")
                                  )
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              disabled
                              className="w-full py-2 min-[550px]:py-2.5 px-4 min-[550px]:px-6 rounded-full font-semibold text-base transition-all mt-6 shadow-sm bg-gray-200 text-gray-400 cursor-not-allowed"
                            >
                              {getPaymentButtonLabel(selectedPaymentMethod)}
                            </button>
                          )
                        ) : (
                          <ManualButton
                            cart={cart}
                            activeSession={activeSession}
                            selectedPaymentMethod={selectedPaymentMethod}
                            cartTotal={cartTotal}
                            currencyCode={currencyCode}
                            setError={setError}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Sub-component for Stripe Button to safely use Stripe hooks
const StripeButton = ({
  cart,
  activeSession,
  selectedPaymentMethod,
  cardComplete,
  cartTotal,
  currencyCode,
  setError
}: any) => {
  const [isLoading, setIsLoading] = useState(false)
  const stripe = useStripe()
  const elements = useElements()

  const handleStripePayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let currentSession = activeSession
      if (activeSession?.provider_id !== selectedPaymentMethod) {
        const updatedCart = await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
        currentSession = updatedCart.payment_collection?.payment_sessions?.find(
          (s: any) => s.provider_id === selectedPaymentMethod
        )
      }

      const card = elements?.getElement("card")
      if (!stripe || !elements || !card || !currentSession) {
        throw new Error("Stripe is not initialized or session is missing")
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        currentSession.data.client_secret as string,
        {
          payment_method: {
            card: card,
            billing_details: {
              name: `${cart.billing_address?.first_name} ${cart.billing_address?.last_name}`,
              email: cart.email,
              phone: cart.billing_address?.phone || undefined,
              address: {
                city: cart.billing_address?.city || undefined,
                country: cart.billing_address?.country_code || undefined,
                line1: cart.billing_address?.address_1 || undefined,
                line2: cart.billing_address?.address_2 || undefined,
                postal_code: cart.billing_address?.postal_code || undefined,
                state: cart.billing_address?.province || undefined,
              },
            },
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "requires_capture") {
        await placeOrder()
      }
    } catch (err: any) {
      if (isNextRedirectError(err)) {
        throw err
      }
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <>
      <ProcessingOverlay isOpen={isLoading} variant="payment" />
      <button
        onClick={handleStripePayment}
        disabled={isLoading || !cardComplete}
        className={clx(
          "w-full py-2 min-[550px]:py-2.5 px-4 min-[550px]:px-6 rounded-full font-semibold text-base transition-all mt-6 shadow-sm",
          {
            "bg-brand-accent text-inverse hover:bg-brand-accent-hover": !isLoading && cardComplete,
            "bg-gray-300 text-gray-500 cursor-not-allowed": isLoading || !cardComplete,
          }
        )}
      >
        {isLoading ? "Processing..." : !cardComplete ? "Enter card details" : `Pay now ${convertToLocale({ amount: cartTotal, currency_code: currencyCode })}`}
      </button>
    </>
  )
}

// Sub-component for Manual Button
const ManualButton = ({
  cart,
  activeSession,
  selectedPaymentMethod,
  cartTotal,
  currencyCode,
  setError
}: any) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleManualPayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Final Handshake: Save all address data from DOM to server explicitly
      const firstNameInput = document.getElementById("shipping_first_name_field") as HTMLInputElement
      const lastNameInput = document.getElementById("shipping_last_name_field") as HTMLInputElement
      const address1Input = document.getElementById("shipping_address_1_field") as HTMLInputElement
      const companyInput = document.getElementById("shipping_company_field") as HTMLInputElement
      const cityInput = document.getElementById("shipping_city_field") as HTMLInputElement
      const provinceInput = document.getElementById("shipping_province_field") as HTMLInputElement
      const postalInput = document.getElementById("shipping_postal_code_field") as HTMLInputElement
      const phoneInput = document.getElementById("shipping_phone_field_internal") as HTMLInputElement
      const emailInput = document.getElementById("shipping_email_field") as HTMLInputElement

      const { updateAddressSilently } = await import("@core/data/cart")
      await updateAddressSilently({
        email: emailInput?.value || cart?.email || "",
        shipping_address: {
          first_name: firstNameInput?.value || cart?.shipping_address?.first_name || "Visitor",
          last_name: lastNameInput?.value || cart?.shipping_address?.last_name || "Customer",
          address_1: address1Input?.value || cart?.shipping_address?.address_1 || "",
          company: companyInput?.value || cart?.shipping_address?.company || "",
          city: cityInput?.value || cart?.shipping_address?.city || "",
          province: provinceInput?.value || cart?.shipping_address?.province || "",
          postal_code: postalInput?.value || cart?.shipping_address?.postal_code || "",
          phone: phoneInput?.value || cart?.shipping_address?.phone || "",
          country_code: cart?.shipping_address?.country_code || "in",
        }
      })

      if (activeSession?.provider_id !== selectedPaymentMethod) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }
      
      await placeOrder()
    } catch (err: any) {
      if (isNextRedirectError(err)) {
        throw err
      }
      setError(err.message)
      setIsLoading(false)
    }
  }

  const isCOD = selectedPaymentMethod.includes("manual") || selectedPaymentMethod.includes("system")

  return (
    <>
      <ProcessingOverlay isOpen={isLoading} variant="order" />
      <button
        onClick={handleManualPayment}
        disabled={isLoading}
        className={clx(
          "w-full py-2 min-[550px]:py-2.5 px-4 min-[550px]:px-6 rounded-full font-semibold text-base transition-all mt-6 shadow-sm",
          {
            "bg-brand-accent text-inverse hover:bg-brand-accent-hover": !isLoading,
            "bg-gray-300 text-gray-500 cursor-not-allowed": isLoading,
          }
        )}
        data-ga-event="cod_payment_click"
        data-ga-label="Continue to process"
      >
        {isLoading ? "Processing..." : isCOD ? "Continue to process" : `Pay now ${convertToLocale({ amount: cartTotal, currency_code: currencyCode })}`}
      </button>
    </>
  )
}

export default Payment
