
"use client"

import { useActionState, useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { createSwapRequest } from "@core/data/swaps"
import { listProducts } from "@core/data/products"
import { enhanceItemsWithReturnStatus } from "@core/util/returns"
import { Button, Heading, Text, clx, Select, Textarea } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { convertToLocale } from "@core/util/money"
import { Minus, Plus } from "@medusajs/icons"
import { sdk } from "@core/config"

type ExchangeRequestTemplateProps = {
    order: HttpTypes.StoreOrder
    returnReasons: HttpTypes.StoreReturnReason[]
}

const initialState = {
    success: false,
    error: null,
    swap: null,
}

const ExchangeRequestTemplate = ({
    order,
    returnReasons,
}: ExchangeRequestTemplateProps) => {
    // We reuse the enhancement logic to know which items are returnable/exchangeable
    const [items, setItems] = useState(enhanceItemsWithReturnStatus(order.items || []))
    const [enrichedProducts, setEnrichedProducts] = useState<Record<string, any>>({})

    useEffect(() => {
        const fetchProductVariants = async () => {
            const productIds = Array.from(new Set(items.map(i => i.product_id || (i.variant as any)?.product_id).filter(Boolean))) as string[]

            if (productIds.length > 0) {
                try {
                    const { response: { products } } = await listProducts({
                        regionId: order.region_id || undefined,
                        queryParams: {
                            id: productIds,
                            fields: "*variants"
                        }
                    })

                    const productMap = products.reduce((acc: any, p: any) => {
                        acc[p.id] = p
                        return acc
                    }, {})

                    setEnrichedProducts(productMap)
                } catch (error) {
                    // Silence error
                }
            }
        }

        fetchProductVariants()
    }, [items, order.region_id])

    // State for selected items to exchange
    const [selectedExchange, setSelectedExchange] = useState<Record<string, {
        return_item_id: string
        quantity: number
        reason: string
        new_variant_id: string | null
        note?: string
    }>>({})

    const [state, formAction] = useActionState(createSwapRequest, initialState)

    const handleSubmit = (formData: FormData) => {
        const exchangeItems = Object.values(selectedExchange).filter(e => e.new_variant_id)

        if (exchangeItems.length === 0) {
            // This should be handled by button disabled state, but safety first
            return
        }

        const return_items = exchangeItems.map(e => ({
            item_id: e.return_item_id,
            quantity: e.quantity,
            reason_id: e.reason,
            // The plugin might want the original variant_id too
            variant_id: items.find(i => i.id === e.return_item_id)?.variant_id
        }))

        const new_items = exchangeItems.map(e => ({
            variant_id: e.new_variant_id!,
            quantity: e.quantity
        }))

        formData.append("order_id", order.id)
        formData.append("return_items", JSON.stringify(return_items))
        formData.append("new_items", JSON.stringify(new_items))
        // We can append a global note/reason if needed, but per-item is better handled by json

        formAction(formData)
    }

    const handleQuantityChange = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            const newState = { ...selectedExchange }
            delete newState[itemId]
            setSelectedExchange(newState)
            return
        }

        const item = items.find(i => i.id === itemId)
        const maxQty = item?.returnable_quantity || 0
        const finalQty = Math.min(quantity, maxQty)

        setSelectedExchange(prev => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || {
                    return_item_id: itemId,
                    reason: returnReasons[0]?.label || "Size exchange",
                    new_variant_id: null
                }),
                quantity: finalQty
            }
        }))
    }

    const isGuest = !order.customer_id
    const backToOrderLink = isGuest ? `/orders/${order.id}` : `/account/orders`

    if (state.success && state.swap) {
        const exchangeReference =
            state.swap.display_id ||
            state.swap.id ||
            state.swap.swap_id ||
            `EX-${order.display_id}`

        return (
            <div className="max-w-md mx-auto pt-16 sm:pt-20 pb-6 sm:pb-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-14 h-14 bg-brand-accent-muted rounded-full flex items-center justify-center shadow-sm border border-brand-accent-border">
                            <svg
                                className="w-7 h-7 text-brand-accent"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M7 16V4m0 0L3 8m4-4 4 4" />
                                <path d="M17 8v12m0 0 4-4m-4 4-4-4" />
                            </svg>
                        </div>
                        <Heading level="h1" className="text-2xl sm:text-3xl font-extrabold font-sans text-brand-accent tracking-tight uppercase">
                            Exchange Submitted!
                        </Heading>
                        <Text className="text-gray-500 text-sm sm:text-base max-w-sm leading-snug">
                            Your exchange for order{" "}
                            <span className="text-brand-accent font-bold">#{order.display_id}</span>{" "}
                            has been received. You&apos;ll get an email with return label and instructions.
                        </Text>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-gray-50/50 rounded-xl px-4 py-3 flex flex-col items-center gap-1 border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                                Exchange Reference
                            </span>
                            <span className="text-sm font-mono font-bold text-brand-accent break-all select-all text-center">
                                {exchangeReference}
                            </span>
                        </div>

                        <div className="bg-brand-accent-muted/40 rounded-xl px-3 py-2.5 border border-brand-accent-border flex items-center gap-2.5 text-left">
                            <div className="w-7 h-7 rounded-lg bg-brand-accent/10 flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 leading-snug">
                                Check your inbox for next steps. Keep this reference for support.
                            </p>
                        </div>

                        <LocalizedClientLink href={backToOrderLink} className="block">
                            <Button className="w-full rounded-xl bg-brand-accent hover:opacity-80 text-inverse h-11 font-bold text-sm shadow-md shadow-gray-200/80 transition-all active:scale-95">
                                Back to Order Details
                            </Button>
                        </LocalizedClientLink>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-16 px-6">
            <div className="mb-8 sm:mb-12">
                <LocalizedClientLink href={`/orders/${order.id}`} className="text-[10px] sm:text-xs text-gray-400 hover:text-brand-accent mb-6 inline-flex gap-2 items-center font-bold tracking-[0.2em] transition-colors uppercase">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                    BACK TO ORDER #{order.display_id}
                </LocalizedClientLink>
                <Heading level="h1" className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-sans tracking-tight text-brand-accent uppercase">Exchange Items</Heading>
                <p className="text-gray-400 font-medium text-sm sm:text-base mt-2">Select the items you'd like to exchange and choose your replacement options below.</p>
            </div>

            <form action={handleSubmit} className="space-y-8">
                {state.error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="font-medium">{state.error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    {items.map((item) => {
                        const isSelected = !!selectedExchange[item.id]
                        const productId = item.product_id || (item.variant as any)?.product_id
                        const product = enrichedProducts[productId] || (item.variant as any)?.product || (item as any).product
                        const canExchange = item.returnable_quantity > 0

                        return (
                            <div key={item.id} className={clx(
                                "group border rounded-3xl p-4 sm:p-5 transition-all duration-300 relative",
                                isSelected ? "border-brand-accent shadow-lg bg-white" :
                                    (canExchange ? "border-gray-200 hover:border-gray-300 bg-white" : "border-gray-100 opacity-50 bg-gray-50/50 grayscale pointer-events-none")
                            )}>
                                <div className="flex gap-4 sm:gap-6">
                                    {/* Left: Thumbnail & Checkbox */}
                                    <div className="relative shrink-0">
                                        <div
                                            className="w-20 h-24 sm:w-24 sm:h-32 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 cursor-pointer"
                                            onClick={() => canExchange && handleQuantityChange(item.id, isSelected ? 0 : 1)}
                                        >
                                            <Thumbnail thumbnail={item.thumbnail} size="full" className="w-full h-full object-cover" />
                                        </div>
                                        <div 
                                            className={clx(
                                                "absolute -top-2 -left-2 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm z-20",
                                                isSelected ? "bg-brand-accent border-white scale-110" : "bg-white border-gray-200"
                                            )}
                                            onClick={() => canExchange && handleQuantityChange(item.id, isSelected ? 0 : 1)}
                                        >
                                            {isSelected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                        </div>
                                    </div>

                                    {/* Middle: Info */}
                                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                        <div className="space-y-1">
                                            <h3 className="text-sm sm:text-base font-bold text-heading line-clamp-1">{item.title}</h3>
                                            <p className="text-xs font-medium text-gray-500">{item.variant?.title}</p>
                                            <div className="mt-1">
                                                <span className="text-brand-accent font-bold text-sm">
                                                    {convertToLocale({ amount: item.unit_price, currency_code: order.currency_code })}
                                                </span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 p-1">
                                                    <button
                                                        type="button"
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-400 hover:text-heading transition-all shadow-sm"
                                                        onClick={() => handleQuantityChange(item.id, (selectedExchange[item.id]?.quantity || 1) - 1)}
                                                    >
                                                        <Minus className="w-3" />
                                                    </button>
                                                    <span className="w-8 text-center text-xs font-bold tabular-nums">{selectedExchange[item.id]?.quantity || 0}</span>
                                                    <button
                                                        type="button"
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-400 hover:text-heading transition-all shadow-sm disabled:opacity-50"
                                                        onClick={() => handleQuantityChange(item.id, (selectedExchange[item.id]?.quantity || 0) + 1)}
                                                        disabled={(selectedExchange[item.id]?.quantity || 0) >= item.returnable_quantity}
                                                    >
                                                        <Plus className="w-3" />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Qty to exchange</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expandable Action Area */}
                                <div className={clx(
                                    "grid transition-all duration-300 ease-in-out",
                                    isSelected ? "grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-gray-50" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                                )}>
                                    <div className="min-h-0 flex flex-col gap-4 pb-4">
                                        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                                            <div className="w-full sm:w-52 space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Reason for exchange:</label>
                                                <Select
                                                    value={selectedExchange[item.id]?.reason || ""}
                                                    onValueChange={(val) => setSelectedExchange(prev => ({
                                                        ...prev,
                                                        [item.id]: { ...prev[item.id], reason: val }
                                                    }))}
                                                >
                                                    <Select.Trigger className="rounded-xl h-10 bg-gray-50/50 border-gray-100 text-xs font-medium">
                                                        <Select.Value placeholder="Select reason" />
                                                    </Select.Trigger>
                                                    <Select.Content className="z-[9999]" position="popper">
                                                        {returnReasons.map(r => (
                                                            <Select.Item key={r.id} value={r.label}>{r.label}</Select.Item>
                                                        ))}
                                                        <Select.Item value="Other">Other</Select.Item>
                                                    </Select.Content>
                                                </Select>
                                            </div>

                                            <div className="w-full sm:w-52 space-y-1.5">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Select replacement</label>
                                                <Select
                                                    value={selectedExchange[item.id]?.new_variant_id || ""}
                                                    onValueChange={(val) => setSelectedExchange(prev => ({
                                                        ...prev,
                                                        [item.id]: { ...prev[item.id], new_variant_id: val }
                                                    }))}
                                                >
                                                    <Select.Trigger className="rounded-xl h-10 bg-gray-50/50 border-gray-100 text-xs font-medium">
                                                        <Select.Value placeholder={product?.variants ? "Choose variant" : "Loading..."} />
                                                    </Select.Trigger>
                                                    <Select.Content className="z-[9999]" position="popper">
                                                        {product?.variants?.filter((v: any) => v.id !== item.variant_id).map((v: any) => {
                                                            const inStock = v.manage_inventory === false || v.allow_backorder || (v.inventory_quantity !== null && v.inventory_quantity > 0);
                                                            return (
                                                                <Select.Item 
                                                                    key={v.id} 
                                                                    value={v.id} 
                                                                    disabled={!inStock}
                                                                    className={clx(!inStock && "opacity-40 select-none", "transition-opacity")}
                                                                >
                                                                    {v.title} {!inStock ? "(Out of stock)" : ""}
                                                                </Select.Item>
                                                            )
                                                        })}
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
                {/* OVERALL NOTE SECTION */}
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-6 h-6 rounded-lg bg-brand-accent text-inverse flex items-center justify-center font-bold text-[10px]">!</div>
                        <h2 className="text-sm font-bold text-brand-accent uppercase tracking-wider">Additional Details (Optional)</h2>
                    </div>
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 sm:p-8">
                        <textarea
                            name="note"
                            placeholder="Tell us any extra details about this exchange..."
                            className="w-full min-h-[120px] rounded-2xl border-gray-100 bg-gray-50/50 p-4 text-sm font-medium text-gray-700 outline-none focus:border-brand-accent/30 focus:ring-0 transition-all placeholder:text-gray-300 resize-none font-sans"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-8 border-t border-gray-100 mt-8 mb-12">
                    <LocalizedClientLink href={`/orders/${order.id}`} className="w-full sm:w-auto">
                        <Button variant="secondary" type="button" className="w-full h-11 rounded-3xl px-10 font-bold text-gray-400 border-none hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]">
                            Cancel
                        </Button>
                    </LocalizedClientLink>
                    
                    <Button
                        type="submit"
                        disabled={Object.values(selectedExchange).length === 0 || Object.values(selectedExchange).some(e => !e.new_variant_id || !e.reason)}
                        className="w-full sm:w-auto h-11 rounded-3xl bg-brand-accent hover:opacity-80 text-inverse px-12 font-black text-xs uppercase tracking-widest shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-20"
                    >
                        {Object.values(selectedExchange).length === 0 ? "Select items" : Object.values(selectedExchange).some(e => !e.new_variant_id) ? "Choose replacement" : Object.values(selectedExchange).some(e => !e.reason) ? "Select reason" : "Confirm Exchange Request"}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default ExchangeRequestTemplate
