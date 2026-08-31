'use client';

import { useAdminTranslations } from '@/lib/admin/i18n/client';

export default function ThemeToggle() {
  const translations = useAdminTranslations();

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
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:border-brand-400 dark:border-gray-700 dark:text-gray-200 dark:hover:border-brand-500"
    >
      <span className="dark:hidden">{translations.header.darkAction}</span>
      <span className="hidden dark:inline">{translations.header.lightAction}</span>
    </button>
  );
}
