import { LegalPage, LegalPlaceholder } from '@/components/legal/LegalContent';

export default function DoNotSellPage() {
  return (
    <LegalPage title="Do Not Sell or Share My Personal Information" lastUpdated="August 8, 2026">
      <h2>Your Privacy Rights</h2>
      <p>
        Residents of states with comprehensive privacy laws (including California&apos;s CCPA/CPRA, and other
        states such as Colorado, Connecticut, Virginia, Utah, and Texas) generally have the right to:
      </p>
      <ul>
        <li><strong>Know</strong> what personal information we collect about you</li>
        <li><strong>Correct</strong> inaccurate personal information</li>
        <li><strong>Request deletion</strong> of your personal information</li>
        <li><strong>Opt out</strong> of the &quot;sale&quot; or &quot;sharing&quot; of your personal information</li>
        <li><strong>Non-discrimination</strong> for exercising your rights</li>
      </ul>

      <h2>Do We Sell Your Personal Information?</h2>
      <p>
        We do not sell your personal information for money. However, under some state laws, the use of certain
        cookies and tracking technologies for advertising and affiliate-attribution purposes may be considered a
        &quot;sale&quot; or &quot;sharing&quot; of personal information.
      </p>
      <p>Specifically:</p>
      <ul>
        <li>We use cookies to track affiliate clicks and conversions</li>
        <li>This data is shared with affiliate networks for commission attribution</li>
        <li>Your IP address is hashed (anonymized) before storage</li>
      </ul>

      <h2>How to Opt-Out</h2>
      <p>You have several ways to opt-out:</p>
      <h3>Option 1: Cookie Settings</h3>
      <p>Click &quot;Cookie Settings&quot; / &quot;Customize&quot; at the bottom of our website and disable non-essential cookie categories.</p>
      <h3>Option 2: Global Privacy Control</h3>
      <p>
        Enable Global Privacy Control (GPC) in your browser or a supported browser extension. We detect the GPC
        signal and automatically apply your opt-out preference across the site — you do not need to also submit a
        separate request.
      </p>
      <h3>Option 3: Email Request</h3>
      <p>Send an email to <strong>privacy@deskholt.com</strong> with the subject line &quot;Do Not Sell or Share My Information.&quot;</p>
      <p>Please include:</p>
      <ul>
        <li>Your full name</li>
        <li>Your email address (to verify your identity)</li>
        <li>Your state of residence</li>
      </ul>
      <p>We will process your request within the timeframe required by applicable law (generally 15 business days).</p>

      <h2>Verification Process</h2>
      <p>To protect your privacy, we may need to verify your identity before processing your request. This may involve:</p>
      <ul>
        <li>Confirming your email address</li>
        <li>Asking for information that matches what we have on file</li>
      </ul>

      <h2>Authorized Agents</h2>
      <p>You may use an authorized agent to submit a request on your behalf. The agent must provide:</p>
      <ul>
        <li>Written permission from you</li>
        <li>Verification of your identity</li>
        <li>Their own identity verification</li>
      </ul>

      <h2>Your Other Rights</h2>
      <p>Even if you opt out of the &quot;sale&quot;/&quot;sharing&quot; of your information, you still have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your information</li>
        <li>Appeal a denied request, where your state&apos;s law provides for it</li>
      </ul>

      <h2>Updates to This Page</h2>
      <p>We may update this page periodically. The &quot;Last Updated&quot; date indicates when changes were made.</p>

      <h2>Contact Us</h2>
      <p>If you have questions about your privacy rights, contact our Privacy Officer:</p>
      <p>
        <strong>Email:</strong> privacy@deskholt.com
        <br />
        <strong>Phone:</strong> <LegalPlaceholder>Phone number not yet provided — optional in most states</LegalPlaceholder>
        <br />
        <strong>Address:</strong> <LegalPlaceholder>Contact address not yet provided — required before launch</LegalPlaceholder>
      </p>
    </LegalPage>
  );
}
