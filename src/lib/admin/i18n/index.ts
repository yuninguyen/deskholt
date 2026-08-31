import { useSyncExternalStore } from 'react';
import { en, type Dictionary } from './en';
import { vi } from './vi';

export type { Dictionary } from './en';
export type Locale = 'en' | 'vi';

export const dictionaries: Record<Locale, Dictionary> = { en, vi };
export const ADMIN_LOCALE_CHANGE_EVENT = 'admin-locale-change';

export function resolveAdminLocale(locale: unknown): Locale {
  return locale === 'vi' ? 'vi' : 'en';
}

function getServerLocale(): Locale {
  return 'en';
}

function getClientLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  try {
    return resolveAdminLocale(window.localStorage.getItem('admin-locale'));
  } catch {
    return 'en';
  }
}

function subscribeToLocaleChanges(onStoreChange: () => void) {
  window.addEventListener(ADMIN_LOCALE_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(ADMIN_LOCALE_CHANGE_EVENT, onStoreChange);
}

export function useAdminTranslations(): Dictionary {
  const locale = useSyncExternalStore(subscribeToLocaleChanges, getClientLocale, getServerLocale);
  return dictionaries[locale];
}
