import { cookies as nextCookies } from "next/headers"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderConfirmationBackHandler from "@modules/order/components/order-confirmation-back-handler"
import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"
import { convertToLocale } from "@core/util/money"
import OrderPurchaseTracker from "@modules/order/components/order-purchase-tracker"
import { getCustomerFacingVariantTitle } from "@lib/util/size-fallback"
import { getCartLineItemThumbnail } from "@lib/cart-line-item-image"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  const isLoggedIn = !!cookies.get("_medusa_jwt")?.value

  const shippingAddress = order.shipping_address
  const fullName = `${shippingAddress?.first_name || ""} ${shippingAddress?.last_name || ""}`.trim()
  const phone = shippingAddress?.phone
    ? shippingAddress.phone.startsWith("+")
      ? shippingAddress.phone
      : `+${shippingAddress.phone}`
    : ""
  const address = [
    shippingAddress?.address_1,
    shippingAddress?.address_2,
    shippingAddress?.city,
    shippingAddress?.province,
    shippingAddress?.postal_code,
    shippingAddress?.country_code?.toUpperCase(),
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="order-confirmed-page">
      <div className="order-confirmed-page__container">
        <OrderPurchaseTracker order={order} />
        {isOnboarding && <OnboardingCta orderId={order.id} />}

        <div className="order-confirmed-page__content" data-testid="order-complete-container">
          <OrderConfirmationBackHandler />

          <div className="order-confirmed-page__hero">
            <Image
              src="/bag1-edited.png"
              alt="Order successful"
              width={480}
              height={320}
              sizes="(max-width: 640px) min(100vw, 28rem), 30rem"
              quality={75}
              className="order-confirmed-page__illustration-img"
              priority
            />
            <span className="order-confirmed-page__badge">Thank you</span>
          </div>

          <div className="order-confirmed-page__intro">
            <h1 className="order-confirmed-page__title">Order Confirmed</h1>
            <p className="order-confirmed-page__subtitle">
              Your order is confirmed. You will receive an order confirmation email/SMS
              shortly with the expected delivery date for your items.
            </p>
          </div>

          <div className="order-confirmed-page__card">
            <div className="order-confirmed-page__delivery">
              <div className="order-confirmed-page__delivery-info">
                <p className="order-confirmed-page__label">Delivering to</p>
                <p className="order-confirmed-page__recipient">
                  {fullName || "Customer"}
                  {phone && (
                    <span className="order-confirmed-page__recipient-phone">
                      {phone}
                    </span>
                  )}
                </p>
                {order.email && (
                  <p className="order-confirmed-page__address" data-testid="order-confirm-email">
                    <span className="order-confirmed-page__meta-label">Email</span>
                    {order.email}
                  </p>
                )}
                <p className="order-confirmed-page__address">
                  <span className="order-confirmed-page__meta-label">Address</span>
                  {address || "Address not available"}
                </p>
                {isLoggedIn && (
                  <LocalizedClientLink
                    href={`/orders/${order.id}`}
                    className="order-confirmed-page__details-link"
                  >
                    Order Details
                    <span aria-hidden="true">→</span>
                  </LocalizedClientLink>
                )}
              </div>
              <div className="order-confirmed-page__delivery-art">
                <Image
                  src="/oderc.png"
                  alt="Delivery"
                  width={399}
                  height={266}
                  sizes="(max-width: 768px) 10rem, 12.5rem"
                  quality={75}
                  className="order-confirmed-page__delivery-img"
                />
              </div>
            </div>
          </div>

          <div className="order-confirmed-page__card">
            <div className="order-confirmed-page__section-head">
              <span className="order-confirmed-page__section-accent" aria-hidden="true" />
              <h2 className="order-confirmed-page__section-title">Order Items</h2>
            </div>
            <div className="order-confirmed-page__items">
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
                <LocalizedClientLink
                  key={item.id}
                  href={`/products/${item.variant?.product?.handle}`}
                  className="order-confirmed-page__item group"
                >
                  <div className="order-confirmed-page__item-thumb">
                    <Thumbnail
                      thumbnail={itemThumbnail}
                      size="square"
                      className="order-confirmed-page__item-thumb-img"
                    />
                  </div>
                  <div className="order-confirmed-page__item-info">
                    <span className="order-confirmed-page__item-brand">SAHSHA</span>
                    <h3 className="order-confirmed-page__item-title">
                      {item.product_title || item.title}
                    </h3>
                    <div className="order-confirmed-page__item-meta">
                      {displayVariant && <span>Variant: {displayVariant}</span>}
                      {displayVariant && <span>|</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="order-confirmed-page__item-price">
                    <span className="order-confirmed-page__item-total">
                      {convertToLocale({
                        amount: item.total ?? 0,
                        currency_code: order.currency_code,
                      })}
                    </span>
                    <span className="order-confirmed-page__item-unit">
                      {convertToLocale({
                        amount:
                          item.quantity > 0
                            ? (item.total ?? 0) / item.quantity
                            : 0,
                        currency_code: order.currency_code,
                      })}{" "}
                      Each
                    </span>
                  </div>
                </LocalizedClientLink>
              )})}
            </div>

            <div className="order-confirmed-page__summary">
              <div className="order-confirmed-page__summary-row">
                <span>Order Total</span>
                <span>
                  {convertToLocale({
                    amount:
                      order.items?.reduce(
                        (sum, item) =>
                          sum + (item.original_total || item.total || 0),
                        0
                      ) || 0,
                    currency_code: order.currency_code,
                  })}
                </span>
              </div>
              <div className="order-confirmed-page__summary-row">
                <span>Shipping</span>
                <span>
                  {convertToLocale({
                    amount: order.shipping_total || 0,
                    currency_code: order.currency_code,
                  })}
                </span>
              </div>
              {(order.tax_total || 0) > 0 && (
                <div className="order-confirmed-page__summary-row">
                  <span>Tax</span>
                  <span>
                    {convertToLocale({
                      amount: order.tax_total || 0,
                      currency_code: order.currency_code,
                    })}
                  </span>
                </div>
              )}
              {(order.discount_total || 0) > 0 && (
                <div className="order-confirmed-page__summary-row order-confirmed-page__summary-row--discount">
                  <span>Discount</span>
                  <span>
                    -
                    {convertToLocale({
                      amount: order.discount_total || 0,
                      currency_code: order.currency_code,
                    })}
                  </span>
                </div>
              )}
              <div className="order-confirmed-page__summary-total">
                <span>Total Amount Paid</span>
                <span>
                  {convertToLocale({
                    amount: order.total || 0,
                    currency_code: order.currency_code,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="order-confirmed-page__actions">
            <LocalizedClientLink href="/store" className="order-confirmed-page__btn order-confirmed-page__btn--outline">
              Continue Shopping
            </LocalizedClientLink>
            <LocalizedClientLink
              href={
                isLoggedIn
                  ? "/account/orders"
                  : `/account?view=guest&email=${order.email}`
              }
              className="order-confirmed-page__btn order-confirmed-page__btn--primary"
            >
              {isLoggedIn ? "View Orders" : "Track Guest Order"}
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </div>
  )
}
