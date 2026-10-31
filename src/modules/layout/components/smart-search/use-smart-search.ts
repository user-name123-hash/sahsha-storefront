"use client"

import { useEffect, useState } from "react"

export const SMART_SEARCH_MIN_CHARS = 2

export type SmartSearchProduct = {
  id: string
  title: string | null
  handle: string | null
  thumbnail: string | null
  price: string | null
}

export type SmartSearchCollection = {
  id: string
  title: string | null
  handle: string | null
  image: string | null
}

export type SmartSearchResults = {
  suggestions: string[]
  products: SmartSearchProduct[]
  collections: SmartSearchCollection[]
}

const EMPTY: SmartSearchResults = {
  suggestions: [],
  products: [],
  collections: [],
}

export function useSmartSearch(query: string, countryCode: string, enabled: boolean) {
  const [results, setResults] = useState<SmartSearchResults>(EMPTY)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const trimmed = (query ?? "").trim()

    if (!enabled || trimmed.length < SMART_SEARCH_MIN_CHARS) {
      setResults(EMPTY)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          q: trimmed,
          countryCode,
        })
        const res = await fetch(`/api/smart-search?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Smart search failed")
        const data = (await res.json()) as SmartSearchResults
        setResults(data)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults(EMPTY)
        }
      } finally {
        setIsLoading(false)
      }
    }, 320)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, countryCode, enabled])

  return { results, isLoading }
}
