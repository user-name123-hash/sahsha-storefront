"use client"

import { Suspense, useState } from "react"
import Image from "next/image"

import { LOGIN_VIEW } from "@core/types/account"
import type { LoginPagePanelConfig } from "@lib/constants/login-panel"
import { shouldUnoptimizeImage } from "@lib/should-unoptimize-image"
import Login from "@theme/slots/account/Login"
import ForgotPassword from "@theme/slots/account/ForgotPassword"
import Spinner from "@modules/common/icons/spinner"

type LoginTemplateClientProps = {
  panel: LoginPagePanelConfig
}

const FORM_COPY = {
  [LOGIN_VIEW.SIGN_IN]: {
    title: "Sign In",
    subtitle: "Select your login mode to continue",
  },
  [LOGIN_VIEW.FORGOT_PASSWORD]: {
    title: "Forgot Password",
    subtitle: "We'll help you get back in",
  },
} as const

export default function LoginTemplateClient({
  panel,
}: LoginTemplateClientProps) {
  const [currentView, setCurrentView] = useState(LOGIN_VIEW.SIGN_IN)
  const formCopy =
    FORM_COPY[currentView as keyof typeof FORM_COPY] ??
    FORM_COPY[LOGIN_VIEW.SIGN_IN]

  const renderView = () => {
    if (currentView === LOGIN_VIEW.FORGOT_PASSWORD) {
      return <ForgotPassword setCurrentView={setCurrentView} />
    }
    return <Login setCurrentView={setCurrentView} />
  }

  return (
    <div className="account-login">
      <div className="account-login__shell">
        <div className="account-login__card-split">
          <aside
            className="account-login__card-brand"
            aria-label="Account benefits"
          >
            <Image
              src={panel.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="account-login__card-brand-image"
              priority
              unoptimized={shouldUnoptimizeImage(panel.image)}
            />
            <div className="account-login__card-brand-overlay" />

            <div className="account-login__card-brand-content">
              {panel.logo ? (
                <div className="account-login__card-brand-logo">
                  <Image
                    src={panel.logo}
                    alt="Sahsha"
                    width={180}
                    height={48}
                    sizes="160px"
                    className="account-login__card-brand-logo-img"
                    unoptimized={shouldUnoptimizeImage(panel.logo)}
                  />
                </div>
              ) : null}

              <div className="account-login__card-brand-body">
                <h1 className="account-login__card-brand-title">{panel.title}</h1>
                <p className="account-login__card-brand-text">
                  {panel.description}
                </p>

                {panel.featureCards.length > 0 ? (
                  <div className="account-login__card-features">
                    <p className="account-login__card-features-label">
                      {panel.featuresLabel}
                    </p>
                    <ul className="account-login__card-features-list">
                      {panel.featureCards.map((card, index) => (
                        <li
                          key={`${card.title}-${index}`}
                          className="account-login__card-feature"
                        >
                          {card.imageSrc ? (
                            <Image
                              src={card.imageSrc}
                              alt=""
                              width={28}
                              height={28}
                              sizes="28px"
                              className="account-login__card-feature-icon"
                              unoptimized={shouldUnoptimizeImage(card.imageSrc)}
                            />
                          ) : (
                            <span
                              className="account-login__card-feature-bullet"
                              aria-hidden
                            />
                          )}
                          <div className="account-login__card-feature-copy">
                            <span className="account-login__card-feature-title">
                              {card.title}
                            </span>
                            <span className="account-login__card-feature-text">
                              {card.text}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <div className="account-login__card-form">
            <header className="account-login__form-header">
              <h2 className="account-login__form-title">{formCopy.title}</h2>
              <p className="account-login__form-subtitle">{formCopy.subtitle}</p>
            </header>

            <div
              className={`account-auth account-auth--${currentView}`}
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
      </div>
    </div>
  )
}
