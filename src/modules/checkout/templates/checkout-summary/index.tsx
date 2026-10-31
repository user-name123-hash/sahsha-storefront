"use client"

import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import DeliveryEstimates from "@modules/checkout/components/delivery-estimates"
import Divider from "@modules/common/components/divider"
import { useModal } from "@core/context/modal-context"
import { useShiprocketDeliveryEstimate } from "@core/hooks/use-shiprocket-delivery-estimate"
import { getLineItemDisplayImage } from "@core/util/line-item-image"

function getCheckoutStep(
  _cart: HttpTypes.StoreCart,
  _customer: HttpTypes.StoreCustomer | null
) {
  return "payment"
}

const CheckoutSummary = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const { isModalOpen } = useModal()

  if (!cart) return null

  const postalCode = cart.shipping_address?.postal_code
  const firstItem = cart.items?.[0]
  const singleVariantId = firstItem?.variant_id || null

  const { deliveryEstimate, formatDeliveryDate, fallbackDeliveryDate } =
    useShiprocketDeliveryEstimate({
      postalCode,
      variantId: singleVariantId,
      cartMetadata: cart.metadata,
    })

  const productImage = getLineItemDisplayImage(firstItem)

  if (isModalOpen) {
    return null
  }

  return (
    <div className="checkout-page__sidebar">
      <div className="checkout-page__sidebar-inner">
        <Divider className="checkout-page__sidebar-divider" />

        <DeliveryEstimates
          postalCode={postalCode}
          firstItem={firstItem}
          productImage={productImage}
          deliveryEstimate={deliveryEstimate}
          formatDeliveryDate={formatDeliveryDate}
          fallbackDeliveryDate={fallbackDeliveryDate}
        />

        <div className="mb-4 min-[550px]:mb-5 sm:mb-6">
          <DiscountCode cart={cart as HttpTypes.StoreCart & { promotions: HttpTypes.StorePromotion[] }} />
        </div>

        <CartTotals
          totals={cart}
          items={cart.items || []}
          checkoutStep={getCheckoutStep(cart, customer)}
        />
      </div>
    </div>
  )
}

export default CheckoutSummary
