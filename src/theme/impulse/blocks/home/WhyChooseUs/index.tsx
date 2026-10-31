import Image from "next/image"
import type { WhyChooseUsBlockData } from "@core/types/home"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"

const WhyChooseUs = ({ title, features }: WhyChooseUsBlockData) => {
  if (features.length === 0) {
    return null
  }

  return (
    <section className="why-choose w-full bg-white py-4 sm:py-5 md:py-6">
      <div className="why-choose__inner">
        <h2 className="why-choose__title">{title}</h2>

        <div className="why-choose__grid">
          {features.map((feature, index) => (
            <div
              key={`${feature.name}-${index}`}
              className="why-choose__item"
            >
              {feature.icon ? (
                <div className="why-choose__icon-wrap">
                  <Image
                    src={feature.icon}
                    alt={feature.name}
                    width={120}
                    height={120}
                    sizes="(max-width: 640px) 60px, (max-width: 1024px) 84px, 96px"
                    quality={65}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    className="why-choose__icon"
                    unoptimized={shouldUnoptimizeImage(feature.icon)}
                  />
                </div>
              ) : null}
              <h3 className="why-choose__label">{feature.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default WhyChooseUs
