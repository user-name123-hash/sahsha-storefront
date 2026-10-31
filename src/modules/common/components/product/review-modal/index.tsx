"use client"

import { useState, useRef } from "react"
import { retrieveCustomer, uploadFiles } from "@core/data/customer"
import { submitReview, updateReview } from "@lib/data/reviews"
import { trackFormSubmit } from "@core/analytics/ga4-events"

type ReviewModalProps = {
    productId: string
    productTitle: string
    isOpen: boolean
    close: () => void
    existingReview?: any // Optional
    onSuccess?: () => void // Optional callback for refetching
}

export default function ReviewModal({
    productId,
    productTitle,
    isOpen,
    close,
    existingReview,
    onSuccess,
}: ReviewModalProps) {
    const [rating, setRating] = useState(existingReview?.rating || 0)
    const [title, setTitle] = useState(existingReview?.title || "")
    const [description, setDescription] = useState(existingReview?.description || "")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [images, setImages] = useState<string[]>(existingReview?.images || [])
    const [isUploading, setIsUploading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const modalRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Close on outside click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            handleClose()
        }
    }

    const handleClose = () => {
        close()
        // Reset state after a tiny delay to allow exit animation if needed
        setTimeout(() => {
            setIsSubmitted(false)
            setError(null)
        }, 300)
    }

    if (!isOpen) return null

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        setError(null)
        try {
            const formData = new FormData()
            for (let i = 0; i < files.length; i++) {
                if (files[i].size > 5 * 1024 * 1024) {
                    setError("Please upload images smaller than 5MB.")
                    setIsUploading(false)
                    return
                }
                formData.append("files", files[i])
            }

            const result = await uploadFiles(formData)
            if (result.success && result.files) {
                const newImageUrls = result.files.map((f: any) => f.url)
                setImages((prev) => [...prev, ...newImageUrls].slice(0, 4)) // Limit to 4 images
            } else {
                setError(result.error || "Failed to upload images")
            }
        } catch (error) {
            setError("An error occurred during upload")
        } finally {
            setIsUploading(false)
        }
    }

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        if (rating === 0) {
            setError("Please select a rating before submitting.")
            setIsSubmitting(false)
            return
        }

        try {
            const customer = await retrieveCustomer()

            if (!customer) {
                setError("Please login to submit a review.")
                setIsSubmitting(false)
                return
            }

            let result

            if (existingReview?.id) {
                // Update existing review
                result = await updateReview({
                    id: existingReview.id,
                    rating,
                    title,
                    description,
                    images: images,
                })
            } else {
                // Submit new review
                result = await submitReview({
                    product_id: productId,
                    rating,
                    title,
                    description,
                    images: images,
                })
            }

            if (result.success) {
                trackFormSubmit({
                    form_type: existingReview
                        ? "product_review_update"
                        : "product_review_submit",
                })

                setIsSubmitted(true)
                setTitle("")
                setDescription("")
                setRating(0)
                setImages([])

                // Give success animation a moment before auto-close
                setTimeout(() => {
                    handleClose()
                    if (onSuccess) onSuccess()
                }, 2200)
            } else {
                setError(result.error || "Failed to submit review")
            }
        } catch (error) {
            setError("An error occurred. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const modalTitle = existingReview ? "Edit Review" : "Write a Review"

    return (
        <div
            className="product-reviews__modal-overlay"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className={`product-reviews__modal product-reviews__modal--write${
                    isSubmitted ? " product-reviews__modal--success" : ""
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="review-modal-title"
            >
                {!isSubmitted && (
                    <div className="product-reviews__modal-header">
                        <h2 id="review-modal-title" className="product-reviews__modal-title">
                            {modalTitle}
                        </h2>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="product-reviews__modal-close"
                            aria-label="Close"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                )}

                {isSubmitted ? (
                    <div className="product-reviews__modal-body product-reviews__success">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="product-reviews__success-dismiss"
                            aria-label="Close"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className="product-reviews__success-hero" aria-hidden>
                            <div className="product-reviews__success-glow" />
                            <div className="product-reviews__success-badge">
                                <svg
                                    className="product-reviews__success-icon"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </div>

                        <div className="product-reviews__success-body">
                            <p className="product-reviews__success-eyebrow">
                                {existingReview ? "Updated" : "Submitted"}
                            </p>
                            <h2 id="review-modal-title" className="product-reviews__success-title">
                                Thank You!
                            </h2>
                            <p className="product-reviews__success-text">
                                Your review for <strong>{productTitle}</strong> has been{" "}
                                {existingReview ? "updated" : "submitted"} successfully.
                            </p>

                            <div className="product-reviews__success-stars" aria-hidden>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        viewBox="0 0 24 24"
                                        className="product-reviews__success-star"
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                            </div>

                            <div className="product-reviews__success-progress" aria-hidden>
                                <span className="product-reviews__success-progress-bar" />
                            </div>
                            <p className="product-reviews__success-hint">Closing automatically…</p>

                            <button
                                type="button"
                                onClick={handleClose}
                                className="product-reviews__modal-close-btn"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="product-reviews__modal-body product-reviews__modal-form"
                    >
                        <div className="product-reviews__field">
                            <label className="product-reviews__field-label">Product</label>
                            <p className="product-reviews__field-product">{productTitle}</p>
                        </div>

                        <div className="product-reviews__field">
                            <label className="product-reviews__field-label">Rating</label>
                            <div className="product-reviews__stars-input">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className={
                                                star <= rating
                                                    ? "product-reviews__star--filled"
                                                    : "product-reviews__star--empty"
                                            }
                                            stroke="currentColor"
                                            strokeWidth="1.75"
                                        >
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="product-reviews__field">
                            <label className="product-reviews__field-label" htmlFor="review-title">
                                Title
                            </label>
                            <input
                                id="review-title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="product-reviews__input"
                                placeholder="Great product!"
                            />
                        </div>

                        <div className="product-reviews__field">
                            <label className="product-reviews__field-label" htmlFor="review-description">
                                Review
                            </label>
                            <textarea
                                id="review-description"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="product-reviews__textarea"
                                placeholder="Share your experience..."
                            />
                        </div>

                        <div className="product-reviews__field">
                            <label className="product-reviews__field-label">Images (Max 4)</label>
                            <div className="product-reviews__upload-grid">
                                {images.map((url, index) => (
                                    <div key={index} className="product-reviews__upload-thumb">
                                        <img src={url} alt={`Review upload ${index + 1}`} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="product-reviews__upload-remove"
                                            aria-label="Remove image"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {images.length < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="product-reviews__upload-add"
                                    >
                                        {isUploading ? (
                                            <span className="product-reviews__upload-spinner" aria-hidden />
                                        ) : (
                                            <>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                                <span className="product-reviews__upload-add-label">Add Photo</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <p className="product-reviews__upload-hint">
                                Please upload images smaller than 5MB.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {error && (
                            <div className="product-reviews__error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            data-ga-event={existingReview ? "review_update" : "review_submit"}
                            data-ga-label={existingReview ? "Update Review" : "Submit Review"}
                            className="product-reviews__modal-submit"
                        >
                            {isSubmitting
                                ? "Submitting..."
                                : existingReview
                                  ? "Update Review"
                                  : "Submit Review"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
