"use client"

import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Image from "next/image"
import { ShoppingBag, ArrowRight, RefreshCw, Loader2 } from "lucide-react"
import { Trash } from "@medusajs/icons"
import { useState, useTransition, useEffect } from "react"
import { resumeAbandonedCart } from "@core/data/cart"
import { deleteAbandonedCart } from "@lib/data/cart/delete-abandoned-cart"
import Modal from "@modules/common/components/modal"

type AbandonedCartsProps = {
  abandonedCarts?: {
    buyNowCarts: HttpTypes.StoreCart[]
    reorderCarts: HttpTypes.StoreCart[]
  }
  countryCode: string
}

export default function AbandonedCarts({ abandonedCarts, countryCode }: AbandonedCartsProps) {
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()
  const [resumingId, setResumingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expandedCarts, setExpandedCarts] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<"buy_now" | "reorder">("buy_now")

  const buyNowCarts = abandonedCarts?.buyNowCarts ?? []
  const reorderCarts = abandonedCarts?.reorderCarts ?? []

  const hasItems = (cart: HttpTypes.StoreCart) => (cart.items?.length ?? 0) > 0
  const activeBuyNowCarts = buyNowCarts.filter(
    (cart) => !dismissed[cart.id] && hasItems(cart)
  )
  const activeReorderCarts = reorderCarts.filter(
    (cart) => !dismissed[cart.id] && hasItems(cart)
  )

  useEffect(() => {
    if (activeBuyNowCarts.length === 0 && activeReorderCarts.length > 0 && activeTab === "buy_now") {
      setActiveTab("reorder")
    } else if (activeReorderCarts.length === 0 && activeBuyNowCarts.length > 0 && activeTab === "reorder") {
      setActiveTab("buy_now")
    }
  }, [activeBuyNowCarts.length, activeReorderCarts.length, activeTab])

  if (!abandonedCarts) return null

  if (activeBuyNowCarts.length === 0 && activeReorderCarts.length === 0) return null

  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    setDeleteError(null)
    const result = await deleteAbandonedCart(deletingId)

    if (result.success) {
      setDismissed((prev) => ({ ...prev, [deletingId]: true }))
      setDeletingId(null)
    } else {
      setDeleteError(result.error || "Failed to remove pending order.")
    }
    setIsDeleting(false)
  }

  const handleResume = (cartId: string) => {
    setResumingId(cartId)
    startTransition(() => {
      resumeAbandonedCart(cartId, countryCode)
    })
  }

  const renderCartCard = (cart: HttpTypes.StoreCart, type: "buy_now" | "reorder") => {
    const itemCount = cart.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
    const items = cart.items || []
    const total = items.reduce((acc, item) => acc + (item.total || 0), 0).toFixed(2)
    
    const isBuyNow = type === "buy_now"
    const isResuming = isPending && resumingId === cart.id

    return (
      <div
        key={cart.id}
        className={`pending-orders-card relative group ${isBuyNow ? "pending-orders-card--buy-now" : "pending-orders-card--reorder"}`}
      >
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDeleteError(null)
            setDeletingId(cart.id)
          }}
          className="pending-orders-card__delete"
          title="Delete this cart"
          disabled={isResuming || (isDeleting && deletingId === cart.id)}
        >
          {isDeleting && deletingId === cart.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash className="w-4 h-4 pointer-events-none" />
          )}
        </button>

        <div className="pending-orders-card__body">
          <div className="pending-orders-card__top">
            <span className="pending-orders-card__badge">
              {isBuyNow ? "Buy Now Order" : "Reorder Order"}
            </span>
            <span className="pending-orders-card__status">Awaiting checkout</span>
          </div>

          <div className="pending-orders-card__items">
            {(expandedCarts[cart.id] ? items : items.slice(0, 1)).map((item, index) => (
              <div
                key={item.id}
                className={`pending-orders-card__item ${index > 0 ? "pending-orders-card__item--divider" : ""}`}
              >
                <div className="pending-orders-card__thumb">
                  {item.thumbnail ? (
                    <Image
                      src={item.thumbnail}
                      alt={item.title}
                      width={128}
                      height={128}
                      sizes="64px"
                      quality={65}
                      className="pending-orders-card__thumb-img"
                    />
                  ) : (
                    <ShoppingBag className="w-4 h-4 text-[#c9a86a]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="pending-orders-card__item-title">{item.title}</h3>
                  <p className="pending-orders-card__item-meta">
                    Qty: {item.quantity}
                    <span className="pending-orders-card__dot" aria-hidden>
                      ·
                    </span>
                    <span className="pending-orders-card__item-price">
                      ₹{item.total?.toFixed(2) || "0.00"}
                    </span>
                  </p>
                </div>
              </div>
            ))}

            {items.length > 1 && (
              <div className="pending-orders-card__more">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setExpandedCarts((prev) => ({
                      ...prev,
                      [cart.id]: !prev[cart.id],
                    }))
                  }}
                  className="pending-orders-card__expand"
                >
                  {expandedCarts[cart.id]
                    ? "Show Less"
                    : `+ View ${items.length - 1} more`}
                </button>

                {!expandedCarts[cart.id] && (
                  <div className="pending-orders-card__mini-row">
                    {items.slice(1, 4).map((item) => (
                      <div
                        key={item.id}
                        className="pending-orders-card__mini-thumb"
                        title={item.title}
                      >
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.title}
                            width={44}
                            height={44}
                            sizes="22px"
                            quality={65}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[7px] font-bold text-[#5a2a43]">
                            {item.title
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                    {items.length > 4 && (
                      <div className="pending-orders-card__mini-more">
                        +{items.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pending-orders-card__footer">
            <p className="pending-orders-card__total">
              {itemCount} {itemCount === 1 ? "item" : "items"}
              <span className="pending-orders-card__dot" aria-hidden>
                ·
              </span>
              Total: <span>₹{total}</span>
            </p>
            <Button
              variant="primary"
              onClick={() => handleResume(cart.id)}
              disabled={isResuming || isDeleting}
              className="pending-orders-card__cta group/btn"
            >
              {isResuming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isBuyNow ? "Continue Checkout" : "Continue Reorder"}
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const buyNowTotalItems = activeBuyNowCarts.reduce((acc, cart) => acc + (cart.items?.reduce((a, i) => a + i.quantity, 0) || 0), 0)
  const reorderTotalItems = activeReorderCarts.reduce((acc, cart) => acc + (cart.items?.reduce((a, i) => a + i.quantity, 0) || 0), 0)

  return (
    <>
      <div id="abandoned-carts-section" className="pending-orders-section w-full flex flex-col gap-3 animate-in fade-in duration-500 scroll-mt-24 min-[1024px]:scroll-mt-32">
        
        {(activeBuyNowCarts.length > 0 && activeReorderCarts.length > 0) && (
          <div className="pending-orders-tabs">
            <button
              onClick={() => setActiveTab("buy_now")}
              className={`pending-orders-tabs__btn ${activeTab === "buy_now" ? "pending-orders-tabs__btn--active" : ""}`}
            >
              Buy Now ({activeBuyNowCarts.length})
            </button>
            <button
              onClick={() => setActiveTab("reorder")}
              className={`pending-orders-tabs__btn ${activeTab === "reorder" ? "pending-orders-tabs__btn--active" : ""}`}
            >
              Reorder ({activeReorderCarts.length})
            </button>
          </div>
        )}

        {activeTab === "buy_now" && activeBuyNowCarts.length > 0 && (
          <div className="pending-orders-panel pending-orders-panel--buy-now">
            <div className="pending-orders-panel__header">
              <div className="pending-orders-panel__intro">
                <div className="pending-orders-panel__icon" aria-hidden>
                  <Image
                    src="/digital.png"
                    alt=""
                    width={40}
                    height={40}
                    className="pending-orders-panel__icon-img"
                  />
                </div>
                <div className="pending-orders-panel__copy">
                  <h2 className="pending-orders-panel__title">Pending Buy Now Order</h2>
                  <p className="pending-orders-panel__desc">
                    Your Buy Now items are waiting. Finish checkout to complete your order.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center mt-0.5">
                <span className="pending-orders-panel__count">
                  {buyNowTotalItems}{" "}
                  {buyNowTotalItems === 1 ? "Item" : "Items"} Pending
                </span>
              </div>
            </div>
            <div
              className={`pending-orders-panel__grid ${
                activeBuyNowCarts.length === 1
                  ? "pending-orders-panel__grid--single"
                  : ""
              }`}
            >
              <div className="sm:hidden mb-1">
                <span className="pending-orders-panel__count pending-orders-panel__count--mobile">
                  {buyNowTotalItems}{" "}
                  {buyNowTotalItems === 1 ? "Item" : "Items"} Pending
                </span>
              </div>
              {activeBuyNowCarts.map((cart) => renderCartCard(cart, "buy_now"))}
            </div>
          </div>
        )}

        {(activeTab === "reorder" || activeBuyNowCarts.length === 0) &&
          activeReorderCarts.length > 0 && (
            <div className="pending-orders-panel pending-orders-panel--reorder">
              <div className="pending-orders-panel__header">
                <div className="pending-orders-panel__intro">
                  <div className="pending-orders-panel__icon pending-orders-panel__icon--reorder">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div className="pending-orders-panel__copy">
                    <h2 className="pending-orders-panel__title">Pending Reorder</h2>
                    <p className="pending-orders-panel__desc">
                      Your reorder items are pending. Proceed to checkout to complete your
                      order.
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center mt-0.5">
                  <span className="pending-orders-panel__count">
                    {reorderTotalItems}{" "}
                    {reorderTotalItems === 1 ? "Item" : "Items"} Pending
                  </span>
                </div>
              </div>
              <div
                className={`pending-orders-panel__grid ${
                  activeReorderCarts.length === 1
                    ? "pending-orders-panel__grid--single"
                    : ""
                }`}
              >
                <div className="sm:hidden mb-1">
                  <span className="pending-orders-panel__count pending-orders-panel__count--mobile">
                    {reorderTotalItems}{" "}
                    {reorderTotalItems === 1 ? "Item" : "Items"} Pending
                  </span>
                </div>
                {activeReorderCarts.map((cart) =>
                  renderCartCard(cart, "reorder")
                )}
              </div>
            </div>
          )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        close={() => {
          if (isDeleting) return
          setDeletingId(null)
          setDeleteError(null)
        }}
        size="xsmall"
      >
        <div className="p-7 md:p-9">
          <div className="flex flex-col items-center text-center">
            <div className="w-13 h-13 rounded-full bg-[#FFF5F5] flex items-center justify-center mb-5">
              <Trash className="w-6 h-6 text-[#F34E4E]" />
            </div>

            <h2 className="text-xl md:text-2xl font-extrabold text-[#111827] mb-2 tracking-tight">
              Remove Order?
            </h2>

            <p className="text-[#6B7280] text-sm md:text-base leading-relaxed mb-7 max-w-[280px]">
              Are you sure you want to remove this pending order? This action cannot be undone.
            </p>

            {deleteError && (
              <p className="mb-4 text-sm text-[#F34E4E]" role="alert">
                {deleteError}
              </p>
            )}

            <div className="flex flex-row gap-3 w-full">
              <button
                onClick={() => {
                  setDeletingId(null)
                  setDeleteError(null)
                }}
                disabled={isDeleting}
                className="flex-1 bg-white hover:bg-gray-50 text-[#111827] font-bold h-[48px] rounded-xl text-sm md:text-base transition-all active:scale-[0.98] border-2 border-[#E5E7EB] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-[#F34E4E] hover:bg-[#E03E3E] text-white font-bold h-[48px] rounded-xl text-sm md:text-base transition-all active:scale-[0.98] flex items-center justify-center border-2 border-[#111827] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  "Yes, Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
