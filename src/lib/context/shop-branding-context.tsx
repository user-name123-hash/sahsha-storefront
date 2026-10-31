"use client"

import { createContext, useContext } from "react"

const ShopBrandingContext = createContext("Store")

export function ShopBrandingProvider({
  shopName,
  children,
}: {
  shopName: string
  children: React.ReactNode
}) {
  return (
    <ShopBrandingContext.Provider value={shopName}>
      {children}
    </ShopBrandingContext.Provider>
  )
}

export function useShopName() {
  return useContext(ShopBrandingContext)
}
