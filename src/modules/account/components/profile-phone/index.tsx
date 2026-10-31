"use client"

import { isNextRedirectError, safeErrorMessage } from "@lib/util/is-next-redirect"

import React, { useEffect, useState } from "react";
import { Badge, Button, Input, Text } from "@medusajs/ui";
import { HttpTypes } from "@medusajs/types";
import { updateCustomer } from "@core/data/customer";
import { sendCustomerOTP, verifyCustomerOTP } from "@core/data/customer-registration";
import AccountInfo from "../account-info";
import useToggleState from "@core/hooks/use-toggle-state";

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfilePhone: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpToken, setOtpToken] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState("")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(
    !!(customer.metadata?.phone_verified)
  )

  const handleSendOtp = async () => {
    if (!customer.phone) {
      setError("Please add a phone number first.")
      return
    }

    setIsSendingOtp(true)
    setError(null)
    try {
      const result = await sendCustomerOTP(customer.id, "phone_verification")
      if (result.success && result.token) {
        setOtpToken(result.token)
        setShowOtpInput(true)
      } else {
        setError(result.error || "Failed to send OTP")
      }
    } catch (err: any) {
      if (isNextRedirectError(err)) throw err
      setError(safeErrorMessage(err, "An error occurred"))
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpToken || !otpCode) return

    setIsVerifying(true)
    setError(null)
    try {
      const result = await verifyCustomerOTP(otpToken, otpCode)
      if (result.success) {
        setIsPhoneVerified(true)
        setShowOtpInput(false)
        setSuccessState(true)
      } else {
        setError(result.error || "Invalid OTP")
      }
    } catch (err: any) {
      if (isNextRedirectError(err)) throw err
      setError(safeErrorMessage(err, "An error occurred"))
    } finally {
      setIsVerifying(false)
    }
  }

  const updateCustomerPhone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const phone = formData.get("phone") as string

    try {
      await updateCustomer({ phone })
      setSuccessState(true)
      setError(null)
      // If phone is updated, current verification is void
      if (phone !== customer.phone) {
        setIsPhoneVerified(false)
      }
    } catch (err: any) {
      if (isNextRedirectError(err)) throw err
      setError(safeErrorMessage(err, "An error occurred"))
    }
  }

  const clearState = () => {
    setSuccessState(false)
    setError(null)
  }

  return (
    <div className="w-full">
      <AccountInfo
        label="Phone"
        currentInfo={
          <div className="flex items-center gap-x-2">
            <span className="font-semibold">{customer.phone ?? "No phone number added"}</span>
            {isPhoneVerified ? (
              <Badge color="green">Verified</Badge>
            ) : customer.phone ? (
              <Badge color="orange">Unverified</Badge>
            ) : null}
          </div>
        }
        isSuccess={successState}
        isError={!!error}
        errorMessage={error || undefined}
        clearState={clearState}
        data-testid="account-phone-editor"
      >
        <form onSubmit={updateCustomerPhone} className="grid grid-cols-1 gap-y-2">
          <Input
            name="phone"
            type="phone"
            maxLength={13}
            autoComplete="phone"
            required
            defaultValue={customer.phone ?? ""}
            onInput={(e) => {
              e.currentTarget.value = e.currentTarget.value.replace(/[^0-9+]/g, '');
            }}
            data-testid="phone-input"
          />
          <div className="flex justify-end mt-2">
            <Button type="submit" variant="secondary">Save Changes</Button>
          </div>
        </form>

        {!isPhoneVerified && customer.phone && !showOtpInput && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <Text className="text-ui-fg-subtle text-small-regular">
              Verify your phone number to secure your account.
            </Text>
            <Button
              onClick={handleSendOtp}
              isLoading={isSendingOtp}
              variant="secondary"
              className="px-4"
            >
              Verify Phone
            </Button>
          </div>
        )}

        {showOtpInput && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            <div className="flex flex-col gap-y-1">
              <Text className="text-ui-fg-base font-semibold">Enter OTP</Text>
              <Text className="text-ui-fg-subtle text-small-regular">
                We've sent a code to {customer.phone}
              </Text>
            </div>
            <div className="flex gap-x-2">
              <Input
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="flex-1"
                maxLength={6}
              />
              <Button
                onClick={handleVerifyOtp}
                isLoading={isVerifying}
                disabled={otpCode.length < 4}
              >
                Confirm Code
              </Button>
            </div>
            <button
              onClick={() => setShowOtpInput(false)}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover text-small-regular"
            >
              Cancel
            </button>
          </div>
        )}
      </AccountInfo>
    </div>
  )
}

export default ProfilePhone
