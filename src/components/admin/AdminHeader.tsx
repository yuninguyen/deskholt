'use client';

import { useAdminTranslations } from '@/lib/admin/i18n/client';
import LocaleToggle from './LocaleToggle';
import ThemeToggle from './ThemeToggle';

export default function AdminHeader() {
  const translations = useAdminTranslations();

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <span className="font-body text-sm font-semibold uppercase tracking-[0.14em] text-gray-900 dark:text-white">
          {translations.header.title}
        </span>
        <div className="flex items-center gap-2">
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
