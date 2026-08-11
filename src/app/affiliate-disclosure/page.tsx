export default function AffiliateDisclosurePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 glass-card p-8 md:p-12 rounded-3xl border border-white/10">
      <h1 className="text-3xl font-extrabold text-white">Affiliate Disclosure</h1>
      <p className="text-xs text-gray-400">Last updated: August 2026</p>

      <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
        <p>
          Deskholt.com is a reader-supported digital publication and multi-store price comparison engine for home-office and ergonomic workstation products.
        </p>
        <p className="p-4 rounded-xl bg-dark-800 border border-brand-500/30 text-white font-medium">
          &ldquo;As an affiliate, Deskholt may earn a commission from qualifying purchases at no extra cost to you.&rdquo;
        </p>
        <h2 className="text-lg font-bold text-white pt-4">Affiliate Programs</h2>
        <p>
          We participate in several merchant affiliate programs, including Amazon Associates, Walmart Affiliate Program, Target Partners (via Impact Network), Awin, and CJ Affiliate.
        </p>
        <p>
          When you click on links to merchant stores (such as `/go/[slug]`) and make a purchase, we may receive a small tracking commission from the retailer. This commission does not impact the price you pay; merchant store prices remain identical whether you use our link or navigate directly.
        </p>
      </div>
    </div>
  );
}
