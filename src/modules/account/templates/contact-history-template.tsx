"use client"

import React, { useState } from "react"
import { Button } from "@medusajs/ui"
import { ContactRequest } from "@lib/data/contact"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ContactHistoryTemplateProps = {
  contactRequests: ContactRequest[]
}

const TOPIC_LABELS: Record<string, string> = {
  general_inquiry: "General Inquiry",
  order_delivery_issue: "Order / Delivery Issue",
  returns_refunds: "Returns & Refunds",
  product_inquiry: "Product Inquiry",
  payment_billing: "Payment & Billing",
  account_login: "Account & Login",
}

const formatDate = (dateString: string) => {
  if (!dateString) return "—"
  try {
    const date = new Date(dateString)
    const day = date.getDate()
    const month = date.toLocaleDateString("en-US", { month: "short" })
    const weekday = date.toLocaleDateString("en-US", { weekday: "short" })
    return `${weekday}, ${day} ${month}`
  } catch {
    return "—"
  }
}

const formatTopic = (topic: string) => {
  if (!topic) return "General Inquiry"
  if (TOPIC_LABELS[topic]) return TOPIC_LABELS[topic]
  return topic
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

type StatusConfig = {
  label: string
  modifier: string
  iconSrc: string | null
}

const getStatusConfig = (
  status: string,
  hasResponses: boolean
): StatusConfig => {
  const s = status?.toLowerCase() || "pending"

  if (s === "resolved" || s === "replied" || s === "closed") {
    return {
      label: s === "closed" ? "Closed" : "Resolved",
      modifier: "delivered",
      iconSrc: "/receive.png",
    }
  }

  if (s === "in_progress") {
    return {
      label: "In Progress",
      modifier: "shipped",
      iconSrc: "/time-left.png",
    }
  }

  if (hasResponses) {
    return {
      label: "Reply Received",
      modifier: "out-for-delivery",
      iconSrc: "/receive.png",
    }
  }

  return {
    label: "Awaiting Reply",
    modifier: "return-requested",
    iconSrc: "/time-left.png",
  }
}

const collectResponses = (request: ContactRequest) => {
  const directReply =
    request.reply ||
    request.reply_comment ||
    request.response ||
    request.metadata?.reply ||
    request.metadata?.response
  const directImages: string[] =
    request.reply_images || request.metadata?.images || []
  const comments = [...(request.comments || [])]

  if (request.status_history) {
    request.status_history.forEach((h: any) => {
      if (
        h.comment &&
        !comments.find(
          (c) => (c.comment || (c as any).content) === h.comment
        )
      ) {
        comments.push({
          id: h.id || Math.random().toString(),
          comment: h.comment,
          images: h.images || [],
          created_at: h.changed_at,
        })
      }
    })
  }

  const sortedComments = [...comments].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  const commentReplies = sortedComments.filter(
    (c) => c.comment || (c as any).content || c.images?.length
  )

  return {
    directReply,
    directImages,
    sortedComments,
    hasResponses: Boolean(
      directReply || commentReplies.length || directImages.length
    ),
  }
}

const ContactHistoryTemplate: React.FC<ContactHistoryTemplateProps> = ({
  contactRequests,
}) => {
  const count = contactRequests?.length || 0

  if (!count) {
    return (
      <div
        className="account-orders-page__empty"
        data-testid="no-contact-history-container"
      >
        <img
          src="/chat.png"
          alt=""
          className="account-orders-page__empty-icon-img"
          width={140}
          height={140}
        />
        <h2 className="account-orders-page__empty-title">
          You haven&apos;t sent any inquiries yet!
        </h2>
        <p className="account-orders-page__empty-text">
          Need help with an order, return, or product? Send us a message and
          track our replies here.
        </p>
        <div className="account-orders-page__empty-action">
          <LocalizedClientLink href="/contact" passHref>
            <Button data-testid="contact-support-button">Contact support</Button>
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <div className="account-orders-page">
      <div className="account-orders-page__header">
        <h2 className="account-orders-page__title">Contact History</h2>
        <LocalizedClientLink
          href="/contact"
          className="account-address-card__btn account-address-card__btn--edit account-contact-history-page__new-btn"
        >
          + New inquiry
        </LocalizedClientLink>
      </div>

      <div className="account-orders-page__list">
        {contactRequests.map((request) => (
          <ContactRequestItem key={request.id} request={request} />
        ))}
      </div>

      <div className="account-orders-page__count">
        {count} {count === 1 ? "inquiry" : "inquiries"}
      </div>
    </div>
  )
}

const ContactRequestItem: React.FC<{ request: ContactRequest }> = ({
  request,
}) => {
  const { directReply, directImages, sortedComments, hasResponses } =
    collectResponses(request)
  const [isExpanded, setIsExpanded] = useState(false)
  const status = getStatusConfig(request.status, hasResponses)
  const topic = formatTopic(request.payload?.topic || request.topic || "")
  const message = request.payload?.message || request.message || ""
  const shortId = request.id?.slice(-8)?.toUpperCase() || "——"

  return (
    <article className="account-order-card" data-testid="contact-history-card">
      <div className="account-order-card__header">
        <div
          className={`account-order-card__status-icon account-order-card__status-icon--${status.modifier}`}
          aria-hidden
        >
          {status.iconSrc ? (
            <span
              role="img"
              aria-label={status.label}
              className="account-order-card__status-icon-img"
              style={{
                WebkitMaskImage: `url("${status.iconSrc}")`,
                maskImage: `url("${status.iconSrc}")`,
              }}
            />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </div>

        <div className="account-order-card__status-copy">
          <div className="account-order-card__status-row">
            <h3
              className={`account-order-card__status-label account-order-card__status-label--${status.modifier}`}
            >
              {status.label}
            </h3>
          </div>
          <p className="account-order-card__date">
            Sent on {formatDate(request.created_at)}
          </p>
        </div>
      </div>

      <div className="account-order-card__items">
        <div className="account-contact-card__detail">
          <div className="account-contact-card__detail-head">
            <h4 className="account-order-card__item-title">{topic}</h4>
            <span className="account-contact-card__ref">#{shortId}</span>
          </div>

          <p className="account-contact-card__message">{message || "—"}</p>

          {hasResponses ? (
            <>
              <div className="account-contact-card__actions">
                <button
                  type="button"
                  className={`account-address-card__btn ${
                    isExpanded
                      ? "account-address-card__btn--default"
                      : "account-address-card__btn--edit"
                  }`}
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "Hide reply" : "View reply"}
                </button>
              </div>

              {isExpanded && (
                <div className="account-contact-card__replies">
                  {directReply &&
                    !sortedComments.find(
                      (c) =>
                        (c.comment || (c as any).content) === directReply
                    ) && (
                      <ReplyBubble
                        text={directReply}
                        images={directImages}
                        date={request.updated_at}
                      />
                    )}

                  {[...sortedComments].reverse().map((comment) => {
                    const commentText =
                      comment.comment || (comment as any).content
                    const hasImages = Boolean(comment.images?.length)
                    if (!commentText && !hasImages) return null

                    return (
                      <ReplyBubble
                        key={comment.id}
                        text={commentText}
                        images={comment.images}
                        date={comment.created_at}
                      />
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <p className="account-contact-card__waiting">
              Waiting for support reply
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

const ReplyBubble = ({
  text,
  images,
  date,
}: {
  text?: string
  images?: string[]
  date?: string
}) => (
  <div className="account-contact-card__reply">
    <span className="account-contact-card__reply-from">Support</span>
    {text && <p className="account-contact-card__reply-text">{text}</p>}
    {images && images.length > 0 && (
      <div className="account-contact-card__reply-images">
        {images.map((image, index) => (
          <a
            key={index}
            href={image}
            target="_blank"
            rel="noopener noreferrer"
            className="account-contact-card__reply-image"
          >
            <img src={image} alt="Attachment from support" />
          </a>
        ))}
      </div>
    )}
    {date && (
      <p className="account-order-card__date">
        Replied {formatDate(date)}
      </p>
    )}
  </div>
)

export default ContactHistoryTemplate
