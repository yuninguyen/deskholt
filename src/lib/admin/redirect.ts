export const DEFAULT_ADMIN_REDIRECT = '/admin/products';

export function sanitizeAdminRedirect(target: string): string {
  if (
    !target.startsWith('/admin') ||
    target.startsWith('//') ||
    target.includes('\\') ||
    !['', '/', '?', '#'].includes(target.charAt('/admin'.length))
  ) {
    return DEFAULT_ADMIN_REDIRECT;
  }

  return target;
}
