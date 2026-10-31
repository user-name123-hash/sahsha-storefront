"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { listReturnReasons } from "@core/data/returns"
import React from "react"

type CancelOrderModalProps = {
  isOpen: boolean
  isSubmitting: boolean
  onClose: () => void
  onConfirm: (reasonId: string) => void
}

const CancelOrderModal = ({
  isOpen,
  isSubmitting,
  onClose,
  onConfirm,
}: CancelOrderModalProps) => {
  const [reasons, setReasons] = React.useState<HttpTypes.StoreReturnReason[]>([])
  const [selectedReasonId, setSelectedReasonId] = React.useState("")
  const [isFetchingReasons, setIsFetchingReasons] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedReasonId("")
      return
    }

    let isMounted = true

    const fetchReasons = async () => {
      setIsFetchingReasons(true)
      const res = await listReturnReasons()
      if (isMounted) {
        setReasons(res)
        setIsFetchingReasons(false)
      }
    }

    fetchReasons()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const handleClose = () => {
    setSelectedReasonId("")
    onClose()
  }

  const handleConfirm = () => {
    if (!selectedReasonId) {
      alert("Please select a reason for cancellation")
      return
    }

    onConfirm(selectedReasonId)
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in" onClick={handleClose} />
      <div 
        className="relative w-full max-w-lg bg-page-bg rounded-[32px] sm:rounded-[40px] shadow-2xl p-6 sm:p-10 animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 sm:top-8 sm:right-8 text-gray-400 hover:text-heading transition-colors"
          aria-label="Close cancel order dialog"
        >
          <XMark className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="text-center mb-6 sm:mb-8">
          <h2 id="cancel-order-title" className="text-2xl sm:text-3xl font-black font-sans text-brand-accent tracking-tight uppercase">
            Cancel Order
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-2 leading-relaxed">
            We're sorry to see you go! Please let us know why you're cancelling this order so we can improve our service.
          </p>
        </div>

        <div className="mb-8">
          <label htmlFor="cancel-reason-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Reason for Cancellation
          </label>
          <select
            id="cancel-reason-select"
            value={selectedReasonId}
            onChange={(e) => setSelectedReasonId(e.target.value)}
            disabled={isFetchingReasons}
            className="w-full h-14 rounded-2xl border border-gray-200 bg-gray-50/50 px-4 text-sm font-medium text-heading outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all appearance-none cursor-pointer"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1rem'
            }}
          >
            <option value="" disabled>
              {isFetchingReasons ? "Loading reasons..." : "Select a reason"}
            </option>
            {reasons.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.label}
              </option>
            ))}
            {reasons.length === 0 && !isFetchingReasons && (
              <option value="other">Other / Not Specified</option>
            )}
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedReasonId || isSubmitting}
            className="w-full h-14 sm:h-16 rounded-2xl bg-brand-accent hover:opacity-90 text-inverse font-black text-base sm:text-lg uppercase tracking-widest shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Cancelling...
              </>
            ) : (
              "Cancel Order"
            )}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-white hover:bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
          >
            Keep Order
          </button>
        </div>
      </div>
    </div>
  )
}

export default CancelOrderModal
