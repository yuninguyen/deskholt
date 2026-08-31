'use client';

import { useAdminTranslations } from '@/lib/admin/i18n/client';
import { ADMIN_LOCALE_CHANGE_EVENT, resolveAdminLocale, type Locale } from '@/lib/admin/i18n/shared';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export default function LocaleToggle() {
  const translations = useAdminTranslations();
  const locale = typeof document === 'undefined'
    ? 'en'
    : resolveAdminLocale(document.getElementById('admin-theme-root')?.getAttribute('data-locale'));

  function setLocale(locale: Locale) {
    const root = document.getElementById('admin-theme-root');
    if (root) root.setAttribute('data-locale', locale);

    try {
      window.localStorage.setItem('admin-locale', locale);
    } catch {
      // localStorage unavailable — the cookie and current page state still update.
    }

    // eslint-disable-next-line react-hooks/immutability -- Cookie persistence is an intentional browser side effect of this event handler.
    document.cookie = `admin-locale=${locale}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
    window.dispatchEvent(new Event(ADMIN_LOCALE_CHANGE_EVENT));
  }

  return (
    <div aria-label={translations.header.localeLabel} className="inline-flex rounded-md border border-gray-300 p-0.5 dark:border-gray-700">
      {(['en', 'vi'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
          className={`rounded px-2 py-1 font-mono text-xs font-semibold tracking-wide ${locale === option ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950' : 'text-gray-600 hover:text-gray-950 dark:text-gray-300 dark:hover:text-white'}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
