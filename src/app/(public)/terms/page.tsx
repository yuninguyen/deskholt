import Link from 'next/link';
import { LegalPage, LegalPlaceholder } from '@/components/legal/LegalContent';

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" lastUpdated="August 8, 2026">
      <p>
        Welcome to Deskholt.com (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). By accessing or using our
        website, you agree to comply with and be bound by these Terms and Conditions.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>By using Deskholt.com, you agree to these Terms and Conditions. If you do not agree, please do not use our website.</p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old, or the age of majority in your jurisdiction, to use this website or agree
        to these Terms. If you are under that age, you may only use the site with the involvement of a parent or
        legal guardian.
      </p>

      <h2>3. Affiliate Disclaimer</h2>
      <p>
        Deskholt.com participates in affiliate marketing programs, including the Amazon Associates Program. We may
        earn commissions from qualifying purchases made through links on our website. This does not affect the price
        you pay.
      </p>
      <p>For more information, see our <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>.</p>

      <h2>4. Use of Website</h2>
      <h3>4.1 Permitted Use</h3>
      <p>You may use our website for personal, non-commercial purposes to:</p>
      <ul>
        <li>Research and compare products</li>
        <li>Read reviews and guides</li>
        <li>Click affiliate links to purchase products</li>
      </ul>
      <h3>4.2 Prohibited Use</h3>
      <p>You may not:</p>
      <ul>
        <li>Use automated tools (bots, crawlers) to scrape our content without permission</li>
        <li>Manipulate, spoof, or abuse our affiliate link tracking system</li>
        <li>Submit false or misleading information</li>
        <li>Attempt to bypass our rate-limiting or security measures</li>
        <li>Use our content for commercial purposes without authorization</li>
      </ul>

      <h2>5. Intellectual Property</h2>
      <p>
        All content on Deskholt.com, including text, images, graphics, logos, and code, is our property or licensed
        to us. You may not reproduce, distribute, or create derivative works without our prior written consent.
      </p>

      <h2>6. Copyright Complaints (DMCA)</h2>
      <p>If you believe content on Deskholt.com infringes your copyright, please send a written notice containing:</p>
      <ul>
        <li>A description of the copyrighted work you believe is infringed</li>
        <li>The URL(s) of the allegedly infringing material</li>
        <li>Your contact information (name, address, phone, email)</li>
        <li>A statement that you have a good-faith belief the use is not authorized</li>
        <li>A statement, under penalty of perjury, that the notice is accurate and you are authorized to act on behalf of the copyright owner</li>
        <li>Your physical or electronic signature</li>
      </ul>
      <p>
        Send notices to our designated agent: <strong>legal@deskholt.com</strong> (or the address in Section 14). We
        will respond in accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512).
      </p>

      <h2>7. Third-Party Links</h2>
      <p>
        Our website contains links to third-party websites (Amazon, Walmart, Target, Awin, Impact, etc.). We do not
        control these websites and are not responsible for their content, products, or privacy practices.
      </p>

      <h2>8. Product Information and Pricing</h2>
      <p>We strive to provide accurate product information, including pricing and availability. However:</p>
      <ul>
        <li>Prices are subject to change without notice</li>
        <li>We are not responsible for pricing errors or discrepancies</li>
        <li>Product availability is determined by third-party retailers</li>
      </ul>

      <h2>9. Disclaimer of Warranties</h2>
      <p>
        Deskholt.com is provided &quot;as is&quot; without warranties of any kind, either express or implied,
        including but not limited to:
      </p>
      <ul>
        <li>Fitness for a particular purpose</li>
        <li>Accuracy or reliability of information</li>
        <li>Uninterrupted or error-free access</li>
      </ul>

      <h2>10. Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, Deskholt.com and its owners are not liable for:</p>
      <ul>
        <li>Any direct, indirect, incidental, or consequential damages</li>
        <li>Loss of profits or data</li>
        <li>Damages arising from your use or inability to use our website</li>
      </ul>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold Deskholt.com harmless from any claims, damages, or expenses arising from your
        violation of these Terms.
      </p>

      <h2>12. Governing Law and Venue</h2>
      <p>
        These Terms are governed by the laws of the State of{' '}
        <LegalPlaceholder>State not yet selected — required before launch</LegalPlaceholder>, United States, without
        regard to conflict-of-law principles. Any dispute not subject to arbitration or informal resolution shall be
        brought in the state or federal courts located in that state.
      </p>

      <h2>13. Severability and Entire Agreement</h2>
      <p>
        If any provision of these Terms is found unenforceable, the remaining provisions remain in full effect.
        These Terms, together with our Privacy Policy, Cookie Policy, Acceptable Use Policy, and Affiliate
        Disclosure, constitute the entire agreement between you and Deskholt.com regarding your use of the website.
      </p>

      <h2>14. Changes to Terms</h2>
      <p>We reserve the right to update these Terms at any time. Continued use of our website constitutes acceptance of the updated Terms.</p>

      <h2>15. Termination</h2>
      <p>We reserve the right to terminate or restrict your access to our website at our sole discretion, without notice or liability.</p>

      <h2>16. Contact Us</h2>
      <p>For questions about these Terms, contact us at <strong>legal@deskholt.com</strong>.</p>
    </LegalPage>
  );
}
