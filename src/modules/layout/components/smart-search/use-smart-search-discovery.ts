"use client"

import { useEffect, useState } from "react"
import type { SmartSearchProduct } from "./use-smart-search"

export type SmartSearchCategory = {
  id: string
  name: string
}

export type SmartSearchCollection = {
  id: string
  title: string
  imageUrl: string | null
}

type SmartSearchDiscoveryData = {
  categories: SmartSearchCategory[]
  collections: SmartSearchCollection[]
  products: SmartSearchProduct[]
}

const EMPTY: SmartSearchDiscoveryData = {
  categories: [],
  collections: [],
  products: [],
}

export function useSmartSearchDiscovery(
  countryCode: string,
  enabled: boolean,
  categoryId: string | null
) {
  const [data, setData] = useState<SmartSearchDiscoveryData>(EMPTY)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setData(EMPTY)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    const load = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({ countryCode })
        if (categoryId) {
          params.set("categoryId", categoryId)
        }

        const res = await fetch(`/api/smart-search/discovery?${params}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Discovery fetch failed")

        const json = (await res.json()) as SmartSearchDiscoveryData
        setData(json)
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setData(EMPTY)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void load()

    return () => controller.abort()
  }, [countryCode, enabled, categoryId])

  return { data, isLoading }
}
