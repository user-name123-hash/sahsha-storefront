"use client"

import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { useMemo, useEffect, useState, useRef } from "react"
import ProductRating from "../product-rating"
import { fetchReviewsForProduct } from "@core/data/reviews"
import { retrieveCustomer } from "@core/data/customer"
import ReviewModal from "../review-modal"
import {
    getAggregateRatingColor,
    getStarLevelColor,
} from "@lib/util/rating-colors"

type Review = {
    id: string
    product_id: string
    customer_id: string
    rating: number
    title: string
    description: string
    images: string[]
    verified_purchase: boolean
    status: string
    created_at: string
    updated_at: string
}

type RatingsTabProps = {
    product: HttpTypes.StoreProduct & {
        average_rating?: number | null
        total_rating_count?: number | null
    }
}

function getBarFillClass(star: number) {
    return `product-reviews__bar-fill product-reviews__bar-fill--${star}`
}

function getRatingBadgeClass(rating: number) {
    if (rating >= 5) return "product-reviews__rating-badge product-reviews__rating-badge--5"
    if (rating === 4) return "product-reviews__rating-badge product-reviews__rating-badge--4"
    if (rating === 3) return "product-reviews__rating-badge product-reviews__rating-badge--3"
    if (rating === 2) return "product-reviews__rating-badge product-reviews__rating-badge--2"
    return "product-reviews__rating-badge product-reviews__rating-badge--1"
}

