"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Button, Label, Input, clx } from "@medusajs/ui"
import { PencilSquare, Plus, Trash } from "@medusajs/icons"
import {
  listPaymentDetails,
  createPaymentDetail,
  makeDefaultPaymentDetail,
  deletePaymentDetail,
} from "@core/data/payment-details"
import { updatePaymentDetail } from "@lib/data/payment-details"

type PaymentType = "upi" | "bank" | "card"

type UpiForm = { upi_id: string }
type BankForm = {
  account_number: string
  ifsc: string
  account_holder_name: string
  bank_name: string
  branch_name: string
}
type CardForm = {
  card_holder_name: string
  card_number: string
  expiry_date: string
  cvv: string
}

type PaymentDetail = {
  id: string
  type: PaymentType
  is_default?: boolean
  detail_json?: Record<string, string>
}

const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
const ACCOUNT_NUMBER_REGEX = /^[0-9]{9,18}$/
const CARD_NUMBER_REGEX = /^[0-9]{12,19}$/
const CVV_REGEX = /^[0-9]{3,4}$/

const defaultUpi: UpiForm = { upi_id: "" }
const defaultBank: BankForm = {
  account_number: "",
  ifsc: "",
  account_holder_name: "",
  bank_name: "",
  branch_name: "",
}
const defaultCard: CardForm = {
  card_holder_name: "",
  card_number: "",
  expiry_date: "",
  cvv: "",
}

