"use client"

import React, { useState, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { useParams } from "next/navigation"
import { trackProductShareClick } from "@core/analytics/ga4-events"

type ShareButtonProps = {
    productTitle: string
    productHandle: string
}

export default function ShareButton({ productTitle, productHandle }: ShareButtonProps) {
    const { countryCode } = useParams() as { countryCode: string }
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [productUrl, setProductUrl] = useState("")

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted || typeof window === "undefined") return

        const fallbackUrl = window.location.href.split("?")[0].split("#")[0]
        const builtUrl = productHandle
            ? `${window.location.origin}/${countryCode}/products/${productHandle}`
            : fallbackUrl

        setProductUrl(builtUrl)
    }, [mounted, countryCode, productHandle, isOpen])

    const socialLinks = useMemo(() => [
        {
            name: "WhatsApp",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.553 4.189 1.606 6.06L0 24l6.104-1.599a11.82 11.82 0 005.94 1.59h.005c6.634 0 12.032-5.396 12.035-12.03.001-3.213-1.252-6.234-3.528-8.511z" />
                </svg>
            ),
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check this out: ${productTitle}\n\n${productUrl}`)}`,
            color: "#25D366"
        },
        {
            name: "Facebook",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
            color: "#1877F2"
        },
        {
            name: "Instagram",
            icon: (
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg"
                    alt="Instagram"
                    className="w-7 h-7 object-contain"
                />
            ),
            url: `https://www.instagram.com/`,
            color: "#E4405F",
            gradient: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
        },
        {
            name: "Twitter",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
            ),
            url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(`Check out ${productTitle}`)}`,
            color: "#000000"
        },
        {
            name: "Telegram",
            icon: (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.53.26l.213-3.05 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                </svg>
            ),
            url: `https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(`Check out ${productTitle}`)}`,
            color: "#26A5E4"
        }
    ], [productTitle, productUrl])

    const copyToClipboard = () => {
        if (!productUrl) return
        navigator.clipboard.writeText(productUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Prevent scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    const modalContent = isOpen ? (
        <div className="product-share-modal">
            <button
                type="button"
                className="product-share-modal__backdrop"
                onClick={() => setIsOpen(false)}
                aria-label="Close share dialog"
            />

            <div className="product-share-modal__panel" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
                <div className="product-share-modal__header">
                    <div>
                        <h3 id="share-modal-title" className="product-share-modal__title">Spread the Joy</h3>
                        <p className="product-share-modal__subtitle">Tell your friends about Sahsha</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="product-share-modal__close"
                        aria-label="Close"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                <div className="product-share-modal__socials">
                    {socialLinks.map((social) => (
                        <a
                            key={social.name}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-ga-event="product_share_click"
                            data-ga-label={`${social.name} - ${productTitle}`}
                            className="product-share-modal__social"
                        >
                            <div
                                className="product-share-modal__social-icon"
                                style={{
                                    background: (social as { gradient?: string }).gradient || social.color,
                                    boxShadow: `0 8px 16px -4px ${social.color}40`,
                                }}
                            >
                                {social.icon}
                            </div>
                            <span className="product-share-modal__social-label">{social.name}</span>
                        </a>
                    ))}
                </div>

                <div className="product-share-modal__link-box">
                    <div className="product-share-modal__link-head">
                        <span className="product-share-modal__link-label">Shareable Link</span>
                        {copied && (
                            <span className="product-share-modal__copied">Link Copied!</span>
                        )}
                    </div>
                    <div className="product-share-modal__link-row">
                        <p className="product-share-modal__link-url" title={productUrl}>
                            {productUrl || "Loading link..."}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                copyToClipboard()
                                trackProductShareClick({
                                    method: "Copy Link",
                                    product_title: productTitle,
                                })
                            }}
                            className={`product-share-modal__copy-btn${copied ? " product-share-modal__copy-btn--done" : ""}`}
                            disabled={!productUrl}
                        >
                            {copied ? "Done" : "Copy"}
                        </button>
                    </div>
                </div>

                <div className="product-share-modal__footer-strip" aria-hidden>
                    <span />
                    <span />
                    <span />
                    <span />
                </div>
            </div>
        </div>
    ) : null

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                data-ga-event="product_share_open"
                data-ga-label={productTitle}
                className="product-share-btn"
                title="Share"
                aria-label="Share"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="product-share-btn__icon"
                    aria-hidden
                >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span className="product-share-btn__label">Share</span>
            </button>

            {mounted && modalContent ? createPortal(modalContent, document.body) : null}
        </>
    )
}
