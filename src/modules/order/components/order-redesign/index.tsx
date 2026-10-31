"use client"

import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@core/util/money"
import Thumbnail from "@modules/products/components/thumbnail"
import LineItemOptions from "@modules/common/components/line-item-options"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React, { useEffect, useState } from "react"
import { listSwaps } from "@core/data/swaps"
import { listReturns } from "@core/data/returns"
import { sdk } from "@core/config"
import { XMark, Spinner } from "@medusajs/icons"
import Image from "next/image"
import { getFulfillmentTrackingEntries } from "@lib/util/fulfillment-tracking"
import { getCartLineItemThumbnail } from "@lib/cart-line-item-image"

type OrderRedesignProps = {
    order: HttpTypes.StoreOrder
    handleDownloadInvoice: () => Promise<void>
    isDownloading: boolean
    handleCancelOrder: () => Promise<void>
    isCancelling: boolean
    handleReorder: (skipVariantIds?: string[], forceReorder?: boolean) => Promise<void>
    isReordering: boolean
    canCancel: boolean
    isCancelled: boolean
    hasReturnableItems: boolean
    inventoryIssues: any[] | null
    setInventoryIssues: (issues: any[] | null) => void
}

const OrderRedesign: React.FC<OrderRedesignProps> = ({
    order,
    handleDownloadInvoice,
    isDownloading,
    handleCancelOrder,
    isCancelling,
    handleReorder,
    isReordering,
    canCancel,
    isCancelled,
    hasReturnableItems,
    inventoryIssues,
    setInventoryIssues
}) => {
    const [hasActiveExchange, setHasActiveExchange] = useState(false)
    const [hasActiveReturn, setHasActiveReturn] = useState(false)
    const [isGuestUser, setIsGuestUser] = useState<boolean | null>(null)
    const [isCheckingStock, setIsCheckingStock] = useState(false)
    const [fetchedReturns, setFetchedReturns] = useState<any[]>([])
    const [fetchedSwaps, setFetchedSwaps] = useState<any[]>([])
    const [showReorderConfirmModal, setShowReorderConfirmModal] = useState(false)

    useEffect(() => {
        // Check login status on mount
        const isLoggedIn = document.cookie.includes("_medusa_jwt")

        // Safely determine guest status after mount
        const guestStatus = !order.customer_id || !isLoggedIn
        setIsGuestUser(guestStatus)
        const checkSwaps = async () => {
            try {
                const result = await listSwaps(order.id)
                const activeSwaps = (result?.swaps || []).filter((s: any) =>
                    s.status !== "canceled" && s.status !== "rejected"
                )
                if (activeSwaps.length > 0) {
                    setHasActiveExchange(true)
                    setFetchedSwaps(activeSwaps)
                }
            } catch (err) {
                // Silence error
            }
        }

        // Check for active returns
        const checkReturns = async () => {
            try {
                const result = await listReturns(order.id)
                const activeReturns = (result?.returns || result?.return_orders || []).filter((r: any) =>
                    r.status !== "canceled" && r.status !== "rejected"
                )
                if (activeReturns.length > 0) {
                    setHasActiveReturn(true)
                    setFetchedReturns(activeReturns)
                }
            } catch (err) {
                // Silence error
            }
        }

        checkSwaps()
        checkReturns()
    }, [order.id])

    // Lock body scroll when inventory issues modal is open
    useEffect(() => {
        if (inventoryIssues) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [inventoryIssues])

    const getAmount = (amount?: number | null) => {
        if (amount === undefined || amount === null) return "₹0"
        return convertToLocale({
            amount,
            currency_code: order.currency_code,
        })
    }

    const formatDate = (date: string | Date) => {
        try {
            const d = new Date(date)
            if (isNaN(d.getTime())) return "N/A"
            return new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }).format(d)
        } catch (e) {
            return "N/A"
        }
    }

    const formatStepDate = (date: string | Date) => {
        try {
            if (!date) return ""
            const d = new Date(date)
            if (isNaN(d.getTime())) return ""
            return new Intl.DateTimeFormat("en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
            }).format(d)
        } catch (e) {
            return ""
        }
    }

    const fromMetadataDate = order.metadata?.estimated_delivery || (order as any).shipping_methods?.[0]?.metadata?.etd
    const calcDays = fromMetadataDate ? Math.max(1, Math.ceil((new Date(fromMetadataDate as string).getTime() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24))) : 7

    const estimatedDays = 
        order.metadata?.estimated_delivery_days || 
        order.metadata?.delivery_days || 
        order.metadata?.days || 
        (order as any).shipping_methods?.[0]?.metadata?.estimated_delivery_days ||
        (order as any).shipping_methods?.[0]?.metadata?.delivery_days ||
        (order as any).shipping_methods?.[0]?.metadata?.days ||
        calcDays;

    const deliveryText = (estimatedDays === 7 || estimatedDays === "7") ? "1 week" : `${estimatedDays} days`

    const steps = [
        { title: "Order Confirmed", status: "confirmed", date: order.created_at },
        { title: "Shipped", status: "shipped", date: null },
        { title: "Out For Delivery", status: "out_for_delivery", date: null },
        { title: "Delivered", status: "delivered", date: null },
    ]

    const getStatusIndex = (status: string) => {
        switch (status) {
            case "not_fulfilled":
                return 0
            case "partially_fulfilled":
            case "fulfilled":
                return 1
            case "partially_shipped":
            case "shipped":
                return 2
            case "delivered":
                return 3
            default:
                return 0
        }
    }

    const currentStatusIndex = getStatusIndex(order.fulfillment_status)
    const trackingEntries = getFulfillmentTrackingEntries(
        (order as { fulfillments?: Array<Record<string, unknown>> }).fulfillments
    )

    return (
        <>
        <div className="order-track-page">
            <header className="order-track-page__header">
                <h1 className="order-track-page__title">
                    Track Your Little One&apos;s Order
                </h1>
                <p className="order-track-page__subtitle">
                    Order #{order.display_id} · Placed on {formatDate(order.created_at)}
                </p>
            </header>

            <div className="order-track-page__grid">
                {/* Left Column */}
                <div className="order-track-page__main">
                    {/* Main Order Card */}
                    <div className="order-track-card">
                        <div className="order-track-card__header">
                            <div>
                                <div className="order-track-card__heading-row">
                                    <h2 className="order-track-card__order-id">
                                        Order ID: {order.display_id}
                                    </h2>
                                    {/* Order Status Badges */}
                                    <div className="order-track-card__badges">
                                        {/* Fulfillment Status */}
                                        {(() => {
                                            const returns = (order as any).returns || (order as any).return_orders || []
                                            const isReviewed = returns.some((r: any) => r.status === "received" || r.status === "partially_received")
                                            const isRequested = returns.some((r: any) => r.status === "requested")

                                            if (isReviewed) {
                                                return (
                                                    <span className="order-track-badge order-track-badge--returned">
                                                        Returned
                                                    </span>
                                                )
                                            }

                                            if (isRequested) {
                                                return (
                                                    <span className="order-track-badge order-track-badge--return-requested">
                                                        Return Requested
                                                    </span>
                                                )
                                            }

                                            return (
                                                <span className={`order-track-badge ${(order.fulfillment_status === 'fulfilled' || order.fulfillment_status === 'shipped' || order.fulfillment_status === 'delivered')
                                                    ? 'order-track-badge--delivered'
                                                    : order.fulfillment_status === 'canceled'
                                                        ? 'order-track-badge--cancelled'
                                                        : order.fulfillment_status === 'partially_fulfilled'
                                                            ? 'order-track-badge--partial'
                                                            : 'order-track-badge--pending'
                                                    }`}>
                                                    {(order.fulfillment_status || 'pending').split('_').map(word =>
                                                        word.charAt(0).toUpperCase() + word.slice(1)
                                                    ).join(' ')}
                                                </span>
                                            )
                                        })()}

                                        {/* Refund Status */}
                                        {(order.payment_status === "refunded" || order.payment_status === "partially_refunded") && (
                                            <span className="order-track-badge order-track-badge--refund">
                                                Amount Refunded
                                            </span>
                                        )}

                                        {/* Payment Status */}
                                        <span className={`order-track-badge ${(order.payment_status === 'captured' || order.payment_status === 'partially_captured')
                                            ? 'order-track-badge--payment-captured'
                                            : (order.payment_status === 'awaiting' || order.payment_status === 'authorized' || order.payment_status === 'partially_authorized')
                                                ? 'order-track-badge--payment-pending'
                                                : (order.payment_status === 'canceled' || order.payment_status === 'refunded' || order.payment_status === 'partially_refunded')
                                                    ? 'order-track-badge--payment-failed'
                                                    : 'order-track-badge--payment-neutral'
                                            }`}>
                                            Payment: {(order.payment_status || 'pending').split('_').map(word =>
                                                word.charAt(0).toUpperCase() + word.slice(1)
                                            ).join(' ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="order-track-card__meta">
                                    <div className="order-track-card__meta-item">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        <span>Order date: <strong>{formatDate(order.created_at)}</strong></span>
                                    </div>
                                    <div className="order-track-card__meta-item order-track-card__meta-item--delivery">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                        <span>Estimated delivery: After {deliveryText}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="order-track-card__actions">
                                {/* First Row: Invoice & Reorder */}
                                {(order.fulfillment_status === "delivered" || isCancelled) && (
                                    <div className={`order-track-card__action-row ${order.fulfillment_status === "delivered" && !isCancelled ? "" : "order-track-card__action-row--three"}`}>
                                        {order.fulfillment_status === "delivered" && !isCancelled && (
                                            <button
                                                onClick={handleDownloadInvoice}
                                                disabled={isDownloading}
                                                className="order-track-btn"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8" /><path d="M8 17h8" /><path d="M8 9h1" /></svg>
                                                {isDownloading ? "..." : "Invoice"}
                                            </button>
                                        )}

                                        <div className="order-track-btn__tooltip-wrap">
                                            <button
                                                onClick={() => handleReorder()}
                                                disabled={isReordering}
                                                className="order-track-btn order-track-btn--primary w-full"
                                                data-ga-event="order_reorder_click"
                                                data-ga-label={`Order ${order.display_id}`}
                                            >
                                                {isReordering ? (
                                                    <Spinner className="animate-spin" />
                                                ) : (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
                                                )}
                                                {isReordering ? "Processing..." : "Reorder"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Second Row: Return & Exchange & Cancel */}
                                <div className="order-track-card__action-row order-track-card__action-row--three">
                                    {order.fulfillment_status === "delivered" && (
                                        <>
                                            {(() => {
                                                const returns = (order as any).returns || (order as any).return_orders || []
                                                const hasActiveReturns = returns.filter((r: any) => r.status !== "canceled" && r.status !== "rejected").length > 0
                                                const isReturnDisabled = hasActiveReturns || hasActiveReturn || !hasReturnableItems
                                                // Default to guest path if not yet determined to avoid mismatch
                                                const returnHref = isGuestUser === false ? `/account/orders/return/${order.id}` : `/order/return/${order.id}`

                                                return (
                                                    <div className="order-track-btn__tooltip-wrap">
                                                        {isReturnDisabled ? (
                                                            <button disabled className="order-track-btn order-track-btn--disabled w-full" data-ga-event="order_return_disabled" data-ga-label={`Order ${order.display_id}`}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                                                Return
                                                            </button>
                                                        ) : (
                                                            <LocalizedClientLink href={returnHref} className="order-track-btn w-full" data-ga-event="order_return_click" data-ga-label={`Order ${order.display_id}`}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                                                                Return
                                                            </LocalizedClientLink>
                                                        )}
                                                    </div>
                                                )
                                            })()}

                                            {(() => {
                                                const swaps = (order as any).swaps || []
                                                const hasActiveSwaps = swaps.filter((s: any) => s.status !== "canceled" && s.status !== "rejected").length > 0
                                                const isExchangeDisabled = hasActiveSwaps || hasActiveExchange || !hasReturnableItems
                                                const exchangeHref = isGuestUser === false ? `/account/orders/exchange/${order.id}` : `/order/exchange/${order.id}`

                                                return (
                                                    <div className="order-track-btn__tooltip-wrap">
                                                        {isExchangeDisabled ? (
                                                            <button disabled className="order-track-btn order-track-btn--disabled w-full" data-ga-event="order_exchange_disabled" data-ga-label={`Order ${order.display_id}`}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></svg>
                                                                Exchange
                                                            </button>
                                                        ) : (
                                                            <LocalizedClientLink href={exchangeHref} className="order-track-btn order-track-btn--outline-plum w-full" data-ga-event="order_exchange_click" data-ga-label={`Order ${order.display_id}`}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></svg>
                                                                Exchange
                                                            </LocalizedClientLink>
                                                        )}
                                                    </div>
                                                )
                                            })()}
                                        </>
                                    )}

                                    {/* Cancel Order Button */}
                                    {(() => {
                                        const hasFulfillment = order.fulfillment_status !== 'not_fulfilled'
                                        const isDisabled = isCancelling || isCancelled || !canCancel || hasFulfillment

                                        return (
                                            <div className="order-track-btn__tooltip-wrap">
                                                <button
                                                    onClick={handleCancelOrder}
                                                    disabled={isDisabled}
                                                    className={`order-track-btn w-full ${isCancelled
                                                        ? "order-track-btn--disabled"
                                                        : "order-track-btn--danger"
                                                        }`}
                                                    data-ga-event="order_cancel_click"
                                                    data-ga-label={`Order ${order.display_id}`}
                                                >
                                                    {isCancelling ? (
                                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    ) : (
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                                    )}
                                                    {isCancelling ? "..." : isCancelled ? "Cancelled" : "Cancel Order"}
                                                </button>

                                                {hasFulfillment && !isCancelled && (
                                                    <div className="order-track-btn__tooltip">
                                                        Cannot cancel after shipping.
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                        </div>

                        <hr className="order-track-card__divider" />

                        {/* Stepper */}
                        <div className="order-track-stepper">
                            <div className="order-track-stepper__track">
                                {(isCancelled ? [
                                    { title: "Order Confirmed", status: "confirmed", date: order.created_at },
                                    { title: "Order Cancelled", status: "canceled", date: (order as any).canceled_at || new Date() }
                                ] : steps).map((step, index, arr) => {
                                    const isActive = isCancelled ? true : index <= currentStatusIndex
                                    const isCancelledStep = isCancelled && index === 1

                                    // Helper to get icon based on status
                                    const getIcon = () => {
                                        if (isCancelledStep) return (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        )

                                        if (step.status === 'confirmed') return (
                                            <span
                                                className="order-track-stepper__img"
                                                style={{ WebkitMaskImage: 'url("/order-delivy.png")', maskImage: 'url("/order-delivy.png")' }}
                                                aria-hidden="true"
                                            />
                                        )
                                        if (step.status === 'shipped') return (
                                            <span
                                                className="order-track-stepper__img"
                                                style={{ WebkitMaskImage: 'url("/box%20(1).png")', maskImage: 'url("/box%20(1).png")' }}
                                                aria-hidden="true"
                                            />
                                        )
                                        if (step.status === 'out_for_delivery') return (
                                            <img
                                                src="/delivery.svg"
                                                alt=""
                                                aria-hidden="true"
                                                className="order-track-delivery-icon order-track-delivery-icon--stepper"
                                            />
                                        )
                                        if (step.status === 'delivered') return (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        )

                                        // Default fallback
                                        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
                                    }

                                    return (
                                        <div key={index} className={`order-track-stepper__step ${isCancelled ? "order-track-stepper__step--half" : ""}`}>
                                            {index < arr.length - 1 && (
                                                <div
                                                    className={`order-track-stepper__line ${isActive ? (isCancelled ? "order-track-stepper__line--cancelled" : "order-track-stepper__line--active") : ""}`}
                                                />
                                            )}

                                            <div
                                                className={`order-track-stepper__icon ${isActive
                                                    ? (isCancelledStep ? "order-track-stepper__icon--cancelled" : "order-track-stepper__icon--active")
                                                    : ""
                                                    }`}
                                            >
                                                {getIcon()}
                                            </div>

                                            <p className={`order-track-stepper__label ${isActive ? (isCancelledStep ? "order-track-stepper__label--cancelled" : "order-track-stepper__label--active") : ""}`}>
                                                {step.title}
                                            </p>
                                            <p className="order-track-stepper__date">
                                                {step.date ? formatStepDate(step.date) : ""}
                                                {!isCancelled && !isActive && index === 3 ? `After ${deliveryText}` : ""}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {trackingEntries.length > 0 && (
                            <div className="order-track-tracking">
                                <div className="order-track-tracking__header">
                                    <div className="order-track-tracking__icon" aria-hidden="true">
                                        <img
                                            src="/delivery.svg"
                                            alt=""
                                            className="order-track-delivery-icon order-track-delivery-icon--tracking"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="order-track-tracking__title">Track Shipment</h3>
                                        <p className="order-track-tracking__subtitle">Your package is on the way</p>
                                    </div>
                                </div>
                                <ul className="order-track-tracking__list">
                                    {trackingEntries.map((entry, index) => (
                                        <li key={`${entry.trackingNumber || "entry"}-${index}`} className="order-track-tracking__item">
                                            {entry.trackingNumber && (
                                                <div className="order-track-tracking__number-box">
                                                    <span className="order-track-tracking__term">Tracking Number</span>
                                                    <span className="order-track-tracking__number">{entry.trackingNumber}</span>
                                                </div>
                                            )}
                                            {entry.trackingUrl && (
                                                <a
                                                    href={entry.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="order-track-tracking__cta"
                                                >
                                                    Track Package
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                                </a>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Product List */}
                        <div className="order-track-products">
                            <div className="order-track-products__head">
                                <span className="order-track-products__accent" aria-hidden="true" />
                                <h3 className="order-track-products__title">Order Items</h3>
                            </div>
                            {order.items?.map((item) => {
                                const itemThumbnail = getCartLineItemThumbnail(
                                    item as HttpTypes.StoreCartLineItem & {
                                        product?: HttpTypes.StoreProduct
                                    }
                                )

                                return (
                                <LocalizedClientLink 
                                    key={item.id} 
                                    href={`/products/${item.variant?.product?.handle}`}
                                    className="order-track-product"
                                >
                                    <div className="order-track-product__thumb">
                                        <Thumbnail
                                            thumbnail={itemThumbnail}
                                            size="square"
                                            className="order-track-product__thumb-img"
                                        />
                                    </div>
                                    <div className="order-track-product__body">
                                        <div>
                                            <h3 className="order-track-product__title">
                                                {item.title}
                                            </h3>
                                            <div className="order-track-product__variant">
                                                <LineItemOptions
                                                  variant={item.variant}
                                                  metadata={item.metadata}
                                                  title={item.title}
                                                />
                                            </div>
                                        </div>
                                        <div className="order-track-product__footer">
                                            <div className="order-track-product__price">
                                                {convertToLocale({
                                                    amount: item.total ?? ((item.unit_price ?? 0) * item.quantity),
                                                    currency_code: order.currency_code,
                                                })}
                                            </div>
                                            <div className="order-track-product__qty">
                                                Qty: {item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                </LocalizedClientLink>
                            )})}
                        </div>
                    </div>

                    {/* Returns & Exchanges Details */}
                    {(fetchedReturns.length > 0 || fetchedSwaps.length > 0) && (
                        <div className="order-track-card order-track-returns">
                            <h3 className="order-track-returns__title">Return & Exchange Details</h3>
                            <div className="order-track-returns__list">
                                {fetchedReturns.map((r: any, idx: number) => (
                                    <div key={r.id || idx} className="order-track-request order-track-request--return">
                                        <div className="order-track-request__header">
                                            <h4 className="order-track-request__title">Return Request</h4>
                                            <span className="order-track-request__status">{r.status}</span>
                                        </div>
                                        <div className="order-track-request__body">
                                            {r.items?.map((item: any, i: number) => {
                                                const itemName = order.items?.find((oItem: any) => oItem.id === item.item_id)?.title || 'Returned Item'
                                                return (
                                                    <div key={i} className="order-track-request-item">
                                                        <h5 className="order-track-request-item__name">{itemName}</h5>
                                                        <div>
                                                            <span className="order-track-request-item__label">Reason</span>
                                                            <p className="order-track-request-item__value">{item.return_reason?.value || item.reason?.value || 'N/A'}</p>
                                                        </div>
                                                        {item.note && (
                                                            <div>
                                                                <span className="order-track-request-item__label">Additional Note</span>
                                                                <p className="order-track-request-item__note">"{item.note}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {r.note && (
                                            <div className="order-track-request__body order-track-request__body--compact">
                                                <div className="order-track-request-item">
                                                    <span className="order-track-request-item__label">Request Note</span>
                                                    <p className="order-track-request-item__note">"{r.note}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {fetchedSwaps.map((s: any, idx: number) => (
                                    <div key={s.id || idx} className="order-track-request order-track-request--exchange">
                                        <div className="order-track-request__header">
                                            <h4 className="order-track-request__title">Exchange Request</h4>
                                            <span className="order-track-request__status">{s.status}</span>
                                        </div>
                                        <div className="order-track-request__body">
                                            {s.return_order?.items?.map((item: any, i: number) => {
                                                const itemName = order.items?.find((oItem: any) => oItem.id === item.item_id)?.title || 'Exchanged Item'
                                                return (
                                                    <div key={i} className="order-track-request-item">
                                                        <h5 className="order-track-request-item__name">{itemName}</h5>
                                                        <div>
                                                            <span className="order-track-request-item__label">Reason</span>
                                                            <p className="order-track-request-item__value">{item.return_reason?.value || item.reason?.value || 'N/A'}</p>
                                                        </div>
                                                        {item.note && (
                                                            <div>
                                                                <span className="order-track-request-item__label">Additional Note</span>
                                                                <p className="order-track-request-item__note">"{item.note}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {s.return_order?.note && (
                                            <div className="order-track-request__body order-track-request__body--compact">
                                                <div className="order-track-request-item">
                                                    <span className="order-track-request-item__label">Exchange Note</span>
                                                    <p className="order-track-request-item__note">"{s.return_order.note}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment & Delivery Bottom Cards */}
                    <div className="order-track-info-grid">
                        {/* Payment Card */}
                        <div className="order-track-info-card">
                            <h3 className="order-track-info-card__title">Payment</h3>
                            {(() => {
                                const payment = (order as any).payments?.[0] || order.payment_collections?.[0]?.payments?.[0]
                                const providerId = payment?.provider_id || ""
                                const isManual = providerId.includes("manual") || providerId.includes("system_default") || providerId === "cod"

                                if (isManual) {
                                    return (
                                        <div className="order-track-info-card__payment">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12h.01"/><path d="M17 12h.01"/><path d="M7 12h.01"/></svg>
                                            Cash on Delivery (Cash/UPI)
                                        </div>
                                    )
                                }

                                const brand = (payment?.data?.card_brand as string)?.toUpperCase()
                                const last4 = payment?.data?.card_last4 as string

                                if (brand || last4) {
                                    return (
                                        <div className="order-track-info-card__payment">
                                            <span>**{last4 || "0000"}</span>
                                            {brand && (
                                                <span className="order-track-badge order-track-badge--pending">{brand}</span>
                                            )}
                                        </div>
                                    )
                                }

                                return (
                                    <div className="order-track-info-card__payment">
                                        {providerId ? providerId.replace(/_/g, " ") : "Payment details not available"}
                                    </div>
                                )
                            })()}
                        </div>

                        {/* Delivery Card */}
                        <div className="order-track-info-card">
                            <h3 className="order-track-info-card__title">Delivery</h3>
                            <p className="order-track-info-card__address-label">Address</p>
                            <div className="order-track-info-card__address">
                                <strong>
                                    {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                                </strong>
                                <p>{order.shipping_address?.address_1}</p>
                                {order.shipping_address?.address_2 && <p>{order.shipping_address.address_2}</p>}
                                <p>
                                    {order.shipping_address?.city}
                                    {order.shipping_address?.province && `, ${order.shipping_address.province}`}
                                    {order.shipping_address?.postal_code && ` - ${order.shipping_address.postal_code}`}
                                </p>
                                <p>{order.shipping_address?.country_code?.toUpperCase()}</p>
                                <p>
                                    Phone: {order.shipping_address?.phone ? (order.shipping_address.phone.startsWith("+") ? order.shipping_address.phone : `+${order.shipping_address.phone}`) : "N/A"}
                                </p>
                                {order.email && (
                                    <p data-testid="order-detail-email">
                                        Email: {order.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Help / Issues Section */}
                    <div className="order-track-help">
                        <div className="order-track-help__inner">
                            <div>
                                <h3 className="order-track-help__title">Having an issue with this order?</h3>
                                <p className="order-track-help__text">Check our frequently asked questions or contact our support team for help.</p>
                            </div>
                            <LocalizedClientLink
                                href="/help"
                                className="order-track-btn order-track-btn--outline-plum"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                Help & FAQ
                            </LocalizedClientLink>
                        </div>
                    </div>
                </div>

                {/* Right Column - Price Summary */}
                <div className="order-track-summary">
                    <h3 className="order-track-summary__title">
                        PRICE SUMMARY ({order.items?.length} {order.items?.length === 1 ? "ITEM" : "ITEMS"})
                    </h3>

                    <div className="order-track-summary__rows">
                        <div className="order-track-summary__row">
                            <span>Total MRP</span>
                            <span>
                                {getAmount(order.items?.reduce((acc, item) => {
                                    return acc + ((item as any).original_total ?? (item.unit_price * item.quantity))
                                }, 0))}
                            </span>
                        </div>

                        {order.discount_total > 0 && (
                            <div className="order-track-summary__row order-track-summary__row--discount">
                                <span>Discount</span>
                                <span>-{getAmount(order.discount_total)}</span>
                            </div>
                        )}

                        <div className="order-track-summary__row">
                            <span>GST</span>
                            <span>{getAmount(order.tax_total)}</span>
                        </div>

                        <div className="order-track-summary__row">
                            <span>Shipping</span>
                            <span>{getAmount(order.shipping_total)}</span>
                        </div>

                        <hr className="order-track-summary__divider" />

                        <div className="order-track-summary__total">
                            <span>Total</span>
                            <span>{getAmount(order.total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
                    {inventoryIssues && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setInventoryIssues(null)}>
                    <div 
                        className="w-full max-w-[480px] bg-white rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden relative animate-in zoom-in-95 duration-200" 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 sm:p-6 relative">
                            {/* Close Icon */}
                            <button 
                                onClick={() => setInventoryIssues(null)}
                                className="absolute top-5 right-5 p-1 text-gray-300 hover:text-gray-900 transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>

                            {/* Centered Icon */}
                            <div className="flex justify-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                </div>
                            </div>

                            <div className="text-center mb-5 px-2">
                                <h2 className="text-[17px] font-bold text-gray-900 leading-snug px-2 whitespace-nowrap">
                                    {inventoryIssues.every(i => (i.available_quantity ?? 0) === 0) && inventoryIssues.length === (order.items?.length ?? 0) ? (
                                        <>Sorry! This product is currently out of stock 😔</>
                                    ) : (
                                        "Inventory Update"
                                    )}
                                </h2>
                                <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
                                    {inventoryIssues.every(i => (i.available_quantity ?? 0) === 0) && inventoryIssues.length === (order.items?.length ?? 0)
                                        ? "You can explore and purchase similar products instead 🛍️✨"
                                        : "Some items in your order are currently unavailable or have limited stock. Would you like to proceed with the remaining items?"}
                                </p>
                            </div>

                            {/* Comprehensive Item List */}
                            <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1 custom-scrollbar mb-8">
                                {order.items?.map((item, idx) => {
                                    const issue = inventoryIssues.find(i => i.variant_id === item.variant_id)
                                    const isOutOfStock = issue?.available_quantity === 0
                                    const isLimited = issue && (issue.available_quantity ?? 0) > 0
                                    const isFullyAvailable = !issue

                                    return (
                                        <div key={idx} className={`p-3 rounded-2xl flex items-center gap-4 border transition-all ${
                                            isOutOfStock ? "bg-red-50/50 border-red-100" : 
                                            isLimited ? "bg-orange-50/50 border-orange-100" : 
                                            "bg-green-50/50 border-green-100"
                                        }`}>
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 shadow-sm">
                                                {item.thumbnail ? (
                                                    <Image 
                                                        src={item.thumbnail} 
                                                        alt={item.title || "Product"} 
                                                        width={48} 
                                                        height={48} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300 font-bold">N/A</div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-grow min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-xs text-gray-900 truncate">
                                                        {item.title}
                                                    </h4>
                                                    <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400 whitespace-nowrap">
                                                        Qty: {item.quantity}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 mt-1">
                                                    {isOutOfStock ? (
                                                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-red-500" />
                                                            Out of Stock
                                                        </span>
                                                    ) : isLimited ? (
                                                        <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-orange-500" />
                                                            Only {issue.available_quantity} available
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-green-500" />
                                                            Fully Available
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex gap-3 mt-2">
                                {(inventoryIssues.length < (order.items?.length ?? 0) || inventoryIssues.some(i => (i.available_quantity ?? 0) > 0)) ? (
                                    <>
                                        <button 
                                            onClick={() => setInventoryIssues(null)}
                                            className="flex-1 h-11 rounded-xl font-bold text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setInventoryIssues(null)
                                                handleReorder([], true)
                                            }}
                                            disabled={isReordering}
                                            className="flex-1 h-11 rounded-xl font-bold text-sm bg-[#8B5AB1] text-white hover:bg-[#764a97] transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                                        >
                                            {isReordering ? <Spinner className="animate-spin" /> : "Reorder"}
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex gap-3 w-full">
                                        <button 
                                            onClick={() => setInventoryIssues(null)}
                                            className="flex-1 h-11 rounded-xl font-bold text-sm bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all active:scale-95"
                                        >
                                            Got It
                                        </button>
                                        <LocalizedClientLink 
                                            href="/store"
                                            className="flex-1 h-11 rounded-xl font-bold text-sm bg-[#8B5AB1] text-white hover:bg-[#764a97] transition-all active:scale-95 shadow-sm flex items-center justify-center"
                                            onClick={() => setInventoryIssues(null)}
                                        >
                                            SHOP NOW
                                        </LocalizedClientLink>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default OrderRedesign
