"use client"

import { HttpTypes } from "@medusajs/types"
import { useState, useEffect } from "react"
import { getShiprocketServiceability } from "@core/data/fulfillment"
import { Truck } from "lucide-react"

interface DeliveryEstimate {
  etd: string | null
  isLoading: boolean
  error: string | null
}

const CartDeliveryEstimate = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  const [estimate, setEstimate] = useState<DeliveryEstimate>({
    etd: null,
    isLoading: false,
    error: null,
  })

  const postalCode = cart?.shipping_address?.postal_code
  const firstItem = cart?.items?.[0]

  useEffect(() => {
    const fetchEstimate = async () => {
      // Prioritize metadata if available
      if (cart?.metadata?.etd) {
        setEstimate({ etd: cart.metadata.etd as string, isLoading: false, error: null })
        return
      }

      if (!postalCode || postalCode.length < 6 || !firstItem?.variant_id) {
        setEstimate({ etd: null, isLoading: false, error: null })
        return
      }

      setEstimate(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const data = await getShiprocketServiceability(postalCode, firstItem.variant_id, 0)
        
        let etd = null
        if (data?.etd) etd = data.etd
        else if (data?.data?.etd) etd = data.data.etd
        else if (data?.data?.available_courier_companies?.length > 0) etd = data.data.available_courier_companies[0].etd

        if (etd) {
          setEstimate({ etd, isLoading: false, error: null })
          document.cookie = `_medusa_last_etd=${etd}; path=/; max-age=3600`
        } else {
          setEstimate({ etd: null, isLoading: false, error: "Not available" })
        }
      } catch (err) {
        setEstimate({ etd: null, isLoading: false, error: "Error fetching" })
      }
    }

    fetchEstimate()
  }, [postalCode, firstItem?.variant_id, cart?.metadata?.etd])

  if (!postalCode || postalCode.length < 6) return null

  const formatDeliveryDate = (etd: string) => {
    const date = new Date(etd)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
        <Truck className="w-5 h-5 text-[#8B5AB1]" />
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Delivery Estimate</p>
        {estimate.isLoading ? (
          <p className="text-sm text-gray-500 animate-pulse">Calculating...</p>
        ) : estimate.etd ? (
          <p className="text-sm sm:text-base text-gray-900 font-medium">
            Estimated delivery by <span className="font-bold text-[#8B5AB1]">{formatDeliveryDate(estimate.etd)}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500">Enter a valid pincode for estimate</p>
        )}
      </div>
    </div>
  )
}

export default CartDeliveryEstimate
