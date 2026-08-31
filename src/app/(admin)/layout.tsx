import type { ReactNode } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';

const THEME_INIT_SCRIPT = `
(function () {
  var theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  var locale = 'en';
  try {
    var storedTheme = localStorage.getItem('admin-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') theme = storedTheme;
    var storedLocale = localStorage.getItem('admin-locale');
    if (storedLocale === 'en' || storedLocale === 'vi') locale = storedLocale;
  } catch (e) {}
  document.currentScript.parentElement.setAttribute('data-theme', theme);
  document.currentScript.parentElement.setAttribute('data-locale', locale);
})();
`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      id="admin-theme-root"
      suppressHydrationWarning
      data-theme="dark"
      data-locale="en"
      className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100"
    >
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <AdminHeader />
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
