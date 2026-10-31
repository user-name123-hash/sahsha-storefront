import ObfuscatedEmail from "@modules/common/components/obfuscated-email"
import { getContactInfoFromConfig } from "@lib/data/contact-info"

const FooterContact = async () => {
  const fetchedContact = await getContactInfoFromConfig()

  const phone = fetchedContact?.phone || ""
  const email = fetchedContact?.email || ""
  const address = fetchedContact?.address || ""

  if (!phone && !email && !address) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4 sm:gap-y-6">
      <h3 className="text-white text-sm sm:text-base font-semibold mb-2 sm:mb-3">Contact Us</h3>
      <div className="flex flex-col gap-y-4 sm:gap-y-5">
        {phone ? (
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gray-600/50 flex items-center justify-center flex-shrink-0">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="text-white text-xs sm:text-sm font-medium">{phone}</span>
          </div>
        ) : null}

        {email ? (
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gray-600/50 flex items-center justify-center flex-shrink-0">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <ObfuscatedEmail
              email={email}
              className="text-white text-xs sm:text-sm font-medium hover:text-pink-400 transition-colors"
            />
          </div>
        ) : null}

        {address ? (
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gray-600/50 flex items-center justify-center flex-shrink-0">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span className="text-white text-xs sm:text-sm font-medium leading-normal">
              {address}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default FooterContact
