import Link from 'next/link';
import { Layers, ShieldAlert } from 'lucide-react';

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-gray-100 selection:bg-brand-500 selection:text-white">
      {/* Compliance Disclosure Banner */}
      <div className="bg-dark-800 border-b border-gray-800/80 px-4 py-1.5 text-xs text-gray-400 text-center flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-brand-500" />
        <span>
          As an affiliate, Deskholt may earn a commission from qualifying purchases at no extra cost to you.{' '}
          <Link href="/affiliate-disclosure" className="underline hover:text-brand-500 transition-colors">
            Read Disclosure
          </Link>
        </span>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span>DESKHOLT</span>
            <span className="text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 font-mono border border-brand-500/20">
              Hub
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-dark-900 py-12 mt-16 text-sm text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-500" />
            <span className="font-bold text-white tracking-wider">DESKHOLT</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-xs text-gray-400">
            <Link href="/affiliate-disclosure" className="hover:text-white transition-colors">
              Affiliate Disclosure
            </Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