export default function PaymentMethodsTemplate({
  customer: _customer,
}: {
  customer: HttpTypes.StoreCustomer
}) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentDetail[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newPaymentType, setNewPaymentType] = useState<PaymentType>("upi")
  const [upiForm, setUpiForm] = useState<UpiForm>(defaultUpi)
  const [bankForm, setBankForm] = useState<BankForm>(defaultBank)
  const [cardForm, setCardForm] = useState<CardForm>(defaultCard)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    setIsLoadingPayments(true)
    try {
      const methods = await listPaymentDetails()
      setPaymentMethods(methods)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingPayments(false)
    }
  }

  const resetForms = () => {
    setUpiForm(defaultUpi)
    setBankForm(defaultBank)
    setCardForm(defaultCard)
    setEditingId(null)
    setNewPaymentType("upi")
    setError(null)
  }

  const closeForm = () => {
    setShowForm(false)
    resetForms()
  }

  const openAddForm = () => {
    resetForms()
    setShowForm(true)
  }

  const openEditForm = (pm: PaymentDetail) => {
    setError(null)
    setEditingId(pm.id)
    setNewPaymentType(pm.type)
    const detail = pm.detail_json || {}

    if (pm.type === "upi") {
      setUpiForm({ upi_id: detail.upi_id || "" })
      setBankForm(defaultBank)
      setCardForm(defaultCard)
    } else if (pm.type === "bank") {
      setBankForm({
        account_number: detail.account_number || "",
        ifsc: detail.ifsc || "",
        account_holder_name: detail.account_holder_name || "",
        bank_name: detail.bank_name || "",
        branch_name: detail.branch_name || "",
      })
      setUpiForm(defaultUpi)
      setCardForm(defaultCard)
    } else {
      setCardForm({
        card_holder_name: detail.card_holder_name || "",
        card_number: detail.card_number || "",
        expiry_date: detail.expiry_date || "",
        cvv: detail.cvv || "",
      })
      setUpiForm(defaultUpi)
      setBankForm(defaultBank)
    }

    setShowForm(true)
  }

  const isFormValid = () => {
    if (newPaymentType === "upi") {
      const upiId = upiForm.upi_id.trim()
      return !!upiId && UPI_REGEX.test(upiId)
    }
    if (newPaymentType === "bank") {
      const ifsc = bankForm.ifsc.trim().toUpperCase()
      const accNum = bankForm.account_number.trim()
      return (
        ACCOUNT_NUMBER_REGEX.test(accNum) &&
        IFSC_REGEX.test(ifsc) &&
        !!bankForm.bank_name.trim() &&
        !!bankForm.account_holder_name.trim()
      )
    }
    if (newPaymentType === "card") {
      const cardNum = cardForm.card_number.trim().replace(/\s/g, "")
      const cvv = cardForm.cvv.trim()
      const expiry = cardForm.expiry_date.trim()

      if (!/^\d{2}\/\d{2}$/.test(expiry)) return false
      const [month, year] = expiry.split("/").map((n: string) => parseInt(n))
      if (month < 1 || month > 12) return false

      const now = new Date()
      const currentYear = parseInt(now.getFullYear().toString().slice(-2))
      const currentMonth = now.getMonth() + 1
      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return false
      }

      return (
        CARD_NUMBER_REGEX.test(cardNum) &&
        CVV_REGEX.test(cvv) &&
        !!cardForm.card_holder_name.trim()
      )
    }
    return false
  }

  const buildDetailJson = (): Record<string, string> => {
    if (newPaymentType === "upi") {
      return { upi_id: upiForm.upi_id.trim() }
    }
    if (newPaymentType === "bank") {
      const detailJson: Record<string, string> = {
        account_number: bankForm.account_number.trim(),
        bank_name: bankForm.bank_name.trim(),
        account_holder_name: bankForm.account_holder_name.trim(),
        ifsc: bankForm.ifsc.trim().toUpperCase(),
      }
      if (bankForm.branch_name.trim()) {
        detailJson.branch_name = bankForm.branch_name.trim()
      }
      return detailJson
    }
    return {
      card_holder_name: cardForm.card_holder_name.trim(),
      card_number: cardForm.card_number.trim(),
      expiry_date: cardForm.expiry_date.trim(),
      cvv: cardForm.cvv.trim(),
    }
  }

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)
    try {
      const detailJson = buildDetailJson()

      if (editingId) {
        const updateRes = await updatePaymentDetail(
          editingId,
          newPaymentType,
          detailJson
        )
        if (updateRes?.payment_detail) {
          setPaymentMethods((prev) =>
            prev.map((pm) =>
              pm.id === editingId ? updateRes.payment_detail : pm
            )
          )
          closeForm()
        }
        return
      }

      const createRes = await createPaymentDetail(newPaymentType, detailJson)
      if (createRes?.payment_detail) {
        if (paymentMethods.length === 0) {
          await makeDefaultPaymentDetail(createRes.payment_detail.id)
          createRes.payment_detail.is_default = true
        }
        setPaymentMethods([...paymentMethods, createRes.payment_detail])
        closeForm()
      }
    } catch (err: any) {
      console.error("Failed to save payment method", err)
      setError(
        err.message ||
          (editingId
            ? "Failed to update payment method. Please try again."
            : "Failed to add payment method. Please try again.")
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleMakeDefault = async (id: string) => {
    try {
      setError(null)
      await makeDefaultPaymentDetail(id)
      setPaymentMethods((prev) =>
        prev.map((pm) => ({
          ...pm,
          is_default: pm.id === id,
        }))
      )
    } catch (err: any) {
      console.error(err)
      setError(
        typeof err?.message === "string" && err.message.trim()
          ? err.message
          : "Could not update your default payment method. Please try again."
      )
    }
  }

  const handleDelete = async (pm: PaymentDetail) => {
    if (pm.is_default && paymentMethods.length === 1) {
      setError(
        "The default payment method cannot be removed. Please add another payment method and set it as default before removing this one."
      )
      return
    }

    if (!window.confirm("Are you sure you want to delete this payment method?")) {
      return
    }

    try {
      await deletePaymentDetail(pm.id)
      const remaining = paymentMethods.filter((p) => p.id !== pm.id)
      setPaymentMethods(remaining)
      setError(null)
    } catch (err: any) {
      console.error("Failed to delete payment method", err)
      const msg =
        typeof err?.message === "string" && err.message.trim()
          ? err.message
          : "Failed to delete payment method."
      // Never surface raw unique-constraint messages
      if (/already exists/i.test(msg) && /customer/i.test(msg)) {
        setError(
          "Could not remove this payment method because of a conflict with your default method. Please set another method as default, then try again."
        )
      } else {
        setError(msg)
      }
    }
  }

  const isEditing = !!editingId

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="account-refund-page__title">Refund Settings</h1>
        <div className="account-refund-page__note">
          <p className="account-refund-page__note-text">
            <span className="account-refund-page__note-title">Important Note:</span>
            These details are <u>only</u> used to send money back to you when you
            return an item. For security, we do not use these methods for taking
            payments when you place an order.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-start gap-3">
          <svg
            className="w-5 h-5 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}

      {isLoadingPayments ? (
        <div className="animate-pulse flex flex-col gap-4">
          <div className="bg-gray-100 h-24 rounded-2xl w-full"></div>
          <div className="bg-gray-100 h-24 rounded-2xl w-full"></div>
        </div>
      ) : !showForm ? (
        <div className="space-y-6">
          {paymentMethods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className={`border-2 p-6 rounded-2xl flex flex-col justify-between items-start gap-4 transition-all ${
                    pm.is_default
                      ? "border-brand-accent bg-brand-accent-muted/30"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-heading uppercase">
                        {pm.type}
                      </span>
                      {pm.is_default && (
                        <span className="bg-brand-accent text-inverse text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    {pm.type === "upi" && (
                      <span className="text-gray-600 font-mono text-sm">
                        {pm.detail_json?.upi_id}
                      </span>
                    )}
                    {pm.type === "bank" && (
                      <>
                        <span className="text-heading font-semibold text-sm">
                          {pm.detail_json?.bank_name}
                        </span>
                        <span className="text-gray-600 font-mono text-sm">
                          A/C: ****{pm.detail_json?.account_number?.slice(-4)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {pm.detail_json?.account_holder_name}
                        </span>
                        <span className="text-gray-400 text-xs">
                          IFSC: {pm.detail_json?.ifsc}
                        </span>
                      </>
                    )}
                    {pm.type === "card" && (
                      <>
                        <span className="text-gray-600 font-mono text-sm">
                          Card: **** {pm.detail_json?.card_number?.slice(-4)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {pm.detail_json?.card_holder_name}
                        </span>
                        <span className="text-gray-400 text-xs font-mono">
                          {pm.detail_json?.expiry_date}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between w-full mt-auto gap-3">
                    {!pm.is_default ? (
                      <button
                        type="button"
                        onClick={() => handleMakeDefault(pm.id)}
                        className="text-brand-accent text-sm font-medium hover:underline focus:outline-none"
                      >
                        Set as default
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => openEditForm(pm)}
                        className="inline-flex items-center gap-1.5 text-brand-accent text-sm font-medium hover:underline focus:outline-none"
                        title="Edit payment method"
                        aria-label="Edit payment method"
                      >
                        <PencilSquare color="currentColor" />
                        Edit
                      </button>
                      {!pm.is_default && (
                        <button
                          type="button"
                          onClick={() => handleDelete(pm)}
                          className="inline-flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors focus:outline-none p-1"
                          title="Delete payment method"
                          aria-label="Delete payment method"
                        >
                          <Trash color="currentColor" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
              <p className="text-gray-500 mb-2 font-semibold">
                No refund destination saved
              </p>
              <p className="text-sm text-gray-400">
                Add your bank or UPI details to receive refunds directly to your
                account.
              </p>
            </div>
          )}

          <Button
            onClick={openAddForm}
            variant="secondary"
            className="w-full sm:w-auto mt-4 px-8 border-gray-200 shadow-sm rounded-full text-brand-accent hover:bg-brand-accent-muted/50 flex flex-row items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add refund destination
          </Button>
        </div>
      ) : (
        <div className="bg-white border text-heading border-gray-200 p-6 md:p-8 rounded-3xl shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">
              {isEditing ? "Edit Refund Account" : "Add Refund Account"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close form"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(["upi", "bank", "card"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setNewPaymentType(type)}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  newPaymentType === type
                    ? "border-brand-accent bg-brand-accent-muted text-brand-accent ring-2 ring-brand-accent-border ring-offset-1"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="font-semibold text-sm">
                  {type === "bank"
                    ? "Bank Account"
                    : type === "card"
                      ? "Card"
                      : "UPI"}
                </span>
              </button>
            ))}
          </div>

          {newPaymentType === "upi" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="font-medium text-gray-700">
                  UPI ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={upiForm.upi_id}
                  onChange={(e) => setUpiForm({ upi_id: e.target.value })}
                  placeholder="e.g. username@okaxis"
                  className={clx("bg-gray-50 focus:bg-white h-12 rounded-xl", {
                    "border-red-500 focus:border-red-600":
                      upiForm.upi_id && !UPI_REGEX.test(upiForm.upi_id),
                  })}
                />
                {upiForm.upi_id && !UPI_REGEX.test(upiForm.upi_id) && (
                  <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                    Please enter a valid UPI ID (e.g. name@bank)
                  </p>
                )}
              </div>
            </div>
          )}

          {newPaymentType === "bank" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="font-medium text-gray-700">
                  Bank Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={bankForm.bank_name}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, bank_name: e.target.value })
                  }
                  placeholder="e.g. HDFC Bank"
                  className="bg-gray-50 focus:bg-white h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-gray-700">
                  Account Holder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={bankForm.account_holder_name}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      account_holder_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Rahul Patel"
                  className="bg-gray-50 focus:bg-white h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-gray-700">
                  Account Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="text"
                  inputMode="numeric"
                  value={bankForm.account_number}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      account_number: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="e.g. 123456789012"
                  className={clx("bg-gray-50 focus:bg-white h-12 rounded-xl", {
                    "border-red-500 focus:border-red-600":
                      bankForm.account_number &&
                      !ACCOUNT_NUMBER_REGEX.test(bankForm.account_number),
                  })}
                />
                {bankForm.account_number &&
                  !ACCOUNT_NUMBER_REGEX.test(bankForm.account_number) && (
                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                      Please enter a valid 9-18 digit account number
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-gray-700">
                  IFSC Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={bankForm.ifsc}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      ifsc: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="e.g. HDFC0001234"
                  className={clx("bg-gray-50 focus:bg-white h-12 rounded-xl", {
                    "border-red-500 focus:border-red-600":
                      bankForm.ifsc && !IFSC_REGEX.test(bankForm.ifsc),
                  })}
                />
                {bankForm.ifsc && !IFSC_REGEX.test(bankForm.ifsc) && (
                  <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                    Invalid IFSC (e.g. HDFC0001234)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-gray-700">
                  Branch Name{" "}
                  <span className="text-gray-400 text-xs font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  value={bankForm.branch_name}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, branch_name: e.target.value })
                  }
                  placeholder="e.g. Adajan Branch"
                  className="bg-gray-50 focus:bg-white h-12 rounded-xl"
                />
              </div>
            </div>
          )}

          {newPaymentType === "card" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="font-medium text-gray-700">
                  Card Holder Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  value={cardForm.card_holder_name}
                  onChange={(e) =>
                    setCardForm({
                      ...cardForm,
                      card_holder_name: e.target.value,
                    })
                  }
                  placeholder="e.g. Rahul Patel"
                  className="bg-gray-50 focus:bg-white h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-gray-700">
                  Card Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  type="text"
                  inputMode="numeric"
                  value={cardForm.card_number}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "")
                    setCardForm({ ...cardForm, card_number: val })
                  }}
                  placeholder="e.g. 4242 4242 4242 4242"
                  className={clx("bg-gray-50 focus:bg-white h-12 rounded-xl", {
                    "border-red-500 focus:border-red-600":
                      cardForm.card_number &&
                      !CARD_NUMBER_REGEX.test(cardForm.card_number),
                  })}
                />
                {cardForm.card_number &&
                  !CARD_NUMBER_REGEX.test(cardForm.card_number) && (
                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                      Please enter a valid 12-19 digit card number
                    </p>
                  )}
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <Label className="font-medium text-gray-700">
                    Expiry Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    value={cardForm.expiry_date}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "")
                      if (val.length > 2) {
                        val = val.slice(0, 2) + "/" + val.slice(2, 4)
                      }
                      setCardForm({
                        ...cardForm,
                        expiry_date: val.slice(0, 5),
                      })
                    }}
                    placeholder="MM/YY"
                    className={clx("bg-gray-50 focus:bg-white h-12 rounded-xl", {
                      "border-red-500 focus:border-red-600":
                        cardForm.expiry_date &&
                        cardForm.expiry_date.length === 5 &&
                        !isFormValid(),
                    })}
                  />
                  {cardForm.expiry_date &&
                    cardForm.expiry_date.length === 5 &&
                    !isFormValid() && (
                      <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                        Invalid or Past Date
                      </p>
                    )}
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="font-medium text-gray-700">
                    CVV <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    type="password"
                    maxLength={4}
                    value={cardForm.cvv}
                    onChange={(e) =>
                      setCardForm({
                        ...cardForm,
                        cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                    placeholder="***"
                    className={clx("bg-gray-50 focus:bg-white h-12 rounded-xl", {
                      "border-red-500 focus:border-red-600":
                        cardForm.cvv && !CVV_REGEX.test(cardForm.cvv),
                    })}
                  />
                  {cardForm.cvv && !CVV_REGEX.test(cardForm.cvv) && (
                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                      Invalid CVV
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeForm}
              className="h-12 rounded-full px-6 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              isLoading={isSaving}
              onClick={handleSave}
              disabled={!isFormValid()}
              className="flex-1 h-12 rounded-full bg-brand-accent hover:bg-brand-accent-hover text-inverse border-none font-bold"
            >
              {isEditing ? "Update Refund Details" : "Save Refund Details"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
