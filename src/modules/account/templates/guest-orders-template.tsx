"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { listGuestOrders } from "@core/data/guest"
import OrderOverview from "@modules/account/components/order-overview"
import { Spinner } from "@medusajs/icons"
import { Heading, Text } from "@medusajs/ui"

const GuestOrdersTemplate = () => {
    const router = useRouter()
    // We can read 'token' from URL query if verify API passed it, or sessionStorage/cookie
    // For security, HttpOnly cookie is best, but here we assume the login modal 
    // redirected with a token in URL or stored it in document.cookie as per previous context.
    // Let's try to get it from a cookie named 'guest_token'.

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [orders, setOrders] = useState<any[]>([])

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    }

    useEffect(() => {
        const fetchOrders = async () => {
            const token = getCookie("_medusa_guest_token")

            if (!token) {
                setError("No verification token found. Please verify your email again.")
                setLoading(false)
                return
            }

            try {
                const data = await listGuestOrders(token)
                if (data && data.orders) {
                    // Sort orders by created_at descending (latest first)
                    const sortedOrders = [...data.orders].sort((a: any, b: any) => {
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    })
                    setOrders(sortedOrders)
                }
            } catch (err: any) {
                setError(err.message || "Failed to load orders")
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner className="animate-spin text-brand-accent" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={() => router.push("/account")}
                    className="bg-brand-accent text-inverse px-6 py-2 rounded-full hover:bg-brand-accent-hover"
                >
                    Go to Login
                </button>
            </div>
        )
    }

    const handleClearGuestSession = () => {
        document.cookie = "_medusa_guest_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push("/account")
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <Heading level="h1" className="text-2xl sm:text-3xl font-bold text-heading mb-2">
                        My Orders
                    </Heading>
                    <Text className="text-gray-500">
                        View your order history and status.
                    </Text>
                </div>
                <div className="flex items-center gap-4">
                    {orders.length > 0 && (
                        <span className="hidden md:inline-block text-gray-500 text-sm font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            {orders[0].email}
                        </span>
                    )}
                    <button
                        onClick={handleClearGuestSession}
                        className="whitespace-nowrap px-4 py-2 border border-brand-accent text-brand-accent rounded-full hover:bg-brand-accent-muted transition-colors text-sm font-medium"
                    >
                        Check Different User
                    </button>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No orders found associated with this email.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-y-4">
                    <OrderOverview orders={orders} />
                </div>
            )}
        </div>
    )
}

export default GuestOrdersTemplate
