import type { ReactNode } from 'react';
import ThemeToggle from '@/components/admin/ThemeToggle';

const THEME_INIT_SCRIPT = `
(function () {
  var theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  try {
    var stored = localStorage.getItem('admin-theme');
    if (stored === 'light' || stored === 'dark') theme = stored;
  } catch (e) {}
  document.currentScript.parentElement.setAttribute('data-theme', theme);
})();
`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      id="admin-theme-root"
      suppressHydrationWarning
      data-theme="dark"
      className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100"
    >
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <header className="border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Deskholt Admin</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
