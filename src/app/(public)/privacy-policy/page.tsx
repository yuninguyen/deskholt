import Link from 'next/link';
import { LegalPage, LegalPlaceholder } from '@/components/legal/LegalContent';

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="August 8, 2026">
      <p>
        At Deskholt.com (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we respect your privacy and are
        committed to protecting your personal information. This Privacy Policy explains how we collect, use,
        disclose, and safeguard your information when you visit our website.
      </p>

      <h2>1. Information We Collect</h2>
      <h3>1.1 Information You Provide to Us</h3>
      <ul>
        <li>Name and email address (when you subscribe to our newsletter or contact us)</li>
        <li>Comments and feedback you submit</li>
        <li>Any other information you voluntarily provide</li>
      </ul>
      <h3>1.2 Information Collected Automatically</h3>
      <ul>
        <li>
          <strong>IP Address:</strong> We collect and hash your IP address for security, fraud prevention, and
          analytics purposes. We do not store raw IP addresses.
        </li>
        <li>
          <strong>Browser and Device Information:</strong> Browser type, operating system, device type, screen
          resolution
        </li>
        <li>
          <strong>Usage Data:</strong> Pages visited, time spent on pages, referral sources, click patterns
        </li>
        <li>
          <strong>Cookies and Similar Technologies:</strong> See our{' '}
          <Link href="/cookie-policy">Cookie Policy</Link> for details
        </li>
      </ul>
      <h3>1.3 Information from Third Parties</h3>
      <ul>
        <li>Affiliate networks (Amazon Associates, Awin, Impact, CJ Affiliate) may provide conversion data</li>
        <li>Analytics providers (e.g., Google Analytics, Cloudflare Analytics)</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Operate, maintain, and improve our website</li>
        <li>Process affiliate links and track clicks (via <code>/go/</code> redirects)</li>
        <li>Detect and prevent fraud and abuse (click fraud prevention via IP hashing and rate limiting)</li>
        <li>Understand how users interact with our content</li>
        <li>Send you newsletters and updates (if you opt-in)</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>3. Data Retention</h2>
      <ul>
        <li><strong>Hashed IP addresses:</strong> Retained for up to 365 days for analytics and fraud prevention</li>
        <li><strong>Click data:</strong> Retained for up to 3 years for affiliate reconciliation and tax purposes</li>
        <li><strong>Newsletter subscribers:</strong> Retained until you unsubscribe</li>
        <li><strong>Conversion data:</strong> Retained for up to 7 years for tax reporting</li>
      </ul>

      <h2>4. How We Share Your Information</h2>
      <h3>4.1 Affiliate Networks</h3>
      <p>
        When you click an affiliate link (<code>/go/</code> redirect), we share click data (click ID, timestamp,
        product ID) with the respective affiliate network to track commissions.
      </p>
      <h3>4.2 Service Providers</h3>
      <p>We may share your information with third-party service providers who help us operate our website, including:</p>
      <ul>
        <li>Cloudflare (CDN and security)</li>
        <li>VPS hosting provider</li>
        <li>Email service provider</li>
        <li>Analytics providers</li>
      </ul>
      <h3>4.3 Legal Requirements</h3>
      <p>We may disclose your information if required by law or to protect our rights, property, or safety.</p>
      <p>
        We do not sell your personal information for money, and we do not share it with third parties for their own
        independent marketing purposes.
      </p>

      <h2>5. Your Privacy Rights</h2>
      <p>Depending on where you live, state and international law may give you rights over your personal information.</p>
      <h3>5.1 U.S. State Privacy Rights (California, Colorado, Connecticut, Virginia, Utah, Texas, and other states with comprehensive privacy laws)</h3>
      <p>If you are a resident of a state with a comprehensive consumer privacy law, you generally have the right to:</p>
      <ul>
        <li><strong>Know / Access</strong> what personal information we collect about you</li>
        <li><strong>Correct</strong> inaccurate personal information</li>
        <li><strong>Delete</strong> your personal information</li>
        <li><strong>Opt out</strong> of the &quot;sale&quot; of your personal information and of &quot;sharing&quot; for cross-context (targeted) advertising</li>
        <li><strong>Non-discrimination</strong> for exercising your rights</li>
        <li><strong>Appeal</strong> a denied request (where applicable under your state&apos;s law)</li>
      </ul>
      <p>
        To exercise your rights, visit our <Link href="/do-not-sell">Do Not Sell / Opt-Out of Sharing My Personal Information</Link> page
        or contact us at <strong>privacy@deskholt.com</strong>.
      </p>
      <p>
        <strong>Global Privacy Control (GPC):</strong> Our website is configured to detect and automatically honor the
        GPC opt-out signal from supported browsers and browser extensions as an opt-out of sale/sharing, consistent
        with the requirements of California, Colorado, Connecticut, and other states that recognize GPC as a valid
        universal opt-out mechanism.
      </p>
      <h3>5.2 European Residents (GDPR/UK GDPR)</h3>
      <p>
        Where GDPR applies, our legal bases for processing your information are: performance of a contract or steps
        toward one (e.g., newsletter delivery), our legitimate interests (e.g., fraud prevention, analytics,
        affiliate tracking), and your consent (e.g., non-essential cookies).
      </p>
      <p>You have the right to:</p>
      <ul>
        <li>Access, rectify, or delete your data</li>
        <li>Restrict or object to processing</li>
        <li>Data portability</li>
        <li>Withdraw consent at any time (without affecting processing carried out before withdrawal)</li>
        <li>Lodge a complaint with your local data protection supervisory authority</li>
      </ul>
      <p>
        Because our servers are located in the United States, personal information from EU/UK visitors may be
        transferred internationally. Where required, we rely on appropriate safeguards (such as Standard Contractual
        Clauses) for such transfers.
      </p>

      <h2>6. Do Not Sell / Do Not Share My Personal Information</h2>
      <p>
        We do not sell your personal information for money. However, our use of cookies and similar technologies for
        advertising and affiliate-attribution purposes may be considered a &quot;sale&quot; or &quot;sharing&quot;
        under some state privacy laws (e.g., CCPA/CPRA).
      </p>
      <p>You can opt out by:</p>
      <ul>
        <li>Clicking the &quot;Do Not Sell or Share My Personal Information&quot; link in our footer</li>
        <li>Adjusting your cookie preferences via &quot;Cookie Settings&quot; (Customize)</li>
        <li>Enabling Global Privacy Control in a supported browser — we will detect and honor it automatically</li>
        <li>Emailing <strong>privacy@deskholt.com</strong></li>
      </ul>

      <h2>7. Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect your information:</p>
      <ul>
        <li><strong>IP hashing:</strong> We use SHA-256 hashing with a secret salt to anonymize IP addresses</li>
        <li><strong>Encryption:</strong> API keys and sensitive data are encrypted using AES-256-GCM</li>
        <li><strong>Secure connections:</strong> All data is transmitted via HTTPS</li>
        <li><strong>Access controls:</strong> Limited personnel have access to sensitive data</li>
      </ul>
      <p>No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>

      <h2>8. Children&apos;s Privacy</h2>
      <p>
        Deskholt.com is not directed to children under 13, and we do not knowingly collect personal information from
        children under 13. If we learn we have collected such information, we will delete it. Parents who believe we
        may have collected information from a child under 13 should contact us at <strong>privacy@deskholt.com</strong>.
      </p>

      <h2>9. Third-Party Links</h2>
      <p>
        Our website contains links to third-party websites (Amazon, Walmart, Target, etc.). We are not responsible
        for their privacy practices. We encourage you to review their privacy policies.
      </p>

      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. The updated version will be indicated by the &quot;Last
        Updated&quot; date at the top of this page. Material changes will be highlighted where required by law.
      </p>

      <h2>11. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, contact us:</p>
      <p>
        <strong>Email:</strong> privacy@deskholt.com
        <br />
        <strong>Address:</strong> <LegalPlaceholder>Contact address not yet provided — required before launch</LegalPlaceholder>
      </p>
    </LegalPage>
  );
}
