"use client"

import { useActionState, useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { createReturnRequest } from "@core/data/returns"
import { listPaymentDetails, createPaymentDetail, makeDefaultPaymentDetail } from "@core/data/payment-details"
import { enhanceItemsWithReturnStatus } from "@core/util/returns"
import ReturnItemSelector from "../components/return-item-selector"
import ReturnShippingSelector from "../components/return-shipping-selector"
import { Button, Heading, Text, Label, Input } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ReturnRequestTemplateProps = {
    order: HttpTypes.StoreOrder & { cart_id?: string }
    shippingOptions: HttpTypes.StoreShippingOption[]
    returnReasons: HttpTypes.StoreReturnReason[]
}

const initialState = {
    success: false,
    error: null,
    return: null,
}

const ReturnRequestTemplate = ({
    order,
    shippingOptions,
    returnReasons,
}: ReturnRequestTemplateProps) => {
    // 1. ABSOLUTE GUEST DETECTION
    const isGuest = !order.customer_id || order.customer_id === ""

    const [items, setItems] = useState(enhanceItemsWithReturnStatus(order.items || []))
    const [selectedItems, setSelectedItems] = useState<Array<{
        id: string
        quantity: number
        return_reason_id?: string
    }>>([])
    const [selectedShippingOption, setSelectedShippingOption] = useState<string | null>(null)

    const [paymentMethods, setPaymentMethods] = useState<any[]>([])
    const [isLoadingPayments, setIsLoadingPayments] = useState(!isGuest)
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)

    const [state, formAction] = useActionState(createReturnRequest, initialState)
    const [isLinkingPayment, setIsLinkingPayment] = useState(false)
    const [paymentLinked, setPaymentLinked] = useState(false)
    const [showRefundPopup, setShowRefundPopup] = useState(false)

    // DIRECT SUBMIT FOR EVERYONE
    const handleFormSubmit = async (formData: FormData) => {
        formData.append("order_id", order.id)
        formData.append("items", JSON.stringify(selectedItems))
        if (selectedShippingOption) formData.append("return_shipping_option_id", selectedShippingOption)
        const locId = formData.get("location_id") || (order as any).fulfillments?.[0]?.location_id
        if (locId) formData.set("location_id", locId.toString())

        formAction(formData)
    }

    const handleLinkPayment = async (paymentId: string) => {
        if (!state.return?.id) return
        setIsLinkingPayment(true)
        setSelectedPaymentId(paymentId)
        try {
            const { updateReturnPayment } = await import("@core/data/returns")
            const res = await updateReturnPayment(state.return.id, paymentId)
            if (res.success) {
                setPaymentLinked(true)
                setTimeout(() => setShowRefundPopup(false), 1500)
            }
        } catch (e) {
            console.error("Link fail", e)
        } finally {
            setIsLinkingPayment(false)
        }
    }

    // ONLY FETCH PAYMENTS AFTER SUCCESSFUL RETURN (For Registered Users)
    useEffect(() => {
        if (state.success && state.return) {
            // Scroll to top when success happens
            window.scrollTo({ top: 0, behavior: 'smooth' })

            if (!isGuest && !paymentLinked) {
                // First fetch the methods
                listPaymentDetails().then(methods => {
                    setPaymentMethods(methods)
                    const defaultMethod = methods.find((p: any) => p.is_default) || methods[0]
                    if (defaultMethod) setSelectedPaymentId(defaultMethod.id)

                    // Then show the popup
                    const timer = setTimeout(() => setShowRefundPopup(true), 800)
                    return () => clearTimeout(timer)
                }).catch(() => {
                    // If payment fetch fails, still show the finish screen
                    console.error("Could not load payment methods")
                })
            }
        }
    }, [state.success, state.return, isGuest, paymentLinked])

    // SCROLL TO TOP ON INITIAL MOUNT
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }, [])

    const backToOrdersLink = isGuest ? `/orders/${order.id}` : "/account/orders"

    if (state.success && state.return) {
        return (
            <div className="relative">
        <div className="max-w-md mx-auto pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center shadow-sm border border-green-200">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Heading level="h1" className="text-2xl sm:text-3xl font-extrabold font-sans text-brand-accent tracking-tight uppercase">Return Requested!</Heading>
              <Text className="text-gray-500 text-sm sm:text-base max-w-sm leading-snug">
                Your return for order <span className="text-brand-accent font-bold">#{order.display_id}</span> has been submitted and is under review.
              </Text>
            </div>

            <div className="space-y-3">
              {!isGuest && !paymentLinked && !showRefundPopup && (
                <Button 
                  variant="secondary" 
                  onClick={() => setShowRefundPopup(true)} 
                  className="w-full rounded-xl h-11 font-bold text-brand-accent border border-brand-accent/30 bg-white hover:bg-brand-accent-muted transition-all text-sm"
                >
                  Link Refund Bank Account
                </Button>
              )}

              {paymentLinked && (
                <div className="bg-green-50/50 rounded-xl px-3 py-2.5 flex items-center gap-2.5 border border-green-200 animate-in zoom-in-95">
                  <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center text-inverse shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-green-900 font-bold text-sm leading-tight">Refund Method Linked</p>
                    <p className="text-green-700/70 text-xs leading-snug">Funds will be credited to your selected account.</p>
                  </div>
                </div>
              )}

              <div className="bg-gray-50/50 rounded-xl px-4 py-3 flex flex-col items-center gap-1 border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">Request ID</span>
                <span className="text-xs font-mono font-bold text-brand-accent break-all text-center select-all">{state.return.id}</span>
              </div>

              <LocalizedClientLink href={backToOrdersLink} className="block">
                <Button className="w-full rounded-xl bg-brand-accent hover:opacity-80 text-inverse h-11 font-bold text-sm shadow-md shadow-gray-200/80 transition-all active:scale-95">
                  Go to My Orders
                </Button>
              </LocalizedClientLink>
            </div>
          </div>
        </div>

                {/* REFUND POPUP FOR LOGIN USERS ONLY */}
                {showRefundPopup && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in" onClick={() => setShowRefundPopup(false)} />
                        <div className="relative w-full max-w-lg bg-page-bg rounded-[32px] sm:rounded-[40px] shadow-2xl p-6 sm:p-10 animate-in zoom-in-95 duration-300">
                            <button onClick={() => setShowRefundPopup(false)} className="absolute top-5 right-5 sm:top-8 sm:right-8 text-gray-400 hover:text-heading"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg></button>

                            <div className="text-center mb-6 sm:mb-8">
                                <Heading level="h2" className="text-2xl sm:text-3xl font-black font-sans text-brand-accent tracking-tight uppercase">Refund Destination</Heading>
                                <p className="text-gray-500 text-sm font-medium mt-2">Where should we send your money?</p>
                            </div>

                            <div className="space-y-3 sm:space-y-4 max-h-[40vh] overflow-y-auto px-1 custom-scrollbar mb-6 sm:mb-8">
                                {paymentMethods.map(pm => (
                                    <div key={pm.id} onClick={() => setSelectedPaymentId(pm.id)} className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 cursor-pointer transition-all ${selectedPaymentId === pm.id ? 'border-brand-accent bg-brand-accent-muted/50' : 'border-gray-50 bg-gray-50/50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-brand-accent text-sm sm:text-base">{pm.type.toUpperCase()}: {pm.type === "upi" ? pm.detail_json?.upi_id : pm.detail_json?.bank_name}</span>
                                            </div>
                                            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center shrink-0 ml-3 ${selectedPaymentId === pm.id ? 'border-brand-accent bg-brand-accent' : 'border-gray-200'}`}>
                                                {selectedPaymentId === pm.id && <svg className="w-3 h-3 sm:w-4 sm:h-4 text-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 sm:gap-4">
                                <Button
                                    onClick={() => selectedPaymentId && handleLinkPayment(selectedPaymentId)}
                                    disabled={!selectedPaymentId || isLinkingPayment || paymentLinked}
                                    className={`w-full h-14 sm:h-16 rounded-2xl font-black text-base sm:text-lg transition-all ${paymentLinked ? 'bg-green-500' : 'bg-brand-accent hover:opacity-80'} text-inverse`}
                                >
                                    {isLinkingPayment ? "Linking..." : paymentLinked ? "Linked Successfully!" : "Confirm & Link Account"}
                                </Button>
                                <button onClick={() => setShowRefundPopup(false)} className="text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-brand-accent">Skip for now</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
            <div className="mb-8 sm:mb-12">
                <LocalizedClientLink href={`/orders/${order.id}`} className="text-[10px] sm:text-xs text-gray-400 hover:text-brand-accent mb-6 inline-flex gap-2 items-center font-bold tracking-[0.2em] transition-colors">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                    BACK TO ORDER #{order.display_id}
                </LocalizedClientLink>
                <Heading level="h1" className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-sans tracking-tight text-brand-accent uppercase">Return Request</Heading>
                <p className="text-gray-400 font-medium text-sm sm:text-base mt-2">Follow the steps below to return items from your order.</p>
            </div>

            <form action={handleFormSubmit} className="space-y-6 sm:space-y-10 pb-12">
                {state.error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs sm:text-sm font-bold border border-red-100 flex items-center gap-3 animate-in shake duration-500">
                        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        {state.error}
                    </div>
                )}

                {/* STEP 1: SELECT ITEMS */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-6 h-6 rounded-lg bg-brand-accent text-inverse flex items-center justify-center font-bold text-[10px]">1</div>
                        <h2 className="text-sm font-bold text-brand-accent uppercase tracking-wider">Select items to return</h2>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 sm:p-8">
                        <ReturnItemSelector items={items} returnReasons={returnReasons} selectedItems={selectedItems} onItemSelectionChange={setSelectedItems} currencyCode={order.currency_code} />
                    </div>
                </div>

                {/* STEP 2: SHIPPING METHOD (only if admin has return shipping options) */}
                {selectedItems.length > 0 && shippingOptions.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-6 h-6 rounded-lg bg-brand-accent text-inverse flex items-center justify-center font-bold text-[10px]">2</div>
                            <h2 className="text-sm font-bold text-brand-accent uppercase tracking-wider">Return Shipping</h2>
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 sm:p-8">
                            <ReturnShippingSelector shippingOptions={shippingOptions} selectedOption={selectedShippingOption} onOptionSelect={setSelectedShippingOption} cartId={order.cart_id || ""} currencyCode={order.currency_code} />
                        </div>
                        <input type="hidden" name="location_id" value={(order as any).fulfillments?.[0]?.location_id || "default_location"} />
                    </div>
                )}
                {/* CONDITIONAL ADDITIONAL DETAILS SECTION */}
                {selectedItems.length > 0 && (shippingOptions.length === 0 || selectedShippingOption) && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-6 h-6 rounded-lg bg-brand-accent text-inverse flex items-center justify-center font-bold text-[10px]">
                                {shippingOptions.length > 0 ? "3" : "2"}
                            </div>
                            <h2 className="text-sm font-bold text-brand-accent uppercase tracking-wider">Additional Details (Optional)</h2>
                        </div>
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 sm:p-8">
                            <textarea
                                name="note"
                                placeholder="Tell us more about the reason for your return..."
                                className="w-full min-h-[120px] rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-medium text-gray-700 outline-none focus:border-brand-accent/30 focus:ring-0 transition-all placeholder:text-gray-300 resize-none font-sans"
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-8 border-t border-gray-100 mt-8">
                    <LocalizedClientLink href={`/orders/${order.id}`} className="w-full sm:w-auto">
                        <Button variant="secondary" type="button" className="w-full h-11 rounded-3xl px-10 font-bold text-gray-400 border-none hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]">
                            Cancel
                        </Button>
                    </LocalizedClientLink>
                    
                    <Button
                        type="submit"
                        disabled={
                            selectedItems.length === 0 ||
                            selectedItems.some(i => !i.return_reason_id) ||
                            (shippingOptions.length > 0 && !selectedShippingOption)
                        }
                        className="w-full sm:w-auto h-11 rounded-3xl bg-brand-accent hover:opacity-80 text-inverse px-12 font-black text-xs uppercase tracking-widest shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-20"
                    >
                        {selectedItems.length === 0
                            ? "Select items"
                            : selectedItems.some(i => !i.return_reason_id)
                                ? "Select reasons"
                                : shippingOptions.length > 0 && !selectedShippingOption
                                    ? "Choose shipping"
                                    : "Confirm Return Request"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default ReturnRequestTemplate
