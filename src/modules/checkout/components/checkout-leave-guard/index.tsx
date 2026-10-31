"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Modal from "@modules/common/components/modal"

export default function CheckoutLeaveGuard() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [targetUrl, setTargetUrl] = useState<string | null>(null)

  const isNavigatingRef = useRef(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isNavigatingRef.current) return
      e.preventDefault()
      e.returnValue = ""
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const link = target.closest("a")

      if (link && link.href) {
        // If it's a link within checkout, an anchor, or the same page, do nothing
        if (
          link.href === window.location.href || 
          link.href.startsWith(window.location.pathname + "#") ||
          link.pathname.includes('/checkout') ||
          link.pathname.includes('/order/confirmed')
        ) {
          return
        }

        e.preventDefault()
        setTargetUrl(link.href)
        setShowModal(true)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    document.addEventListener("click", handleClick, { capture: true })

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      document.removeEventListener("click", handleClick, { capture: true })
    }
  }, [])

  const handleConfirm = () => {
    if (targetUrl) {
      isNavigatingRef.current = true
      window.location.href = targetUrl
    }
    setShowModal(false)
  }

  const handleCancel = () => {
    setShowModal(false)
    setTargetUrl(null)
  }

  return (
    <Modal isOpen={showModal} close={handleCancel} size="xsmall">
      <div className="checkout-leave-modal">
        <div className="checkout-leave-modal__hero">
          <div className="checkout-leave-modal__icon" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>
          <h2 className="checkout-leave-modal__title">Leave Checkout?</h2>
        </div>

        <div className="checkout-leave-modal__body">
          <p className="checkout-leave-modal__text">
            Your order details and progress will be lost if you leave now. Are you sure you want to go back?
          </p>

          <div className="checkout-leave-modal__actions">
            <button
              type="button"
              onClick={handleCancel}
              className="checkout-leave-modal__btn checkout-leave-modal__btn--secondary"
            >
              Stay in Checkout
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="checkout-leave-modal__btn checkout-leave-modal__btn--primary"
            >
              Yes, Leave
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
