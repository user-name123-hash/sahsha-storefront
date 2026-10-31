"use client"

import { Badge, Heading, Input, Label, Text } from "@medusajs/ui"
import React from "react"
import { useRouter, usePathname } from "next/navigation"

import { applyPromotions } from "@core/data/cart"
import { convertToLocale } from "@core/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const router = useRouter()
  const pathname = usePathname()
  const isCartPage = pathname.includes("/cart")
  const isCheckoutPage = pathname.includes("/checkout")
  const useSahshaCouponStyle = isCartPage || isCheckoutPage
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  const [successMessage, setSuccessMessage] = React.useState("")

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
    setSuccessMessage("")
    router.refresh()
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")
    setSuccessMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      const updatedCart = await applyPromotions(codes)
      const hasDiscount = (updatedCart?.discount_total || 0) > 0
      
      if (hasDiscount) {
        setSuccessMessage("Coupon applied successfully!")
      } else {
        setErrorMessage("Coupon added, but it doesn't apply to the items in your bag.")
      }
      router.refresh()
    } catch (e: any) {
      setErrorMessage("Invalid coupon code. Please check the code and try again.")
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div
      className={
        useSahshaCouponStyle
          ? "cart-page__coupons w-full flex flex-col"
          : "checkout-page__delivery-panel flex flex-col"
      }
    >
      <Heading
        className={
          useSahshaCouponStyle
            ? "cart-page__section-title"
            : "text-lg font-bold text-heading mb-4 uppercase"
        }
      >
        COUPONS
      </Heading>

      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={
          useSahshaCouponStyle
            ? "cart-page__coupon-toggle w-full flex items-center justify-between"
            : "w-full rounded-lg p-4 flex items-center justify-between transition-colors border border-brand-accent-border"
        }
        style={useSahshaCouponStyle ? undefined : { backgroundColor: "var(--color-brand-accent-muted)" }}
        data-testid="add-discount-button"
      >
        <div className="flex items-center gap-3">
          <div
            className={
              useSahshaCouponStyle
                ? "cart-page__coupon-icon"
                : "w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm"
            }
          >
            <span className="text-heading font-bold text-xl">%</span>
          </div>

          <div className="flex flex-col items-start">
            <span
              className={
                useSahshaCouponStyle
                  ? "cart-page__coupon-toggle-title"
                  : "font-bold text-base text-heading"
              }
            >
              Apply Coupons
            </span>
            <span
              className={
                useSahshaCouponStyle
                  ? "cart-page__coupon-toggle-sub"
                  : "text-sm text-gray-500"
              }
            >
              View all offers
            </span>
          </div>
        </div>

        {/* Chevron Icon */}
        <svg
          className="w-5 h-5 text-heading"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Promotion Code Input Form */}
      {isOpen && (
        <form action={(a) => addPromotionCode(a)} className="w-full mt-4">
          <div className="flex w-full gap-x-2">
            <Input
              className="size-full"
              id="promotion-input"
              name="code"
              type="text"
              autoFocus={false}
              placeholder="Enter coupon code"
              data-testid="discount-input"
            />
            <SubmitButton
              variant="secondary"
              className="!bg-brand-accent hover:!bg-brand-accent-hover text-inverse border-0"
              data-testid="discount-apply-button"
            >
              Apply
            </SubmitButton>
          </div>

          <ErrorMessage
            error={errorMessage}
            data-testid="discount-error-message"
          />

          {successMessage && (
            <div
              className="mt-2 text-sm text-green-500"
              data-testid="discount-success-message"
            >
              {successMessage}
            </div>
          )}
        </form>
      )}

      {/* Applied Promotions - Clean Card Redesign */}
      {promotions.length > 0 && (
        <div className="w-full flex flex-col mt-6 pt-4 border-t border-gray-100">
          <Heading className="text-sm font-bold mb-3 text-heading uppercase tracking-tight">
            Promotion(s) applied:
          </Heading>

          <div className="flex flex-col gap-y-2">
            {promotions.map((promotion) => {
              return (
                <div
                  key={promotion.id}
                  className="flex items-center justify-between w-full p-3 rounded-xl border border-brand-accent-border bg-brand-accent-muted/50 transition-all hover:bg-brand-accent-muted group"
                  data-testid="discount-row"
                >
                  <div className="flex items-center gap-x-3 overflow-hidden">
                    {/* Tag Icon */}
                    <div className="flex-shrink-0 text-brand-accent">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                    </div>

                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold truncate text-sm uppercase tracking-wider text-brand-accent" data-testid="discount-code">
                        {promotion.code}
                      </span>
                      {promotion.application_method?.value !== undefined && (
                        <span className="cart-page__discount-value text-xs font-bold">
                          {promotion.application_method.type === "percentage"
                            ? `${promotion.application_method.value}% OFF`
                            : `${convertToLocale({
                                amount: +promotion.application_method.value,
                                currency_code: promotion.application_method.currency_code || "INR",
                              })} OFF`}
                        </span>
                      )}
                    </div>
                  </div>

                  {!promotion.is_automatic && (
                    <button
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      onClick={() => {
                        if (!promotion.code) return
                        removePromotionCode(promotion.code)
                      }}
                      data-testid="remove-discount-button"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscountCode
