import Link from 'next/link';
import Image from 'next/image';
import { ShieldAlert, Sparkles } from 'lucide-react';
import CookieBanner from '@/components/ui/CookieBanner';

export default function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper-grid font-body text-ink selection:bg-blueprint-soft selection:text-blueprint-deep">
      {/* Compliance Disclosure Banner */}
      <div className="flex items-center justify-center gap-2 border-b border-line-strong bg-paper-alt px-4 py-1.5 text-center font-mono text-xs text-ink-soft">
        <ShieldAlert className="h-3.5 w-3.5 text-walnut" />
        <span>
          As an affiliate, Deskholt may earn a commission from qualifying purchases at no extra cost to you.{' '}
          <Link
            href="/affiliate-disclosure"
            className="rounded-sm underline transition-colors hover:text-walnut focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
          >
            Read Disclosure
          </Link>
        </span>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-line-strong bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.webp" alt="Deskholt" width={1600} height={414} className="h-16 w-auto object-contain" priority />
          </Link>

          <nav className="hidden items-center gap-8 font-body text-sm font-medium text-ink-soft md:flex">
            <Link
              href="/category/standing-desks"
              className="rounded-sm transition-colors hover:text-walnut focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
            >
              Standing Desks
            </Link>
            <Link
              href="/category/ergonomic-chairs"
              className="rounded-sm transition-colors hover:text-walnut focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
            >
              Ergonomic Chairs
            </Link>
            <Link
              href="/category/lighting"
              className="rounded-sm transition-colors hover:text-walnut focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
            >
              Desk Lighting
            </Link>
            <Link
              href="/category/cable-management"
              className="rounded-sm transition-colors hover:text-walnut focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
            >
              Cable Management
            </Link>
            <Link
              href="/category/standing-desks?eco=true"
              className="flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage-soft px-3 py-1 text-sage transition-colors hover:bg-sage-soft/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Eco Setup
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>

      {/* Footer */}
      <footer className="mt-16 bg-ink py-12 text-sm text-[#c9cec4]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/logo-icon.webp" alt="" width={512} height={512} className="h-9 w-9 rounded-md object-contain" />
              <span className="font-display text-lg font-bold text-paper">Deskholt</span>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-xs sm:grid-cols-2">
              <div>
                <h5 className="mb-2 font-display text-[11px] font-semibold uppercase tracking-wide text-paper">Legal</h5>
                <ul className="space-y-1.5">
                  <li>
                    <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
                  </li>
                  <li>
                    <FooterLink href="/terms">Terms &amp; Conditions</FooterLink>
                  </li>
                  <li>
                    <FooterLink href="/cookie-policy">Cookie Policy</FooterLink>
                  </li>
                  <li>
                    <FooterLink href="/acceptable-use">Acceptable Use</FooterLink>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="mb-2 font-display text-[11px] font-semibold uppercase tracking-wide text-paper">Affiliate</h5>
                <ul className="space-y-1.5">
                  <li>
                    <FooterLink href="/affiliate-disclosure">Affiliate Disclosure</FooterLink>
                  </li>
                  <li>
                    <FooterLink href="/do-not-sell">Do Not Sell / Share My Info</FooterLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-[#333831] pt-4 text-center text-xs text-[#8b9086]">
            <p>As an Amazon Associate, Deskholt.com earns from qualifying purchases.</p>
            <p className="mt-1">© 2026 Deskholt.com. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-sm transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
    >
      {children}
    </Link>
  );
}
