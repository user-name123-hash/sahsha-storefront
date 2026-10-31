"use client"

import { useState } from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { submitContactRequest } from "@core/data/contact"
import { trackFormSubmit } from "@core/analytics/ga4-events"
import ObfuscatedEmail from "@modules/common/components/obfuscated-email"
import { clx } from "@medusajs/ui"

interface ContactDetails {
  phone: string
  email: string
  address: string
}

interface ContactTemplateProps {
  countryCode: string
  contactInfo?: ContactDetails | null
}

const HELP_TOPICS = [
  "Order & Payment queries",
  "Shipping & Tracking",
  "Returns & Exchanges",
  "Product queries",
  "Feedback & Complaints",
] as const

const QUICK_LINKS = [
  { href: "/help", title: "FAQs" },
  { href: "/returns-refund-policy", title: "Returns & Refunds Policy" },
  { href: "/account/orders", title: "Track Your Order" },
] as const

function buildTelLink(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (phone.trim().startsWith("+")) {
    return phone.replace(/\s+/g, "")
  }
  if (digits.startsWith("91") && digits.length >= 12) {
    return `+${digits}`
  }
  return `+91${digits}`
}

const ContactTemplate = ({ contactInfo }: ContactTemplateProps) => {
  const contactDetails: ContactDetails = {
    phone: contactInfo?.phone?.trim() || "",
    email: contactInfo?.email?.trim() || "",
    address: contactInfo?.address?.trim() || "",
  }

  const telLink = buildTelLink(contactDetails.phone)

  const [formData, setFormData] = useState({
    name: "",
    order_id: "",
    email: "",
    phone: "",
    topic: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitSuccess(false)
    setSubmitError(null)

    try {
      const result = await submitContactRequest({
        email: formData.email,
        payload: {
          full_name: formData.name,
          order_id: formData.order_id,
          phone: formData.phone,
          topic: formData.topic || "general_inquiry",
          message: formData.message,
        },
        metadata: { source_page: "contact" },
        source: "storefront",
      })

      if (result.success) {
        trackFormSubmit({ form_type: "contact_us_form" })
        setSubmitSuccess(true)
        setFormData({ name: "", order_id: "", email: "", phone: "", topic: "", message: "" })
        setTimeout(() => setSubmitSuccess(false), 5000)
      } else {
        setSubmitError(result.error || "Failed to submit contact request. Please try again.")
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="contact-page about-page min-h-screen">
      <div className="contact-page__inner about-page__container">
        <nav className="about-page__breadcrumb" aria-label="Breadcrumb">
          <LocalizedClientLink href="/">Home</LocalizedClientLink>
          <span aria-hidden>/</span>
          <span>Contact Us</span>
        </nav>

        <header className="policy-doc-page__hero contact-page__hero">
          <p className="policy-doc-page__eyebrow">Get in touch</p>
          <h1 className="policy-doc-page__title">
            Contact <span className="policy-doc-page__title-accent">Us</span>
          </h1>
        </header>

        <p className="contact-page__intro">
          We&apos;d love to hear from you. Whether you have a question about your order, need help
          with a return, or simply want to know more about our collections — our team is here to
          help.
        </p>

        <section
          className={`contact-page__cards${
            contactDetails.email && contactDetails.phone
              ? " contact-page__cards--two"
              : ""
          }`}
          aria-label="Contact details"
        >
          {contactDetails.email ? (
            <article className="contact-page__card">
              <div className="contact-page__card-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="contact-page__card-title">Email</h2>
              <ObfuscatedEmail email={contactDetails.email} className="contact-page__card-value" />
              <p className="contact-page__card-note">
                We typically respond within 24 business hours.
              </p>
            </article>
          ) : null}

          {contactDetails.phone ? (
            <article className="contact-page__card">
              <div className="contact-page__card-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h2 className="contact-page__card-title">Phone</h2>
              <a href={`tel:${telLink}`} className="contact-page__card-value">
                {contactDetails.phone}
              </a>
              <p className="contact-page__card-note">
                Available Monday to Saturday, 10:00 AM – 8:00 PM IST
              </p>
            </article>
          ) : null}
        </section>

        <div className="contact-page__main">
          <aside className="contact-page__aside">
            <section className="contact-page__panel contact-page__panel--highlight">
              <h2 className="contact-page__panel-title">What Can We Help You With?</h2>
              <ul className="contact-page__topics">
                {HELP_TOPICS.map((title) => (
                  <li key={title} className="contact-page__topic">
                    <span className="contact-page__topic-dot" aria-hidden>
                      •
                    </span>
                    <p>{title}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="contact-page__panel">
              <h2 className="contact-page__panel-title">Before You Reach Out</h2>
              <p className="contact-page__panel-lead">You may find a quick answer in our:</p>
              <div className="contact-page__resource-cards">
                {QUICK_LINKS.map((link) => (
                  <LocalizedClientLink
                    key={link.href}
                    href={link.href}
                    className="contact-page__resource-card"
                  >
                    <span className="contact-page__resource-card-title">{link.title}</span>
                  </LocalizedClientLink>
                ))}
              </div>
            </section>
          </aside>

          <section className="contact-page__form-section" aria-labelledby="contact-form-title">
            <div className="contact-page__form-card">
              <div className="contact-page__form-intro">
                <Image
                  src="/d71c8d0f-58b8-4eb0-9c62-c446c32bb2ac.png"
                  alt=""
                  width={320}
                  height={193}
                  sizes="(max-width: 640px) 7.75rem, 10rem"
                  quality={75}
                  className="contact-page__form-intro-image"
                />
                <div className="contact-page__form-intro-copy">
                  <p className="contact-page__form-intro-badge">We are here to help!</p>
                  <h2 id="contact-form-title" className="contact-page__form-title">
                    Write To Us
                  </h2>
                  <p className="contact-page__form-lead">
                    Prefer to put it in writing? Use the form below and we&apos;ll get back to you
                    within 24 business hours.
                  </p>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="contact-page__form">
                <div className="contact-page__form-row">
                  <div className="contact-page__field">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      className="contact-page__input"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="contact-page__field">
                    <label htmlFor="order_id">Order ID (Optional)</label>
                    <input
                      type="text"
                      id="order_id"
                      name="order_id"
                      value={formData.order_id}
                      onChange={handleFormChange}
                      className="contact-page__input"
                      placeholder="E.g. #12345"
                    />
                  </div>
                </div>

                <div className="contact-page__form-row">
                  <div className="contact-page__field">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      className="contact-page__input"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="contact-page__field">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      required
                      className="contact-page__input"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="contact-page__field">
                  <label htmlFor="topic">Subject *</label>
                  <select
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleFormChange}
                    required
                    className="contact-page__input"
                  >
                    <option value="">Select a subject</option>
                    <option value="general_inquiry">General Inquiry</option>
                    <option value="order_delivery_issue">Shipping &amp; Tracking</option>
                    <option value="returns_refunds">Returns &amp; Exchanges</option>
                    <option value="product_inquiry">Product Query</option>
                    <option value="payment_billing">Order &amp; Payment</option>
                    <option value="account_login">Account &amp; Login</option>
                  </select>
                </div>

                <div className="contact-page__field contact-page__field--grow">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    required
                    rows={5}
                    className={clx("contact-page__input", "contact-page__input--textarea")}
                    placeholder="How can we help you?"
                  />
                </div>

                {submitSuccess && (
                  <div className="contact-page__alert contact-page__alert--success" role="status">
                    Thank you for contacting us! We&apos;ll get back to you within 24 business
                    hours.
                  </div>
                )}
                {submitError && (
                  <div className="contact-page__alert contact-page__alert--error" role="alert">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-ga-event="contact_form_submit"
                  data-ga-label="Contact Us Form"
                  className={clx(
                    "contact-page__submit",
                    submitSuccess && "contact-page__submit--success"
                  )}
                >
                  {isSubmitting ? "Submitting..." : submitSuccess ? "Submitted!" : "Send Message"}
                </button>
              </form>

              <p className="contact-page__form-closing">
                We&apos;re committed to resolving every query with care. Thank you for choosing
                SAHSHA.
              </p>
            </div>
          </section>
        </div>

        {contactDetails.address ? (
          <p className="contact-page__address-line">
            <strong>Registered Business Address:</strong> {contactDetails.address} — Please note
            this is our registered business address and not a retail store. Walk-in visits are not
            accepted.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default ContactTemplate
