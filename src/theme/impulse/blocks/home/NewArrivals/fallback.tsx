/** Reserve new-arrivals carousel while products stream in. */
export default function NewArrivalsFallback() {
  return (
    <section
      className="new-arrivals w-full py-1 md:py-12 bg-page-bg"
      aria-hidden
    >
      <div
        className="mx-auto px-2 sm:px-3 md:px-5 lg:px-4"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div className="h-8 w-40 rounded bg-neutral-100 animate-pulse" />
          <div className="h-4 w-20 rounded bg-neutral-100 animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[45vw] max-w-[280px] aspect-[3/4] rounded-lg bg-neutral-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
