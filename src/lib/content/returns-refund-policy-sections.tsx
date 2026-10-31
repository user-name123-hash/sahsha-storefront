import type { ReactNode } from "react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type ReturnsRefundPolicySection = {
  id: string
  title: string
  content: ReactNode
}

export const RETURNS_REFUND_POLICY_INTRO = (
  <p className="policy-page__text">
    At &ldquo;SAHSHA&rdquo;, we want you to love what you ordered. If something isn&apos;t right,
    here&apos;s everything you need to know about returning or exchanging it.
  </p>
)

export const RETURNS_REFUND_POLICY_SECTIONS: ReturnsRefundPolicySection[] = [
  {
    id: "return-window",
    title: "Return Window",
    content: (
      <p className="policy-page__text">
        You may initiate a return request within 3 days of delivery. Requests raised after this
        window will not be accepted, so please inspect your order as soon as it arrives.
      </p>
    ),
  },
  {
    id: "eligibility-for-return",
    title: "Eligibility for Return",
    content: (
      <>
        <p className="policy-page__text">
          To be eligible for a return, the product must be:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>Unworn and unwashed</li>
          <li>With all original tags attached</li>
          <li>In its original packaging</li>
        </ul>
        <p className="policy-page__text">
          This applies to all return requests, including size/fit-related returns and exchanges.
        </p>
        <p className="policy-page__text">
          <strong>Mandatory Unboxing Video:</strong> For all return and exchange requests, you must
          share an unedited video of yourself unpacking the product for the first time, clearly
          showing the package seal, label, and the product condition. This video is required to
          verify and process your request — requests submitted without an unboxing video may be
          declined.
        </p>
        <p className="policy-page__text">
          <strong>Defective or Incorrectly Shipped Items:</strong> If you&apos;ve received a
          defective product or the wrong item/size, please raise a request within the same 3-day
          window via any of our support channels below, these requests are reviewed on priority.
        </p>
      </>
    ),
  },
  {
    id: "how-to-initiate-return",
    title: "How to Initiate a Return",
    content: (
      <>
        <p className="policy-page__text">
          You can raise a return request through any of the following:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>
            <strong>Your Account Dashboard</strong> —{" "}
            <LocalizedClientLink href="/account/orders" className="content-page__legal-link">
              return / tracking page
            </LocalizedClientLink>
            : log in and select &ldquo;Return Item&rdquo; against your order.
          </li>
          <li>
            <strong>Website Return Form</strong> — available at{" "}
            <LocalizedClientLink href="/contact" className="content-page__legal-link">
              contact page
            </LocalizedClientLink>
            .
          </li>
          <li>
            <strong>Email</strong> — write to{" "}
            <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
              support@sahsha.co.in
            </a>
            , with your order ID, product details, and reason for return.
          </li>
          <li>
            <strong>Phone Support</strong> — call us at{" "}
            <a href="tel:+9163521091106" className="content-page__legal-link">
              +91 63521091106
            </a>{" "}
            during business hours Monday to Saturday, 10AM to 8PM.
          </li>
        </ul>
        <p className="policy-page__text">
          Please have your order ID and product details ready when reaching out — this helps us
          process your request faster.
        </p>
      </>
    ),
  },
  {
    id: "return-pickup-shipping",
    title: "Return Pickup & Shipping Charges",
    content: (
      <ul className="content-page__legal-list content-page__legal-list--single">
        <li>
          Once your return request is approved, we will arrange a pickup from your delivery address.
        </li>
        <li>
          A nominal shipping charge of ₹100 will be deducted from your refund amount to cover the
          pickup and return logistics cost (this covers the shipping that was offered free of charge
          at the time of order).
        </li>
        <li>
          For products confirmed to be defective or incorrectly shipped, no such shipping charge will
          be deducted, and the return pickup will be entirely free of cost.
        </li>
      </ul>
    ),
  },
  {
    id: "quality-check",
    title: "Quality Check & Verification",
    content: (
      <p className="policy-page__text">
        All returned items go through a quality check at our facility upon receipt to confirm they
        meet the eligibility criteria listed in Section 2. Refunds or exchanges are processed only
        after this verification is complete. If a returned item does not meet the eligibility
        criteria, or if the product condition does not match the unboxing video, we reserve the
        right to decline the return and ship the product back to you.
      </p>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    content: (
      <ul className="content-page__legal-list content-page__legal-list--single">
        <li>
          <strong>Prepaid Orders:</strong> Refunds are issued to your original payment method.
        </li>
        <li>
          <strong>Cash on Delivery (COD) Orders:</strong> Since there is no original payment method
          to refund to, you will be asked to share your bank account details (account number, IFSC
          code, account holder name) via email at{" "}
          <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
            support@sahsha.co.in
          </a>
          , so we can process the refund via bank transfer.
        </li>
        <li>
          <strong>Timeline:</strong> Refunds are processed within 3–5 business days of your returned
          item being received and verified at our facility. Please allow a few additional business
          days for the amount to reflect in your account, depending on your bank.
        </li>
        <li>
          In case of any issue or discrepancy during the refund process, our team may reach out to you
          directly to confirm details before completing the refund.
        </li>
      </ul>
    ),
  },
  {
    id: "exchanges",
    title: "Exchanges",
    content: (
      <>
        <p className="policy-page__text">
          Prefer a different size or item instead of a refund? We offer exchanges, subject to
          availability:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>
            Exchange requests follow the same 3-day window and eligibility criteria as returns
            (Sections 1 &amp; 2).
          </li>
          <li>
            Once your returned item passes the quality check, we will ship your replacement item.
          </li>
          <li>
            If the replacement item is of higher value, you will be asked to pay the price
            difference. If it&apos;s of lower value, the balance will be refunded as per Section 6.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "non-returnable-items",
    title: "Non-Returnable Items",
    content: (
      <p className="policy-page__text">
        At this time, all products listed on our Website are eligible for return or exchange,
        subject to the eligibility criteria above. Any future exclusions (such as clearance or final
        sale items) will be clearly marked on the relevant product page at the time of purchase.
      </p>
    ),
  },
  {
    id: "partial-returns",
    title: "Partial Returns on Multi-Item Orders",
    content: (
      <p className="policy-page__text">
        If your order contains multiple items and you wish to return only some of them, you can do
        so, the return process and shipping charge (Section 4) will apply per item/return request,
        and the remaining items in your order are unaffected.
      </p>
    ),
  },
  {
    id: "non-serviceable-pickup",
    title: "Non-Serviceable Pickup Locations",
    content: (
      <p className="policy-page__text">
        If our reverse pickup service is not available at your location, you will need to self-ship
        the product to our facility using a reliable courier service of your choice. Once we receive
        and verify the product, the standard return shipping charge (Section 4) will still apply,
        and we will reimburse reasonable, standard self-shipping costs as part of your refund,
        provided you share the courier receipt/proof of shipment. Please retain proof of shipment
        until your return is fully processed.
      </p>
    ),
  },
  {
    id: "return-packaging",
    title: "Return Packaging Requirement",
    content: (
      <p className="policy-page__text">
        Please pack the product securely for return pickup or self-shipping, ideally in its original
        packaging, to prevent damage in transit. Returns that arrive damaged due to inadequate
        packaging on the customer&apos;s part may be declined, and the product will be shipped back.
      </p>
    ),
  },
  {
    id: "refusal-of-delivery",
    title: "Refusal of Delivery",
    content: (
      <p className="policy-page__text">
        If you refuse to accept a delivery at your doorstep, your order will be treated as a
        customer-initiated cancellation and not as a return, the unboxing video requirement (Section
        2) does not apply in such cases, since the product is never unpacked. For Cash on Delivery
        (COD) orders refused at delivery, please note that repeated refusals may result in COD being
        disabled for your account on future orders, and such orders may only be accepted on a prepaid
        basis going forward. For prepaid orders refused at delivery, refunds will be processed as per
        Section 6 once the product is received back at our facility, less applicable shipping charges
        (Section 4).
      </p>
    ),
  },
  {
    id: "missing-items",
    title: "Missing Items Claim",
    content: (
      <p className="policy-page__text">
        If you believe an item is missing from your delivered order, please contact us within 48
        hours of delivery at{" "}
        <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
          support@sahsha.co.in
        </a>
        , or{" "}
        <a href="tel:+916352109106" className="content-page__legal-link">
          +91 6352109106
        </a>
        , along with your mandatory unboxing video clearly showing the package contents at the time
        of opening. Claims raised without an unboxing video, or after this 48-hour window, cannot be
        verified or processed.
      </p>
    ),
  },
  {
    id: "fraudulent-returns",
    title: "Fraudulent Returns",
    content: (
      <p className="policy-page__text">
        We reserve the right to refuse a return, exchange, or refund, and to take appropriate action
        (including blocking the account from future orders), where we identify a return as
        fraudulent, including but not limited to: items inconsistent with what was originally shipped,
        repeated misuse of the return/exchange policy, missing or tampered unboxing videos, or any
        attempt to misrepresent the condition of a product. Such cases will be communicated to you
        with the relevant reason, and our decision in such cases will be final.
      </p>
    ),
  },
  {
    id: "need-help",
    title: "Need Help?",
    content: (
      <>
        <p className="policy-page__text">
          For any questions about your return, refund, or exchange, reach out to us:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
              support@sahsha.co.in
            </a>
          </li>
          <li>
            <strong>Phone:</strong>{" "}
            <a href="tel:+916352109106" className="content-page__legal-link">
              +91 6352109106
            </a>
          </li>
          <li>
            <strong>Account Dashboard:</strong>{" "}
            <LocalizedClientLink href="/account/orders" className="content-page__legal-link">
              track your order
            </LocalizedClientLink>
          </li>
        </ul>
        <p className="policy-page__text">
          Track your return status anytime by logging into your account. We&apos;re committed to
          making this process as smooth as possible for you.
        </p>
        <p className="policy-page__text policy-page__text--note">~TEAM SAHSHA</p>
      </>
    ),
  },
]

export const RETURNS_REFUND_POLICY_TOC = RETURNS_REFUND_POLICY_SECTIONS.map(({ id, title }) => ({
  id,
  title,
}))
