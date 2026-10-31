"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { completePasswordReset } from "@core/data/customer-registration"
import ErrorMessage from "@modules/checkout/components/error-message"
import Lock from "@modules/common/icons/lock"
import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"
import Envelope from "@modules/common/icons/envelope"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const t = searchParams.get("token")
    const e = searchParams.get("email")
    if (t) setToken(t)
    if (e) setEmail(e)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      setError("Invalid or missing reset token.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await completePasswordReset({
        email,
        password,
        token,
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/account")
        }, 3000)
      } else {
        setError(result.error || "Failed to reset password")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-heading mb-2">
          Password Reset Successful
        </h1>
        <p className="text-muted mb-6">
          Your password has been reset successfully. Redirecting you to login...
        </p>
        <button
          onClick={() => router.push("/account")}
          className="w-full py-3 account-btn-primary font-bold rounded-full"
        >
          Go to Login
        </button>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-heading mb-2">Invalid Link</h1>
        <p className="text-muted mb-6">
          This password reset link is invalid or has expired.
        </p>
        <button
          onClick={() => router.push("/account")}
          className="w-full py-3 account-btn-primary font-bold rounded-full"
        >
          Return to Login
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg p-8">
      <h1 className="text-2xl font-bold text-heading mb-2 text-center">
        Reset Password
      </h1>
      <p className="text-muted mb-8 text-center">
        Enter your email and a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Envelope size="20" color="#9CA3AF" />
            </div>
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm account-input rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size="20" color="#9CA3AF" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3 text-sm account-input rounded-full"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-heading"
            >
              {showPassword ? <EyeOff size="20" /> : <Eye size="20" />}
            </button>
          </div>
        </div>

        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size="20" color="#9CA3AF" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3 text-sm account-input rounded-full"
            />
          </div>
        </div>

        <ErrorMessage error={error} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 account-btn-primary font-bold rounded-full"
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-bg px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-surface rounded-2xl shadow-lg p-8 text-center">
            <p>Loading...</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
