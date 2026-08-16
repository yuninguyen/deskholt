'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, createSessionToken, isCorrectPassword } from '@/lib/admin/auth';

export async function loginAction(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const from = String(formData.get('from') ?? '/admin/products');

  if (!isCorrectPassword(password)) {
    redirect(`/admin/login?error=1&from=${encodeURIComponent(from)}`);
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(from || '/admin/products');
}
