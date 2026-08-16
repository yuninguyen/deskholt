import { loginAction } from './actions';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-800 bg-gray-900 p-8"
      >
        <div>
          <h1 className="text-lg font-bold text-white">Deskholt Admin</h1>
          <p className="text-sm text-gray-400">Nhập mật khẩu admin để tiếp tục.</p>
        </div>

        {from && <input type="hidden" name="from" value={from} />}

        {error && (
          <p className="rounded-md bg-red-950 border border-red-800 px-3 py-2 text-sm text-red-300">
            Sai mật khẩu. Vui lòng thử lại.
          </p>
        )}

        <div>
          <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
