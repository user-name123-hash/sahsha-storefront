import type { ReactNode } from "react"

export type PrivacyPolicySection = {
  id: string
  num: string
  title: string
  content: ReactNode
}

export const PRIVACY_POLICY_INTRO = (
  <>
    <p className="policy-page__text">
      Sahsha (&ldquo;SAHSHA&rdquo;) is a women&apos;s ethnic and western wear brand — kurtis, kurti
      sets, sarees, and more — operated by SAHIL MAHESH NARAYANI, a proprietorship firm based in
      Ahmedabad, Gujarat. This Privacy Policy explains how we collect, use, store, share, and
      protect your personal data when you visit or shop on sahsha.co.in (&ldquo;the
      Website&rdquo;), in accordance with the Digital Personal Data Protection Act, 2023
      (&ldquo;DPDP Act&rdquo;) and applicable rules made thereunder.
    </p>
    <p className="policy-page__text policy-page__text--note">
      By using the Website, you agree to the practices described in this Policy.
    </p>
  </>
)

export const PRIVACY_POLICY_SECTIONS: PrivacyPolicySection[] = [
  {
    id: "who-we-are",
    num: "01",
    title: "Who We Are",
    content: (
      <>
        <p className="policy-page__text">
          &ldquo;SAHSHA&rdquo; is the &ldquo;Data Fiduciary&rdquo; under the DPDP Act for the
          personal data collected through this Website — meaning we determine the purpose and
          means of processing your personal data.
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>
            <strong>Registered Address:</strong> Bhat, Gandhinagar, Gujarat, India.
          </li>
          <li>
            <strong>Contact Email:</strong>{" "}
            <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
              support@sahsha.co.in
            </a>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "information-we-collect",
    num: "02",
    title: "Information We Collect",
    content: (
      <>
        <p className="policy-page__text">
          We collect only the data necessary to provide our services. This includes:
        </p>
        <div className="content-page__legal-table-wrap">
          <table className="content-page__legal-table">
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Examples</th>
                <th scope="col">When Collected</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Identity &amp; Contact Data</td>
                <td>
                  Name, email address, phone number, billing/shipping address
                </td>
                <td>Account creation, checkout, newsletter signup</td>
              </tr>
              <tr>
                <td>Order &amp; Transaction Data</td>
                <td>Order history, items purchased, order value, payment status</td>
                <td>Placing an order</td>
              </tr>
              <tr>
                <td>Payment Data</td>
                <td>
                  Payment method, transaction ID (card/UPI details are processed directly by our
                  payment gateway and not stored by us)
                </td>
                <td>Checkout</td>
              </tr>
              <tr>
                <td>Communication Data</td>
                <td>
                  Messages sent via contact form, customer support, WhatsApp/SMS (if used)
                </td>
                <td>Customer support interactions</td>
              </tr>
              <tr>
                <td>Device &amp; Usage Data</td>
                <td>
                  IP address, browser type, device type, pages visited, time spent, referral
                  source
                </td>
                <td>Automatically, via cookies and analytics tools</td>
              </tr>
              <tr>
                <td>Marketing Preference Data</td>
                <td>Email/SMS subscription status, ad interaction data</td>
                <td>Newsletter signup, ad clicks</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="policy-page__text">
          We do not knowingly collect any special category data such as health information,
          religious beliefs, or biometric data through this Website.
        </p>
      </>
    ),
  },
  {
    id: "how-we-collect",
    num: "03",
    title: "How We Collect Information",
    content: (
      <ul className="content-page__legal-list content-page__legal-list--single">
        <li>
          <strong>Directly from you</strong> — when you create an account, place an order, sign
          up for our newsletter, or contact customer support.
        </li>
        <li>
          <strong>Automatically</strong> — through cookies, web beacons, and tracking tools
          (Google Analytics, Meta Pixel, Google Tag Manager) when you browse the Website.
        </li>
        <li>
          <strong>From third parties</strong> — such as our payment gateway (confirming payment
          status) or courier partner (confirming delivery status).
        </li>
      </ul>
    ),
  },
  {
    id: "purpose-of-processing",
    num: "04",
    title: "Purpose of Processing Your Data",
    content: (
      <>
        <p className="policy-page__text">
          We process your personal data strictly for the following itemized purposes:
        </p>
        <ol className="content-page__legal-ordered-list">
          <li>
            <strong>To fulfil orders</strong> — processing payments, generating invoices, and
            arranging delivery via our courier/logistics partner.
          </li>
          <li>
            <strong>To verify your identity</strong> — for account security and fraud prevention
            (e.g., OTP/phone verification).
          </li>
          <li>
            <strong>To communicate with you</strong> — order confirmations, shipping updates, and
            responses to support queries.
          </li>
          <li>
            <strong>To send marketing communications</strong> — only if you have opted in; you may
            withdraw this consent at any time.
          </li>
          <li>
            <strong>To improve the Website</strong> — analyzing browsing behaviour to improve
            product listings, site performance, and user experience.
          </li>
          <li>
            <strong>To run advertising campaigns</strong> — measuring ad performance via tools such
            as Meta Pixel/Conversions API and Google Analytics, with your consent where required.
          </li>
          <li>
            <strong>To comply with legal obligations</strong> — such as tax records, consumer
            protection requirements, or law enforcement requests.
          </li>
        </ol>
        <p className="policy-page__text">
          We do not use your data for any purpose beyond what is stated above without seeking
          fresh consent.
        </p>
      </>
    ),
  },
  {
    id: "consent",
    num: "05",
    title: "Consent",
    content: (
      <>
        <p className="policy-page__text">
          We seek your consent before collecting personal data for purposes that require it
          (such as marketing communications). Consent is:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>
            <strong>Free, specific, informed, and unambiguous</strong> — given through a clear
            affirmative action (e.g., checking a box, signing up for our newsletter).
          </li>
          <li>
            <strong>Itemized</strong> — you may consent to order processing without being forced
            to consent to marketing communications.
          </li>
        </ul>
        <p className="policy-page__text">
          <strong>Withdrawing Consent:</strong> You can withdraw your consent at any time by
          emailing{" "}
          <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
            support@sahsha.co.in
          </a>
          , using the &ldquo;unsubscribe&rdquo; link in marketing emails/SMS, or through your
          account settings (if applicable). Withdrawing consent will not affect the lawfulness of
          processing carried out before withdrawal, and will not affect our ability to complete an
          order you&apos;ve already placed (e.g., we may still need to process shipping data to
          deliver a product already paid for).
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    num: "06",
    title: "Cookies & Tracking Technologies",
    content: (
      <>
        <p className="policy-page__text">
          Our Website uses cookies and similar tracking technologies to enhance your browsing
          experience, remember your cart, and measure marketing performance. Specifically, we use:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>
            <strong>Google Analytics (GA4)</strong> — to understand site traffic and user
            behaviour.
          </li>
          <li>
            <strong>Meta Pixel &amp; Conversions API</strong> — to measure the effectiveness of
            our advertising and show you relevant ads on Meta platforms (Facebook/Instagram).
          </li>
          <li>
            <strong>Google Tag Manager</strong> — to manage the above tracking scripts on our
            Website.
          </li>
        </ul>
        <p className="policy-page__text">
          You can control or disable cookies through your browser settings. Disabling cookies may
          affect certain features of the Website, such as your shopping cart.
        </p>
      </>
    ),
  },
  {
    id: "how-we-share",
    num: "07",
    title: "How We Share Your Information",
    content: (
      <>
        <p className="policy-page__text">
          We do not sell your personal data. We share data only with trusted service providers
          (&ldquo;Data Processors&rdquo;) strictly to the extent necessary to operate our
          business:
        </p>
        <div className="content-page__legal-table-wrap">
          <table className="content-page__legal-table">
            <thead>
              <tr>
                <th scope="col">Service Provider Category</th>
                <th scope="col">Purpose</th>
                <th scope="col">Data Shared</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Payment Gateway</td>
                <td>Processing payments securely</td>
                <td>Name, contact details, payment/transaction data</td>
              </tr>
              <tr>
                <td>Logistics/Courier Partner</td>
                <td>
                  Order delivery, KYC where mandated by courier regulations
                </td>
                <td>Name, address, phone number</td>
              </tr>
              <tr>
                <td>Cloud Hosting &amp; Storage (Google Cloud, AWS S3)</td>
                <td>Securely storing Website data, images, backups</td>
                <td>Account and order data (stored, not shared for marketing)</td>
              </tr>
              <tr>
                <td>Communication Services (Google SMTP, Twilio)</td>
                <td>Sending order emails, OTP/phone verification</td>
                <td>Email address, phone number</td>
              </tr>
              <tr>
                <td>
                  Analytics &amp; Advertising (Google Analytics, Meta Pixel/CAPI, Google Tag
                  Manager)
                </td>
                <td>Measuring site usage and ad performance</td>
                <td>Device/usage data, hashed contact data (where applicable)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="policy-page__text">
          These providers are contractually bound to use your data only for the purpose
          we&apos;ve engaged them for, and not for their own independent purposes.
        </p>
        <p className="policy-page__text">
          We may also disclose your data if required by law, court order, or government request,
          or to protect our legal rights.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    num: "08",
    title: "Data Retention",
    content: (
      <>
        <p className="policy-page__text">
          We retain your personal data only for as long as necessary to fulfil the purposes
          outlined in this Policy, including:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>
            <strong>Order &amp; transaction data</strong> — retained for the duration required
            under applicable tax and consumer protection laws (typically up to 7 years for
            financial records).
          </li>
          <li>
            <strong>Account data</strong> — retained while your account remains active, or until
            you request deletion.
          </li>
          <li>
            <strong>Marketing data</strong> — retained until you withdraw consent or unsubscribe.
          </li>
        </ul>
        <p className="policy-page__text">
          Once data is no longer required, we take steps to securely delete or anonymize it.
        </p>
      </>
    ),
  },
  {
    id: "data-security",
    num: "09",
    title: "Data Security",
    content: (
      <>
        <p className="policy-page__text">
          We implement reasonable security safeguards to protect your personal data against
          unauthorized access, alteration, disclosure, or destruction. These include:
        </p>
        <ul className="content-page__legal-list content-page__legal-list--single">
          <li>SSL/TLS encryption for data transmitted through the Website.</li>
          <li>Secure cloud storage with access controls (Google Cloud / AWS).</li>
          <li>
            PCI-DSS compliant payment processing — we do not store your full card details on our
            servers; this is handled directly by our payment gateway partner.
          </li>
          <li>Two-step verification and OTP-based authentication for account/order security.</li>
        </ul>
        <p className="policy-page__text">
          While we follow leading industry security standard practices, no method of transmission
          over the internet can guarantee absolute security.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    num: "10",
    title: "Your Rights as a Data Principal",
    content: (
      <>
        <p className="policy-page__text">Under the DPDP Act, you have the right to:</p>
        <ol className="content-page__legal-ordered-list">
          <li>
            <strong>Access</strong> — request a copy of the personal data we hold about you.
          </li>
          <li>
            <strong>Correction</strong> — request correction of inaccurate or incomplete data.
          </li>
          <li>
            <strong>Erasure</strong> — request deletion of your personal data, where it is no
            longer necessary for the purpose it was collected for.
          </li>
          <li>
            <strong>Withdraw Consent</strong> — at any time, for any consent-based processing
            (e.g., marketing).
          </li>
          <li>
            <strong>Grievance Redressal</strong> — raise a complaint regarding how we handle
            your data.
          </li>
          <li>
            <strong>Nominate a Representative</strong> — to exercise your rights on your behalf
            in case of death or incapacity.
          </li>
        </ol>
        <p className="policy-page__text">
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
            support@sahsha.co.in
          </a>
          . We will respond within a reasonable timeframe, and in any case as required under
          applicable law.
        </p>
      </>
    ),
  },
  {
    id: "grievances",
    num: "11",
    title: "Grievances",
    content: (
      <p className="policy-page__text">
        In accordance with applicable law, we have designated a Grievance email &amp; Contact
        Number for any concerns regarding this Privacy Policy or the handling of your personal
        data: Email:{" "}
        <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
          support@sahsha.co.in
        </a>{" "}
        · Contact:{" "}
        <a href="tel:+916352109106" className="content-page__legal-link">
          +91 6352109106
        </a>
        .
      </p>
    ),
  },
  {
    id: "changes",
    num: "12",
    title: "Changes to This Policy",
    content: (
      <p className="policy-page__text">
        We may update this Privacy Policy from time to time to reflect changes in our practices
        or applicable law. The &ldquo;Last Updated&rdquo; date at the end of this page will
        indicate when the latest revision was made. We encourage you to review this page
        periodically. Material changes will be notified to you via email or a prominent notice
        on the Website where required by law.
      </p>
    ),
  },
  {
    id: "contact-us",
    num: "13",
    title: "Contact Us",
    content: (
      <>
        <p className="policy-page__text">
          For any questions about this Privacy Policy or how we handle your data, reach out to
          us at:
        </p>
        <div className="content-page__legal-contact">
          <p className="content-page__legal-contact-name">SAHSHA</p>
          <p className="policy-page__text">
            Email:{" "}
            <a href="mailto:support@sahsha.co.in" className="content-page__legal-link">
              support@sahsha.co.in
            </a>
          </p>
          <p className="policy-page__text">Address: Bhat, Gandhinagar, Gujarat.</p>
        </div>
      </>
    ),
  },
]

export const PRIVACY_POLICY_TOC = PRIVACY_POLICY_SECTIONS.map(({ id, title }) => ({
  id,
  title,
}))
