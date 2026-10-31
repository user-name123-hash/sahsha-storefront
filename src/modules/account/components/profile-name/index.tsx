"use client"

import React, { useEffect, useActionState } from "react";

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomer } from "@core/data/customer"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileName: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  const updateCustomerName = async (
    _currentState: Record<string, unknown>,
    formData: FormData
  ) => {
    const full_name = formData.get("full_name") as string
    const [first_name, ...last_name_parts] = (full_name || "").split(" ")
    const last_name = last_name_parts.join(" ") || "."

    const customer = {
      first_name: first_name || "",
      last_name: last_name,
    }

    try {
      await updateCustomer(customer)
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.toString() }
    }
  }

  const [state, formAction] = useActionState(updateCustomerName, {
    error: false,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} className="w-full overflow-visible">
      <AccountInfo
        label="Name"
        currentInfo={`${customer.first_name} ${customer.last_name}`}
        isSuccess={successState}
        isError={!!state?.error}
        clearState={clearState}
        data-testid="account-name-editor"
      >
        <div className="flex flex-col gap-y-4">
          <Input
            label="Full name"
            name="full_name"
            required
            defaultValue={customer.first_name ? `${customer.first_name} ${customer.last_name === "." ? "" : customer.last_name}`.trim() : ""}
            data-testid="full-name-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileName
