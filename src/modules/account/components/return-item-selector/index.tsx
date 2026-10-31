"use client"

import { HttpTypes } from "@medusajs/types"
import { ItemWithDeliveryStatus } from "@core/util/returns"
import { Select, Text, clx } from "@medusajs/ui"
import { Minus, Plus } from "@medusajs/icons"
import Thumbnail from "@modules/products/components/thumbnail"
import { convertToLocale } from "@core/util/money"

type ReturnItemSelectorProps = {
    items: ItemWithDeliveryStatus[]
    returnReasons: HttpTypes.StoreReturnReason[]
    selectedItems: Array<{
        id: string
        quantity: number
        return_reason_id?: string
    }>
    onItemSelectionChange: (
        items: Array<{
            id: string
            quantity: number
            return_reason_id?: string
        }>
    ) => void
    currencyCode: string
}

const ReturnItemSelector = ({
    items,
    returnReasons,
    selectedItems,
    onItemSelectionChange,
    currencyCode,
}: ReturnItemSelectorProps) => {
    const handleQuantityChange = (itemId: string, quantity: number) => {
        const existingItemIndex = selectedItems.findIndex((i) => i.id === itemId)

        if (quantity === 0) {
            if (existingItemIndex > -1) {
                const newItems = [...selectedItems]
                newItems.splice(existingItemIndex, 1)
                onItemSelectionChange(newItems)
            }
            return
        }

        if (existingItemIndex > -1) {
            const newItems = [...selectedItems]
            newItems[existingItemIndex] = { ...newItems[existingItemIndex], quantity }
            onItemSelectionChange(newItems)
        } else {
            onItemSelectionChange([...selectedItems, { id: itemId, quantity }])
        }
    }



    const handleReasonChange = (itemId: string, reasonId: string) => {
        const existingItemIndex = selectedItems.findIndex((i) => i.id === itemId)
        if (existingItemIndex > -1) {
            const newItems = [...selectedItems]
            newItems[existingItemIndex] = { ...newItems[existingItemIndex], return_reason_id: reasonId }
            onItemSelectionChange(newItems)
        }
    }

    return (
        <div className="space-y-4">
            {items.map((item) => {
                const isReturnable = item.returnable_quantity > 0
                const selected = selectedItems.find((i) => i.id === item.id)
                const currentQty = selected?.quantity || 0

                return (
                    <div
                        key={item.id}
                        className={clx(
                            "group border rounded-3xl p-4 sm:p-5 transition-all duration-300 relative",
                            selected
                                ? "border-brand-accent shadow-lg bg-white"
                                : isReturnable
                                    ? "border-gray-200 hover:border-gray-300 bg-white"
                                    : "border-gray-100 opacity-50 bg-gray-50/50 grayscale pointer-events-none"
                        )}
                    >
                        <div className="flex gap-4 sm:gap-6">
                            {/* Left: Thumbnail & Checkbox */}
                            <div className="relative shrink-0">
                                <div
                                    className="w-20 h-24 sm:w-24 sm:h-32 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 cursor-pointer"
                                    onClick={() => isReturnable && handleQuantityChange(item.id, selected ? 0 : 1)}
                                >
                                    <Thumbnail thumbnail={item.thumbnail} size="full" className="object-cover w-full h-full" />
                                </div>
                                <div 
                                    className={clx(
                                        "absolute -top-2 -left-2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm z-20",
                                        selected ? "bg-brand-accent border-white scale-110" : "bg-white border-gray-200"
                                    )}
                                    onClick={() => isReturnable && handleQuantityChange(item.id, selected ? 0 : 1)}
                                >
                                    {selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </div>
                            </div>

                            {/* Middle: Info */}
                            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                <div className="space-y-1">
                                    <h3 className="text-sm sm:text-base font-bold text-heading line-clamp-1">{item.title}</h3>
                                    <p className="text-xs font-medium text-gray-500">{item.variant?.title}</p>
                                    <div className="mt-1">
                                        <span className="text-brand-accent font-bold text-sm">
                                            {convertToLocale({
                                                amount: item.unit_price,
                                                currency_code: currencyCode,
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {selected && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 p-1">
                                            <button
                                                type="button"
                                                onClick={() => handleQuantityChange(item.id, currentQty - 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-400 hover:text-heading transition-all shadow-sm"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="w-8 text-center text-xs font-bold tabular-nums">{currentQty}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleQuantityChange(item.id, currentQty + 1)}
                                                disabled={currentQty >= item.returnable_quantity}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-400 hover:text-heading transition-all shadow-sm disabled:opacity-50"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Qty to return</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom: Return Reason Selector */}
                        <div
                            className={clx(
                                "grid transition-all duration-300 ease-in-out",
                                selected ? "grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-gray-50" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                            )}
                        >
                            <div className="min-h-0 pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Reason for return:</label>
                                    <div className="w-full sm:w-64">
                                        <Select
                                            value={selected?.return_reason_id || ""}
                                            onValueChange={(value) => handleReasonChange(item.id, value)}
                                        >
                                            <Select.Trigger className={clx(
                                                "rounded-xl h-10 transition-all text-xs font-medium border-gray-100",
                                                selected?.return_reason_id ? "bg-brand-accent-muted/50 text-brand-accent border-brand-accent/20" : "bg-gray-50/50 text-gray-500"
                                            )}>
                                                <Select.Value placeholder="Please select a reason" />
                                            </Select.Trigger>
                                            <Select.Content className="z-[9999]" position="popper">
                                                {returnReasons.map((reason) => (
                                                    <Select.Item key={reason.id} value={reason.id} className="text-xs font-medium">
                                                        {reason.label}
                                                     </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ReturnItemSelector
