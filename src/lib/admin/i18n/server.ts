import 'server-only';
import { cookies } from 'next/headers';
import { resolveAdminLocale, type Locale } from './index';

export async function getAdminLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return resolveAdminLocale(cookieStore.get('admin-locale')?.value);
}
