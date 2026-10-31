import Image from "next/image"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"

const features = [
  {
    name: "Free Shipping",
    description: "On all orders over ₹999",
    icon: "/delivery.svg",
    width: 30,
    height: 18,
  },
  {
    name: "Easy Returns",
    description: "Hassle-free 15-day returns",
    icon: "/Return.svg",
    width: 28,
    height: 26,
  },
  {
    name: "Secure Checkout",
    description: "100% protected payments",
    icon: "/secure-payment.png",
    width: 36,
    height: 36,
  },
  {
    name: "Cash on Delivery",
    description: "Pay at your doorstep",
    icon: "/Cod.svg",
    width: 30,
    height: 18,
  },
]

/** Premium Impulse-style trust badge strip. */
const Features = () => {
  return (
    <section className="w-full bg-page-bg py-4 md:py-8 border-y border-[var(--color-border)] overflow-hidden">
      <div
        className="mx-auto px-4 sm:px-6"
        style={{ maxWidth: "var(--container-max)" }}
      >
        {/* Mobile Continuous Marquee */}
        <div
          className="flex sm:hidden relative w-full overflow-hidden -mx-4 px-4"
          style={{ width: "calc(100% + 2rem)" }}
        >
          <div className="flex animate-infinite-scroll w-max hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="flex"
                aria-hidden={copy === 1 ? true : undefined}
              >
                {features.map((feature) => (
                  <div
                    key={`${copy}-${feature.name}`}
                    className="flex flex-col items-center text-center px-4 w-[140px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-[var(--color-border)] mb-2">
                      {copy === 0 ? (
                        <Image
                          src={feature.icon}
                          alt={feature.name}
                          width={feature.width}
                          height={feature.height}
                          sizes="20px"
                          className="max-w-5 max-h-5 w-auto h-auto object-contain"
                          unoptimized={shouldUnoptimizeImage(feature.icon)}
                        />
                      ) : (
                        <span
                          className="block max-w-5 max-h-5 w-5 h-5 bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${feature.icon})` }}
                        />
                      )}
                    </div>
                    <h3 className="whitespace-nowrap text-[10px] font-black uppercase tracking-tighter text-heading mb-0.5">
                      {feature.name}
                    </h3>
                    <p className="whitespace-nowrap text-[8px] text-muted font-medium">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Grid */}
        <div className="hidden sm:grid sm:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="group flex flex-col items-center text-center space-y-3"
            >
              <div className="w-14 h-14 lg:w-[72px] lg:h-[72px] rounded-full bg-surface flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-brand-sm border border-[var(--color-border)]">
                <Image
                  src={feature.icon}
                  alt={feature.name}
                  width={feature.width}
                  height={feature.height}
                  sizes="(max-width: 1024px) 28px, 36px"
                  className="max-w-7 max-h-7 lg:max-w-9 lg:max-h-9 w-auto h-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                  unoptimized={shouldUnoptimizeImage(feature.icon)}
                />
              </div>
              <div>
                <h3 className="whitespace-nowrap sm:text-[11px] lg:text-[13px] font-black uppercase sm:tracking-widest text-heading mb-1.5">
                  {feature.name}
                </h3>
                <p className="whitespace-nowrap sm:text-[10px] lg:text-xs text-muted max-w-[200px] mx-auto font-medium leading-normal">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
