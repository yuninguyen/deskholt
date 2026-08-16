// Minimal placeholder admin gate for V1-alpha (see
// specs/001-admin-product-specifications/spec.md Assumptions — no role
// hierarchy per Constitution Principle III, and this is explicitly NOT a
// full auth system, just enough to keep /admin off an open write endpoint).
//
// Single shared password (ADMIN_PASSWORD). The session cookie stores an
// HMAC-SHA256 of that password keyed by ADMIN_SESSION_SECRET, so the cookie
// itself never contains the password and the check stays stateless (no
// session table needed). Uses the Web Crypto API (not Node's `crypto`
// module) so this also works unmodified in the Edge middleware runtime.

export const ADMIN_SESSION_COOKIE = 'deskholt_admin_session';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(signature);
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const password = process.env.ADMIN_PASSWORD ?? '';
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not set');
  }
  return hmacSha256Hex(secret, password);
}

export function isCorrectPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  return timingSafeStringEqual(candidate, expected);
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await createSessionToken();
  return timingSafeStringEqual(token, expected);
}
