import { loginAction } from './actions';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-2xl dark:shadow-black/40"
      >
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Deskholt Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Nhập mật khẩu admin để tiếp tục.</p>
        </div>

        {from && <input type="hidden" name="from" value={from} />}

        {error && (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            Sai mật khẩu. Vui lòng thử lại.
          </p>
        )}

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 dark:shadow-lg dark:shadow-black/30"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
