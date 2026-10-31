"use client"

import { deleteLineItem } from "@core/data/cart"
import { addToWishlist } from "@core/data/wishlist"
import { Spinner, Trash } from "@medusajs/icons"
import { clx, Button, Heading, Text } from "@medusajs/ui"
import Modal from "@modules/common/components/modal"
import { useState } from "react"
import { useWishlist } from "@core/context/wishlist-context"

import Image from "next/image"
import X from "@modules/common/icons/x"

const DeleteButton = ({
  id,
  productId,
  thumbnail,
  children,
  className,
  onAfterDelete,
  "data-testid": dataTestId,
}: {
  id: string
  productId?: string
  thumbnail?: string | null
  children?: React.ReactNode
  className?: string
  onAfterDelete?: () => void
  "data-testid"?: string
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshWishlist } = useWishlist()

  const handleDelete = async () => {
    setIsDeleting(true)
    setShowModal(false)
    try {
      await deleteLineItem(id)
      onAfterDelete?.()
    } catch {
      // keep isDeleting false on error
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMoveToWishlist = async () => {
    if (!productId) {
      handleDelete()
      return
    }
    
    setWishlistLoading(true)
    setError(null)
    
    const result = await addToWishlist(productId)
    
    if (result.success) {
      await refreshWishlist()
      await handleDelete()
    } else {
      setError(result.error || "Please login to move items to wishlist.")
      setWishlistLoading(false)
    }
  }

  return (
    <>
      <div
        className={clx(
          "flex items-center justify-between text-small-regular",
          className
        )}
      >
        <button
          className="flex gap-x-1 text-ui-fg-subtle hover:text-ui-fg-base cursor-pointer items-center"
          onClick={() => setShowModal(true)}
          data-testid={dataTestId}
        >
          {isDeleting ? <Spinner className="animate-spin" /> : <Trash />}
          <span>{children}</span>
        </button>
      </div>

      <Modal isOpen={showModal} close={() => setShowModal(false)} size="medium">
        <div className="flex flex-col bg-white overflow-hidden rounded-sm relative">
          {/* Close Icon */}
          <button 
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 text-black hover:opacity-70 transition-opacity z-10"
          >
            <X size={24} />
          </button>

          {/* Body Content */}
          <div className="p-6 flex gap-6 pr-12">
            {/* Product Thumbnail */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 bg-gray-50 rounded-sm overflow-hidden border border-gray-100 shadow-sm">
              {thumbnail ? (
                <Image 
                  src={thumbnail} 
                  alt="Product" 
                  width={120} 
                  height={120}
                  sizes="112px"
                  quality={65}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 uppercase text-[10px] font-bold">No Image</div>
              )}
            </div>

            {/* Title and Description */}
            <div className="flex flex-col justify-center">
              <h3 className="text-[17px] font-bold text-gray-800 mb-1.5 leading-tight">Move from Bag</h3>
              <p className="text-[15px] text-gray-500 leading-snug font-medium max-w-[280px]">
                Are you sure you want to move this item from bag?
              </p>
              
              {error && (
                <p className="text-red-500 text-[11px] font-bold mt-2 uppercase tracking-wide">{error}</p>
              )}
            </div>
          </div>

          {/* Footer with side-by-side buttons and separator */}
          <div className="flex border-t border-gray-100 h-[52px]">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 h-full flex items-center justify-center text-[13px] font-bold text-gray-500 tracking-wider hover:bg-gray-50 transition-colors uppercase"
            >
              {isDeleting ? <Spinner className="animate-spin" /> : "REMOVE"}
            </button>
            
            {/* Vertical Separator */}
            <div className="w-px bg-gray-100 h-full" />

            <button
              onClick={handleMoveToWishlist}
              disabled={wishlistLoading}
              className="flex-1 h-full flex items-center justify-center text-[13px] font-bold tracking-wider hover:bg-gray-50 transition-colors uppercase"
              style={{ color: '#D25C78' }} // Pinkish color from reference
            >
              {wishlistLoading ? <Spinner className="animate-spin" /> : "MOVE TO WISHLIST"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default DeleteButton
