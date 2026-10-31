"use client"

type SimpleSpinnerProps = {
  size?: number
  className?: string
}

/** Minimal ring spinner for ecommerce loading states (CSS, no framer-motion). */
export default function SimpleSpinner({
  size = 36,
  className = "",
}: SimpleSpinnerProps) {
  return (
    <span
      aria-hidden
      className={`sahsha-spinner inline-block rounded-full border-2 border-[var(--color-brand-accent-border)] border-t-[var(--color-brand-accent)] ${className}`}
      style={{
        width: size,
        height: size,
      }}
    />
  )
}
