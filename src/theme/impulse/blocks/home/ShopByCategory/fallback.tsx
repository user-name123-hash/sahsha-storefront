/** Reserve shop-by-category layout while categories stream in. */
export default function ShopByCategoryFallback() {
  return (
    <section
      className="shop-by-category w-full bg-white py-8 sm:py-9 md:py-10 font-[family-name:var(--sf-font-family)]"
      aria-hidden
    >
      <div
        className="shop-by-category__inner mx-auto px-4"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div className="shop-by-category__header mb-6">
          <div className="h-8 w-48 max-w-full rounded bg-neutral-100 animate-pulse" />
        </div>
        <div className="shop-by-category__grid grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-lg bg-neutral-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
