"use client"

export default function ScrollToPendingOrdersButton() {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const element = document.getElementById("abandoned-carts-section")
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <button
      onClick={handleClick}
      className="w-full min-[600px]:w-auto px-6 py-2.5 min-[600px]:px-4 min-[600px]:py-1.5 whitespace-nowrap bg-[#8B5AB1] hover:bg-[#7a4f9b] text-white text-[11px] sm:text-xs font-bold rounded-full shadow-sm transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
    >
      Complete Your Orders ✅
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13l5 5 5-5M7 6l5 5 5-5" /></svg>
    </button>
  )
}
