"use client"

import { useState } from "react"
import { subscribeToNewsletter } from "@core/data/newsletter"
import { trackFormSubmit } from "@core/analytics/ga4-events"

const FooterNewsletter = () => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid email address" })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await subscribeToNewsletter(email)

      if (result.success) {
        trackFormSubmit({ form_type: "footer_newsletter_subscribe" })

        setMessage({ type: "success", text: result.message })
        setEmail("")
        setTimeout(() => {
          setMessage(null)
        }, 3000)
      } else {
        setMessage({ type: "error", text: result.message })
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: "Something went wrong. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="footer-newsletter">
      <form onSubmit={handleSubmit} className="footer-newsletter__form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="footer-newsletter__input"
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          data-ga-event="newsletter_subscribe"
          data-ga-label="Footer Newsletter"
          className="footer-newsletter__submit"
        >
          {isSubmitting ? "..." : "Subscribe"}
        </button>
      </form>
      {message && (
        <p
          className={`footer-newsletter__message ${
            message.type === "success"
              ? "footer-newsletter__message--success"
              : "footer-newsletter__message--error"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}

export default FooterNewsletter
