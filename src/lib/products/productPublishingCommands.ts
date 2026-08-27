import type { Prisma, ProductStatus } from '@prisma/client';

export type PublishingCommand =
  | { kind: 'set-lifecycle'; status: ProductStatus }
  | { kind: 'enable-index' }
  | { kind: 'disable-index' };

export type PublishingState = {
  status: ProductStatus;
  is_indexed: boolean;
};

export type ProductPublishingStore = {
  setLifecycle(productId: string, status: ProductStatus): Promise<number>;
  enableIndexWhenActive(productId: string): Promise<number>;
  disableIndex(productId: string): Promise<number>;
  findPublishingState(productId: string): Promise<PublishingState | null>;
};

export type PublishingResult =
  | { ok: true }
  | { ok: false; reason: 'missing' | 'active-only' | 'concurrency-conflict' };

const PRODUCT_ID_PATTERNS = [
  /^c[a-z0-9]{20,}$/i,
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
];
const PRODUCT_STATUSES = new Set<ProductStatus>(['DRAFT', 'ACTIVE', 'BLOCKED', 'ARCHIVED']);

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${key} is required`);
  return value.trim();
}

function isValidProductId(value: string): boolean {
  return PRODUCT_ID_PATTERNS.some((pattern) => pattern.test(value));
}

export function parsePublishingCommand(formData: FormData): {
  productId: string;
  command: PublishingCommand;
} {
  const productId = requiredText(formData, 'productId');
  if (!isValidProductId(productId)) throw new Error('invalid product id');

  const kind = requiredText(formData, 'command');
  if (kind === 'enable-index' || kind === 'disable-index') {
    return { productId, command: { kind } };
  }
  if (kind !== 'set-lifecycle') throw new Error('invalid command');

  const status = requiredText(formData, 'status') as ProductStatus;
  if (!PRODUCT_STATUSES.has(status)) throw new Error('invalid lifecycle status');
  return { productId, command: { kind, status } };
}

export function classifyZeroRowEnable(state: PublishingState | null): PublishingResult {
  if (!state) return { ok: false, reason: 'missing' };
  if (state.status !== 'ACTIVE') return { ok: false, reason: 'active-only' };
  return { ok: false, reason: 'concurrency-conflict' };
}

export async function executePublishingCommand(
  store: ProductPublishingStore,
  productId: string,
  command: PublishingCommand
): Promise<PublishingResult> {
  if (command.kind === 'set-lifecycle') {
    const affected = await store.setLifecycle(productId, command.status);
    if (affected === 1) return { ok: true };
    const state = await store.findPublishingState(productId);
    return state ? { ok: false, reason: 'concurrency-conflict' } : { ok: false, reason: 'missing' };
  }

  if (command.kind === 'enable-index') {
    const affected = await store.enableIndexWhenActive(productId);
    if (affected === 1) return { ok: true };
    return classifyZeroRowEnable(await store.findPublishingState(productId));
  }

  const affected = await store.disableIndex(productId);
  if (affected === 1) return { ok: true };
  const state = await store.findPublishingState(productId);
  return state ? { ok: false, reason: 'concurrency-conflict' } : { ok: false, reason: 'missing' };
}

export function createPrismaPublishingStore(tx: Prisma.TransactionClient): ProductPublishingStore {
  return {
    setLifecycle: async (productId, status) =>
      tx.product.updateMany({ where: { id: productId }, data: { status, is_indexed: false } }).then((result) => result.count),
    enableIndexWhenActive: async (productId) =>
      tx.product.updateMany({ where: { id: productId, status: 'ACTIVE' }, data: { is_indexed: true } }).then((result) => result.count),
    disableIndex: async (productId) =>
      tx.product.updateMany({ where: { id: productId }, data: { is_indexed: false } }).then((result) => result.count),
    findPublishingState: async (productId) =>
      tx.product.findUnique({ where: { id: productId }, select: { status: true, is_indexed: true } }),
  };
}
