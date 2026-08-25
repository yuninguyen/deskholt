'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, authenticateAdmin } from '@/lib/admin/auth';
import { sanitizeAdminRedirect } from '@/lib/admin/redirect';

export async function loginAction(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const from = sanitizeAdminRedirect(String(formData.get('from') ?? ''));
  const token = await authenticateAdmin(password);

  if (token === null) {
    redirect(`/admin/login?error=1&from=${encodeURIComponent(from)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(from);
}
