"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { listGuestOrders } from "@core/data/guest"
import GuestOrderModal from "@modules/account/components/guest-order-modal"
import Spinner from "@modules/common/icons/spinner"

type FooterTrackOrderLinkProps = {
  isLoggedIn: boolean
}

function getGuestToken(): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split("; _medusa_guest_token=")
  if (parts.length === 2) return parts.pop()?.split(";").shift() ?? null
  return null
}

export default function FooterTrackOrderLink({ isLoggedIn }: FooterTrackOrderLinkProps) {
  const router = useRouter()
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "in"

  const [showGuestModal, setShowGuestModal] = useState(false)
  const [checkingGuest, setCheckingGuest] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()

    if (isLoggedIn) {
      router.push(`/${countryCode}/account/orders`)
      return
    }

    const token = getGuestToken()
    if (token) {
      setCheckingGuest(true)
      try {
        await listGuestOrders(token)
        router.push(`/${countryCode}/guest-orders`)
        return
      } catch {
        document.cookie =
          "_medusa_guest_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      } finally {
        setCheckingGuest(false)
      }
    }

    setShowGuestModal(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={checkingGuest}
        className="site-footer__link text-left disabled:opacity-60"
      >
        {checkingGuest ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="animate-spin" size={14} />
            Checking...
          </span>
        ) : (
          "Track My Order"
        )}
      </button>

      <GuestOrderModal
        isOpen={showGuestModal}
        close={() => setShowGuestModal(false)}
        onVerified={() => {
          setShowGuestModal(false)
          router.push(`/${countryCode}/guest-orders`)
        }}
      />
    </>
  )
}
