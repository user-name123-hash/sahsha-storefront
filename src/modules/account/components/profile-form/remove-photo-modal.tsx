"use client"

import { Dialog, Transition } from "@headlessui/react"
import React, { Fragment } from "react"
import X from "@modules/common/icons/x"

type RemovePhotoModalProps = {
  isOpen: boolean
  close: () => void
  onConfirm: () => void
  isRemoving: boolean
}

const RemovePhotoModal = ({
  isOpen,
  close,
  onConfirm,
  isRemoving,
}: RemovePhotoModalProps) => {
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
                  disabled={isRemoving}
                >
                  <X size={18} />
                </button>

                <div className="account-dashboard__logout-content">
                  <div
                    className="account-dashboard__logout-icon"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width={22}
                      height={22}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </div>

                  <Dialog.Title
                    as="h2"
                    className="account-dashboard__logout-title"
                  >
                    Remove Photo
                  </Dialog.Title>

                  <p className="account-dashboard__logout-text">
                    Are you sure you want to remove your profile photo?
                  </p>

                  <div className="account-dashboard__logout-actions">
                    <button
                      type="button"
                      onClick={close}
                      disabled={isRemoving}
                      className="account-dashboard__logout-btn account-dashboard__logout-btn--secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onConfirm}
                      disabled={isRemoving}
                      className="account-dashboard__logout-btn account-dashboard__logout-btn--primary"
                    >
                      {isRemoving ? (
                        <span className="account-dashboard__logout-btn-loading">
                          <span
                            className="account-dashboard__logout-spinner"
                            aria-hidden="true"
                          />
                          Removing...
                        </span>
                      ) : (
                        "Remove"
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

export default RemovePhotoModal
