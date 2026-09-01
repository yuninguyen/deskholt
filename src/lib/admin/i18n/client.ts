'use client';

import { useSyncExternalStore } from 'react';
import {
  ADMIN_LOCALE_CHANGE_EVENT,
  dictionaries,
  resolveAdminClientLocale,
  type Dictionary,
  type Locale,
} from './shared';

function getRootLocale(): unknown {
  return document.getElementById('admin-theme-root')?.getAttribute('data-locale');
}

export function getClientLocale(): Locale {
  if (typeof window === 'undefined') return 'en';

  try {
    return resolveAdminClientLocale(window.localStorage.getItem('admin-locale'), getRootLocale());
  } catch {
    return resolveAdminClientLocale(undefined, getRootLocale());
  }
}

function subscribeToLocaleChanges(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener(ADMIN_LOCALE_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(ADMIN_LOCALE_CHANGE_EVENT, onStoreChange);
}

export function useAdminLocale(initialLocale: Locale = 'en'): Locale {
  return useSyncExternalStore(subscribeToLocaleChanges, getClientLocale, () => initialLocale);
}

export function useAdminTranslations(initialLocale: Locale = 'en'): Dictionary {
  return dictionaries[useAdminLocale(initialLocale)];
}
