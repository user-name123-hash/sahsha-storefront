"use client"

import { HttpTypes } from "@medusajs/types"
import React from "react"

import { downloadInvoice, cancelOrder, reorderOrder } from "@core/data/orders"
import { hasReturnableItems } from "@core/util/returns"
import { useRouter, useParams } from "next/navigation"
import CancelOrderModal from "@modules/order/components/cancel-order-modal"
import OrderRedesign from "@modules/order/components/order-redesign"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  const router = useRouter()
  const params = useParams()
  const countryCode = params.countryCode as string
  const [isDownloading, setIsDownloading] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [isReordering, setIsReordering] = React.useState(false)
  const [showCancelModal, setShowCancelModal] = React.useState(false)
  const [inventoryIssues, setInventoryIssues] = React.useState<any[] | null>(null)

  const handleDownloadInvoice = async () => {
    setIsDownloading(true)
    try {
      const result = await downloadInvoice(order.id)

      if (!result.success) {
        alert(result.error || "Failed to download invoice")
        setIsDownloading(false)
        return
      }

      if (result.data) {
        // Convert base64 to blob
        const byteCharacters = atob(result.data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: "application/pdf" })

        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `invoice-${order.display_id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      alert("An error occurred while downloading the invoice.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleCancelOrderConfirm = async (reasonId: string) => {
    setIsCancelling(true)
    const result = await cancelOrder(order.id, reasonId)
    if (result.success) {
      alert("Order cancelled successfully")
      setShowCancelModal(false)
      router.refresh()
    } else {
      alert(result.error || "Failed to cancel order")
    }
    setIsCancelling(false)
  }

  const handleReorder = async (skipVariantIds?: string[], forceReorder: boolean = false) => {
    setIsReordering(true)
    setInventoryIssues(null)
    const result = await reorderOrder(order.id, skipVariantIds, forceReorder)
    if (result.success) {
      const cartId = (result as any).data?.cart?.id || (result as any).data?.id || (result as any).data?.cart_id
      const checkoutUrl = countryCode ? `/${countryCode}/checkout` : "/checkout"
      window.location.assign(cartId ? `${checkoutUrl}?cart_id=${cartId}` : checkoutUrl)
    } else {
      if ((result as any).inventory_issues) {
        setInventoryIssues((result as any).inventory_issues)
      } else {
        alert(result.error || "Failed to reorder")
      }
    }
    setIsReordering(false)
  }

  const isCancelled = order.status === "canceled"
  const canCancel = !isCancelled && order.status !== "archived"

  return (
    <div className="order-track-page-wrap">
      <div className="order-track-page-wrap__inner">
        <OrderRedesign
          order={order}
          handleDownloadInvoice={handleDownloadInvoice}
          isDownloading={isDownloading}
          handleCancelOrder={async () => setShowCancelModal(true)}
          isCancelling={isCancelling}
          handleReorder={handleReorder}
          isReordering={isReordering}
          canCancel={canCancel}
          isCancelled={isCancelled}
          hasReturnableItems={hasReturnableItems(order)}
          inventoryIssues={inventoryIssues}
          setInventoryIssues={setInventoryIssues}
        />
      </div>

      <CancelOrderModal
        isOpen={showCancelModal}
        isSubmitting={isCancelling}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrderConfirm}
      />
    </div>
  )
}

export default OrderDetailsTemplate
