"use client"

import React, { useActionState, useEffect, useState, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { updateCustomer, uploadProfileImage } from "@core/data/customer"
import { sendCustomerOTP, verifyCustomerOTP } from "@core/data/customer-registration"
import {
    requestContactChange,
    verifyContactChange,
} from "@lib/data/customer-contact"
import { isNextRedirectError, safeErrorMessage } from "@lib/util/is-next-redirect"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"
import AccountDeletion from "../account-deletion"
import RemovePhotoModal from "./remove-photo-modal"
import { formatCustomerDisplayName } from "@lib/util/customer-name"

type ProfileFormProps = {
    customer: HttpTypes.StoreCustomer
}

// Helper function to get profile image URL from metadata
const getProfileImageUrl = (
    customer: HttpTypes.StoreCustomer,
    accentHex = "5a2a43"
): string => {
    const metadata = customer.metadata as Record<string, any> | undefined
    const profileImageUrl = metadata?.profile_image_url
    if (typeof profileImageUrl === "string" && profileImageUrl.trim()) {
        return profileImageUrl
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        formatCustomerDisplayName(customer.first_name, customer.last_name, "JW")
    )}&background=${accentHex}&color=fff&size=256&bold=true`
}

const hasCustomProfileImage = (customer: HttpTypes.StoreCustomer): boolean => {
    const metadata = customer.metadata as Record<string, any> | undefined
    const profileImageUrl = metadata?.profile_image_url
    return typeof profileImageUrl === "string" && profileImageUrl.trim().length > 0
}

const normalizePhoneForSave = (value: string) => {
    const digits = value.replace(/[^\d+]/g, "")
    if (!digits) return ""
    return digits.startsWith("+") ? digits : `+${digits}`
}

const phoneDigits = (value: string) => value.replace(/\D/g, "")

const ProfileForm: React.FC<ProfileFormProps> = ({ customer }) => {
    const [successState, setSuccessState] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [accentHex, setAccentHex] = useState("5a2a43")
    const [imagePreview, setImagePreview] = useState<string>(getProfileImageUrl(customer))
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const [isDeletingImage, setIsDeletingImage] = useState(false)
    const [isRemovePhotoModalOpen, setIsRemovePhotoModalOpen] = useState(false)
    const [hasUploadedImage, setHasUploadedImage] = useState(hasCustomProfileImage(customer))
    const fileInputRef = useRef<HTMLInputElement>(null)

    // OTP related states
    const [isSendingOtp, setIsSendingOtp] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [otpToken, setOtpToken] = useState<string | null>(null)
    const [otpCode, setOtpCode] = useState("")
    const [showOtpInput, setShowOtpInput] = useState(false)
    const [otpType, setOtpType] = useState<"email_verification" | "phone_verification">("phone_verification")
    /** Existing-email verify vs add/change email via /me/contact */
    const [emailOtpMode, setEmailOtpMode] = useState<"verify_existing" | "add_or_change">("verify_existing")
    const [otpError, setOtpError] = useState<string | null>(null)
    const [phoneFieldError, setPhoneFieldError] = useState<string | null>(null)
    const [emailFieldError, setEmailFieldError] = useState<string | null>(null)
    const [phone, setPhone] = useState((customer.phone || "").replace(/^\+/, ""))
    const [email, setEmail] = useState(customer.email || "")
    const [imageError, setImageError] = useState<string | null>(null)
    const [phoneVerified, setPhoneVerified] = useState((customer as any).phone_verified === true || (customer as any).phone_verified === "true" || customer.metadata?.phone_verified === true || customer.metadata?.phone_verified === "true")
    const [emailVerified, setEmailVerified] = useState((customer as any).email_verified === true || (customer as any).email_verified === "true" || customer.metadata?.email_verified === true || customer.metadata?.email_verified === "true")

    useEffect(() => {
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue("--color-brand-accent")
            .trim()
        if (raw) {
            const hex = raw.replace("#", "")
            setAccentHex(hex)
            setImagePreview((prev) => {
                if (prev.includes("ui-avatars.com")) {
                    return getProfileImageUrl(customer, hex)
                }
                return prev
            })
        }
    }, [customer])

    useEffect(() => {
        setPhone((customer.phone || "").replace(/^\+/, ""))
    }, [customer.phone])

    useEffect(() => {
        setEmail(customer.email || "")
    }, [customer.email])

    useEffect(() => {
        setHasUploadedImage(hasCustomProfileImage(customer))
        setImagePreview(getProfileImageUrl(customer, accentHex))
    }, [customer, accentHex])

    const canEditEmail = !emailVerified
    const isEmailValid = /^\S+@\S+\.\S+$/.test(email.trim())
    const normalizedCustomerEmail = (customer.email || "").trim().toLowerCase()
    const normalizedEmail = email.trim().toLowerCase()
    const needsEmailContactChange =
        !normalizedCustomerEmail || normalizedEmail !== normalizedCustomerEmail

    const updateProfile = async (
        _currentState: Record<string, unknown>,
        formData: FormData
    ) => {
        setIsSubmitting(true)
        const fullName = formData.get("full_name") as string
        const phoneValue = normalizePhoneForSave(formData.get("phone") as string)

        try {
            // Only include fields supported by Medusa 2.0 Store API
            const payload: any = {
                first_name: fullName.split(" ")[0],
                last_name: fullName.split(" ").slice(1).join(" ") || ".",
                phone: phoneValue,
            }

            await updateCustomer(payload)
            setIsSubmitting(false)
            // If phone is changed, it's no longer verified
            if (phoneDigits(phoneValue) !== phoneDigits(customer.phone || "")) {
                setPhoneVerified(false)
            }
            setPhone(phoneValue.replace(/^\+/, ""))
            return { success: true, error: null }
        } catch (error: any) {
            setIsSubmitting(false)
            return { success: false, error: error.toString() }
        }
    }

    const [state, formAction] = useActionState(updateProfile, {
        error: null,
        success: false,
    })

    useEffect(() => {
        if (state.success) {
            setSuccessState(true)
            const timer = setTimeout(() => setSuccessState(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [state.success])

    const fullName = formatCustomerDisplayName(
        customer.first_name,
        customer.last_name
    )

    const isPhoneInputValid = phoneDigits(phone).length >= 10

    const ensurePhoneSavedForVerification = async (): Promise<boolean> => {
        const normalizedPhone = normalizePhoneForSave(phone)
        if (!normalizedPhone || phoneDigits(normalizedPhone).length < 10) {
            setPhoneFieldError("Please enter a valid 10-digit mobile number.")
            return false
        }

        if (phoneDigits(normalizedPhone) === phoneDigits(customer.phone || "")) {
            return true
        }

        try {
            await updateCustomer({ phone: normalizedPhone })
            return true
        } catch (error: unknown) {
            setPhoneFieldError(
                error instanceof Error
                    ? error.message
                    : "Failed to save mobile number. Please try again."
            )
            return false
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImageError(null)
        if (!file.type.startsWith("image/")) {
            setImageError("Please select an image file")
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setImageError("Please upload an image smaller than 5MB")
            return
        }

        setIsUploadingImage(true)
        try {
            const formData = new FormData()
            formData.append("image", file)
            const result = await uploadProfileImage(formData)
            if (result.success) {
                window.location.reload()
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            alert(error.message || "Failed to upload image")
            setImagePreview(getProfileImageUrl(customer))
        } finally {
            setIsUploadingImage(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleImageDelete = async () => {
        if (!hasUploadedImage || isDeletingImage || isUploadingImage) return

        setImageError(null)
        setIsDeletingImage(true)
        try {
            const existingMetadata =
                (customer.metadata as Record<string, any> | undefined) || {}
            // Empty string clears the photo via existing updateCustomer — no new API
            await updateCustomer({
                metadata: {
                    ...existingMetadata,
                    profile_image_url: "",
                },
            })
            setHasUploadedImage(false)
            setIsRemovePhotoModalOpen(false)
            setImagePreview(getProfileImageUrl({
                ...customer,
                metadata: { ...existingMetadata, profile_image_url: "" },
            }, accentHex))
            window.location.reload()
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to remove image"
            setImageError(message)
            alert(message)
        } finally {
            setIsDeletingImage(false)
        }
    }

    const handleSendOtp = async (type: "email_verification" | "phone_verification" = "phone_verification") => {
        const setFieldError =
            type === "email_verification" ? setEmailFieldError : setPhoneFieldError

        if (type === "phone_verification") {
            setPhoneFieldError(null)
            if (!isPhoneInputValid) {
                setPhoneFieldError("Please enter a valid mobile number before verifying.")
                return
            }
            const saved = await ensurePhoneSavedForVerification()
            if (!saved) {
                return
            }
        } else {
            setEmailFieldError(null)
            if (!isEmailValid) {
                setEmailFieldError("Please enter a valid email address.")
                return
            }

            setIsSendingOtp(true)
            setOtpError(null)
            setOtpType("email_verification")

            try {
                if (needsEmailContactChange) {
                    const result = await requestContactChange({ email: normalizedEmail })
                    if (result.success && result.token) {
                        setOtpToken(result.token)
                        setEmailOtpMode("add_or_change")
                        setShowOtpInput(true)
                        setFieldError(null)
                    } else {
                        const message = result.error || "Failed to send OTP"
                        setOtpError(message)
                        setFieldError(message)
                    }
                } else {
                    const result = await sendCustomerOTP(customer.id, type)
                    if (result.success && result.token) {
                        setOtpToken(result.token)
                        setEmailOtpMode("verify_existing")
                        setShowOtpInput(true)
                        setFieldError(null)
                    } else {
                        const message = result.error || "Failed to send OTP"
                        setOtpError(message)
                        setFieldError(message)
                    }
                }
            } catch (err: unknown) {
                if (isNextRedirectError(err)) throw err
                const message = safeErrorMessage(err, "An error occurred while sending OTP")
                setOtpError(message)
                setFieldError(message)
            } finally {
                setIsSendingOtp(false)
            }
            return
        }

        setIsSendingOtp(true)
        setOtpError(null)
        setOtpType(type)
        try {
            const result = await sendCustomerOTP(customer.id, type)
            if (result.success && result.token) {
                setOtpToken(result.token)
                setShowOtpInput(true)
                setFieldError(null)
            } else {
                const message = result.error || "Failed to send OTP"
                setOtpError(message)
                setFieldError(message)
            }
        } catch (err: unknown) {
            if (isNextRedirectError(err)) throw err
            const message = safeErrorMessage(err, "An error occurred while sending OTP")
            setOtpError(message)
            setFieldError(message)
        } finally {
            setIsSendingOtp(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!otpToken || !otpCode) return

        setIsVerifying(true)
        setOtpError(null)
        try {
            if (otpType === "email_verification" && emailOtpMode === "add_or_change") {
                const result = await verifyContactChange(otpToken, otpCode)
                if (result.success) {
                    setEmailVerified(true)
                    setShowOtpInput(false)
                    setSuccessState(true)
                    window.location.reload()
                } else {
                    setOtpError(result.error || "Invalid OTP")
                }
                return
            }

            const result = await verifyCustomerOTP(otpToken, otpCode)
            if (result.success) {
                // Update local state
                if (otpType === "phone_verification") {
                    setPhoneVerified(true)
                } else {
                    setEmailVerified(true)
                }

                // Persist verification status in metadata
                const newMetadata = {
                    ...(customer.metadata as Record<string, any> || {}),
                    [otpType === "phone_verification" ? "phone_verified" : "email_verified"]: true
                }
                await updateCustomer({ metadata: newMetadata })

                setShowOtpInput(false)
                setSuccessState(true)
                // Reload to fetch updated metadata and ensure consistency
                window.location.reload()
            } else {
                setOtpError(result.error || "Invalid OTP")
            }
        } catch (err: any) {
            if (isNextRedirectError(err)) throw err
            setOtpError(safeErrorMessage(err, "An error occurred"))
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="account-profile-form account-profile-form--modern">
            <form action={formAction} className="account-profile-form__form">
                <div className="account-profile-form__hero">
                    <div className="account-profile-form__avatar-wrap">
                        <div className="account-profile-form__avatar-image">
                            <img
                                src={imagePreview}
                                alt="Profile"
                                className="account-profile-form__avatar-photo"
                            />
                        </div>
                        {hasUploadedImage ? (
                            <button
                                type="button"
                                onClick={() => setIsRemovePhotoModalOpen(true)}
                                disabled={isDeletingImage || isUploadingImage}
                                className="account-profile-form__avatar-edit"
                                aria-label="Remove profile photo"
                            >
                                {isDeletingImage ? (
                                    <div className="account-profile-form__avatar-spinner" />
                                ) : (
                                    <svg
                                        className="account-profile-form__avatar-remove-icon"
                                        viewBox="0 0 24 24"
                                        width={14}
                                        height={14}
                                        aria-hidden="true"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 6h18" />
                                        <path d="M8 6V4h8v2" />
                                        <path d="M19 6l-1 14H6L5 6" />
                                        <path d="M10 11v6" />
                                        <path d="M14 11v6" />
                                    </svg>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingImage || isDeletingImage}
                                className="account-profile-form__avatar-edit"
                                aria-label="Upload profile photo"
                            >
                                {isUploadingImage ? (
                                    <div className="account-profile-form__avatar-spinner" />
                                ) : (
                                    <img
                                        src="/icon/edit.png"
                                        alt=""
                                        className="account-profile-form__avatar-edit-icon"
                                        width={18}
                                        height={18}
                                    />
                                )}
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                    <div className="account-profile-form__hero-info">
                        <h3 className="account-profile-form__hero-name">
                            {fullName || "Your Profile"}
                        </h3>
                        {customer.email && (
                            <p className="account-profile-form__hero-email">{customer.email}</p>
                        )}
                        <div className="account-profile-form__hero-badges">
                            <span
                                className={`account-profile-form__pill ${phoneVerified ? "account-profile-form__pill--ok" : "account-profile-form__pill--pending"}`}
                            >
                                {phoneVerified ? "Mobile Verified" : "Mobile Unverified"}
                            </span>
                            <span
                                className={`account-profile-form__pill ${emailVerified ? "account-profile-form__pill--ok" : "account-profile-form__pill--pending"}`}
                            >
                                {emailVerified ? "Email Verified" : "Email Unverified"}
                            </span>
                        </div>
                        <p className="account-profile-form__hint">
                            {hasUploadedImage
                                ? "Tap the trash icon to remove your photo."
                                : "Please upload an image smaller than 5MB."}
                        </p>
                        {imageError && (
                            <p className="account-profile-form__error">{imageError}</p>
                        )}
                    </div>
                </div>

                <div className="account-profile-form__card">
                    <div className="account-profile-form__card-head">
                        <h4 className="account-profile-form__card-title">Personal Information</h4>
                        <p className="account-profile-form__card-sub">
                            Manage your name and contact details
                        </p>
                    </div>

                <div className="account-profile-form__grid">
                    <div className="account-profile-form__field">
                        <label className="account-profile-form__label">
                            Full Name<span className="account-profile-form__required">*</span>
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            required
                            defaultValue={fullName}
                            className="account-profile-form__input"
                        />
                    </div>
                    <div className="account-profile-form__field">
                        <label className="account-profile-form__label">
                            Mobile Number<span className="account-profile-form__required">*</span>
                        </label>
                        <div className="account-profile-form__contact-row">
                            <div className="account-profile-form__phone account-profile-form__phone--with-action">
                                <PhoneInput
                                    country={"in"}
                                    value={phone}
                                    onChange={(value) => {
                                        setPhone(value)
                                        setPhoneFieldError(null)
                                        const cleanedValue = phoneDigits(value)
                                        const cleanedCustomerPhone = phoneDigits(customer.phone || "")
                                        if (cleanedValue && cleanedValue !== cleanedCustomerPhone) {
                                            setPhoneVerified(false)
                                        }
                                    }}
                                    inputProps={{
                                        name: "phone",
                                        required: true
                                    }}
                                    inputStyle={{
                                        width: "100%",
                                        height: "46px",
                                        fontSize: "14px",
                                        paddingLeft: "52px",
                                        borderRadius: "10px",
                                        border: "1px solid #e5e5e5",
                                        backgroundColor: "#ffffff",
                                        transition: "all 0.2s",
                                        color: "#1a1a1a"
                                    }}
                                    buttonStyle={{
                                        backgroundColor: "transparent",
                                        border: "none",
                                        borderRadius: "10px 0 0 10px",
                                        paddingLeft: "8px"
                                    }}
                                    containerStyle={{
                                        width: "100%",
                                        height: "46px"
                                    }}
                                    dropdownStyle={{
                                        width: "280px",
                                        borderRadius: "10px",
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                                    }}
                                />
                            </div>
                            {phoneVerified ? (
                                <div className="account-profile-form__verified" aria-label="Phone verified">
                                    <span className="account-profile-form__verified-check" aria-hidden="true" />
                                    <span>Verified</span>
                                </div>
                            ) : isPhoneInputValid ? (
                                <button
                                    type="button"
                                    onClick={() => handleSendOtp("phone_verification")}
                                    disabled={isSendingOtp}
                                    className="account-profile-form__verify-action"
                                    aria-label="Verify phone number"
                                >
                                    {isSendingOtp && otpType === "phone_verification" ? "Sending..." : "Verify"}
                                </button>
                            ) : null}
                        </div>
                        {phoneFieldError && (
                            <p className="account-profile-form__error">{phoneFieldError}</p>
                        )}
                        {!phoneVerified && isPhoneInputValid && !showOtpInput && (
                            <p className="account-profile-form__verify-hint">
                                Tap <strong>Verify</strong> to get an OTP on this number.
                            </p>
                        )}
                    </div>
                </div>

                {showOtpInput && (
                    <div className="account-profile-form__otp">
                        <div className="account-profile-form__otp-header">
                            <div className="account-profile-form__otp-copy">
                                <span className="account-profile-form__otp-title">
                                    Enter OTP
                                </span>
                                <p className="account-profile-form__otp-sub">
                                    {otpType === "email_verification"
                                        ? `Code sent to ${email.trim() || customer.email}`
                                        : `Code sent to +${phoneDigits(phone)}`}
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowOtpInput(false)} className="account-profile-form__otp-cancel">Cancel</button>
                        </div>
                        <div className="account-profile-form__otp-row">
                            <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder="• • • • • •"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                                className="account-profile-form__input account-profile-form__otp-input"
                            />
                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={isVerifying || otpCode.length < 6}
                                className="account-dashboard__btn account-dashboard__btn--primary account-profile-form__otp-submit"
                            >
                                {isVerifying ? "Checking..." : "Confirm"}
                            </button>
                        </div>
                        {otpError && <p className="account-profile-form__error">{otpError}</p>}
                    </div>
                )}

                <div className="account-profile-form__field">
                    <label className="account-profile-form__label">
                        Email
                        {canEditEmail && (
                            <span className="account-profile-form__required">*</span>
                        )}
                    </label>
                    <div className="account-profile-form__contact-row">
                        <input
                            type="email"
                            name="email"
                            value={email}
                            readOnly={!canEditEmail}
                            required={canEditEmail}
                            placeholder={
                                canEditEmail
                                    ? "Enter your email to verify"
                                    : undefined
                            }
                            onChange={(e) => {
                                if (!canEditEmail) return
                                setEmail(e.target.value)
                                setEmailFieldError(null)
                                setEmailVerified(false)
                                if (showOtpInput && otpType === "email_verification") {
                                    setShowOtpInput(false)
                                    setOtpCode("")
                                    setOtpToken(null)
                                }
                            }}
                            className={
                                canEditEmail
                                    ? "account-profile-form__input"
                                    : "account-profile-form__input account-profile-form__input--readonly"
                            }
                        />
                        {emailVerified ? (
                            <div className="account-profile-form__verified" aria-label="Email verified">
                                <span className="account-profile-form__verified-check" aria-hidden="true" />
                                <span>Verified</span>
                            </div>
                        ) : isEmailValid ? (
                            <button
                                type="button"
                                onClick={() => handleSendOtp("email_verification")}
                                disabled={isSendingOtp}
                                className="account-profile-form__verify-action"
                                aria-label="Verify email address"
                            >
                                {isSendingOtp && otpType === "email_verification" ? "Sending..." : "Verify"}
                            </button>
                        ) : null}
                    </div>
                    {emailFieldError && (
                        <p className="account-profile-form__error">{emailFieldError}</p>
                    )}
                    {!emailVerified && isEmailValid && !showOtpInput && (
                        <p className="account-profile-form__verify-hint">
                            {needsEmailContactChange
                                ? "Enter your email, then tap Verify to receive a confirmation code."
                                : "Tap Verify to receive a confirmation code."}
                        </p>
                    )}
                    {canEditEmail && !isEmailValid && (
                        <p className="account-profile-form__verify-hint">
                            Add an email address so we can verify your account.
                        </p>
                    )}
                </div>
                </div>

                <div className="account-profile-form__actions">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="account-dashboard__btn account-dashboard__btn--primary account-profile-form__save"
                    >
                        {isSubmitting ? "Saving..." : "Save Profile Details"}
                    </button>
                </div>

                {state.error && (
                    <p className="account-profile-form__error-text">
                        {state.error}
                    </p>
                )}
                {successState && (
                    <p className="account-profile-form__success-text">
                        Profile updated successfully.
                    </p>
                )}

                <div className="account-profile-form__danger">
                    <div className="account-profile-form__danger-copy">
                        <h4 className="account-profile-form__danger-title">Delete Account</h4>
                        <p className="account-profile-form__danger-sub">
                            Permanently remove your account and all associated data.
                        </p>
                    </div>
                    <div className="account-profile-form__delete">
                        <AccountDeletion customerEmail={customer.email} hideHeader={true} />
                    </div>
                </div>
            </form>

            <RemovePhotoModal
                isOpen={isRemovePhotoModalOpen}
                close={() => {
                    if (!isDeletingImage) {
                        setIsRemovePhotoModalOpen(false)
                    }
                }}
                onConfirm={handleImageDelete}
                isRemoving={isDeletingImage}
            />
        </div>
    )
}

export default ProfileForm
