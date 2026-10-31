import { Container } from "@medusajs/ui"

import ChevronDown from "@modules/common/icons/chevron-down"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@core/util/money"
import { getOrderDisplayStatus, getStatusConfig } from "@core/util/order-status"
import { HttpTypes } from "@medusajs/types"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const STATUS_ICON_IMG: Record<string, string> = {
  Delivered: "/box.png",
  Cancelled: "/cancel.png",
  Shipped: "/box%20(1).png",
  "Out For Delivery": "/delivery-truck.png",
  "Return Requested": "/return%20(1).png",
  Returned: "/return%20(1).png",
  "Partially Returned": "/return%20(1).png",
  "Exchange Requested": "/exchange.png",
}

const STATUS_COLOR: Record<string, string> = {
  Delivered: "#2d6a4f",
  Cancelled: "#c1272d",
  Shipped: "#5a2a43",
  "Out For Delivery": "#5a2a43",
  "Return Requested": "#9a3412",
  Returned: "#1a1a1a",
  "Partially Returned": "#1a1a1a",
  "Exchange Requested": "#3730a3",
  "Order Confirmed": "#1a1a1a",
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper">
      <div className="hidden small:block">
        <div className="text-xl-semi flex justify-between items-center mb-4">
          <span data-testid="welcome-message" data-value={customer?.first_name}>
            Hello {customer?.first_name}
          </span>
          <span className="text-small-regular text-ui-fg-base">
            Signed in as:{" "}
            <span
              className="font-semibold"
              data-testid="customer-email"
              data-value={customer?.email}
            >
              {customer?.email}
            </span>
          </span>
        </div>
        <div className="flex flex-col py-8 border-t border-gray-200">
          <div className="flex flex-col gap-y-4 h-full col-span-1 row-span-2 flex-1">
            <div className="flex items-start gap-x-16 mb-6">
              <div className="flex flex-col gap-y-4">
                <h3 className="text-large-semi">Profile</h3>
                <div className="flex items-end gap-x-2">
                  <span
                    className="text-3xl-semi leading-none"
                    data-testid="customer-profile-completion"
                    data-value={getProfileCompletion(customer)}
                  >
                    {getProfileCompletion(customer)}%
                  </span>
                  <span className="uppercase text-base-regular text-ui-fg-subtle">
                    Completed
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-y-4">
                <h3 className="text-large-semi">Addresses</h3>
                <div className="flex items-end gap-x-2">
                  <span
                    className="text-3xl-semi leading-none"
                    data-testid="addresses-count"
                    data-value={customer?.addresses?.length || 0}
                  >
                    {customer?.addresses?.length || 0}
                  </span>
                  <span className="uppercase text-base-regular text-ui-fg-subtle">
                    Saved
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-y-4">
              <div className="flex items-center gap-x-2">
                <h3 className="text-large-semi">Recent orders</h3>
              </div>
              <ul
                className="flex flex-col gap-y-4"
                data-testid="orders-wrapper"
              >
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => {
                    const statusConfig = getStatusConfig(getOrderDisplayStatus(order))
                    const iconSrc = STATUS_ICON_IMG[statusConfig.label]
                    const statusColor = STATUS_COLOR[statusConfig.label] || "#1a1a1a"
                    const isCancel = statusConfig.label === "Cancelled"

                    return (
                      <li
                        key={order.id}
                        data-testid="order-wrapper"
                        data-value={order.id}
                      >
                        <LocalizedClientLink
                          href={`/orders/${order.id}`}
                        >
                          <Container className="bg-page-bg flex justify-between items-center p-4">
                            <div className="grid grid-cols-4 grid-rows-2 text-small-regular gap-x-4 flex-1">
                              <span className="font-semibold">Date placed</span>
                              <span className="font-semibold">
                                Order number
                              </span>
                              <span className="font-semibold">
                                Total amount
                              </span>
                              <span className="font-semibold">Status</span>
                              <span data-testid="order-created-date">
                                {new Date(order.created_at).toDateString()}
                              </span>
                              <span
                                data-testid="order-id"
                                data-value={order.display_id}
                              >
                                #{order.display_id}
                              </span>
                              <span data-testid="order-amount">
                                {convertToLocale({
                                  amount: order.total,
                                  currency_code: order.currency_code,
                                })}
                              </span>
                              <span data-testid="order-status">
                                <span className="inline-flex items-center gap-2">
                                  <span
                                    className="inline-flex items-center justify-center shrink-0 rounded-full"
                                    style={{
                                      width: 40,
                                      height: 40,
                                      background: "#f5f2ee",
                                      color: statusColor,
                                    }}
                                  >
                                    {iconSrc ? (
                                      <span
                                        role="img"
                                        aria-label={statusConfig.label}
                                        style={{
                                          display: "inline-block",
                                          width: isCancel ? 18 : 24,
                                          height: isCancel ? 18 : 24,
                                          backgroundColor: statusColor,
                                          WebkitMaskImage: `url("${iconSrc}")`,
                                          maskImage: `url("${iconSrc}")`,
                                          WebkitMaskRepeat: "no-repeat",
                                          maskRepeat: "no-repeat",
                                          WebkitMaskPosition: "center",
                                          maskPosition: "center",
                                          WebkitMaskSize: "contain",
                                          maskSize: "contain",
                                        }}
                                      />
                                    ) : (
                                      <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M20 6 9 17l-5-5" />
                                      </svg>
                                    )}
                                  </span>
                                  <span
                                    className="font-semibold text-xs whitespace-nowrap"
                                    style={{ color: statusColor }}
                                  >
                                    {statusConfig.label}
                                  </span>
                                </span>
                              </span>
                            </div>
                            <button
                              className="flex items-center justify-between"
                              data-testid="open-order-button"
                            >
                              <span className="sr-only">
                                Go to order #{order.display_id}
                              </span>
                              <ChevronDown className="-rotate-90" />
                            </button>
                          </Container>
                        </LocalizedClientLink>
                      </li>
                    )
                  })
                ) : (
                  <span data-testid="no-orders-message">No recent orders</span>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
