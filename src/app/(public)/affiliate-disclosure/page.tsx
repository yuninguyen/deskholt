import Link from 'next/link';
import { LegalPage } from '@/components/legal/LegalContent';

export default function AffiliateDisclosurePage() {
  return (
    <LegalPage title="Affiliate Disclosure" lastUpdated="August 8, 2026">
      <p className="rounded-md border border-walnut/30 bg-walnut-soft p-4 font-medium text-ink">
        As an Amazon Associate, Deskholt.com earns from qualifying purchases.
      </p>

      <h2>What Is an Affiliate Disclosure?</h2>
      <p>
        Deskholt.com participates in affiliate marketing programs. This means that when you click on a link to a
        product on our site and make a purchase, we may earn a commission at no additional cost to you.
      </p>

      <h2>How It Works</h2>
      <ul>
        <li>You visit our website and read product reviews, comparisons, or guides.</li>
        <li>You click a &quot;Buy Now,&quot; &quot;Check Price,&quot; or similar button/link.</li>
        <li>You are redirected through our affiliate link tracking system (<code>/go/</code>).</li>
        <li>If you make a purchase on the retailer&apos;s website, we may receive a commission.</li>
      </ul>

      <h2>Our Affiliate Networks</h2>
      <p>We participate in the following affiliate networks:</p>
      <table>
        <thead>
          <tr><th>Network</th><th>Commission Structure</th><th>Cookie Duration</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Amazon Associates</strong></td><td>1-10% depending on category</td><td>24 hours</td></tr>
          <tr><td><strong>Awin</strong> (including ShareASale)</td><td>Varies by brand</td><td>Varies</td></tr>
          <tr><td><strong>Impact</strong></td><td>Varies by brand</td><td>Varies</td></tr>
          <tr><td><strong>CJ Affiliate</strong></td><td>Varies by brand</td><td>Varies</td></tr>
          <tr><td><strong>Walmart Affiliate</strong> (via Impact)</td><td>Varies by category</td><td>Varies</td></tr>
          <tr><td><strong>Target Partners</strong> (via Impact)</td><td>Up to 8%</td><td>7 days</td></tr>
        </tbody>
      </table>

      <h2>Does This Affect the Price You Pay?</h2>
      <p>
        <strong>No.</strong> The price you pay for a product is exactly the same whether you use our affiliate link
        or go directly to the retailer&apos;s website. The commission is paid by the retailer, not by you.
      </p>

      <h2>Why Do We Use Affiliate Links?</h2>
      <p>Affiliate commissions help us:</p>
      <ul>
        <li>Maintain and operate Deskholt.com</li>
        <li>Create high-quality, unbiased content</li>
        <li>Keep our website free for all users</li>
      </ul>

      <h2>Our Commitment to Honest Reviews</h2>
      <ul>
        <li><strong>Honest Opinions:</strong> Our reviews are based on research, user sentiment, and personal testing when possible.</li>
        <li><strong>No Paid Reviews:</strong> We do not accept payment to give positive reviews.</li>
        <li><strong>Pros and Cons:</strong> We always include both advantages and disadvantages of products.</li>
        <li>
          <strong>Transparency:</strong> We clearly identify when a link is an affiliate link, including short
          in-content disclosures (e.g., &quot;This post contains affiliate links; we may earn a commission&quot;)
          placed near product recommendations, not only on this page.
        </li>
      </ul>

      <h2>Your Responsibilities</h2>
      <ul>
        <li>
          <strong>State Privacy Rights:</strong> Depending on where you live, you may have the right to opt out of
          the &quot;sale&quot; or &quot;sharing&quot; of your personal information used for affiliate attribution.
          See our <Link href="/do-not-sell">Do Not Sell / Do Not Share My Personal Information</Link> page.
        </li>
        <li><strong>Cookie Preferences:</strong> You can manage your cookie preferences through our cookie banner or browser settings.</li>
      </ul>

      <h2>Questions?</h2>
      <p>If you have questions about our affiliate relationships, contact us at <strong>affiliate@deskholt.com</strong>.</p>
    </LegalPage>
  );
}
