import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PolicyPageFooter from "@modules/common/components/policy-page-footer"
import {
  PRIVACY_POLICY_INTRO,
  PRIVACY_POLICY_SECTIONS,
  PRIVACY_POLICY_TOC,
} from "@lib/content/privacy-policy-sections"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Sahsha protects your personal information when you shop kurtis, kurti sets, and sarees online.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="policy-page policy-doc-page about-page legal-page min-h-screen">
      <div className="policy-page__inner about-page__container">
        <nav className="about-page__breadcrumb" aria-label="Breadcrumb">
          <LocalizedClientLink href="/">Home</LocalizedClientLink>
          <span aria-hidden>/</span>
          <span>Privacy Policy</span>
        </nav>

        <div className="policy-page__layout">
          <aside className="policy-page__sidebar" aria-label="Privacy Policy sections">
            <p className="policy-page__sidebar-label">On this page</p>
            <nav className="policy-page__sidebar-nav">
              {PRIVACY_POLICY_TOC.map((item, index) => (
                <a key={item.id} href={`#${item.id}`} className="policy-page__sidebar-link">
                  {index + 1}. {item.title}
                </a>
              ))}
            </nav>
          </aside>

          <header className="policy-doc-page__hero policy-page__layout-hero">
            <p className="policy-doc-page__eyebrow">Your data, protected</p>
            <h1 className="policy-doc-page__title">
              Privacy <span className="policy-doc-page__title-accent">Policy</span>
            </h1>
          </header>

          <main className="policy-page__main policy-doc-page__main">
            <section className="policy-doc-page__intro">{PRIVACY_POLICY_INTRO}</section>

            {PRIVACY_POLICY_SECTIONS.map((section, index) => (
              <section key={section.id} id={section.id} className="policy-doc-page__card">
                <div className="policy-doc-page__card-head">
                  <span className="policy-doc-page__card-num">{index + 1}</span>
                  <h2 className="policy-doc-page__card-title">{section.title}</h2>
                </div>
                <div className="policy-doc-page__card-body">{section.content}</div>
              </section>
            ))}
            <PolicyPageFooter />
          </main>
        </div>
      </div>
    </div>
  )
}
