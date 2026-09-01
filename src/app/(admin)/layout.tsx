import type { ReactNode } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import { getAdminLocale } from '@/lib/admin/i18n/server';

const THEME_INIT_SCRIPT = `
(function () {
  var theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  var root = document.currentScript.parentElement;
  var locale = root.getAttribute('data-locale') === 'vi' ? 'vi' : 'en';
  try {
    var storedTheme = localStorage.getItem('admin-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') theme = storedTheme;
    var storedLocale = localStorage.getItem('admin-locale');
    if (storedLocale === 'en' || storedLocale === 'vi') locale = storedLocale;
  } catch (e) {}
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-locale', locale);
})();
`;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const locale = await getAdminLocale();

  return (
    <div
      id="admin-theme-root"
      suppressHydrationWarning
      data-theme="dark"
      data-locale={locale}
      className="min-h-screen font-body bg-admin-background text-admin-foreground"
    >
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <AdminHeader initialLocale={locale} />
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
