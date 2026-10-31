"use client"

import { useEffect, useState } from "react"
import { useWishlist } from "@core/context/wishlist-context"

const WishlistCounter = () => {
    const { count } = useWishlist()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || count === 0) return null

    return (
        <div className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center bg-brand-accent text-white text-[8px] sm:text-[10px] rounded-full font-bold shadow-sm">
            {count}
        </div>
    )
}

export default WishlistCounter
