import { Heading, Text } from "@medusajs/ui"
import { ShoppingCart } from "@medusajs/icons"
import Link from "next/link"

const EmptyCartMessage = () => {
  return (
    <div className="py-24 px-4 flex flex-col items-center justify-center text-center w-full max-w-lg mx-auto animate-in fade-in duration-700" data-testid="empty-cart-message">
      {/* Small Cart Icon */}
      <div className="relative mb-8">
        <div className="relative w-20 h-20 bg-[#f8f4ef] rounded-full flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#5a2a43]">
            <path d="M3 3H5L5.4 5M5.4 5H21L19 13H7L5.4 5ZM7 13L4.707 15.293C4.077 15.293 4.523 17 5.414 17H19M17 17C15.8954 17 15 17.8954 15 19C15 20.1046 15.8954 21 17 21C18.1046 21 19 20.1046 19 19C19 17.8954 18.1046 17 17 17ZM9 17C7.89543 17 7 17.8954 7 19C7 20.1046 7.89543 21 9 21C10.1046 21 11 20.1046 11 19C11 17.8954 10.1046 17 9 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <Heading
        level="h1"
        className="text-3xl sm:text-4xl text-[#1a1a1a] mb-3 font-heading"
      >
        Your bag is empty
      </Heading>

      <Text className="text-[#4d4d4d] text-base sm:text-lg mb-10 max-w-[320px] leading-relaxed font-sans">
        Let&apos;s find something amazing to fill your bag today!
      </Text>

      <Link
        href="/store"
        className="inline-flex items-center justify-center px-10 h-14 bg-[#5a2a43] hover:bg-[#723a56] text-white font-semibold tracking-wide uppercase text-sm rounded shadow-[0_4px_12px_rgba(90,42,67,0.15)] hover:shadow-[0_8px_20px_rgba(90,42,67,0.25)] hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.98]"
      >
        Start Shopping
      </Link>
    </div>
  )
}

export default EmptyCartMessage
