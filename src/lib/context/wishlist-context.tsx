"use client"

/**
 * Storefront override of @core/context/wishlist-context.
 * Clears and re-fetches wishlist IDs on auth changes so the nav badge
 * never keeps a stale non-zero count after login / account creation.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react"
import {
  getWishlistProductIds,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from "@core/data/wishlist"
import { AUTH_SESSION_CHANGED_EVENT } from "@lib/auth-session-events"
import type { AuthSessionChangeDetail } from "@lib/auth-session-events"

interface WishlistContextType {
  wishlistIds: string[]
  count: number
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (
    productId: string
  ) => Promise<{ success: boolean; error?: string }>
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
)

function sanitizeProductIds(ids: string[]): string[] {
  return ids.filter((id) => {
    if (!id || typeof id !== "string") return false
    const trimmed = id.trim()
    if (!trimmed) return false
    if (trimmed === "null" || trimmed === "undefined") return false
    return true
  })
}

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([])

  const refreshWishlist = useCallback(async () => {
    try {
      const ids = await getWishlistProductIds()
      setWishlistIds(sanitizeProductIds(ids))
    } catch {
      setWishlistIds([])
    }
  }, [])

  useEffect(() => {
    refreshWishlist()
  }, [refreshWishlist])

  useEffect(() => {
    const onAuthChanged = (event: Event) => {
      const detail = (event as CustomEvent<AuthSessionChangeDetail>).detail
      // Drop in-memory IDs immediately so the nav badge never stays stale.
      setWishlistIds([])
      // After logout the session is still briefly valid if we re-fetch now —
      // keep the cleared state. Login / signup should load the new wishlist.
      if (detail?.mode === "logout") return
      void refreshWishlist()
    }

    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthChanged)
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onAuthChanged)
    }
  }, [refreshWishlist])

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  )

  const toggleWishlist = async (productId: string) => {
    const currentlyWishlisted = isWishlisted(productId)

    try {
      if (currentlyWishlisted) {
        const result = await removeFromWishlistApi(productId)
        if (result.success) {
          setWishlistIds((prev) => prev.filter((id) => id !== productId))
          return { success: true }
        }
        return { success: false, error: result.error }
      }

      const result = await addToWishlistApi(productId)
      if (result.success) {
        setWishlistIds((prev) =>
          prev.includes(productId) ? prev : [...prev, productId]
        )
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred" }
    }
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        count: wishlistIds.length,
        isWishlisted,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}
