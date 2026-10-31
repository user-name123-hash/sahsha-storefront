"use client"

import { Suspense, useState } from "react"

import { LOGIN_VIEW } from "@core/types/account"
import Login from "@theme/slots/account/Login"
import ForgotPassword from "@theme/slots/account/ForgotPassword"
import Spinner from "@modules/common/icons/spinner"

export { LOGIN_VIEW }

/**
 * Legacy template — OTP-only Sign In (same APIs as theme LoginTemplate).
 * Register is the same OTP continue flow; use Sign In for both.
 */
const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState(LOGIN_VIEW.SIGN_IN)

  const renderView = () => {
    if (currentView === LOGIN_VIEW.FORGOT_PASSWORD) {
      return <ForgotPassword setCurrentView={setCurrentView} />
    }
    return <Login setCurrentView={setCurrentView} />
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-page-bg">
      <div className="flex-1 flex flex-col items-center justify-start px-2 min-[340px]:px-3 min-[550px]:px-4 sm:px-6 md:px-8 pt-2 min-[340px]:pt-3 min-[550px]:pt-4 sm:pt-4 md:pt-6 pb-6 min-[340px]:pb-8 min-[550px]:pb-8 sm:pb-8 md:pb-8">
        <h1 className="text-2xl min-[340px]:text-3xl min-[550px]:text-3xl sm:text-4xl md:text-4xl font-bold text-heading mb-4 min-[340px]:mb-6 min-[550px]:mb-8 sm:mb-8 md:mb-8 text-center">
          My Account
        </h1>

        <div
          className="w-full bg-page-bg rounded-2xl shadow-lg p-4 min-[340px]:p-5 min-[550px]:p-6 sm:p-7 md:p-8"
          style={{ maxWidth: "560px" }}
        >
          <Suspense
            fallback={
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            }
          >
            {renderView()}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
