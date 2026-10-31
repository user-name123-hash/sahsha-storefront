import type { ReactNode } from "react"

export type TermsOfUseSection = {
  id: string
  title: string
  content: ReactNode
}

export const TERMS_OF_USE_INTRO = (
  <p className="policy-page__text">
    Welcome to &ldquo;SAHSHA&rdquo; the Brand. These Terms of Use (&ldquo;Terms&rdquo;) govern your
    access to and use of sahsha.co.in the Website and any purchase made through it. By accessing or
    using the website, placing an order, or creating an account, you agree to be bound by these
    terms.
  </p>
)

export const TERMS_OF_USE_SECTIONS: TermsOfUseSection[] = [
  {
    id: "about-us",
    title: "About Us",
    content: (
      <>
        <p className="policy-page__text">
          SAHSHA is owned and operated by Sahil Mahesh Narayani, a proprietorship business
          registered as an MSME (Udyam Registration No. [UDYAM-GJ-09-0073939]), based in Ahmedabad,
          Gujarat, India. We are an inventory based e-commerce entity, meaning all products listed
          and sold on this Website are sold directly by us. We are not a marketplace hosting
          third-party sellers. Business Address: Bhat, Gandhinagar, Gujarat, India Contact Email:{" "}
          <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
            support@sahsha.co.in
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "account-registration",
    title: "Account Registration",
    content: (
      <>
        <p className="policy-page__text">
          You may be required to create an account to place orders or access certain features. You
          are responsible for:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>Maintaining the confidentiality of your login credentials.</li>
          <li>All activities that occur under your account.</li>
          <li>
            Notifying us immediately at{" "}
            <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
              support@sahsha.co.in
            </a>
            . of any unauthorized use of your account.
          </li>
        </ul>
        <p className="policy-page__text">
          We reserve the right to suspend or terminate accounts that provide false information or
          violate these Terms.
        </p>
      </>
    ),
  },
  {
    id: "products-pricing-availability",
    title: "Products, Pricing & Availability",
    content: (
      <ul className="content-page__legal-list content-page__legal-list--single">
        <li>
          All prices listed on the Website are in Indian Rupees (INR) and are inclusive of
          applicable taxes unless stated otherwise.
        </li>
        <li>
          We display the total price along with a breakup of any additional charges (such as
          shipping fees), where applicable, before you complete checkout.
        </li>
        <li>
          Product images are for representational purposes. Due to screen/display variations, actual
          colour may differ slightly from what is shown.
        </li>
        <li>
          We reserve the right to limit order quantities, refuse, or cancel orders at our
          discretion, including in cases of pricing errors, suspected fraud, or stock
          unavailability. If we cancel a prepaid order, a full refund will be processed to your
          original payment method.
        </li>
        <li>
          We do not engage in price manipulation or impose unjustified pricing on any product.
        </li>
      </ul>
    ),
  },
  {
    id: "order-placement-acceptance",
    title: "Order Placement & Acceptance",
    content: (
      <ul className="content-page__legal-list content-page__legal-list--single">
        <li>
          Placing an order on the Website constitutes an offer to purchase. An order is confirmed
          only once you receive an order confirmation email/SMS from us — this does not guarantee
          product availability, which is subject to final confirmation of shipment.
        </li>
        <li>
          We do not record your consent for any purchase using pre-ticked checkboxes; all consent
          given during checkout is explicit and affirmative.
        </li>
        <li>
          For Cash on Delivery (COD) orders, we reserve the right to call/verify your contact
          number before dispatch, and to cancel COD orders that fail verification or have a history
          of refusal at delivery.
        </li>
      </ul>
    ),
  },
  {
    id: "cancellations",
    title: "Cancellations",
    content: (
      <ul className="content-page__legal-list content-page__legal-list--single">
        <li>
          Orders can be cancelled free of charge before they are shipped, by writing to{" "}
          <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
            support@sahsha.co.in
          </a>
          , contacting at customer support number or via your account dashboard.
        </li>
        <li>
          We do not charge cancellation fees to customers unless we, too, bear equivalent charges
          when cancelling an order unilaterally, in line with applicable consumer protection rules.
        </li>
        <li>
          Once an order is shipped, it cannot be cancelled; you may initiate a return as per our{" "}
          <a href="/returns-refund-policy" className="content-page__legal-link">
            Returns Policy
          </a>{" "}
          after delivery.
        </li>
      </ul>
    ),
  },
  {
    id: "shipping-delivery",
    title: "Shipping & Delivery",
    content: (
      <p className="policy-page__text">
        We ship across serviceable locations in India through our logistics partners. Shipping
        charges, if any, will be clearly displayed at checkout before you complete your order.
        Estimated delivery timelines will be communicated at the time of order confirmation and are
        indicative only, actual delivery may vary due to logistics partner delays, weather, regional
        restrictions, or circumstances beyond our control (force majeure). We are not liable for
        delays caused by such events, except as required under applicable law.
      </p>
    ),
  },
  {
    id: "returns-refunds-exchanges",
    title: "Returns, Refunds & Exchanges",
    content: (
      <>
        <p className="policy-page__text">
          Our detailed policy is available on our Returns &amp; Refunds page. In summary:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>
            Buyers may initiate a return request within 3 days of delivery, including for defective
            or incorrectly shipped items. Requests raised after this window will not be accepted.
          </li>
          <li>
            All returns are subject to verification at our facility before a refund is processed.
          </li>
          <li>
            Full details on the return process, eligibility, and refund timelines are available on
            our{" "}
            <a href="/returns-refund-policy" className="content-page__legal-link">
              Returns Policy
            </a>{" "}
            page.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual Property",
    content: (
      <p className="policy-page__text">
        All content on this Website, including but not limited to the &ldquo;SAHSHA&rdquo; logo,
        brand name, product photography, graphics, text, and design is owned by us and is protected
        under applicable Indian intellectual property laws. You may not copy, reproduce, distribute,
        modify, or use any content from this Website for personal or commercial purposes without our
        prior written consent.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    content: (
      <>
        <p className="policy-page__text">You agree NOT to:</p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>Use the Website for any unlawful purpose or in violation of these Terms.</li>
          <li>
            Attempt to gain unauthorized access to our systems, servers, or another user&apos;s
            account.
          </li>
          <li>
            Upload or transmit any content that is defamatory, obscene, infringing, or harmful.
          </li>
          <li>
            Use automated tools (bots, scrapers) to extract data from the Website without our
            permission.
          </li>
          <li>Post fake reviews or misrepresent yourself as a different consumer.</li>
        </ul>
        <p className="policy-page__text">
          We reserve the right to suspend access for any user who violates these provisions.
        </p>
      </>
    ),
  },
  {
    id: "reviews-user-content",
    title: "Reviews & User Content",
    content: (
      <p className="policy-page__text">
        If you submit a product review, rating, or any other content on the Website, you grant us a
        non-exclusive, royalty-free right to use, reproduce, and display that content for marketing
        and Website purposes. You agree not to post false, misleading, or paid reviews
        misrepresenting your experience.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    content: (
      <p className="policy-page__text">
        To the maximum extent permitted by law, &ldquo;SAHSHA&rdquo; shall not be liable for any
        indirect, incidental, special, or consequential damages arising from your use of (or inability
        to use) the Website, including but not limited to loss of data, loss of profits, or business
        interruption except where such liability arises from our own deficiency, defect, or
        misrepresentation as recognized under the Consumer Protection Act, 2019, and applicable
        rules. Our total liability for any claim related to your order shall not exceed the amount
        you paid for that order.
      </p>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    content: (
      <p className="policy-page__text">
        You agree to indemnify and hold harmless SAHSHA, its proprietor, employees, and affiliates
        from any claims, damages, or liabilities arising out of your breach of these Terms or your
        misuse of the Website.
      </p>
    ),
  },
  {
    id: "care-instructions",
    title: "Care Instructions Disclaimer",
    content: (
      <p className="policy-page__text">
        Unless otherwise specified on the product label or product page, certain fabrics may require
        gentle hand-wash or dry-cleaning only. We recommend following the specific care instructions
        provided with each product to maintain quality and longevity. We are not liable for damage
        caused by improper care or washing methods not recommended for the fabric.
      </p>
    ),
  },
  {
    id: "grievance-redressal",
    title: "Grievance Redressal",
    content: (
      <p className="policy-page__text">
        In accordance with the Consumer Protection (E-Commerce) Rules, 2020, we have a Grievance
        redressal system to address consumer complaints regarding products, orders, or these Terms.
        Complaints will be acknowledged within 48 hours and resolved at the earliest. Grievance
        Email:{" "}
        <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
          support@sahsha.co.in
        </a>
        . Address: Bhat, Gandhinagar, Gujarat, India
      </p>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to These Terms",
    content: (
      <p className="policy-page__text">
        We may revise these Terms from time to time to reflect changes in our practices, products,
        or applicable law. The &ldquo;Last Updated&rdquo; date at the end of this page reflects the most recent
        revision. Continued use of the Website after changes are posted constitutes your acceptance
        of the revised Terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law & Jurisdiction",
    content: (
      <p className="policy-page__text">
        These Terms shall be governed by and construed in accordance with the laws of India. Any
        disputes arising out of or in connection with these Terms or your use of the Website shall
        be subject to the exclusive jurisdiction of the courts at Ahmedabad, Gujarat.
      </p>
    ),
  },
  {
    id: "contact-us",
    title: "Contact Us",
    content: (
      <p className="policy-page__text">
        For any questions regarding these Terms, please contact us at: SAHSHA Email:{" "}
        <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
          support@sahsha.co.in
        </a>{" "}
        Address: Bhat, Gandhinagar, Gujarat, India Contact Number:{" "}
        <a href="tel:+916352109106" className="content-page__legal-link">
          +91 6352109106
        </a>
      </p>
    ),
  },
]

export const TERMS_OF_USE_TOC = TERMS_OF_USE_SECTIONS.map(({ id, title }) => ({
  id,
  title,
}))
