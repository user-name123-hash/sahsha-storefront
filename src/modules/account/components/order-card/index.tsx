import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@core/util/money"
import { HttpTypes } from "@medusajs/types"
import { getCustomerFacingVariantTitle } from "@lib/util/size-fallback"
import { getCartLineItemThumbnail } from "@lib/cart-line-item-image"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

type StatusConfig = {
  label: string
  modifier: string
  icon: React.ReactNode
}

const StatusIconImg = ({ src, alt }: { src: string; alt: string }) => (
  <span
    role="img"
    aria-label={alt}
    className="account-order-card__status-icon-img"
    style={{
      WebkitMaskImage: `url("${src}")`,
      maskImage: `url("${src}")`,
    }}
  />
)

const getStatusConfig = (status: string): StatusConfig => {
  const statusLower = status?.toLowerCase() || ""

  if (statusLower.includes("cancel")) {
    return {
      label: "Cancelled",
      modifier: "cancelled",
      icon: <StatusIconImg src="/cancel.png" alt="Cancelled" />,
    }
  }

  if (statusLower === "delivered" || statusLower === "complete" || statusLower === "completed") {
    return {
      label: "Delivered",
      modifier: "delivered",
      icon: <StatusIconImg src="/box.png" alt="Delivered" />,
    }
  }

  if (statusLower === "shipped" || statusLower === "partially_shipped") {
    return {
      label: "Out For Delivery",
      modifier: "out-for-delivery",
      icon: <StatusIconImg src="/delivery-truck.png" alt="Out For Delivery" />,
    }
  }

  if (statusLower === "fulfilled" || statusLower === "partially_fulfilled") {
    return {
      label: "Shipped",
      modifier: "shipped",
      icon: <StatusIconImg src="/box%20(1).png" alt="Shipped" />,
    }
  }

  if (statusLower === "exchange" || statusLower === "exchange_requested") {
    return {
      label: "Exchange Requested",
      modifier: "exchange",
      icon: <StatusIconImg src="/exchange.png" alt="Exchange" />,
    }
  }

  if (statusLower === "returned" || statusLower === "partially_returned") {
    return {
      label: statusLower === "returned" ? "Returned" : "Partially Returned",
      modifier: "returned",
      icon: <StatusIconImg src="/return%20(1).png" alt="Returned" />,
    }
  }

  if (statusLower === "return_requested") {
    return {
      label: "Return Requested",
      modifier: "return-requested",
      icon: <StatusIconImg src="/return%20(1).png" alt="Return Requested" />,
    }
  }

  return {
    label: "Order Confirmed",
    modifier: "confirmed",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  }
}

const OrderCard = ({ order }: OrderCardProps) => {
  const isCancelled = order.status === "canceled" || order.status === "cancelled"

  const returns = (order as HttpTypes.StoreOrder & { returns?: { status: string }[]; return_orders?: { status: string }[] }).returns
    || (order as HttpTypes.StoreOrder & { return_orders?: { status: string }[] }).return_orders
    || []
  const isReviewedReturn = returns.some((r) => r.status === "received" || r.status === "partially_received")
  const isRequestedReturn = returns.some((r) => r.status === "requested")

  const exchanges = (order as HttpTypes.StoreOrder & { exchanges?: { status: string }[]; swaps?: { status: string }[] }).exchanges
    || (order as HttpTypes.StoreOrder & { swaps?: { status: string }[] }).swaps
    || []
  const isExchange = exchanges.some((e) => e.status !== "canceled" && e.status !== "rejected")

  const isRefunded = order.payment_status === "refunded" || order.payment_status === "partially_refunded"

  const statusToDisplay = isCancelled
    ? "canceled"
    : isExchange
      ? "exchange"
      : isReviewedReturn
        ? "returned"
        : isRequestedReturn
          ? "return_requested"
          : (order.fulfillment_status || order.status)

  const statusConfig = getStatusConfig(statusToDisplay)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" })
    return `${weekday}, ${day} ${month}`
  }

  const renderStatusIcon = () => {
    return (
      <div className={`account-order-card__status-icon account-order-card__status-icon--${statusConfig.modifier}`}>
        {statusConfig.icon}
      </div>
    )
  }

  return (
    <LocalizedClientLink href={`/orders/${order.id}`}>
      <div className="account-order-card" data-testid="order-card">
        <div className="account-order-card__header">
          {renderStatusIcon()}
          <div className="account-order-card__status-copy">
            <div className="account-order-card__status-row">
              <h3 className={`account-order-card__status-label account-order-card__status-label--${statusConfig.modifier}`}>
                {statusConfig.label}
              </h3>
              {isRefunded && (
                <span className="account-order-card__refund-badge">
                  Amount Refunded
                </span>
              )}
            </div>
            <p className="account-order-card__date">
              Placed on {formatDate(order.created_at?.toString() || new Date().toISOString())}
            </p>
          </div>
        </div>

        <div className="account-order-card__items">
          {order.items?.map((item) => {
            const displayVariant = getCustomerFacingVariantTitle({
              variant: item.variant,
              metadata: item.metadata,
              title: item.title,
              variant_title: item.variant_title,
            })
            const itemThumbnail = getCartLineItemThumbnail(
              item as HttpTypes.StoreCartLineItem & {
                product?: HttpTypes.StoreProduct
              }
            )

            return (
            <div
              key={item.id}
              className="account-order-card__item"
              data-testid="order-item"
            >
              <div className="account-order-card__item-thumb">
                <Thumbnail
                  thumbnail={itemThumbnail}
                  size="square"
                  className="account-order-card__item-thumb-img"
                />
              </div>

              <div className="account-order-card__item-body">
                <span className="account-order-card__item-brand">
                  Sahsha
                </span>
                <h4 className="account-order-card__item-title">
                  {item.product_title || item.title}
                </h4>
                <div className="account-order-card__item-meta">
                  <p className="account-order-card__item-variant">
                    {displayVariant && `Size: ${displayVariant}`}
                  </p>
                  <p className="account-order-card__item-price">
                    {convertToLocale({
                      amount: item.total || (item.unit_price * item.quantity) || 0,
                      currency_code: order.currency_code,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    </LocalizedClientLink>
  )
}

export default OrderCard
