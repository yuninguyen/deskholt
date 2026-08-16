export interface ConsentRecord {
  necessary: true;
  analytics: boolean;
  functionality: boolean;
  advertising: boolean;
}

const STORAGE_KEY = 'deskholt-consent-v1';

export function readConsent(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.necessary === true) {
      return parsed as ConsentRecord;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeConsent(consent: Omit<ConsentRecord, 'necessary'>): void {
  if (typeof window === 'undefined') return;
  const record: ConsentRecord = { necessary: true, ...consent };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export const ALL_DECLINED: Omit<ConsentRecord, 'necessary'> = {
  analytics: false,
  functionality: false,
  advertising: false,
};

export const ALL_ACCEPTED: Omit<ConsentRecord, 'necessary'> = {
  analytics: true,
  functionality: true,
  advertising: true,
};
