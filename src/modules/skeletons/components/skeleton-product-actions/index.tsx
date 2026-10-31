export default function SkeletonProductActions() {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 w-full animate-pulse" aria-hidden>
      <div className="h-8 w-40 bg-surface-muted rounded-none" />
      <div className="flex flex-col gap-3">
        <div className="h-3 w-24 bg-surface-muted rounded-none" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-10 bg-surface-muted rounded-none" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-3 w-28 bg-surface-muted rounded-none" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="product-color-variants__card bg-surface-muted rounded-none"
            />
          ))}
        </div>
      </div>
      <div className="h-12 w-full bg-surface-muted rounded-none" />
      <div className="h-12 w-full bg-surface-muted rounded-none" />
    </div>
  )
}
