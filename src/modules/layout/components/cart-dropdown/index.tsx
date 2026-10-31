"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import Image from "next/image"
import { convertToLocale } from "@core/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getCartLineItemThumbnail } from "@lib/cart-line-item-image"
import { getCartBadgeCount } from "@lib/cart-badge-count"
import { usePathname, useRouter } from "next/navigation"
import { Fragment, startTransition, useEffect, useRef, useState } from "react"

const formatBagPrice = (amount: number, currencyCode: string) =>
  convertToLocale({
    amount,
    currency_code: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const router = useRouter()
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([])

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const visibleItems =
    cartState?.items?.filter((item) => !removedItemIds.includes(item.id)) ?? []

  const optimisticCart = cartState
    ? { ...cartState, items: visibleItems }
    : cartState

  // Drop optimistic removals once server cart catches up
  useEffect(() => {
    if (!removedItemIds.length) return
    const currentIds = new Set(cartState?.items?.map((item) => item.id) ?? [])
    setRemovedItemIds((prev) => prev.filter((id) => currentIds.has(id)))
  }, [cartState?.items, removedItemIds.length])

  const totalItems = getCartBadgeCount(optimisticCart)

  const subtotal = visibleItems.reduce((sum, item) => sum + (item.total ?? 0), 0)
  const itemRef = useRef<number>(totalItems || 0)

  const refreshCart = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const handleItemRemoved = (itemId: string) => {
    setRemovedItemIds((prev) =>
      prev.includes(itemId) ? prev : [...prev, itemId]
    )
    refreshCart()
  }

  const timedOpen = () => {
    open()

    const timer = setTimeout(close, 2000)

    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  // open cart dropdown when items are added, but only if we're not on the cart page
  useEffect(() => {
    // Check if we just navigated away from the cart page
    const isNavigationFromCart = prevPathname.current.includes("/cart") && !pathname.includes("/cart")

    if (
      totalItems > itemRef.current &&
      !pathname.includes("/cart") &&
      !isNavigationFromCart
    ) {
      timedOpen()
    }
    itemRef.current = totalItems
    prevPathname.current = pathname
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, pathname])

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (pathname.includes("/cart")) {
    return (
      <div className="h-full flex items-center">
        <LocalizedClientLink
          className="hover:opacity-80 transition-opacity flex items-center"
          href="/cart"
          data-testid="nav-cart-link-simple"
        >
          <div className="relative">
              <Image
                src="/parcel (1).png"
                alt="Cart"
                width={26}
                height={26}
                className="w-7 h-7 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
              />
            {totalItems > 0 && (
              <div className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center bg-brand-accent text-inverse text-[8px] sm:text-[10px] rounded-full font-bold shadow-sm">
                {totalItems}
              </div>
            )}
          </div>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        {!isMounted ? (
          /* Placeholder to prevent hydration mismatch */
          <div className="h-full flex items-center">
            <div className="relative">
              <Image src="/parcel (1).png" alt="Cart" width={26} height={26} className="w-7 h-7 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
              {totalItems > 0 && (
                <div className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center bg-brand-accent text-inverse text-[8px] sm:text-[10px] rounded-full font-bold shadow-sm">{totalItems}</div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile View: Simple Link (No Dropdown) */}
            <div className="h-full flex items-center sm:hidden">
              <LocalizedClientLink
                className="hover:opacity-80 transition-opacity flex items-center"
                href="/cart"
                data-testid="nav-cart-link-mobile"
              >
                <div className="relative">
                  <Image
                    src="/parcel (1).png"
                    alt="Cart"
                    width={26}
                    height={26}
                    className="w-7 h-7 min-[340px]:w-7 min-[340px]:h-7"
                  />
                  {totalItems > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 flex items-center justify-center bg-brand-accent text-inverse text-[8px] rounded-full font-bold shadow-sm">
                      {totalItems}
                    </div>
                  )}
                </div>
              </LocalizedClientLink>
            </div>

            {/* Desktop View: Popover Button (Opens Dropdown) */}
            <div className="h-full items-center hidden sm:flex">
              <PopoverButton className="h-full flex items-center focus:outline-none">
                <LocalizedClientLink
                  className="hover:opacity-80 transition-opacity flex items-center"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  <div className="relative">
                    <Image
                      src="/parcel (1).png"
                      alt="Cart"
                      width={26}
                      height={26}
                      className="sm:w-6 sm:h-6 lg:w-7 lg:h-7"
                    />
                    {totalItems > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center bg-brand-accent text-inverse text-[8px] sm:text-[10px] rounded-full font-bold shadow-sm">
                        {totalItems}
                      </div>
                    )}
                  </div>
                </LocalizedClientLink>
              </PopoverButton>
            </div>
          </>
        )}
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="nav-cart-dropdown absolute top-[calc(100%+8px)] right-0 w-[min(100vw-2rem,23rem)] z-[100] sm:block hidden"
            data-testid="nav-cart-dropdown"
          >
            <div className="nav-cart-dropdown__accent" aria-hidden />
            <div className="nav-cart-dropdown__inner">
              <div className="nav-cart-dropdown__header">
                <div className="nav-cart-dropdown__header-text">
                  <h3 className="nav-cart-dropdown__title">Bag</h3>
                  {totalItems > 0 ? (
                    <span className="nav-cart-dropdown__count">
                      {totalItems} {totalItems === 1 ? "item" : "items"}
                    </span>
                  ) : null}
                </div>
              </div>
              <CartItems
                cartState={cartState}
                items={visibleItems}
                subtotal={subtotal}
                close={close}
                onItemRemoved={handleItemRemoved}
              />
            </div>
          </PopoverPanel>
        </Transition>

        {/* Mobile View Bottom Sheet (Opens for 2 seconds) */}
        <div className="sm:hidden">
          <Transition
            show={cartDropdownOpen}
            as={Fragment}
            enter="transition ease-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="transition ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
             <div className="nav-cart-dropdown nav-cart-dropdown--mobile fixed inset-x-0 bottom-0 z-[100]">
                <div className="nav-cart-dropdown__accent" aria-hidden />
                <div className="nav-cart-dropdown__inner">
                <div className="nav-cart-dropdown__header flex items-center justify-between">
                  <div className="nav-cart-dropdown__header-text">
                    <h3 className="nav-cart-dropdown__title mb-0">Added to Bag</h3>
                  </div>
                  <button type="button" onClick={close} className="nav-cart-dropdown__close" aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                
                {cartState && cartState.items && cartState.items.length > 0 ? (
                  <div className="nav-cart-dropdown__mobile-body">
                    {(() => {
                      const items = cartState?.items || []
                      if (items.length === 0) return null

                      const sortedItems = [...items].sort((a: any, b: any) => {
                        const dateA = a.updated_at || a.created_at || ""
                        const dateB = b.updated_at || b.created_at || ""
                        return dateA > dateB ? -1 : 1
                      })
                      
                      const lastItem = sortedItems[0]
                      if (!lastItem) return null

                      const lastItemThumbnail = getCartLineItemThumbnail(lastItem)
                      
                      return (
                        <div className="nav-cart-dropdown__item nav-cart-dropdown__item--toast">
                          <div className="nav-cart-dropdown__item-row">
                            <div className="nav-cart-dropdown__thumb">
                              {lastItemThumbnail ? (
                                <Image
                                  src={lastItemThumbnail}
                                  alt={lastItem.title || "Product"}
                                  width={152}
                                  height={152}
                                  sizes="76px"
                                  quality={65}
                                  className="nav-cart-dropdown__thumb-img"
                                />
                              ) : (
                                <div className="nav-cart-dropdown__thumb-img bg-[#f8f4ef]" />
                              )}
                            </div>
                            <div className="nav-cart-dropdown__item-body min-w-0">
                              <h4 className="nav-cart-dropdown__item-title">{lastItem.title}</h4>
                              <span data-testid="cart-item-quantity">Qty: {lastItem.quantity}</span>
                              <div className="nav-cart-dropdown__item-price mt-1">
                                <LineItemPrice
                                  item={lastItem}
                                  style="tight"
                                  currencyCode={cartState?.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <LocalizedClientLink 
                      href="/cart" 
                      className="nav-cart-dropdown__cta"
                      onClick={close}
                    >
                        View Bag & Checkout
                    </LocalizedClientLink>
                  </div>
                ) : null}
                </div>
             </div>
          </Transition>
        </div>
      </Popover>
    </div>
  )
}

const CartItems = ({
  cartState,
  items,
  subtotal,
  close,
  onItemRemoved,
}: {
  cartState: any
  items: HttpTypes.StoreCartLineItem[]
  subtotal: number
  close: () => void
  onItemRemoved: (itemId: string) => void
}) => {
  return (
    <>
      {items.length ? (
        <>
          <div className="nav-cart-dropdown__items overflow-y-auto max-h-[min(50vh,18rem)] no-scrollbar">
            {[...items]
              .sort((a: any, b: any) => {
                const dateA = a.updated_at || a.created_at || ""
                const dateB = b.updated_at || b.created_at || ""
                return dateA > dateB ? -1 : 1
              })
              .map((item: HttpTypes.StoreCartLineItem) => {
                const itemThumbnail = getCartLineItemThumbnail(item)

                return (
                <div
                  className="nav-cart-dropdown__item"
                  key={item.id}
                  data-testid="cart-item"
                >
                  <div className="nav-cart-dropdown__item-row">
                    <div className="nav-cart-dropdown__thumb">
                      <LocalizedClientLink
                        href={`/products/${item.product_handle}`}
                        className="nav-cart-dropdown__thumb-link"
                      >
                        {itemThumbnail ? (
                          <Image
                            src={itemThumbnail}
                            alt={item.title || "Product"}
                            width={152}
                            height={152}
                            sizes="76px"
                            quality={65}
                            className="nav-cart-dropdown__thumb-img"
                          />
                        ) : (
                          <div className="nav-cart-dropdown__thumb-img bg-[#f8f4ef]" />
                        )}
                      </LocalizedClientLink>
                    </div>
                    <div className="nav-cart-dropdown__item-body">
                      <div className="nav-cart-dropdown__item-top">
                        <h3 className="nav-cart-dropdown__item-title">
                          <LocalizedClientLink
                            href={`/products/${item.product_handle}`}
                            data-testid="product-link"
                          >
                            {item.title}
                          </LocalizedClientLink>
                        </h3>
                        <div className="nav-cart-dropdown__item-price">
                          <LineItemPrice
                            item={item}
                            style="tight"
                            currencyCode={cartState.currency_code}
                          />
                        </div>
                      </div>
                      <LineItemOptions
                        variant={item.variant}
                        metadata={item.metadata}
                        title={item.title}
                        data-testid="cart-item-variant"
                        data-value={item.variant}
                      />
                      <span
                        data-testid="cart-item-quantity"
                        data-value={item.quantity}
                      >
                        Qty: {item.quantity}
                      </span>
                      <DeleteButton
                        id={item.id}
                        productId={item.product_id || ""}
                        thumbnail={itemThumbnail}
                        data-testid="cart-item-remove-button"
                        onAfterDelete={() => onItemRemoved(item.id)}
                      >
                        Remove
                      </DeleteButton>
                    </div>
                  </div>
                </div>
              )})}
          </div>
          <div className="nav-cart-dropdown__footer">
            <div className="nav-cart-dropdown__subtotal-row">
              <span className="nav-cart-dropdown__subtotal-label">
                Subtotal
                <span className="nav-cart-dropdown__subtotal-note">excl. taxes</span>
              </span>
              <span
                className="nav-cart-dropdown__subtotal-value"
                data-testid="cart-subtotal"
                data-value={subtotal}
              >
                {formatBagPrice(subtotal, cartState.currency_code)}
              </span>
            </div>
            <LocalizedClientLink
              href="/cart"
              className="nav-cart-dropdown__cta"
              data-testid="go-to-cart-button"
              onClick={close}
            >
              Go to bag
            </LocalizedClientLink>
          </div>
        </>
      ) : (
        <div className="nav-cart-dropdown__empty">
          <div className="nav-cart-dropdown__empty-inner">
            <div className="nav-cart-dropdown__empty-count">
              <span>0</span>
            </div>
            <span className="nav-cart-dropdown__empty-text">Your shopping bag is empty.</span>
            <LocalizedClientLink href="/store" onClick={close} className="nav-cart-dropdown__cta nav-cart-dropdown__cta--compact">
              Explore products
            </LocalizedClientLink>
          </div>
        </div>
      )}
    </>
  )
}

export default CartDropdown
