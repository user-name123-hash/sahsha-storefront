import { Disclosure } from "@headlessui/react"
import { Badge, clx } from "@medusajs/ui"
import { useEffect } from "react"

import useToggleState from "@core/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  'data-testid'?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "An error occurred, please try again",
  children,
  'data-testid': dataTestid
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()

  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    setTimeout(() => toggle(), 100)
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div className="account-profile-section" data-testid={dataTestid}>
      <div className="account-profile-section__header">
        <div className="account-profile-section__copy">
          <span className="account-profile-section__label">{label}</span>
          {!state && (
            <div className="account-profile-section__info">
              {typeof currentInfo === "string" ? (
                <span data-testid="current-info">{currentInfo}</span>
              ) : (
                currentInfo
              )}
            </div>
          )}
        </div>
        <div>
          <button
            className="account-dashboard__btn account-dashboard__btn--outline account-profile-section__edit-btn"
            onClick={handleToggle}
            type={state ? "reset" : "button"}
            data-testid="edit-button"
            data-active={state}
          >
            {state ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Success state */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isSuccess,
              "max-h-0 opacity-0": !isSuccess,
            }
          )}
          data-testid="success-message"
        >
          <div className="my-2">
            <span className="account-profile-form__verified account-profile-form__verified--inline">
              {label} updated succesfully
            </span>
          </div>
        </Disclosure.Panel>
      </Disclosure>

      {/* Error state  */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden",
            {
              "max-h-[1000px] opacity-100": isError,
              "max-h-0 opacity-0": !isError,
            }
          )}
          data-testid="error-message"
        >
          <Badge className="p-2 my-4" color="red">
            <span>{errorMessage}</span>
          </Badge>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "transition-[max-height,opacity] duration-300 ease-in-out overflow-visible",
            {
              "max-h-[1000px] opacity-100": state,
              "max-h-0 opacity-0": !state,
            }
          )}
        >
          <div className="flex flex-col gap-y-1 py-2">
            <div>{children}</div>
            <div className="account-profile-section__save-row">
              <button
                className="account-dashboard__btn account-dashboard__btn--primary account-profile-section__save-btn"
                disabled={pending}
                type="submit"
                data-testid="save-button"
              >
                {pending ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </div>
  )
}

export default AccountInfo
