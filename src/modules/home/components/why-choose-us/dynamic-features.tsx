import Image from "next/image"
import { getFeaturesFromPublicConfig } from "@lib/data/why-choose-us"

const DynamicFeatures = async () => {
  const config = await getFeaturesFromPublicConfig()

  const title = config?.title || "Why Choose Sahsha?"
  const features = config?.features || []

  if (features.length === 0) {
    return null
  }

  return (
    <div className="w-full py-8 sm:py-12 md:py-14 lg:py-16 bg-[#FFFAFE]">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="max-w-[1440px] mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 text-gray-900">
            {title}
          </h2>
          <style dangerouslySetInnerHTML={{
            __html: `
              @media (max-width: 449px) {
                .why-choose-grid {
                  grid-template-columns: repeat(4, 1fr) !important;
                  gap: 0.5rem !important;
                }
                .why-choose-icon {
                  width: 45px !important;
                  height: 45px !important;
                }
                .why-choose-text-scroll {
                  font-size: 8.5px !important;
                }
              }
              @media (min-width: 450px) {
                .why-choose-grid {
                  grid-template-columns: repeat(4, 1fr) !important;
                }
                .why-choose-icon {
                  width: 60px !important;
                  height: 60px !important;
                }
              }
              @media (min-width: 550px) {
                .why-choose-icon {
                  width: 70px !important;
                  height: 70px !important;
                }
              }
              @media (min-width: 640px) {
                .why-choose-icon {
                  width: 75px !important;
                  height: 75px !important;
                }
              }
              @media (min-width: 768px) {
                .why-choose-icon {
                  width: 85px !important;
                  height: 85px !important;
                }
              }
            `
          }} />
          <div className="grid grid-cols-4 sm:grid-cols-4 why-choose-grid gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12 2xl:gap-16 justify-items-center">
            {features.map((feature, index) => (
              <div
                key={`${feature.name}-${index}`}
                className="flex flex-col items-center group w-full max-w-[160px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-[220px] why-choose-item-scroll"
              >
                <div className="relative w-[60px] h-[60px] sm:w-[75px] sm:h-[75px] md:w-[85px] md:h-[85px] lg:w-[95px] lg:h-[95px] xl:w-[105px] xl:h-[105px] 2xl:w-[120px] 2xl:h-[120px] mb-2 sm:mb-3 md:mb-4 why-choose-icon why-choose-icon-scroll">
                  <Image
                    src={feature.icon}
                    alt={feature.name}
                    width={120}
                    height={120}
                    sizes="(max-width: 640px) 60px, (max-width: 1024px) 85px, 120px"
                    quality={75}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-900 text-center leading-tight px-1 why-choose-text-scroll">
                  {feature.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DynamicFeatures

