'use client';

import { useAdminLocale, useAdminTranslations } from '@/lib/admin/i18n/client';
import { ADMIN_LOCALE_CHANGE_EVENT, type Locale } from '@/lib/admin/i18n/shared';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export default function LocaleToggle({ initialLocale }: { initialLocale: Locale }) {
  const translations = useAdminTranslations(initialLocale);
  const locale = useAdminLocale(initialLocale);

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
    <div aria-label={translations.header.localeLabel} className="inline-flex h-[34px] rounded-[8px] border border-[#E3DACB] bg-[#EFE9DC] p-[3px] dark:border-[#34291E] dark:bg-[#17140F]">
      {(['en', 'vi'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
          className={`h-full w-[38px] rounded-[6px] text-xs font-bold ${locale === option ? 'bg-admin-primary text-admin-primary-foreground shadow-sm' : 'text-admin-muted-foreground hover:text-admin-foreground'}`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
