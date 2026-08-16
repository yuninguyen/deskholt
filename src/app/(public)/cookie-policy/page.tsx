import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalContent';

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" lastUpdated="August 8, 2026">
      <p>This Cookie Policy explains how Deskholt.com (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies and similar technologies.</p>

      <h2>1. What Are Cookies?</h2>
      <p>Cookies are small text files stored on your device when you visit a website. They help us understand how you use our site and improve your experience.</p>

      <h2>2. Types of Cookies We Use</h2>
      <h3>2.1 Essential Cookies (Strictly Necessary)</h3>
      <p>These cookies are necessary for the website to function properly and cannot be turned off.</p>
      <table>
        <thead>
          <tr><th>Cookie Name</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td><code>session</code></td><td>Maintains your session while browsing</td><td>Session</td></tr>
          <tr><td><code>csrf_token</code></td><td>Protects against cross-site request forgery</td><td>Session</td></tr>
          <tr><td><code>cookie_consent</code></td><td>Stores your cookie preferences</td><td>365 days</td></tr>
        </tbody>
      </table>

      <h3>2.2 Analytics Cookies</h3>
      <p>These help us understand how visitors interact with our site. Loaded only with your consent (or if Global Privacy Control is not detected and you accept via the banner).</p>
      <table>
        <thead>
          <tr><th>Cookie Name</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td><code>_ga</code></td><td>Google Analytics — distinguishes users</td><td>2 years</td></tr>
          <tr><td><code>_gid</code></td><td>Google Analytics — distinguishes users</td><td>24 hours</td></tr>
          <tr><td><code>_gat</code></td><td>Google Analytics — throttles request rate</td><td>1 minute</td></tr>
          <tr><td><code>cf_*</code></td><td>Cloudflare — analytics and security</td><td>Session</td></tr>
        </tbody>
      </table>

      <h3>2.3 Functionality Cookies</h3>
      <p>These remember your preferences and improve your experience.</p>
      <table>
        <thead>
          <tr><th>Cookie Name</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td><code>preferred_currency</code></td><td>Remembers your currency preference</td><td>30 days</td></tr>
          <tr><td><code>preferred_network</code></td><td>Remembers your preferred affiliate network</td><td>30 days</td></tr>
        </tbody>
      </table>

      <h3>2.4 Advertising / Affiliate-Attribution Cookies</h3>
      <p>
        We use these to attribute purchases to affiliate links. Under some state laws, use of these cookies may be
        treated as a &quot;sale&quot; or &quot;sharing&quot; of personal information — see our{' '}
        <Link href="/do-not-sell">Do Not Sell / Do Not Share</Link> page.
      </p>
      <table>
        <thead>
          <tr><th>Cookie Name</th><th>Purpose</th><th>Duration</th></tr>
        </thead>
        <tbody>
          <tr><td><code>click_id</code></td><td>Tracks affiliate clicks for conversion attribution</td><td>30 days</td></tr>
          <tr><td><code>ref_*</code></td><td>Tracks referral sources</td><td>Session</td></tr>
        </tbody>
      </table>

      <h2>3. Third-Party Cookies</h2>
      <p>Some cookies are placed by third-party services:</p>
      <h3>3.1 Cloudflare</h3>
      <ul>
        <li><strong>Purpose:</strong> CDN, security, analytics</li>
        <li><strong>Data:</strong> IP address (hashed), browser information</li>
        <li><strong>Policy:</strong> <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare Privacy Policy</a></li>
      </ul>
      <h3>3.2 Google Analytics</h3>
      <ul>
        <li><strong>Purpose:</strong> Website analytics</li>
        <li><strong>Data:</strong> Usage patterns, approximate location</li>
        <li><strong>Policy:</strong> <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a></li>
      </ul>
      <h3>3.3 Affiliate Networks</h3>
      <p>When you click an affiliate link, the destination network (Amazon, Walmart, etc.) may place cookies on your device. We do not control these cookies.</p>
      <ul>
        <li><a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=GXV3NEZTGWEDXNEQ" target="_blank" rel="noopener noreferrer">Amazon Cookie Policy</a></li>
        <li><a href="https://www.awin.com/us/privacy-policy" target="_blank" rel="noopener noreferrer">Awin Privacy Policy</a></li>
      </ul>

      <h2>4. Your Cookie Preferences</h2>
      <p>You can manage your cookie preferences:</p>
      <ul>
        <li><strong>Cookie Banner:</strong> Click &quot;Customize&quot; to choose which non-essential cookie categories to allow, or &quot;Essential Only&quot; to reject all non-essential cookies</li>
        <li><strong>Global Privacy Control:</strong> If your browser sends a GPC signal, we automatically treat it as an opt-out of advertising/affiliate-attribution cookies</li>
        <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
        <li><strong>Opt-Out Tools:</strong> Use the Network Advertising Initiative opt-out tool</li>
      </ul>
      <h3>How to Manage Cookies in Popular Browsers</h3>
      <ul>
        <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
        <li><strong>Firefox:</strong> Options → Privacy &amp; Security → Cookies</li>
        <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
        <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
      </ul>

      <h2>5. Do Not Track and Global Privacy Control</h2>
      <p>
        Our website does not respond to the legacy browser &quot;Do Not Track&quot; header, as no common industry
        standard exists for it. We do, however, detect and honor the <strong>Global Privacy Control (GPC)</strong>{' '}
        signal as an opt-out of sale/sharing, and we honor your preferences set through our cookie banner.
      </p>

      <h2>6. Changes to This Policy</h2>
      <p>We may update this Cookie Policy periodically. The &quot;Last Updated&quot; date indicates when changes were made.</p>

      <h2>7. Contact Us</h2>
      <p>If you have questions about our use of cookies, contact us at <strong>privacy@deskholt.com</strong>.</p>
    </LegalPage>
  );
}
