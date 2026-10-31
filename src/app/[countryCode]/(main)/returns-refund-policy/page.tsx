import { Metadata } from "next"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PolicyPageFooter from "@modules/common/components/policy-page-footer"
import {
  RETURNS_REFUND_POLICY_INTRO,
  RETURNS_REFUND_POLICY_SECTIONS,
  RETURNS_REFUND_POLICY_TOC,
} from "@lib/content/returns-refund-policy-sections"

export const metadata: Metadata = {
  title: "Returns & Refunds Policy",
  description:
    "SAHSHA returns, refunds, and exchange policy — return window, eligibility, pickup, and refund timelines.",
}

export default function ReturnsRefundPolicyPage() {
  return (
    <div className="policy-page policy-doc-page about-page legal-page min-h-screen">
      <div className="policy-page__inner about-page__container">
        <nav className="about-page__breadcrumb" aria-label="Breadcrumb">
          <LocalizedClientLink href="/">Home</LocalizedClientLink>
          <span aria-hidden>/</span>
          <span>Returns &amp; Refunds Policy</span>
        </nav>

        <div className="policy-page__layout">
          <aside className="policy-page__sidebar" aria-label="Returns and Refunds Policy sections">
            <p className="policy-page__sidebar-label">On this page</p>
            <nav className="policy-page__sidebar-nav">
              {RETURNS_REFUND_POLICY_TOC.map((item, index) => (
                <a key={item.id} href={`#${item.id}`} className="policy-page__sidebar-link">
                  {index + 1}. {item.title}
                </a>
              ))}
            </nav>
          </aside>

          <header className="policy-doc-page__hero policy-page__layout-hero">
            <h1 className="policy-doc-page__title">
              Returns &amp; Refunds <span className="policy-doc-page__title-accent">Policy</span>
            </h1>
          </header>

          <main className="policy-page__main policy-doc-page__main">
            <section className="policy-doc-page__intro">{RETURNS_REFUND_POLICY_INTRO}</section>

            {RETURNS_REFUND_POLICY_SECTIONS.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="policy-doc-page__card"
              >
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