const RatingsTab = ({ product }: RatingsTabProps) => {
    const [reviews, setReviews] = useState<Review[]>([])

    const allReviewImages = useMemo(() => {
        const images: string[] = []
        reviews.forEach((review) => {
            if (review.images && review.images.length > 0) {
                images.push(...review.images)
            }
        })
        return images
    }, [reviews])
    const [isLoading, setIsLoading] = useState(false)
    const [isViewAllOpen, setIsViewAllOpen] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null)
    const [expandedReviews, setExpandedReviews] = useState<string[]>([])
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [editingReview, setEditingReview] = useState<Review | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    useEffect(() => {
        retrieveCustomer().then((customer) => {
            if (customer) setCurrentUser(customer)
        })
    }, [])

    useEffect(() => {
        const isAnyModalOpen = isViewAllOpen || isEditModalOpen || activeImageIndex !== null
        if (isAnyModalOpen) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => {
            document.body.style.overflow = ""
        }
    }, [isViewAllOpen, isEditModalOpen, activeImageIndex])

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
        }
    }

    useEffect(() => {
        const container = scrollContainerRef.current
        if (container) {
            container.addEventListener("scroll", checkScroll)
            checkScroll()
        }
        return () => container?.removeEventListener("scroll", checkScroll)
    }, [reviews])

    const scroll = (direction: "left" | "right") => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300
            scrollContainerRef.current.scrollBy({
                left: direction === "right" ? scrollAmount : -scrollAmount,
                behavior: "smooth",
            })
        }
    }

    const nextImage = () => {
        if (activeImageIndex !== null) {
            setActiveImageIndex((prev) => (prev! + 1) % allReviewImages.length)
        }
    }

    const prevImage = () => {
        if (activeImageIndex !== null) {
            setActiveImageIndex((prev) => (prev! - 1 + allReviewImages.length) % allReviewImages.length)
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeImageIndex === null) return
            if (e.key === "ArrowRight") nextImage()
            if (e.key === "ArrowLeft") prevImage()
            if (e.key === "Escape") setActiveImageIndex(null)
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [activeImageIndex, allReviewImages.length])

    const calculatedRating = useMemo(() => {
        if (reviews.length === 0) return product.average_rating || 0
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
        return sum / reviews.length
    }, [reviews, product.average_rating])

    const rating = calculatedRating
    const total = reviews.length > 0 ? reviews.length : (product.total_rating_count || 0)

    const fetchReviews = async () => {
        setIsLoading(true)
        try {
            const fetchedReviews = await fetchReviewsForProduct(product.id)
            setReviews(fetchedReviews)
        } catch {
            setReviews([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReviews()
    }, [product.id])

    const distribution = useMemo(() => {
        if (reviews.length === 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

        const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        reviews.forEach((review) => {
            const star = review.rating as 1 | 2 | 3 | 4 | 5
            if (star >= 1 && star <= 5) {
                dist[star] = (dist[star] || 0) + 1
            }
        })
        return dist
    }, [reviews])

    const renderReviewCard = (review: Review, showExpand = true) => (
        <article key={review.id} className="product-reviews__card">
            <div className="product-reviews__card-head">
                <h5 className="product-reviews__card-title">{review.title}</h5>
                {currentUser && currentUser.id === review.customer_id && (
                    <button
                        type="button"
                        onClick={() => {
                            setEditingReview(review)
                            setIsEditModalOpen(true)
                        }}
                        className="product-reviews__edit-btn"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                    </button>
                )}
            </div>

            <div className="product-reviews__card-body">
                <div
                    className={getRatingBadgeClass(review.rating)}
                    style={{
                        backgroundColor: getStarLevelColor(review.rating),
                        color: "#ffffff",
                    }}
                >
                    {review.rating}★
                </div>
                <div className="product-reviews__card-content">
                    <p className="product-reviews__card-text">{review.description}</p>

                    {review.images && review.images.length > 0 && (
                        <div className="product-reviews__card-images">
                            {(showExpand && !expandedReviews.includes(review.id)
                                ? review.images.slice(0, 2)
                                : review.images
                            ).map((imageUrl, idx) => (
                                <Image
                                    key={idx}
                                    src={imageUrl}
                                    alt={`Review image ${idx + 1}`}
                                    width={160}
                                    height={160}
                                    sizes="80px"
                                    quality={70}
                                    className="product-reviews__review-img"
                                    onClick={() => {
                                        const globalIdx = allReviewImages.indexOf(imageUrl)
                                        if (globalIdx !== -1) setActiveImageIndex(globalIdx)
                                    }}
                                />
                            ))}
                            {showExpand &&
                                !expandedReviews.includes(review.id) &&
                                review.images.length > 2 && (
                                    <button
                                        type="button"
                                        className="product-reviews__more-images-btn"
                                        onClick={() =>
                                            setExpandedReviews((prev) => [...prev, review.id])
                                        }
                                    >
                                        <span className="product-reviews__more-images-count">
                                            +{review.images.length - 2}
                                        </span>
                                        <span className="product-reviews__more-images-label">
                                            Images
                                        </span>
                                    </button>
                                )}
                        </div>
                    )}
                </div>
            </div>

            <div className="product-reviews__card-footer">
                <strong>Sahsha Customer</strong>
                <span className="product-reviews__card-footer-sep">|</span>
                <span>
                    {new Date(review.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                    })}
                </span>
            </div>
        </article>
    )

    const hasRatings = total > 0 || reviews.length > 0

    return (
        <div className="product-reviews">
            {hasRatings && (
                <div className="product-reviews__header">
                    <h3 className="product-reviews__heading">
                        Ratings
                        <span className="product-reviews__heading-stars" aria-hidden>
                            <Image
                                src="/rating-stars.png"
                                alt=""
                                width={30}
                                height={30}
                                sizes="30px"
                                className="product-reviews__heading-stars-img"
                            />
                        </span>
                    </h3>
                    <ProductRating
                        product={product}
                        buttonText="Submit Review"
                        showStars={false}
                        buttonVariant="filled"
                    />
                </div>
            )}

            {total > 0 && (
                <div className="product-reviews__summary">
                    <div className="product-reviews__score">
                        <div className="product-reviews__score-main">
                            <span className="product-reviews__score-value">
                                {rating.toFixed(1)}
                            </span>
                            <svg
                                className="product-reviews__score-star"
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                aria-hidden
                            >
                                <path
                                    fill={getAggregateRatingColor(rating)}
                                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                />
                            </svg>
                        </div>
                        <p className="product-reviews__score-label">
                            {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total} Verified Buyers
                        </p>
                    </div>

                    <div className="product-reviews__divider" aria-hidden />

                    <div className="product-reviews__bars">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = distribution[star as keyof typeof distribution]
                            const percentage = total > 0 ? (count / total) * 100 : 0

                            return (
                                <div key={star} className="product-reviews__bar-row">
                                    <div className="product-reviews__bar-label">
                                        <span>{star}</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill={getStarLevelColor(star)} aria-hidden>
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </svg>
                                    </div>

                                    <div className="product-reviews__bar-track">
                                        <div
                                            className={getBarFillClass(star)}
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor:
                                                    count > 0
                                                        ? getStarLevelColor(star)
                                                        : "transparent",
                                            }}
                                        />
                                    </div>

                                    <span className="product-reviews__bar-count">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {allReviewImages.length > 0 && (
                <div className="product-reviews__moments">
                    <h4 className="product-reviews__subheading">
                        Customer photos ({allReviewImages.length})
                    </h4>
                    <div className="product-reviews__photos-wrap">
                        <div
                            ref={scrollContainerRef}
                            className="product-reviews__photos-gallery"
                        >
                            {allReviewImages.map((imageUrl, idx) => (
                                <Image
                                    key={idx}
                                    src={imageUrl}
                                    alt={`Customer photo ${idx + 1}`}
                                    width={176}
                                    height={176}
                                    sizes="88px"
                                    quality={70}
                                    className="product-reviews__moment-img"
                                    onClick={() => setActiveImageIndex(idx)}
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => scroll("left")}
                            className={`product-reviews__scroll-btn product-reviews__scroll-btn--left ${canScrollLeft ? "" : "opacity-0 pointer-events-none"}`}
                            aria-label="Scroll left"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            onClick={() => scroll("right")}
                            className={`product-reviews__scroll-btn product-reviews__scroll-btn--right ${canScrollRight ? "" : "opacity-0 pointer-events-none"}`}
                            aria-label="Scroll right"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div
                className={`product-reviews__list${
                    !isLoading && reviews.length === 0
                        ? " product-reviews__list--empty"
                        : ""
                }`}
            >
                <h4 className="product-reviews__subheading">Customer Reviews</h4>
                {isLoading ? (
                    <p className="product-reviews__empty">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <div className="product-reviews__empty-state">
                        <div className="product-reviews__empty-state-col product-reviews__empty-state-col--left">
                            <div className="product-reviews__empty-stars" aria-hidden>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <svg
                                        key={star}
                                        className="product-reviews__empty-star-icon"
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.75"
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                ))}
                            </div>
                            <p className="product-reviews__empty-state-text">
                                Be the first to write a review
                            </p>
                        </div>
                        <div
                            className="product-reviews__empty-state-divider"
                            aria-hidden
                        />
                        <div className="product-reviews__empty-state-col product-reviews__empty-state-col--right">
                            <ProductRating
                                product={product}
                                buttonText="Write a review"
                                showStars={false}
                                showButtonIcon={false}
                                buttonVariant="primary"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="product-reviews__cards">
                            {reviews.slice(0, 2).map((review) => renderReviewCard(review))}
                        </div>

                        {reviews.length > 2 && (
                            <button
                                type="button"
                                onClick={() => setIsViewAllOpen(true)}
                                className="product-reviews__view-all"
                            >
                                View all {reviews.length} reviews
                            </button>
                        )}
                    </>
                )}
            </div>

            {isViewAllOpen && (
                <div
                    className="product-reviews__modal-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsViewAllOpen(false)
                    }}
                >
                    <div className="product-reviews__modal">
                        <div className="product-reviews__modal-header">
                            <h2 className="product-reviews__modal-title">
                                All Reviews ({reviews.length})
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsViewAllOpen(false)}
                                className="product-reviews__modal-close"
                                aria-label="Close"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="product-reviews__modal-body">
                            <div className="product-reviews__cards">
                                {reviews.map((review) => renderReviewCard(review, false))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeImageIndex !== null && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4 sm:p-8"
                    onClick={() => setActiveImageIndex(null)}
                >
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setActiveImageIndex(null)
                        }}
                        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors z-20"
                        aria-label="Close"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    {allReviewImages.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    prevImage()
                                }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all z-20"
                                aria-label="Previous image"
                            >
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    nextImage()
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all z-20"
                                aria-label="Next image"
                            >
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        </>
                    )}

                    <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
                        <Image
                            src={allReviewImages[activeImageIndex]}
                            alt={`Customer photo ${activeImageIndex + 1}`}
                            width={1200}
                            height={1200}
                            sizes="(max-width: 768px) 100vw, 1024px"
                            quality={90}
                            className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="mt-6 px-4 py-1.5 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm text-white/90 text-sm font-bold tracking-widest uppercase">
                            {activeImageIndex + 1} / {allReviewImages.length}
                        </div>
                    </div>
                </div>
            )}

            {isEditModalOpen && (
                <ReviewModal
                    productId={product.id}
                    productTitle={product.title || "Product"}
                    isOpen={isEditModalOpen}
                    close={() => {
                        setIsEditModalOpen(false)
                        setEditingReview(null)
                    }}
                    existingReview={editingReview}
                    onSuccess={fetchReviews}
                />
            )}
        </div>
    )
}

export default RatingsTab
