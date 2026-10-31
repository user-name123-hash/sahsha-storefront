"use client"

import { HttpTypes } from "@medusajs/types"
import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useModal } from "@core/context/modal-context"
import AddressCard from "../address-card"

type SelectAddressModalProps = {
    isOpen: boolean
    onClose: () => void
    addresses: HttpTypes.StoreCustomerAddress[]
    selectedAddressId: string | null
    onSelect: (addressId: string) => void
    onEdit: (address: HttpTypes.StoreCustomerAddress) => void
}

const SelectAddressModal: React.FC<SelectAddressModalProps> = ({
    isOpen,
    onClose,
    addresses,
    selectedAddressId,
    onSelect,
    onEdit,
}) => {
    const { setIsModalOpen } = useModal()

    React.useEffect(() => {
        setIsModalOpen(isOpen)
        if (isOpen) {
            document.documentElement.style.overflow = "hidden"
            document.body.style.overflow = "hidden"
            document.documentElement.classList.add("checkout-modal-open")
            document.body.classList.add("checkout-modal-open")
        } else {
            document.documentElement.style.overflow = ""
            document.body.style.overflow = ""
            document.documentElement.classList.remove("checkout-modal-open")
            document.body.classList.remove("checkout-modal-open")
        }
        return () => {
            document.documentElement.style.overflow = ""
            document.body.style.overflow = ""
            document.documentElement.classList.remove("checkout-modal-open")
            document.body.classList.remove("checkout-modal-open")
        }
    }, [isOpen, setIsModalOpen])

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!isOpen || !mounted) return null

    const modalContent = (
        <div
            className="checkout-page__modal-overlay checkout-page__modal-overlay--scroll"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="checkout-page__modal checkout-page__modal--select">
                <div className="checkout-page__modal-header">
                    <h2 className="checkout-page__modal-title">Select Delivery Address</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="checkout-page__modal-close"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="checkout-page__modal-body checkout-page__modal-body--cards">
                    {addresses.length > 0 ? (
                        addresses.map((address) => (
                            <AddressCard
                                key={address.id}
                                address={address}
                                isSelected={selectedAddressId === address.id}
                                onSelect={() => {
                                    onSelect(address.id)
                                    onClose()
                                }}
                                onEdit={() => onEdit(address)}
                                onRemove={() => { }}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <p className="checkout-page__delivery-msg--muted">
                                No saved addresses found.
                            </p>
                        </div>
                    )}
                </div>

                <div className="checkout-page__modal-footer checkout-page__modal-footer--end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="checkout-page__btn checkout-page__btn--outline"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}

export default SelectAddressModal
