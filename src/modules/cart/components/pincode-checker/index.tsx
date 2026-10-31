"use client"

import { useState } from "react"
import { formatShiprocketDeliveryDate } from "@core/util/shiprocket"
import { useShiprocketPincodeCheck } from "@core/hooks/use-shiprocket-pincode-check"
import { MapPin, CheckCircle2, AlertCircle, X } from "lucide-react"

const PincodeChecker = ({ variantId }: { variantId?: string }) => {
    const [pincode, setPincode] = useState("")
    const [showInput, setShowInput] = useState(false)
    const { isChecking, courier, error, checkPincode, reset } =
      useShiprocketPincodeCheck(variantId)

    const handleCheck = async () => {
        await checkPincode(pincode)
    }

    const handleReset = () => {
        setPincode("")
        setShowInput(false)
        reset()
    }

    return (
        <div className="pincode-checker">
            {!showInput && (
                <div className="pincode-checker__row">
                    <div className="pincode-checker__intro">
                        <div className="pincode-checker__icon-wrap">
                            <span className="pincode-checker__icon" aria-hidden />
                        </div>
                        <p className="pincode-checker__label">
                            Check delivery time &amp; services
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowInput(true)}
                        className="pincode-checker__cta"
                    >
                        ENTER PINCODE
                    </button>
                </div>
            )}

            {showInput && !courier && (
                <div className="pincode-checker__form">
                    <div className="pincode-checker__form-head">
                        <p className="pincode-checker__form-title">Enter Delivery Pincode</p>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="pincode-checker__close"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="pincode-checker__form-row">
                        <input
                            type="text"
                            maxLength={6}
                            placeholder="Ex: 380001"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                            className="pincode-checker__input"
                        />
                        <button
                            type="button"
                            onClick={handleCheck}
                            disabled={isChecking}
                            className="pincode-checker__submit"
                        >
                            {isChecking ? "Checking…" : "Check"}
                        </button>
                    </div>
                    {error && !isChecking && (
                        <div className="pincode-checker__error">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden />
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            )}

            {showInput && courier && !isChecking && (
                <div className="pincode-checker__result">
                    <div className="pincode-checker__result-head">
                        <p className="pincode-checker__result-title">
                            <MapPin className="w-4 h-4" aria-hidden />
                            Results for {pincode}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setPincode("")
                                reset()
                                setShowInput(true)
                            }}
                            className="pincode-checker__change"
                        >
                            Change
                        </button>
                    </div>

                    <div className="pincode-checker__success">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" aria-hidden />
                        <div>
                            <p className="pincode-checker__success-title">
                                Delivery available
                            </p>
                            {courier.etd && (
                                <p className="pincode-checker__success-text">
                                    Estimated delivery by{" "}
                                    <span>{formatShiprocketDeliveryDate(courier.etd)}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PincodeChecker
