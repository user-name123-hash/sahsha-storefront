"use client"

import { useState, useEffect } from "react"
import WishlistItem from "../components/wishlist-item"
import { HttpTypes } from "@medusajs/types"
import { getWishlist, removeFromWishlist } from "@core/data/wishlist"
import { useWishlist } from "@core/context/wishlist-context"
import { retrieveCart } from "@core/data/cart"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface WishlistProduct {
  id: string
  product: HttpTypes.StoreProduct
}

const WishlistTemplate = ({ countryCode }: { countryCode: string }) => {
  const { refreshWishlist } = useWishlist()
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([])
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(null)
  const [loading, setLoading] = useState(true)

  const loadWishlist = async () => {
    try {
      const [wishlistResult, cartResult] = await Promise.all([
        getWishlist(true, countryCode),
        retrieveCart().catch(() => null),
      ])

      setCart(cartResult)

      if (wishlistResult.success) {
        const items: WishlistProduct[] = wishlistResult.data
          .map((item: any) => {
            if (item.product) {
              return {
                id: item.id || item.product.id,
                product: item.product,
              }
            }

            if (item.id && item.title) {
              return {
                id: item.id,
                product: item as HttpTypes.StoreProduct,
              }
            }

            return null
          })
          .filter(
            (item: WishlistProduct | null): item is WishlistProduct =>
              item !== null
          )

        setWishlistItems(items)
      }

      // Keep nav badge in sync with what this page can actually render.
      await refreshWishlist()
    } catch {
      // Error silently handled
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWishlist()
  }, [])

  const handleRemoveItem = async (productId: string) => {
    try {
      const result = await removeFromWishlist(productId)
      if (result.success) {
        const updated = wishlistItems.filter(
          (item) => item.product.id !== productId
        )
        setWishlistItems(updated)
        refreshWishlist()
      } else {
        const updated = wishlistItems.filter(
          (item) => item.product.id !== productId
        )
        setWishlistItems(updated)
        refreshWishlist()
      }
    } catch {
      // Error silently handled
    }
  }

  const handleAddedToCart = async () => {
    try {
      const cartResult = await retrieveCart()
      setCart(cartResult)
    } catch {
      // Keep previous cart state if refresh fails
    }
  }

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-page__container">
          <p className="wishlist-page__loading">Loading your wishlist…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-page__container">
        <nav className="wishlist-page__breadcrumb" aria-label="Breadcrumb">
          <LocalizedClientLink href="/">Home</LocalizedClientLink>
          <span aria-hidden="true">/</span>
          <span>My Wishlist</span>
        </nav>

        <header className="wishlist-page__header">
          <h1 className="wishlist-page__title">My Wishlist</h1>
          <p className="wishlist-page__count">
            ({wishlistItems.length}{" "}
            {wishlistItems.length === 1 ? "Item" : "Items"})
          </p>
        </header>

        {wishlistItems.length > 0 ? (
          <ul className="wishlist-page__grid product-card-grid">
            {wishlistItems.map((item) => (
              <li key={item.id} className="product-card-grid__cell">
                <WishlistItem
                  product={item.product}
                  countryCode={countryCode}
                  cart={cart}
                  onRemove={() => handleRemoveItem(item.product.id || "")}
                  onAddedToCart={handleAddedToCart}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="wishlist-page__empty">
            <svg
              className="wishlist-page__empty-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="wishlist-page__empty-title">Your wishlist is empty</h2>
            <p className="wishlist-page__empty-text">
              Start adding items you love to your wishlist.
            </p>
            <LocalizedClientLink href="/store" className="wishlist-page__empty-link">
              Continue Shopping
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}

export default WishlistTemplate
