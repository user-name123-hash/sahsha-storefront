"use client"

import { Heading, Text, clx } from "@medusajs/ui"
import { convertToLocale } from "@core/util/money"
import { HttpTypes } from "@medusajs/types"

type AppliedPromotionsProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const AppliedPromotions = ({ cart }: AppliedPromotionsProps) => {
  const { promotions = [] } = cart

  if (promotions.length === 0) {
    return null
  }

  return (
    <div className="w-full mb-6">
      {/* Single Promotion Display - Responsive Fixes */}
      {promotions.length === 1 && (
        <div className="rounded-2xl p-3.5 sm:p-5 border border-brand-accent-border bg-brand-accent-muted">
          {promotions.map((promotion: any) => {
            const isPercentage = promotion.application_method?.type === "percentage"
            const discountValue = promotion.application_method?.value
            return (
              <div key={promotion.id} className="w-full">
                <div className="flex items-start sm:items-center justify-between gap-x-2">
                  <div className="flex items-center gap-x-2.5 sm:gap-x-4 overflow-hidden">
                    {/* Circle badge for single promotion */}
                    <div className="w-10 h-10 min-[380px]:w-12 min-[380px]:h-12 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-brand-accent-border p-1">
                      <span className={clx("font-bold text-brand-accent text-center leading-tight whitespace-nowrap", 
                        isPercentage ? "text-xs sm:text-xl" : "text-[10px] sm:text-sm")}>
                        {isPercentage ? `${discountValue}%` : convertToLocale({ amount: discountValue || 0, currency_code: cart.currency_code })}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-x-1.5 flex-wrap gap-y-1">
                        <Heading level="h3" className="text-sm sm:text-lg font-bold text-heading leading-tight">Offer Applied</Heading>
                        <span className="bg-brand-accent/20 text-brand-accent text-[9px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider h-fit">{promotion.code}</span>
                      </div>
                      <Text className="text-[10px] sm:text-sm text-gray-500 mt-0.5 leading-snug font-medium">Extra savings added successfully!</Text>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <Text className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">You Saved</Text>
                    <Text className="text-base min-[380px]:text-lg sm:text-2xl font-black text-brand-accent leading-none mt-0.5">
                      {convertToLocale({ amount: cart.discount_total || 0, currency_code: cart.currency_code })}
                    </Text>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 pt-3 border-t border-brand-accent-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <Text className="text-[9px] sm:text-xs font-bold text-brand-success uppercase tracking-widest leading-none">Best value applied to your bag</Text>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Multiple Promotions Display */}
      {promotions.length > 1 && (
        <div className="rounded-2xl p-4 min-[550px]:p-5 border border-brand-accent-border bg-brand-accent-muted">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 min-[550px]:w-14 min-[550px]:h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-brand-accent-border">
                <span className="text-xl min-[550px]:text-2xl font-black text-brand-accent">%</span>
              </div>
              <div>
                <Heading level="h3" className="text-base min-[550px]:text-lg font-bold text-heading leading-tight">Total Offers Applied</Heading>
                <div className="flex flex-wrap gap-2 mt-2">
                  {promotions.map((p: any) => (
                    <span key={p.id} className="bg-white border border-brand-accent-border text-brand-accent text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold uppercase shadow-sm">{p.code}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <Text className="text-[10px] min-[550px]:text-xs font-bold text-gray-400 uppercase tracking-widest">Total Saved</Text>
              <Text className="text-xl min-[550px]:text-2xl font-black text-brand-accent leading-none">
                {convertToLocale({ amount: cart.discount_total || 0, currency_code: cart.currency_code })}
              </Text>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-brand-accent-border/50 space-y-3 text-left">
            {promotions.map((promotion: any) => {
              const isPercentage = promotion.application_method?.type === "percentage"
              const discountValue = promotion.application_method?.value
              return (
                <div key={promotion.id} className="flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-700 leading-tight">{promotion.is_automatic ? "Automatic Offer" : `Coupon: ${promotion.code}`}</span>
                    <span className="text-gray-400 font-medium leading-tight text-[10px] min-[550px]:text-xs">Savings added to your items</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-brand-accent-border font-black text-brand-accent shadow-sm ml-4 whitespace-nowrap text-sm min-[550px]:text-base">
                    {isPercentage ? `${discountValue}% Off` : convertToLocale({ amount: discountValue || 0, currency_code: cart.currency_code }) + " Off"}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-brand-accent-border/50">
            <div className="flex items-center gap-2 text-left">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
              <Text className="text-[10px] min-[550px]:text-xs font-bold text-brand-success uppercase tracking-widest leading-none">Maximum benefits applied</Text>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppliedPromotions
