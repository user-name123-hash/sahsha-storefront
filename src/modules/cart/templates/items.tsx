import repeat from "@core/util/repeat"
import { HttpTypes } from "@medusajs/types"

import CartItemCard from "@modules/cart/components/cart-item-card"
import AppliedPromotions from "@modules/cart/components/applied-promotions"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  return (
    <div className="flex flex-col gap-y-4">
      <div className="cart-page__bag w-full overflow-hidden">
        <div className="cart-page__bag-head flex items-center justify-between">
          <h1 className="cart-page__bag-title">Your Bag</h1>
          {items && items.length > 0 && (
            <span className="text-xs sm:text-sm text-body">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>
        <div className="w-full">
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      cart={cart}
                      currencyCode={cart?.currency_code || "INR"}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </div>
      </div>
      <AppliedPromotions cart={cart as any} />
    </div>
  )
}

export default ItemsTemplate
