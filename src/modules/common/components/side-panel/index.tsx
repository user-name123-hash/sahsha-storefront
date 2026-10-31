import React, { useEffect } from 'react'
import { clx } from "@medusajs/ui"

type SidePanelProps = {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, title, children }) => {
    // Prevent body scroll when panel is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    return (
        <>
            {/* Backdrop */}
            <div
                className={clx(
                    "fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 z-[999]",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={clx(
                    "fixed top-0 right-0 h-full w-[90%] min-[400px]:w-[350px] sm:w-[400px] md:w-[450px] lg:w-[480px] bg-[#FFFAFE] shadow-2xl transition-transform duration-300 ease-in-out z-[1000] flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </>
    )
}

export default SidePanel
