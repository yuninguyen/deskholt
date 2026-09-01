'use client';

import { useAdminTranslations } from '@/lib/admin/i18n/client';
import type { Locale } from '@/lib/admin/i18n/shared';
import LocaleToggle from './LocaleToggle';
import ThemeToggle from './ThemeToggle';

export default function AdminHeader({ initialLocale }: { initialLocale: Locale }) {
  const translations = useAdminTranslations(initialLocale);

  return (
    <header className="border-b border-admin-border bg-admin-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <span className="font-body text-sm font-semibold uppercase tracking-[0.14em] text-admin-foreground">
          {translations.header.title}
        </span>
        <div className="flex items-center gap-2">
          <LocaleToggle initialLocale={initialLocale} />
          <ThemeToggle initialLocale={initialLocale} />
        </div>
      </div>
    </header>
  );
}
