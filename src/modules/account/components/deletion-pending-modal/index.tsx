"use client"

import { useState, useEffect } from "react"
import { Button, Heading, Text } from "@medusajs/ui"
import Modal from "@modules/common/components/modal"
import {
    requestAccountDeletionCancel,
    confirmAccountDeletionCancel
} from "@core/data/customer-registration"
import { signout } from "@core/data/customer"
import Spinner from "@modules/common/icons/spinner"
import { notifyAuthSessionChanged } from "@lib/auth-session-events"

// Re-using common components
const DeletionPendingModal = ({
    isOpen,
    close,
    email,
    countryCode
}: {
    isOpen: boolean
    close?: () => void
    email?: string
    countryCode?: string
}) => {
    const [step, setStep] = useState<"initial" | "otp" | "success">("initial")
    const [token, setToken] = useState("")
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [emailInput, setEmailInput] = useState(email || "")

    useEffect(() => {
        if (email) {
            setEmailInput(email)
        } else if (typeof document !== 'undefined' && !emailInput) {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || "")
                return null
            }
            const cookieEmail = getCookie("_medusa_customer_email")
            if (cookieEmail) {
                setEmailInput(cookieEmail)
            }
        }
    }, [email])

    const handleRequestCancel = async () => {
        setIsLoading(true)
        setError(null)

        if (!emailInput || !emailInput.includes("@")) {
            setError("Please enter a valid email address.")
            setIsLoading(false)
            return
        }

        const result = await requestAccountDeletionCancel(emailInput)
        if (result.success && result.token) {
            setToken(result.token)
            setStep("otp")
        } else {
            setError(result.error || "Failed to request cancellation")
        }
        setIsLoading(false)
    }

    const handleConfirmCancel = async () => {
        if (!otp || !token) return
        setIsLoading(true)
        setError(null)
        const result = await confirmAccountDeletionCancel(token, otp)
        if (result.success) {
            setStep("success")
        } else {
            setError(result.error || "Invalid verification code")
        }
        setIsLoading(false)
    }

    const handleLogout = async () => {
        setIsLoading(true)
        notifyAuthSessionChanged({ mode: "logout" })
        await signout(countryCode || "in")
        close?.()
        window.location.reload()
    }

    return (
        <div className={isOpen ? "fixed inset-0 z-[100] flex items-center justify-center bg-black/50" : "hidden"}>
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col gap-y-6 text-center">
                    {step === "initial" ? (
                        <>
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Text className="text-amber-600 text-2xl font-bold">!</Text>
                            </div>
                            <Heading level="h2" className="text-2xl font-bold text-heading">Account Deletion Pending</Heading>
                            <Text className="text-gray-500 font-medium">
                                Your account is currently scheduled for deletion. Please confirm your email to withdraw the request.
                            </Text>
                            <div className="mt-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-accent text-center text-heading"
                                    style={{ borderRadius: '30px' }}
                                />
                            </div>
                            {error && <Text className="text-red-500 text-sm">{error}</Text>}
                            <div className="flex flex-col gap-y-3 mt-4">
                                <Button
                                    className="w-full py-3 bg-brand-accent text-inverse font-bold hover:bg-brand-accent-hover"
                                    style={{ borderRadius: '30px' }}
                                    onClick={handleRequestCancel}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Spinner /> : "Withdraw Deletion Request"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full py-3 border border-gray-300 hover:bg-gray-50"
                                    style={{ borderRadius: '30px' }}
                                    onClick={handleLogout}
                                    disabled={isLoading}
                                >
                                    Logout
                                </Button>
                            </div>
                        </>
                    ) : step === "otp" ? (
                        <>
                            <Heading level="h2" className="text-2xl font-bold text-heading">Verify Cancellation</Heading>
                            <Text className="text-gray-500">
                                A verification code has been sent to your email. Please enter it below to confirm cancellation.
                            </Text>
                            <div className="relative flex justify-center gap-x-3 mt-8">
                                {[0, 1, 2, 3, 4, 5].map((index) => (
                                    <div
                                        key={index}
                                        className={`w-12 h-14 flex items-center justify-center border-2 rounded-xl text-2xl font-bold transition-all duration-200 ${otp.length === index
                                                ? "border-brand-accent ring-3 ring-brand-accent/10 bg-white"
                                                : otp.length > index
                                                    ? "border-gray-400 bg-white shadow-sm"
                                                    : "border-gray-200 bg-gray-50/50"
                                            }`}
                                    >
                                        {otp[index] || ""}
                                    </div>
                                ))}
                                <input
                                    type="text"
                                    maxLength={6}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    autoFocus
                                />
                            </div>
                            {error && <Text className="text-red-500 text-sm mt-4">{error}</Text>}
                            <div className="flex flex-col gap-y-3 mt-8">
                                <Button
                                    className="w-full py-3 bg-brand-accent text-inverse font-bold"
                                    style={{ borderRadius: '30px' }}
                                    onClick={handleConfirmCancel}
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? <Spinner /> : "Confirm Cancellation"}
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full py-3"
                                    style={{ borderRadius: '30px' }}
                                    onClick={() => setStep("initial")}
                                    disabled={isLoading}
                                >
                                    Back
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-center py-6 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <Heading level="h2" className="text-2xl font-bold text-heading mb-2">Request Withdrawn</Heading>
                            <Text className="text-gray-600 max-w-[300px] mx-auto">
                                Your account deletion request has been cancelled. You can now use your account normally.
                            </Text>
                            <Button
                                variant="primary"
                                className="mt-8 w-full bg-brand-accent text-inverse py-3 font-bold"
                                style={{ borderRadius: '30px' }}
                                onClick={() => {
                                    close?.()
                                    window.location.reload()
                                }}
                            >
                                Continue to Login
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DeletionPendingModal
