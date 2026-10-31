"use client"

import { useState } from "react"
import { requestLoginOtp } from "@lib/data/customer-otp-login"

export type OtpStep = "identifier" | "verify"
export type IdentifierMethod = "email" | "phone"

export function detectIdentifierMethod(value: string): IdentifierMethod {
  const hasLetter = /[a-zA-Z]/.test(value)
  const isNumeric = /^\+?[\d\s\-()]*$/.test(value) && value.length > 0

  if (hasLetter) return "email"
  if (isNumeric) return "phone"
  return "email"
}

export function parseFirstName(fullName: string): string {
  const [firstName] = fullName.trim().split(/\s+/)
  return firstName || ""
}

export function useOtpAuth() {
  const [identifierMethod, setIdentifierMethod] =
    useState<IdentifierMethod>("phone")
  const [identifier, setIdentifierState] = useState("")
  const [otpToken, setOtpToken] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [otpStep, setOtpStep] = useState<OtpStep>("identifier")
  const [isNewUser, setIsNewUser] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)

  const setIdentifierValue = (value: string) => {
    setIdentifierState(value)
  }

  const updateIdentifier = (value: string) => {
    setIdentifierState(value)
    setIdentifierMethod(detectIdentifierMethod(value))
  }

  const resetOtpFlow = () => {
    setOtp("")
    setOtpToken(null)
    setOtpStep("identifier")
    setIsNewUser(false)
    setOtpError(null)
  }

  const sendOtp = async (identifierValue?: string) => {
    const value = (identifierValue ?? identifier).trim()

    if (!value) {
      setOtpError("Email or mobile number is required")
      return false
    }

    setIsSendingOtp(true)
    setOtpError(null)

    const result = await requestLoginOtp(value)
    setIsSendingOtp(false)

    if (!result.success || !result.token) {
      setOtpError(result.error || "Failed to send OTP")
      return false
    }

    setOtpToken(result.token)
    setIsNewUser(Boolean(result.isNewUser))
    setOtpStep("verify")
    setOtp("")
    return true
  }

  return {
    identifierMethod,
    setIdentifierMethod,
    identifier,
    setIdentifier: updateIdentifier,
    setIdentifierValue,
    otpToken,
    otp,
    setOtp,
    otpStep,
    setOtpStep,
    isNewUser,
    setIsNewUser,
    otpError,
    setOtpError,
    isSendingOtp,
    resetOtpFlow,
    sendOtp,
  }
}
