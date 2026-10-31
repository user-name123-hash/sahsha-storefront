"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { clx } from "@lib/util/clx"
import { useWishlist } from "@core/context/wishlist-context"

const LoginPopup = dynamic(
  () => import("@modules/common/components/login-popup")
)

type WishlistIconProps = {
  productId: string
  variant?: "default" | "card"
}

const WishlistIcon = ({ productId, variant = "default" }: WishlistIconProps) => {
  const { isWishlisted, toggleWishlist } = useWishlist()
  const [showLogin, setShowLogin] = useState(false)
  const [optimistic, setOptimistic] = useState<boolean | null>(null)

  const actualWishlisted = isWishlisted(productId)

  // Once context catches up with the server, drop the optimistic override.
  useEffect(() => {
    if (optimistic !== null && optimistic === actualWishlisted) {
      setOptimistic(null)
    }
  }, [optimistic, actualWishlisted])

  const wishlisted = optimistic ?? actualWishlisted
  const isCard = variant === "card"

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic flip — instant visual feedback, save in background.
    const next = !wishlisted
    setOptimistic(next)

    const res = await toggleWishlist(productId)

    if (!res.success) {
      setOptimistic(null)
      if (res.error?.toLowerCase().includes("login")) {
        setShowLogin(true)
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className={clx(
          isCard
            ? "product-card__wishlist-btn"
            : "p-2 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5",
          wishlisted && isCard && "product-card__wishlist-btn--active"
        )}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={wishlisted}
      >
        <svg
          width={isCard ? 16 : 20}
          height={isCard ? 16 : 20}
          viewBox="0 0 24 24"
          fill={wishlisted ? (isCard ? "currentColor" : "#ef4444") : "none"}
          stroke={wishlisted ? (isCard ? "currentColor" : "#ef4444") : isCard ? "currentColor" : "#4A5568"}
          strokeWidth="2"
          className={clx(
            isCard ? "product-card__wishlist-icon" : undefined,
            !isCard && "hover:scale-110 transition-transform"
          )}
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {showLogin && (
        <LoginPopup isOpen={showLogin} onClose={() => setShowLogin(false)} />
      )}
    </>
  )
}

export default WishlistIcon
