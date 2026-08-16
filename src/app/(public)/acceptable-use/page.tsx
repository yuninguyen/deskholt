import { LegalPage } from '@/components/legal/LegalContent';

export default function AcceptableUsePage() {
  return (
    <LegalPage title="Acceptable Use Policy" lastUpdated="August 8, 2026">
      <p>This Acceptable Use Policy (&quot;Policy&quot;) outlines what is and is not acceptable when using Deskholt.com.</p>

      <h2>1. Prohibited Activities</h2>
      <p>You may not use Deskholt.com to:</p>
      <h3>1.1 Abuse Our Systems</h3>
      <ul>
        <li>Bypass or attempt to bypass rate-limiting</li>
        <li>Use automated tools to generate fake clicks on affiliate links</li>
        <li>Manipulate our affiliate tracking system (click ID, IP hashing)</li>
        <li>Attempt to exploit vulnerabilities in our security systems</li>
      </ul>
      <h3>1.2 Scrape or Crawl</h3>
      <ul>
        <li>Use bots, crawlers, or scraping tools to extract content without permission</li>
        <li>Exceed reasonable usage limits</li>
        <li>Bypass our robots.txt rules</li>
      </ul>
      <h3>1.3 Misrepresent Information</h3>
      <ul>
        <li>Submit false or misleading information</li>
        <li>Impersonate another person or entity</li>
        <li>Create fake user accounts</li>
      </ul>
      <h3>1.4 Infringe Rights</h3>
      <ul>
        <li>Violate intellectual property rights</li>
        <li>Republish our content without authorization</li>
        <li>Use our brand or logo without permission</li>
      </ul>
      <h3>1.5 Engage in Illegal Activities</h3>
      <ul>
        <li>Violate any applicable laws or regulations</li>
        <li>Commit fraud or financial crimes</li>
        <li>Distribute malware or malicious code</li>
      </ul>

      <h2>2. Rate Limits</h2>
      <p>
        To prevent abuse and ensure fair usage, our systems apply automated rate limits to click and request traffic
        (see current limits enforced by our infrastructure). If you exceed these limits, you may be temporarily
        blocked. For legitimate use cases requiring higher limits, please contact us at{' '}
        <strong>support@deskholt.com</strong>.
      </p>

      <h2>3. Enforcement</h2>
      <p>We reserve the right to:</p>
      <ul>
        <li>Monitor usage patterns to detect violations</li>
        <li>Temporarily or permanently block IP addresses that violate this Policy</li>
        <li>Report violations to law enforcement if applicable</li>
        <li>Terminate access without notice</li>
      </ul>

      <h2>4. Reporting Violations</h2>
      <p>If you suspect someone is violating this Policy, please report it to <strong>legal@deskholt.com</strong>.</p>

      <h2>5. Consequences of Violation</h2>
      <p>Violation of this Policy may result in:</p>
      <ul>
        <li>Immediate termination of access</li>
        <li>Permanent IP ban</li>
        <li>Notification to affiliate networks (if fraud is suspected)</li>
        <li>Legal action</li>
      </ul>

      <h2>6. Updates</h2>
      <p>We may update this Policy from time to time. The &quot;Last Updated&quot; date indicates when changes were made.</p>
    </LegalPage>
  );
}
