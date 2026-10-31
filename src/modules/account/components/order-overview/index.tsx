"use client"

import Image from "next/image"
import { Button } from "@medusajs/ui"
import { useState, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Pagination } from "@modules/store/components/pagination"
import { HttpTypes } from "@medusajs/types"

const ORDERS_PER_PAGE = 5

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")

  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1)

  // Sort orders by created_at descending (latest first)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    })
  }, [orders])

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return sortedOrders

    return sortedOrders.filter((order) => {
      const searchLower = searchQuery.toLowerCase()
      return (
        order.display_id?.toString().includes(searchLower) ||
        order.items?.some((item) =>
          item.title?.toLowerCase().includes(searchLower)
        )
      )
    })
  }, [sortedOrders, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)

  const displayedOrders = useMemo(() => {
    const start = (safePage - 1) * ORDERS_PER_PAGE
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE)
  }, [filteredOrders, safePage])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    const params = new URLSearchParams(searchParams)
    params.set("page", "1")
    router.replace(`${pathname}?${params.toString()}`)
  }

  const rangeStart = filteredOrders.length === 0 ? 0 : (safePage - 1) * ORDERS_PER_PAGE + 1
  const rangeEnd = Math.min(safePage * ORDERS_PER_PAGE, filteredOrders.length)

  if (orders?.length) {
    return (
      <div className="account-orders-page">
        <div className="account-orders-page__header">
          <h2 className="account-orders-page__title">All Orders</h2>
          <div className="account-orders-page__search">
            <svg
              className="account-orders-page__search-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search orders"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="account-orders-page__search-input"
            />
          </div>
        </div>

        <div className="account-orders-page__list">
          {displayedOrders.length > 0 ? (
            displayedOrders.map((o) => (
              <div key={o.id}>
                <OrderCard order={o} />
              </div>
            ))
          ) : (
            <div className="account-orders-page__empty-search">
              No orders found matching your search.
            </div>
          )}
        </div>

        {filteredOrders.length > ORDERS_PER_PAGE && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            data-testid="orders-pagination"
          />
        )}

        <div className="account-orders-page__count">
          {filteredOrders.length > 0
            ? `Showing ${rangeStart}-${rangeEnd} of ${filteredOrders.length} orders`
            : "No orders to display"}
        </div>
      </div>
    )
  }

  return (
    <div className="account-orders-page__empty" data-testid="no-orders-container">
      <Image
        src="/shopping-bag.png"
        alt=""
        className="account-orders-page__empty-icon-img"
        width={140}
        height={140}
        sizes="140px"
        quality={75}
      />
      <h2 className="account-orders-page__empty-title">
        You haven&apos;t placed any order yet!
      </h2>
      <p className="account-orders-page__empty-text">
        Order section is empty. After placing order, You can track them from
        here!
      </p>
      <div className="account-orders-page__empty-action">
        <LocalizedClientLink href="/store" passHref>
          <Button data-testid="continue-shopping-button">
            Continue shopping
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
