"use client"

type PageLoaderProps = {
  visible: boolean
}

/**
 * Thin top progress bar for in-app navigations.
 * Avoids full-screen white overlay that made the site feel stuck loading.
 */
export default function PageLoader({ visible }: PageLoaderProps) {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="sahsha-page-loader pointer-events-none fixed left-0 right-0 top-0 z-[99990] h-[2px] overflow-hidden"
    >
      <div className="sahsha-page-loader__bar h-full w-1/3 rounded-full bg-[var(--color-brand-accent,#5a2a43)]" />
    </div>
  )
}
