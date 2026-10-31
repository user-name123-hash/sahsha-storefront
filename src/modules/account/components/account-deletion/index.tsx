"use client"

import React, { useState } from "react"
import { Button, Heading, Text, Input } from "@medusajs/ui"
import Modal from "@modules/common/components/modal"
import Spinner from "@modules/common/icons/spinner"
import {
    requestAccountDeletion,
    confirmAccountDeletion,
} from "@core/data/customer-registration"
import { signout } from "@core/data/customer"
import { useParams } from "next/navigation"
import { notifyAuthSessionChanged } from "@lib/auth-session-events"

const AccountDeletion = ({ customerEmail, hideHeader = false }: { customerEmail: string, hideHeader?: boolean }) => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [step, setStep] = useState<"initial" | "otp" | "success">("initial")
    const [otp, setOtp] = useState("")
    const [token, setToken] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const params = useParams()

    const handleOpenModal = () => {
        setStep("initial")
        setError(null)
        setOtp("")
        setIsModalOpen(true)
    }

    const handleRequestDeletion = async () => {
        setIsLoading(true)
        setError(null)
        const result = await requestAccountDeletion(customerEmail)
        if (result.success && result.token) {
            setToken(result.token)
            setStep("otp")
        } else {
            setError(result.error || "Failed to initiate deletion request")
        }
        setIsLoading(false)
    }

    const handleConfirmDeletion = async () => {
        setIsLoading(true)
        setError(null)
        const result = await confirmAccountDeletion(token, otp)
        if (result.success) {
            setStep("success")
            // Log out user after successful confirmation
            setTimeout(async () => {
                setIsModalOpen(false)
                const countryCode = (params.countryCode as string) || "in"
                notifyAuthSessionChanged({ mode: "logout" })
                await signout(countryCode)
            }, 3000)
        } else {
            setError(result.error || "Invalid OTP")
        }
        setIsLoading(false)
    }

    return (
        <div className={hideHeader ? "" : "mt-8 border-t border-gray-100 pt-8"}>
            {!hideHeader && (
                <div className="flex flex-col gap-y-2 mb-4">
                    <Heading level="h2" className="text-lg font-bold text-heading">Delete account</Heading>
                    <Text className="text-gray-500">Once you delete your account, you will lose all your data. This action is not immediate and can be cancelled within a grace period.</Text>
                </div>
            )}

            {hideHeader ? (
                <button
                    type="button"
                    onClick={handleOpenModal}
                    className="account-dashboard__btn account-dashboard__btn--danger account-profile-form__delete-btn"
                >
                    Delete Account
                </button>
            ) : (
                <Button
                    variant="danger"
                    onClick={handleOpenModal}
                    className="w-fit"
                >
                    Delete Account
                </Button>
            )}

            <Modal isOpen={isModalOpen} close={() => setIsModalOpen(false)} size="small">
                <Modal.Body>
                    <div className="flex flex-col gap-y-6 py-4 text-center">
                        {step === "initial" ? (
                            <>
                                <Heading level="h2" className="text-xl font-bold">Delete Account?</Heading>
                                <Text className="text-gray-500">Are you sure you want to delete your account? A verification code will be sent to your email.</Text>
                                {error && <Text className="text-red-500 text-sm">{error}</Text>}
                                <div className="flex justify-center gap-x-4 mt-4">
                                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button variant="danger" onClick={handleRequestDeletion} disabled={isLoading}>
                                        {isLoading ? <Spinner /> : "Yes, Send Code"}
                                    </Button>
                                </div>
                            </>
                        ) : step === "otp" ? (
                            <>
                                <Heading level="h2" className="text-xl font-bold">Verify Deletion</Heading>
                                <Text className="text-gray-500">Enter the 6-digit code sent to {customerEmail}</Text>
                                <div className="relative flex justify-center gap-x-2 mt-6">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <div
                                            key={index}
                                            className={`w-10 h-12 flex items-center justify-center border-2 rounded-lg text-xl font-bold transition-all duration-200 ${otp.length === index
                                                    ? "border-brand-accent ring-2 ring-brand-accent/10 bg-white"
                                                    : otp.length > index
                                                        ? "border-gray-400 bg-white"
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
                                {error && <Text className="text-red-500 text-sm mt-2">{error}</Text>}
                                <Button
                                    variant="danger"
                                    className="mt-6 w-full"
                                    onClick={handleConfirmDeletion}
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? <Spinner /> : "Confirm Deletion"}
                                </Button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-center py-8">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100 animate-in zoom-in duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <Heading level="h2" className="text-2xl font-bold text-heading mb-2">Deletion Scheduled</Heading>
                                <Text className="text-gray-600 max-w-[280px] mx-auto">
                                    Your account is scheduled for deletion. You will be logged out shortly.
                                </Text>
                            </div>
                        )}
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    )
}

export default AccountDeletion
