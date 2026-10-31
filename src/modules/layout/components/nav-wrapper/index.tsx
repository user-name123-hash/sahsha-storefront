"use client"

import { useModal } from "@core/context/modal-context"
import React from "react"

export default function NavWrapper({ children }: { children: React.ReactNode }) {
    const { isModalOpen } = useModal()

    if (isModalOpen) {
        return null
    }

    return <>{children}</>
}
