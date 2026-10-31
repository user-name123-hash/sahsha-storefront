"use client"

import React, { useEffect, useState } from "react"
import { registerNotificationToken } from "@core/data/notifications"
import {
  getPushTokenErrorMessage,
  isFirebaseConfigured,
  requestPushToken,
  showForegroundPushNotification,
  subscribeForegroundPush,
} from "@lib/firebase-notifications"
import { canUseWebPush, safeLocalGet, safeLocalSet } from "@lib/util/safe-browser"
import { XMark } from "@medusajs/icons"

interface PushNotificationManagerProps {
    customerId?: string
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({ customerId }) => {
    const [showPrompt, setShowPrompt] = useState(false)
    const [status, setStatus] = useState<"idle" | "requesting" | "registered" | "denied">("idle")
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        // Instagram/Facebook iOS WebViews crash on Notification / ServiceWorker access.
        if (!isFirebaseConfigured() || !canUseWebPush()) {
            return
        }

        let unsubscribe: (() => void) | undefined
        const timer = window.setTimeout(() => {
            try {
                const permission = Notification.permission
                const storageKey = customerId ? `fcm_reg_${customerId}` : "fcm_reg_guest"
                const alreadyRegistered = safeLocalGet(storageKey)

                if (permission === "default") {
                    if (safeLocalGet("push_notification_dismissed") === "true") return
                    setShowPrompt(true)
                } else if (permission === "granted") {
                    if (!alreadyRegistered) {
                        void handleAllow(true)
                    } else {
                        setStatus("registered")
                    }
                } else if (permission === "denied") {
                    setStatus("denied")
                }
            } catch {
                /* restricted WebView */
            }
        }, 1000)

        try {
            unsubscribe = subscribeForegroundPush((payload) => {
                showForegroundPushNotification(payload)
            })
        } catch {
            unsubscribe = undefined
        }

        return () => {
            window.clearTimeout(timer)
            unsubscribe?.()
        }
    }, [customerId])

    const handleAllow = async (isBackground = false) => {
        if (!isFirebaseConfigured() || !canUseWebPush()) {
            return
        }

        if (!isBackground) {
            setStatus("requesting")
            setErrorMessage(null)
        }

        const result = await requestPushToken()

        if ("error" in result) {
            if (result.error === "permission_denied") {
                setStatus("denied")
            } else {
                setStatus("idle")
            }

            if (!isBackground) {
                setErrorMessage(getPushTokenErrorMessage(result.error))
            }
            return
        }

        try {
            const deviceInfo = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
            }
            const success = await registerNotificationToken(result.token, deviceInfo)

            if (success) {
                const storageKey = customerId ? `fcm_reg_${customerId}` : "fcm_reg_guest"
                safeLocalSet(storageKey, "true")
                setStatus("registered")
                setShowPrompt(false)
                setErrorMessage(null)
            } else {
                setStatus("idle")
                if (!isBackground) {
                    setErrorMessage("Failed to register token with backend.")
                }
            }
        } catch {
            setStatus("idle")
            if (!isBackground) {
                setErrorMessage("Failed to register token with backend.")
            }
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        safeLocalSet("push_notification_dismissed", "true")
    }

    if (!isFirebaseConfigured() || !customerId || !showPrompt || status === "registered") return null

    return (
        <div
            id="push-notification-prompt"
            className="fixed inset-0 z-[999999] flex items-center justify-center p-6"
        >
            {/* Backdrop with elegant blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-500"
                onClick={handleDismiss}
            />

            <div className="bg-brand-accent-muted w-full max-w-[440px] rounded-[32px] shadow-[0_32px_128px_-16px_rgba(90,42,67,0.18)] border border-brand-accent-border relative overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-bottom-20 duration-500">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-brand-accent/10 rounded-full blur-[60px]" />
                <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-40 h-40 bg-brand-accent-border/50 rounded-full blur-[50px]" />

                <div className="relative z-10 p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div className="bg-gradient-to-br from-brand-accent to-brand-accent-hover w-16 h-16 rounded-[24px] shadow-[0_20px_40px_-10px_rgba(90,42,67,0.45)] grid place-items-center flex-shrink-0 border border-white/20 relative group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[24px]" />
                            <svg
                                width="34"
                                height="34"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-sm"
                            >
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                            </svg>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-2.5 hover:bg-brand-accent-muted rounded-full transition-all group active:scale-90"
                            aria-label="Close notification prompt"
                        >
                            <XMark className="w-6 h-6 text-neutral-400 group-hover:text-brand-accent" />
                        </button>
                    </div>

                    <div className="text-left">
                        <h3 className="font-display text-2xl sm:text-3xl font-semibold text-brand-accent mb-3 tracking-tight">
                            {status === "denied" ? "Notifications Blocked" : "Enable Notifications?"}
                        </h3>
                        <p className="text-neutral-600 text-base sm:text-lg mb-10 leading-relaxed">
                            {status === "denied"
                                ? "Please enable notifications in your browser settings to stay updated."
                                : "Don't miss out! Get real-time updates for your order status and exclusive member-only offers."}
                        </p>
                    </div>

                    {status !== "denied" && (
                        <div className="flex flex-col gap-4">
                            {errorMessage && (
                                <p className="text-sm text-red-600 text-center">{errorMessage}</p>
                            )}
                            <button
                                className="w-full rounded-[20px] h-14 bg-brand-accent hover:bg-brand-accent-hover text-white font-bold text-lg shadow-[0_12px_32px_rgba(90,42,67,0.22)] hover:shadow-[0_16px_40px_rgba(90,42,67,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-75"
                                onClick={() => handleAllow()}
                                disabled={status === "requesting"}
                            >
                                {status === "requesting" ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Connecting...</span>
                                    </>
                                ) : (
                                    "Yes, Notify Me"
                                )}
                            </button>
                            <button
                                className="w-full rounded-[20px] h-14 bg-white border-2 border-brand-accent-border text-neutral-600 font-bold text-lg hover:bg-brand-accent-muted hover:text-brand-accent transition-all active:scale-[0.98]"
                                onClick={handleDismiss}
                            >
                                Maybe Later
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PushNotificationManager
