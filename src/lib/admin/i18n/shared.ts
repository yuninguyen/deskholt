import { en, type Dictionary } from './en';
import { vi } from './vi';

export type { Dictionary } from './en';
export type Locale = 'en' | 'vi';

export const dictionaries: Record<Locale, Dictionary> = { en, vi };
export const ADMIN_LOCALE_CHANGE_EVENT = 'admin-locale-change';

export function resolveAdminLocale(locale: unknown): Locale {
  return locale === 'vi' ? 'vi' : 'en';
}

export function resolveAdminClientLocale(storedLocale: unknown, rootLocale: unknown): Locale {
  return storedLocale === 'en' || storedLocale === 'vi'
    ? storedLocale
    : resolveAdminLocale(rootLocale);
}
