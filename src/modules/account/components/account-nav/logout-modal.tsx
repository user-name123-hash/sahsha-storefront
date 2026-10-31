"use client"

import { Dialog, Transition } from "@headlessui/react"
import React, { Fragment } from "react"
import X from "@modules/common/icons/x"

const LOGOUT_ICON_SRC = "/logout%20(1).png"

type LogoutModalProps = {
  isOpen: boolean
  close: () => void
  onConfirm: () => void
  isLoggingOut: boolean
}

const LogoutModal = ({
  isOpen,
  close,
  onConfirm,
  isLoggingOut,
}: LogoutModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="account-dashboard__logout-backdrop fixed inset-0" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-2"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-2"
            >
              <Dialog.Panel className="account-dashboard__logout-modal w-full max-w-[22rem] transform transition-all">
                <button
                  type="button"
                  onClick={close}
                  className="account-dashboard__logout-close"
                  aria-label="Close"
                  data-testid="logout-modal-close"
                >
                  <X size={18} />
                </button>

                <div className="account-dashboard__logout-content">
                  <div
                    className="account-dashboard__logout-icon"
                    aria-hidden="true"
                  >
                    <img
                      src={LOGOUT_ICON_SRC}
                      alt=""
                      className="account-dashboard__menu-icon account-dashboard__menu-icon--logout account-dashboard__logout-icon-img"
                      width={22}
                      height={22}
                    />
                  </div>

                  <Dialog.Title
                    as="h2"
                    className="account-dashboard__logout-title"
                  >
                    Log Out
                  </Dialog.Title>

                  <p className="account-dashboard__logout-text">
                    Are you sure you want to log out?
                  </p>

                  <div className="account-dashboard__logout-actions">
                    <button
                      type="button"
                      onClick={close}
                      className="account-dashboard__logout-btn account-dashboard__logout-btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={isLoggingOut}
                      className="account-dashboard__logout-btn account-dashboard__logout-btn--primary"
                    >
                      {isLoggingOut ? (
                        <span className="account-dashboard__logout-btn-loading">
                          <span
                            className="account-dashboard__logout-spinner"
                            aria-hidden="true"
                          />
                          Log Out
                        </span>
                      ) : (
                        "Log Out"
                      )}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default LogoutModal
