"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

interface ProductContextType {
    selectedVariantId: string | undefined
    selectedOptions: Record<string, string | undefined>
    hasUserChangedOptions: boolean
    setSelectedVariantId: (id: string | undefined) => void
    setSelectedOptions: (options: Record<string, string | undefined>) => void
    markUserChangedOptions: () => void
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
    const searchParams = useSearchParams()
    const variantIdFromUrl = searchParams.get("v_id") || undefined
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
        variantIdFromUrl
    )
    const [selectedOptions, setSelectedOptions] = useState<
        Record<string, string | undefined>
    >({})
    const [hasUserChangedOptions, setHasUserChangedOptions] = useState(false)

    const markUserChangedOptions = () => {
        setHasUserChangedOptions(true)
    }

    useEffect(() => {
        if (variantIdFromUrl) {
            setSelectedVariantId(variantIdFromUrl)
        }
    }, [variantIdFromUrl])

    return (
        <ProductContext.Provider
            value={{
                selectedVariantId,
                selectedOptions,
                hasUserChangedOptions,
                setSelectedVariantId,
                setSelectedOptions,
                markUserChangedOptions,
            }}
        >
            {children}
        </ProductContext.Provider>
    )
}

export const useProductContext = () => {
    const context = useContext(ProductContext)
    if (context === undefined) {
        throw new Error("useProductContext must be used within a ProductProvider")
    }
    return context
}
