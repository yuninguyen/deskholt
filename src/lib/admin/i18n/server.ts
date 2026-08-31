import 'server-only';
import { cookies } from 'next/headers';
import { dictionaries, resolveAdminLocale, type Dictionary, type Locale } from './shared';

export async function getAdminLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveAdminLocale(cookieStore.get('admin-locale')?.value);
}

export async function getAdminTranslations(): Promise<Dictionary> {
  return dictionaries[await getAdminLocale()];
}
