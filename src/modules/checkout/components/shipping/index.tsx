"use client"

import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@core/data/cart"
import { calculatePriceForShippingOption } from "@core/data/fulfillment"
import { convertToLocale } from "@core/util/money"
import { CheckCircleSolid, Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx, Heading, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

function isPickupOption(option: HttpTypes.StoreCartShippingOption): boolean {
  return (option as { service_zone?: { fulfillment_set?: { type?: string } } })
    .service_zone?.fulfillment_set?.type === "pickup"
}

function isShiprocketShippingOption(
  option: HttpTypes.StoreCartShippingOption
): boolean {
  const name = option.name?.toLowerCase() ?? ""
  const providerId = String(
    (option as { provider_id?: string }).provider_id ?? ""
  ).toLowerCase()

  return name.includes("shiprocket") || providerId.includes("shiprocket")
}

function resolveCheckoutShippingMethods(
  methods: HttpTypes.StoreCartShippingOption[] | null | undefined
): HttpTypes.StoreCartShippingOption[] {
  if (!methods?.length) {
    return []
  }

  const deliveryMethods = methods.filter((method) => !isPickupOption(method))
  const shiprocketMethods = deliveryMethods.filter(isShiprocketShippingOption)

  if (!shiprocketMethods.length) {
    return deliveryMethods
  }

  const rapidShip = shiprocketMethods.find((method) =>
    method.name?.toLowerCase().includes("rapid")
  )

  return [rapidShip ?? shiprocketMethods[0]]
}

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const deliveryShippingMethods = useMemo(
    () => resolveCheckoutShippingMethods(availableShippingMethods),
    [availableShippingMethods]
  )

  const _shippingMethods = deliveryShippingMethods

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) => (sm as any).service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({
      cartId: cart.id,
      shippingMethodId: id,
      shippingOption: availableShippingMethods?.find((m) => m.id === id),
    })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  // Track last calculation parameters to avoid redundant calculations
  const [lastCalcParams, setLastCalcParams] = useState({ postalCode: "", totalWeight: 0 })

  useEffect(() => {
    const fetchPrices = async () => {
      const postalCode = cart.shipping_address?.postal_code || ""
      const totalWeight = cart.items?.reduce((acc, item) => acc + ((item.variant as any)?.weight || 500) * item.quantity, 0) || 0

      if (!postalCode || _shippingMethods?.length === 0) {
          setIsLoadingPrices(false)
          return
      }

      // Don't re-calculate if pincode and weight haven't changed
      if (postalCode === lastCalcParams.postalCode && totalWeight === lastCalcParams.totalWeight) {
        setIsLoadingPrices(false)
        return
      }

      setIsLoadingPrices(true)
      const promises = _shippingMethods!
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        const res = await Promise.allSettled(promises)
        const pricesMap: Record<string, number> = {}
        res.forEach((p: any) => {
          if (p.status === "fulfilled" && p.value) {
            pricesMap[(p.value as any).id || ""] = (p.value as any).amount!
          }
        })
        setCalculatedPricesMap(pricesMap)
        setLastCalcParams({ postalCode, totalWeight })
      }
      setIsLoadingPrices(false)
    }

    fetchPrices()

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods, cart.shipping_address?.postal_code, cart.items])

  useEffect(() => {
    const autoSelect = async () => {
      if (!isOpen || deliveryShippingMethods.length === 0) {
        return
      }

      const preferredOption = deliveryShippingMethods[0]

      if (shippingMethodId !== preferredOption.id) {
        setError(null)
        setShippingMethodId(preferredOption.id)

        const { setShippingMethodSilently } = await import("@core/data/cart")
        await setShippingMethodSilently({
          cartId: cart.id,
          shippingMethodId: preferredOption.id,
          shippingOption: preferredOption,
        })
      }
    }

    autoSelect()
  }, [deliveryShippingMethods, isOpen, shippingMethodId, cart.id])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const shouldHideDeliverySelector =
    deliveryShippingMethods.length === 1 && !hasPickupOptions

  if (!isOpen && (cart.shipping_methods?.length ?? 0) === 0) {
    return null
  }

  if (shouldHideDeliverySelector) {
    return null
  }

  return (
    <div className="bg-page-bg">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-2xl font-bold text-heading gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && cart.shipping_methods?.length === 0,
              hidden: shouldHideDeliverySelector,
            }
          )}
        >
          DELIVERY
          {!isOpen && (cart.shipping_methods?.length ?? 0) > 0 && (
            <CheckCircleSolid />
          )}
        </Heading>
        {!shouldHideDeliverySelector && !isOpen &&
          cart?.shipping_address &&
          cart?.billing_address &&
          cart?.email && (
            <Text>
              <button
                onClick={handleEdit}
                className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                data-testid="edit-delivery-button"
              >
                Edit
              </button>
            </Text>
          )}
      </div>
      {isOpen ? (
        <>
          {shouldHideDeliverySelector ? (
            <div className="hidden" />
          ) : (
            <>
              {/* White Card Container */}
              <div className="bg-page-bg rounded-xl border p-6 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
                <div className="mb-6">
                  <span className="font-bold text-base text-heading block mb-1">
                    Shipping Method
                  </span>
                  <span className="text-sm text-gray-500">
                    How would you like your order delivered
                  </span>
                </div>

                <div data-testid="delivery-options-container" className="space-y-2">
                  {hasPickupOptions && (
                    <RadioGroup
                      value={showPickupOptions}
                      onChange={(value) => {
                        const id = _pickupMethods.find(
                          (option) => !option.insufficient_inventory
                        )?.id

                        if (id) {
                          handleSetShippingMethod(id, "pickup")
                        }
                      }}
                    >
                      <Radio
                        value={PICKUP_OPTION_ON}
                        data-testid="delivery-option-radio"
                        className={clx(
                          "flex items-center justify-between cursor-pointer py-4 px-4 rounded-lg transition-all border-2",
                          {
                            "bg-brand-accent-muted":
                              showPickupOptions === PICKUP_OPTION_ON,
                            "bg-white border":
                              showPickupOptions !== PICKUP_OPTION_ON,
                          }
                        )}
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <div className="flex items-center gap-x-4">
                          <div
                            className={clx(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              {
                                "bg-white": showPickupOptions !== PICKUP_OPTION_ON,
                              }
                            )}
                            style={showPickupOptions === PICKUP_OPTION_ON ? { backgroundColor: 'var(--color-brand-accent)', borderColor: 'var(--color-brand-accent)' } : { borderColor: 'var(--color-border)' }}
                          >
                            {showPickupOptions === PICKUP_OPTION_ON && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-base font-medium text-heading">
                            Pick up your order
                          </span>
                        </div>
                        <span className="text-base font-medium text-gray-500">
                          -
                        </span>
                      </Radio>
                    </RadioGroup>
                  )}

                  <RadioGroup
                    value={shippingMethodId}
                    onChange={(v) => {
                      if (v) {
                        return handleSetShippingMethod(v, "shipping")
                      }
                    }}
                    className="space-y-2"
                  >
                    {_shippingMethods?.map((option) => {
                      const isDisabled =
                        option.price_type === "calculated" &&
                        !isLoadingPrices &&
                        typeof calculatedPricesMap[option.id] !== "number"

                      const isSelected = option.id === shippingMethodId
                      const price = option.price_type === "flat"
                        ? convertToLocale({
                          amount: option.amount!,
                          currency_code: cart?.currency_code,
                        })
                        : calculatedPricesMap[option.id]
                          ? convertToLocale({
                            amount: calculatedPricesMap[option.id],
                            currency_code: cart?.currency_code,
                          })
                          : isLoadingPrices
                            ? null
                            : "-"

                      return (
                        <Radio
                          key={option.id}
                          value={option.id}
                          data-testid="delivery-option-radio"
                          disabled={isDisabled}
                          className={clx(
                            "flex items-center justify-between cursor-pointer py-4 px-4 rounded-lg transition-all border-2",
                            {
                              "bg-brand-accent-muted": isSelected && !isDisabled,
                              "bg-page-bg border": !isSelected && !isDisabled,
                              "bg-gray-50 border cursor-not-allowed opacity-50": isDisabled,
                            }
                          )}
                          style={{ borderColor: 'var(--color-border)' }}
                        >
                          <div className="flex items-center gap-x-4">
                            <div
                              className={clx(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                {
                                  "bg-white": !isSelected && !isDisabled,
                                  "bg-gray-100": isDisabled,
                                }
                              )}
                              style={isSelected && !isDisabled ? { backgroundColor: 'var(--color-brand-accent)', borderColor: 'var(--color-brand-accent)' } : { borderColor: 'var(--color-border)' }}
                            >
                              {isSelected && !isDisabled && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span className={clx(
                              "text-base font-medium",
                              {
                                "text-heading": !isDisabled,
                                "text-gray-400": isDisabled,
                              }
                            )}>
                              {option.name}
                            </span>
                          </div>
                          <span className={clx(
                            "text-base font-medium",
                            {
                              "text-heading": !isDisabled && isSelected,
                              "text-gray-600": !isDisabled && !isSelected,
                              "text-gray-400": isDisabled,
                            }
                          )}>
                            {(isLoadingPrices || isLoading) && !price ? <Loader className="w-4 h-4 animate-spin" /> : price}
                            {isLoading && isSelected && price && (
                              <Loader className="w-4 h-4 animate-spin ml-2 inline-block" />
                            )}
                          </span>
                        </Radio>
                      )
                    })}
                  </RadioGroup>
                </div>
              </div>

              {showPickupOptions === PICKUP_OPTION_ON && (
                <div className="bg-page-bg rounded-xl border p-6 shadow-sm mt-4" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="mb-6">
                    <span className="font-bold text-base text-heading block mb-1">
                      Store
                    </span>
                    <span className="text-sm text-gray-500">
                      Choose a store near you
                    </span>
                  </div>
                  <div data-testid="delivery-options-container" className="space-y-2">
                    <RadioGroup
                      value={shippingMethodId}
                      onChange={(v) => {
                        if (v) {
                          return handleSetShippingMethod(v, "pickup")
                        }
                      }}
                    >
                      {_pickupMethods?.map((option) => {
                        const isSelected = option.id === shippingMethodId
                        return (
                          <Radio
                            key={option.id}
                            value={option.id}
                            disabled={option.insufficient_inventory}
                            data-testid="delivery-option-radio"
                            className={clx(
                              "flex items-center justify-between cursor-pointer py-4 px-4 rounded-lg transition-all border-2",
                              {
                                "bg-brand-accent-muted": isSelected && !option.insufficient_inventory,
                                "bg-white border": !isSelected && !option.insufficient_inventory,
                                "bg-gray-50 border cursor-not-allowed opacity-50": option.insufficient_inventory,
                              }
                            )}
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            <div className="flex items-start gap-x-4 flex-1">
                              <div
                                className={clx(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 flex-shrink-0",
                                  {
                                    "bg-white": !isSelected && !option.insufficient_inventory,
                                    "bg-gray-100": option.insufficient_inventory,
                                  }
                                )}
                                style={isSelected && !option.insufficient_inventory ? { backgroundColor: 'var(--color-brand-accent)', borderColor: 'var(--color-brand-accent)' } : { borderColor: 'var(--color-border)' }}
                              >
                                {isSelected && !option.insufficient_inventory && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className={clx(
                                  "text-base font-medium",
                                  {
                                    "text-heading": !option.insufficient_inventory,
                                    "text-gray-400": option.insufficient_inventory,
                                  }
                                )}>
                                  {option.name}
                                </span>
                                <span className={clx(
                                  "text-sm mt-1",
                                  {
                                    "text-gray-500": !option.insufficient_inventory,
                                    "text-gray-400": option.insufficient_inventory,
                                  }
                                )}>
                                  {formatAddress(
                                    (option as any).service_zone?.fulfillment_set?.location
                                      ?.address
                                  )}
                                </span>
                              </div>
                            </div>
                            <span className={clx(
                              "text-base font-medium ml-4",
                              {
                                "text-heading": !option.insufficient_inventory && isSelected,
                                "text-gray-600": !option.insufficient_inventory && !isSelected,
                                "text-gray-400": option.insufficient_inventory,
                              }
                            )}>
                              {convertToLocale({
                                amount: option.amount!,
                                currency_code: cart?.currency_code,
                              })}
                            </span>
                          </Radio>
                        )
                      })}
                    </RadioGroup>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <ErrorMessage
                  error={error}
                  data-testid="delivery-option-error-message"
                />
              </div>
            </>
          )}
        </>
      ) : (
        <div>
          {cart && (cart.shipping_methods?.length ?? 0) > 0 && !shouldHideDeliverySelector && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-x-4">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-brand-accent)', borderColor: 'var(--color-brand-accent)' }}
                  >
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <Text className="text-base font-medium text-heading mb-1">
                      {cart.shipping_methods!.at(-1)!.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {convertToLocale({
                        amount: cart.shipping_methods!.at(-1)!.amount!,
                        currency_code: cart?.currency_code,
                      })}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {!shouldHideDeliverySelector && <Divider className="mt-8" />}
    </div>
  )
}

export default Shipping
