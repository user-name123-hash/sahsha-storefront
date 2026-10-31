"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function OrderConfirmationBackHandler() {
  const router = useRouter()
  const params = useParams()
  const countryCode = params?.countryCode || "in"

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Redirect to localized store
      router.push(`/${countryCode}/store`)
    }

    // Push an dummy state
    window.history.pushState(null, "", window.location.href)
    
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [router, countryCode])

  return null
}
