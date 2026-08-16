'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, BarChart3, Link2, ShieldAlert } from 'lucide-react';
import {
  ALL_ACCEPTED,
  ALL_DECLINED,
  hasGlobalPrivacyControl,
  readConsent,
  writeConsent,
  type ConsentRecord,
} from '@/lib/consent/cookieConsent';

type ToggleKey = keyof Omit<ConsentRecord, 'necessary'>;

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState<Omit<ConsentRecord, 'necessary'>>(ALL_DECLINED);

  useEffect(() => {
    const existing = readConsent();
    if (existing) return;

    if (hasGlobalPrivacyControl()) {
      writeConsent(ALL_DECLINED);
      return;
    }

    // One-time sync with external state (localStorage/navigator) only available after mount —
    // no non-effect equivalent exists for deciding banner visibility without a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
  }, []);

  if (!visible) return null;

  const essentialOnly = () => {
    writeConsent(ALL_DECLINED);
    setVisible(false);
  };

  const acceptAll = () => {
    writeConsent(ALL_ACCEPTED);
    setVisible(false);
  };

  const saveCustom = () => {
    writeConsent(draft);
    setVisible(false);
  };

  const toggle = (key: ToggleKey) => {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4">
      <div className="mx-auto max-w-3xl rounded-lg bg-ink text-[#c9cec4] shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-5 p-5">
          <div className="max-w-lg">
            <p className="font-display text-sm font-semibold text-paper">We Value Your Privacy</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#c9cec4]">
              We use cookies and similar technologies to:
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#c9cec4]">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-sage" /> Provide essential functionality
              </li>
              <li className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-sage" /> Analyze traffic
              </li>
              <li className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-sage" /> Track affiliate clicks
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-sage" /> Prevent fraud
              </li>
            </ul>
            <p className="mt-2 text-[12px] text-[#8b9086]">
              By clicking &ldquo;Accept All,&rdquo; you consent to our use of cookies.{' '}
              <Link href="/cookie-policy" className="text-paper underline">
                Learn more
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap gap-3">
            <button
              type="button"
              onClick={essentialOnly}
              className="rounded-sm border border-[#4a4e48] px-4 py-2.5 font-display text-sm font-semibold text-[#c9cec4] transition-colors hover:border-paper hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={() => setCustomizing((v) => !v)}
              className="rounded-sm border border-[#4a4e48] px-5 py-2.5 font-display text-sm font-semibold text-paper transition-colors hover:border-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
            >
              Customize
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-sm bg-paper px-5 py-2.5 font-display text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
            >
              Accept All
            </button>
          </div>
        </div>

        {customizing && (
          <div className="rounded-b-lg border-t border-[#4a4e48] bg-card p-4 text-ink">
            <div className="flex items-center justify-between border-b border-line py-2 text-[13px]">
              <span>
                Necessary <span className="text-ink-faint">— always on</span>
              </span>
              <span className="consent-toggle on locked" aria-hidden />
            </div>
            <ToggleRow label="Analytics" checked={draft.analytics} onToggle={() => toggle('analytics')} />
            <ToggleRow label="Functionality" checked={draft.functionality} onToggle={() => toggle('functionality')} />
            <ToggleRow
              label="Advertising / Affiliate Attribution"
              checked={draft.advertising}
              onToggle={() => toggle('advertising')}
            />
            <div className="pt-3 text-right">
              <button
                type="button"
                onClick={saveCustom}
                className="rounded-sm bg-blueprint px-4 py-2 font-display text-xs font-semibold text-white transition-colors hover:bg-blueprint-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
              >
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 text-[13px] last:border-b-0">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={`consent-toggle ${checked ? 'on' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint`}
      />
    </div>
  );
}
