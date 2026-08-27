import type { Prisma } from '@prisma/client';

export type ClickPersistenceInput = Prisma.ClickUncheckedCreateInput & {
  click_id: string;
  created_at: Date;
};

type CreateClick = (input: {
  data: Prisma.ClickUncheckedCreateInput;
}) => Promise<unknown>;

export type ClickPersistenceResult =
  | { outcome: 'persisted' }
  | { outcome: 'idempotent-duplicate' }
  | {
      outcome: 'exhausted';
      classification: 'transient' | 'permanent' | 'timeout';
      attempts: number;
    };

type PersistClickOptions = {
  create: CreateClick;
  click: ClickPersistenceInput;
  maxAttempts: number;
  backoffMs: number;
  timeoutMs: number;
};

type ErrorShape = {
  code?: unknown;
  constraint?: unknown;
  meta?: { target?: unknown };
};

const TRANSIENT_CODES = new Set([
  'P1001',
  'P1002',
  'P1008',
  'P1017',
  'P2024',
  'P2034',
  '40001',
  '40P01',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ETIMEDOUT',
]);

const MAX_ATTEMPTS = 100;
const MAX_BACKOFF_MS = 1_000;
const MAX_TIMEOUT_MS = 60_000;

function normalizeAttempts(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_ATTEMPTS, Math.max(1, Math.floor(value)));
}

function normalizeMilliseconds(value: number, maximum: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(maximum, Math.floor(value));
}

function errorShape(error: unknown): ErrorShape {
  return typeof error === 'object' && error !== null ? (error as ErrorShape) : {};
}

function isClickIdConflict(error: unknown): boolean {
  const shaped = errorShape(error);

  if (shaped.code === 'P2002') {
    const target = shaped.meta?.target;
    return Array.isArray(target)
      ? target.length === 1 && target[0] === 'click_id'
      : target === 'click_id';
  }

  return shaped.code === '23505' && shaped.constraint === 'clicks_click_id_key';
}

function isTransient(error: unknown): boolean {
  const code = errorShape(error).code;
  return typeof code === 'string' && TRANSIENT_CODES.has(code);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function persistClickWithRetry({
  create,
  click,
  maxAttempts,
  backoffMs,
  timeoutMs,
}: PersistClickOptions): Promise<ClickPersistenceResult> {
  const attemptLimit = normalizeAttempts(maxAttempts);
  const normalizedBackoffMs = normalizeMilliseconds(backoffMs, MAX_BACKOFF_MS);
  const normalizedTimeoutMs = normalizeMilliseconds(timeoutMs, MAX_TIMEOUT_MS);
  const deadline = Date.now() + normalizedTimeoutMs;
  let attempts = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutResult = new Promise<ClickPersistenceResult>((resolve) => {
    timeout = setTimeout(() => {
      resolve({ outcome: 'exhausted', classification: 'timeout', attempts });
    }, normalizedTimeoutMs);
  });

  const persistence = (async (): Promise<ClickPersistenceResult> => {
    while (attempts < attemptLimit) {
      if (attempts > 0 && Date.now() >= deadline) {
        return { outcome: 'exhausted', classification: 'timeout', attempts };
      }

      attempts += 1;

      try {
        await create({ data: click });
        return { outcome: 'persisted' };
      } catch (error) {
        if (isClickIdConflict(error)) {
          return { outcome: 'idempotent-duplicate' };
        }

        if (!isTransient(error)) {
          return { outcome: 'exhausted', classification: 'permanent', attempts };
        }

        if (attempts >= attemptLimit) {
          return { outcome: 'exhausted', classification: 'transient', attempts };
        }

        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) {
          return { outcome: 'exhausted', classification: 'timeout', attempts };
        }

        const delayMs = Math.min(normalizedBackoffMs, remainingMs);
        if (delayMs > 0) await wait(delayMs);
      }
    }

    return { outcome: 'exhausted', classification: 'transient', attempts };
  })();

  try {
    return await Promise.race([persistence, timeoutResult]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
