'use client';

import { Moon, Sun } from 'lucide-react';
import { useAdminTranslations } from '@/lib/admin/i18n/client';
import type { Locale } from '@/lib/admin/i18n/shared';

export default function ThemeToggle({ initialLocale }: { initialLocale: Locale }) {
  const translations = useAdminTranslations(initialLocale);

  function handleClick() {
    const root = document.getElementById('admin-theme-root');
    if (!root) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem('admin-theme', next);
    } catch {
      // localStorage unavailable (private browsing) — toggle still works for this page view.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={translations.header.themeLabel}
      className="inline-flex h-[34px] items-center gap-[7px] rounded-[8px] border border-admin-input px-[14px] text-[12.5px] font-semibold text-admin-foreground hover:border-admin-primary"
    >
      <Sun aria-hidden className="h-4 w-4 dark:hidden" />
      <Moon aria-hidden className="hidden h-4 w-4 dark:inline" />
      <span className="dark:hidden">{translations.header.darkAction}</span>
      <span className="hidden dark:inline">{translations.header.lightAction}</span>
    </button>
  );
}
