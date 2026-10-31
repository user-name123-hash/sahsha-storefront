"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { submitContactRequest } from "@core/data/contact"
import { trackFormSubmit } from "@core/analytics/ga4-events"
import ObfuscatedEmail from "@modules/common/components/obfuscated-email"

interface ContactDetails {
  phone: string
  email: string
  address: string
}

interface FaqCategory {
  category: string
  items: Array<{ q: string; a: string }>
}

interface HelpTemplateProps {
  countryCode: string
  contactInfo?: ContactDetails | null
  dynamicFaqs?: FaqCategory[] | null
}

function trimOrEmpty(value?: string | null): string {
  return value?.trim() || ""
}

/** Icon for admin FAQ categories (dynamic config has no icon field). */
function categoryIcon(category: string): string {
  const c = category.toLowerCase()
  if (c.includes("order") || c.includes("payment")) return "🧾"
  if (c.includes("ship") || c.includes("deliver")) return "🚚"
  if (c.includes("return") || c.includes("refund") || c.includes("exchange")) return "📦"
  if (c.includes("product")) return "👗"
  if (c.includes("account")) return "👤"
  return "❓"
}

const HelpTemplate = ({ countryCode, contactInfo, dynamicFaqs }: HelpTemplateProps) => {
  // Admin homepage-config only — no hardcoded FAQ/contact brand fallbacks
  const faqsToDisplay: FaqCategory[] = dynamicFaqs && dynamicFaqs.length > 0 ? dynamicFaqs : []

  const [activeTab, setActiveTab] = useState(0)
  const [openFaq, setOpenFaq] = useState<string | null>("item-0")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ catIndex: number; catName: string; q: string; a: string; itemIndex: number }> | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [heroVisible, setHeroVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  const contactDetails: ContactDetails = {
    phone: trimOrEmpty(contactInfo?.phone),
    email: trimOrEmpty(contactInfo?.email),
    address: trimOrEmpty(contactInfo?.address),
  }

  const [formData, setFormData] = useState({ name: "", email: "", topic: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    const lower = value.toLowerCase()
    const results: typeof searchResults = []
    faqsToDisplay.forEach((cat, catIndex) => {
      cat.items.forEach((item, itemIndex) => {
        if (item.q.toLowerCase().includes(lower) || item.a.toLowerCase().includes(lower)) {
          results!.push({ catIndex, catName: cat.category, q: item.q, a: item.a, itemIndex })
        }
      })
    })
    setSearchResults(results)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        payload: { full_name: formData.name, topic: formData.topic || "general_inquiry", message: formData.message },
        metadata: { source_page: "help" },
        source: "storefront",
      })
      if (result.success) {
        trackFormSubmit({ form_type: "help_contact_form" })
        setSubmitSuccess(true)
        setFormData({ name: "", email: "", topic: "", message: "" })
        setTimeout(() => setSubmitSuccess(false), 5000)
      } else {
        setSubmitError(result.error || "Failed to submit request. Please try again.")
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasFaqs = faqsToDisplay.length > 0
  const currentCategory = hasFaqs
    ? faqsToDisplay[activeTab] || faqsToDisplay[0]
    : null
  const contactCards: Array<{
    icon: ReactNode
    label: string
    value: ReactNode
    sub: string
  }> = [
    ...(contactDetails.phone
      ? [
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            ),
            label: "Call Us",
            value: contactDetails.phone,
            sub: "Mon–Sat, 9am – 6pm IST",
          },
        ]
      : []),
    ...(contactDetails.email
      ? [
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            ),
            label: "Email Us",
            value: (
              <ObfuscatedEmail
                email={contactDetails.email}
                className="hover:text-brand-accent transition-colors"
              />
            ),
            sub: "We'll reply within 24 hours",
          },
        ]
      : []),
    ...(contactDetails.address
      ? [
          {
            icon: (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ),
            label: "Our Store",
            value: contactDetails.address,
            sub: "Visit us anytime",
          },
        ]
      : []),
  ]

  return (
    <div className="help-page page-surface pb-20">
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(6deg); }
        }
        @keyframes float-med {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-4deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.08); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes accordion-open {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-med { animation: float-med 4.5s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-slide-up { animation: slide-up 0.6s ease forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease forwards; }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

        .hero-visible .hero-tag { animation: slide-up 0.5s 0.1s ease both; }
        .hero-visible .hero-title { animation: slide-up 0.5s 0.25s ease both; }
        .hero-visible .hero-sub { animation: slide-up 0.5s 0.4s ease both; }
        .hero-visible .hero-search { animation: slide-up 0.5s 0.55s ease both; }

        .faq-tab { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .faq-tab.active { box-shadow: 0 4px 20px rgba(var(--color-brand-accent-rgb), 0.3); }

        .accordion-content {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          opacity: 0;
        }
        .accordion-content.open {
          grid-template-rows: 1fr;
          opacity: 1;
        }
        .accordion-inner { overflow: hidden; }

        .stat-card:hover .stat-icon { transform: scale(1.2) rotate(8deg); }
        .stat-icon { transition: transform 0.3s cubic-bezier(0.175,0.885,0.32,1.275); }

        .contact-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }

        .shimmer-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
          transform: translateX(-100%);
          transition: none;
        }
        .shimmer-btn:hover::after { animation: shimmer 1.5s ease infinite; }
      `}</style>

      {/* ── HERO SECTION ── */}
      <div
        ref={heroRef}
        className={`relative overflow-hidden pb-12 pt-16 md:pt-24 md:pb-16 ${heroVisible ? "hero-visible" : ""}`}
      >
        {/* Animated blobs (Soft Light Theme) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-pulse-glow absolute top-[-15%] left-[-8%] w-80 h-80 rounded-full help-accent-glow" />
          <div className="animate-pulse-glow absolute bottom-[-20%] right-[-10%] w-[450px] h-[450px] rounded-full help-accent-glow" style={{ animationDelay: "1.5s" }} />
          <div className="animate-float-slow absolute top-[12%] right-[8%] w-20 h-20 rounded-3xl opacity-50 bg-brand-accent-muted/50 backdrop-blur-sm" />
          <div className="animate-float-med absolute top-[30%] left-[6%] w-12 h-12 rounded-2xl opacity-60 bg-brand-accent-muted/40" style={{ animationDelay: "1s" }} />
          <div className="animate-float-slow absolute bottom-[25%] right-[18%] w-8 h-8 rounded-xl opacity-70 bg-brand-accent-muted/50" style={{ animationDelay: "2s" }} />
          <div className="absolute top-8 right-12 opacity-30 help-dot-pattern" style={{ backgroundSize: "20px 20px", width: "160px", height: "120px" }} />
          <div className="absolute bottom-12 left-10 opacity-20 help-dot-pattern-sm" style={{ backgroundSize: "16px 16px", width: "100px", height: "80px" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <span className="hero-tag help-page__eyebrow mb-7 opacity-0">
            <span className="help-page__eyebrow-dot animate-pulse" />
            Support Center — We&apos;re here to help
          </span>

          <h1 className="hero-title help-page__title mb-6 opacity-0">
            How can we{" "}
            <span className="help-page__title-accent">help you</span>
            {" "}today?
          </h1>

          <p className="hero-sub help-page__lead max-w-2xl mx-auto mb-4 opacity-0">
            Find answers to common questions, or reach out to our friendly support team. We&apos;re committed to making every Sahsha experience magical! ✨
          </p>

        </div>
      </div>

      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8">



        {/* ── FAQ SECTION ── */}
        <div id="faq-section" className="mb-20">
          {/* Section Header */}
          <div className="text-center mb-10">
            <span className="help-page__eyebrow mb-4">
              Knowledge Base
            </span>
            <h2 className="help-page__section-title mb-4">
              Frequently Asked{" "}
              <span className="help-page__title-accent">Questions</span>
            </h2>
            <p className="help-page__lead max-w-xl mx-auto">
              Browse through our most common questions — organized by topic for easy navigation.
            </p>
          </div>

          {/* Category Tabs */}
          {hasFaqs && currentCategory ? (
          <>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {faqsToDisplay.map((cat, i) => {
              const isActive = activeTab === i
              const icon = categoryIcon(cat.category)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setActiveTab(i); setOpenFaq("item-0") }}
                  className={`faq-tab flex items-center gap-2.5 py-3 px-5 rounded-2xl text-sm border transition-all ${
                    isActive
                      ? "active help-tab-active font-semibold"
                      : "text-body bg-surface border-[var(--color-border)] hover:border-brand-accent hover:text-brand-accent"
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {cat.category}
                </button>
              )
            })}
          </div>

          {/* FAQ Panel */}
          <div className="help-panel rounded-3xl overflow-hidden relative">
            <div className="help-panel-header px-6 md:px-10 py-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl help-btn-brand">
                {categoryIcon(currentCategory.category)}
              </div>
              <div>
                <h3 className="help-page__panel-title">{currentCategory.category}</h3>
                <p className="help-page__panel-meta">{currentCategory.items.length} questions answered</p>
              </div>
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {currentCategory.items.map((faq, idx) => {
                const id = `item-${idx}`
                const isOpen = openFaq === id
                return (
                  <div key={id} className={`help-page__faq-item group transition-colors duration-200 ${isOpen ? "help-faq-open" : "bg-surface hover:bg-surface-muted/60"}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : id)}
                      className="w-full flex items-center justify-between gap-4 px-6 md:px-10 py-5 md:py-6 text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-all duration-200 ${isOpen ? "help-accent-chip-open" : "help-accent-chip"}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className={`help-page__faq-question transition-colors ${isOpen ? "help-page__faq-question--open" : ""}`}>
                          {faq.q}
                        </span>
                      </div>
                      <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${isOpen ? "rotate-180 help-accent-chip-open" : "help-accent-chip"}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    <div className={`accordion-content ${isOpen ? "open" : ""}`}>
                      <div className="accordion-inner">
                        <div className="px-6 md:px-10 pb-6 pt-0 pl-[4.5rem] md:pl-[5.5rem]">
                          <div className="h-px w-full mb-4 help-accent-divider" />
                          <p className="help-page__faq-answer">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Panel Footer */}
            <div className="px-6 md:px-10 py-5 flex items-center justify-between flex-wrap gap-3 border-t border-[var(--color-border)] bg-brand-accent-muted/30">
              <p className="help-page__panel-meta text-sm">Still have questions? We&apos;re just a message away!</p>
              <button type="button"
                onClick={() => document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" })}
                className="py-2 px-5 rounded-xl text-sm font-bold help-btn-brand transition-all hover:-translate-y-0.5">
                Contact Support
              </button>
            </div>
          </div>
          </>
          ) : (
            <div className="help-panel rounded-3xl px-6 md:px-10 py-12 text-center">
              <p className="help-page__lead">
                FAQs will appear here once they are published in admin.
              </p>
              <button
                type="button"
                onClick={() => document.getElementById("contact-section")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-6 py-2 px-5 rounded-xl text-sm font-bold help-btn-brand transition-all hover:-translate-y-0.5"
              >
                Contact Support
              </button>
            </div>
          )}
        </div>

        {/* ── CONTACT SECTION ── */}
        <div id="contact-section" className="relative">
          {/* Glow backdrop */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-25 help-accent-glow blur-[60px]" />
          </div>

          <div className="text-center mb-12">
            <span className="help-page__eyebrow mb-4">
              Direct Support
            </span>
            <h2 className="help-page__section-title mb-4">
              Still need{" "}
              <span className="help-page__title-accent">help?</span>
            </h2>
            <p className="help-page__lead max-w-lg mx-auto">
              Our friendly support team is ready to assist you with anything, anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-stretch">

            {/* Left: Contact Info + Map */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Contact Cards — from admin contact-us config */}
              {contactCards.map((card, i) => (
                <div key={i} className="contact-card contact-card-themed flex items-center gap-4 p-5 rounded-2xl cursor-default hover:-translate-y-1">
                  <div className="help-page__contact-icon">
                    {card.icon}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="help-page__contact-label">{card.label}</p>
                    <div className="help-page__contact-value truncate">{card.value}</div>
                    <p className="help-page__contact-note">{card.sub}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-3xl overflow-hidden relative flex-grow help-panel"
                style={{ minHeight: "220px" }}>
                <div className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
                  style={{ boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.6)" }} />
                {contactDetails.address ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: "block" }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(contactDetails.address)}&output=embed`}
                    title="Sahsha Store Location"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-muted">
                    <p className="text-muted text-sm">Map unavailable</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="lg:col-span-7">
              <div className="relative help-panel rounded-3xl p-6 sm:p-8 md:p-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none bg-brand-accent-muted/40 rounded-bl-[6rem]" style={{ borderRadius: "0 1.5rem 0 6rem" }} />

                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center help-btn-brand">
                    <svg className="w-5 h-5 text-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="help-page__form-title">Send us a message</h3>
                    <p className="help-page__panel-meta">We typically respond within a few hours</p>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-5 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label htmlFor="help-name" className="help-page__form-label">
                        Full Name <span className="help-page__required">*</span>
                      </label>
                      <input
                        type="text" id="help-name" name="name"
                        value={formData.name} onChange={handleFormChange} required
                        placeholder="Your full name"
                        className="help-form-input form-input w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder:text-muted/60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="help-email" className="help-page__form-label">
                        Email Address <span className="help-page__required">*</span>
                      </label>
                      <input
                        type="email" id="help-email" name="email"
                        value={formData.email} onChange={handleFormChange} required
                        placeholder="you@example.com"
                        className="help-form-input form-input w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder:text-muted/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="help-topic" className="help-page__form-label">
                      Topic <span className="help-page__required">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="help-topic" name="topic"
                        value={formData.topic} onChange={handleFormChange} required
                        className="help-form-input form-input w-full px-4 py-3.5 rounded-xl text-sm font-medium appearance-none cursor-pointer"
                        style={{ color: formData.topic ? "var(--color-text-heading)" : "var(--color-text-muted)" }}
                      >
                        <option value="" disabled>Select a topic...</option>
                        <option value="general_inquiry">💬 General Inquiry (Information)</option>
                        <option value="order_delivery_issue">🚚 Order Issue / Delivery Issue (Order delay, tracking, delivery problem)</option>
                        <option value="returns_refunds">📦 Returns & Refunds (Return, exchange, refund related)</option>
                        <option value="product_inquiry">👗 Product Inquiry (Product details, size, availability)</option>
                        <option value="payment_billing">💳 Payment & Billing Issue (Payment failed, refund, invoice)</option>
                        <option value="account_login">👤 Account & Login Issue</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="help-message" className="help-page__form-label">
                      Your Message <span className="help-page__required">*</span>
                    </label>
                    <textarea
                      id="help-message" name="message"
                      value={formData.message} onChange={handleFormChange} required
                      rows={5}
                      placeholder="Please describe your question or issue in detail. The more context you provide, the faster we can help!"
                      className="help-form-input form-input w-full px-4 py-3.5 rounded-xl text-sm font-medium placeholder:text-muted/60 resize-none"
                    />
                  </div>

                  {/* Feedback Messages */}
                  {submitSuccess && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl animate-bounce-in"
                      style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)", border: "1px solid #bbf7d0" }}>
                      <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-green-800 font-bold text-sm">Message sent successfully! 🎉</p>
                        <p className="text-green-600 text-xs mt-0.5">Our team will get back to you within 24 hours.</p>
                      </div>
                    </div>
                  )}
                  {submitError && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl animate-bounce-in"
                      style={{ background: "linear-gradient(135deg, #fef2f2, #fee2e2)", border: "1px solid #fecaca" }}>
                      <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className="text-red-800 font-semibold text-sm">{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`shimmer-btn relative overflow-hidden w-full py-4 rounded-2xl text-inverse text-[15px] font-black tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 shadow-brand-sm ${submitSuccess ? "bg-green-500 hover:bg-green-600" : "help-btn-brand"}`}
                    style={submitSuccess ? undefined : { backgroundSize: "200% 100%" }}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending your message...
                      </>
                    ) : submitSuccess ? (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Message Sent!
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>

                  <p className="text-center help-page__panel-meta">
                    Your information is safe and never shared with third parties.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default HelpTemplate
