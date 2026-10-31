"use client"

import { setShippingMethod } from "@core/data/cart"
import { calculatePriceForShippingOption } from "@core/data/fulfillment"
import { convertToLocale } from "@core/util/money"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text, clx } from "@medusajs/ui"
import { Radio, RadioGroup } from "@headlessui/react"
import { useEffect, useState } from "react"

type CartDeliverySelectionProps = {
  cart: HttpTypes.StoreCart | null
  availableShippingMethods?: HttpTypes.StoreCartShippingOption[] | null
}

const CartDeliverySelection = ({
  cart,
  availableShippingMethods,
}: CartDeliverySelectionProps) => {
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart?.shipping_methods?.at(-1)?.shipping_option_id || null
  )
  const [isLoadingShipping, setIsLoadingShipping] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [shippingError, setShippingError] = useState<string | null>(null)

  // Filter shipping methods (exclude pickup)
  const _shippingMethods =
    availableShippingMethods?.filter(
      (sm) => (sm as any).service_zone?.fulfillment_set?.type !== "pickup"
    ) || []

  // Calculate shipping prices
  useEffect(() => {
    if (!cart || !_shippingMethods.length) {
      setIsLoadingPrices(false)
      return
    }

    setIsLoadingPrices(true)
    const promises = _shippingMethods
      .filter((sm) => sm.price_type === "calculated")
      .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

    if (promises.length) {
      Promise.allSettled(promises).then((res) => {
        const pricesMap: Record<string, number> = {}
        res
          .filter((r) => r.status === "fulfilled")
          .forEach((p) => (pricesMap[p.value?.id || ""] = p.value?.amount!))

        setCalculatedPricesMap(pricesMap)
        setIsLoadingPrices(false)
      })
    } else {
      setIsLoadingPrices(false)
    }
  }, [availableShippingMethods, cart, _shippingMethods.length])

  const handleSetShippingMethod = async (id: string) => {
    if (!cart) return

    setShippingError(null)
    setIsLoadingShipping(true)
    const currentId = shippingMethodId
    setShippingMethodId(id)

    await setShippingMethod({
      cartId: cart.id,
      shippingMethodId: id,
      shippingOption: _shippingMethods.find((m) => m.id === id),
    })
      .catch((err) => {
        setShippingMethodId(currentId)
        setShippingError(err.message)
      })
      .finally(() => {
        setIsLoadingShipping(false)
      })
  }

  // Don't show if no shipping methods available
  if (!availableShippingMethods || availableShippingMethods.length === 0) {
    return null
  }

  return (
    <div className="bg-white mb-6">
      <Heading
        level="h3"
        className="text-2xl font-bold text-gray-900 mb-4"
      >
        Delivery
      </Heading>

      <div className="mb-4">
        <Text className="text-base font-medium text-gray-900 mb-1">
          Shipping method
        </Text>
        <Text className="text-sm text-gray-500">
          How would you like your order delivered
        </Text>
      </div>

      <RadioGroup
        value={shippingMethodId}
        onChange={(value) => {
          if (value && _shippingMethods.find((m) => m.id === value)) {
            handleSetShippingMethod(value)
          }
        }}
      >
        <div className="space-y-2">
          {_shippingMethods.map((option) => {
            const isDisabled =
              option.price_type === "calculated" &&
              !isLoadingPrices &&
              typeof calculatedPricesMap[option.id] !== "number"

            const price =
              option.price_type === "flat"
                ? option.amount!
                : calculatedPricesMap[option.id]

            const isSelected = option.id === shippingMethodId

            return (
              <Radio
                key={option.id}
                value={option.id}
                disabled={isDisabled}
                className={clx(
                  "flex items-center justify-between text-base cursor-pointer py-4 border rounded-lg px-6 transition-all",
                  {
                    "border-blue-600": isSelected,
                    "border-gray-300": !isSelected,
                    "opacity-50 cursor-not-allowed": isDisabled,
                  }
                )}
                style={
                  isSelected
                    ? {
                        borderColor: "#2563eb",
                        borderWidth: "2px",
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex h-5 w-5 items-center justify-center">
                    <div
                      className={clx(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                        {
                          "border-blue-600 bg-blue-600": isSelected,
                          "border-gray-300 bg-white": !isSelected,
                        }
                      )}
                      style={
                        isSelected
                          ? {
                              borderColor: "#2563eb",
                              backgroundColor: "#2563eb",
                            }
                          : {}
                      }
                    >
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                  <span className="text-base text-gray-900">{option.name}</span>
                </div>
                <span className="text-base text-gray-900 font-semibold">
                  {price && cart ? (
                    convertToLocale({
                      amount: price,
                      currency_code: cart.currency_code,
                    })
                  ) : isLoadingPrices ? (
                    <Loader className="animate-spin w-4 h-4" />
                  ) : (
                    "-"
                  )}
                </span>
              </Radio>
            )
          })}
        </div>
      </RadioGroup>

      {shippingError && (
        <div className="mt-4">
          <Text className="text-sm text-red-600">{shippingError}</Text>
        </div>
      )}
    </div>
  )
}

export default CartDeliverySelection

