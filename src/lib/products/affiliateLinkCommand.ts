import type { Prisma } from '@prisma/client';

export type AffiliateNetwork = 'amazon' | 'walmart' | 'target' | 'awin' | 'impact' | 'cj';

export type CreateAffiliateLinkInput = {
  productId: string;
  network: AffiliateNetwork;
  price: number;
  rawUrl: string;
  isInStock: boolean;
  priorityOrder: number;
};

export type UpdateAffiliateLinkInput = CreateAffiliateLinkInput & {
  linkId: string;
};

type AffiliateLinkData = {
  product_id: string;
  network: AffiliateNetwork;
  price: number;
  raw_url: string;
  tracking_url: string;
  is_in_stock: boolean;
  priority_order: number;
};

type AffiliateLinkUpdateData = Omit<AffiliateLinkData, 'product_id' | 'network'>;

export type AffiliateLinkStore = {
  createAffiliateLink(data: AffiliateLinkData): Promise<{ id: string }>;
  findAffiliateLinkForProduct(linkId: string, productId: string): Promise<{ id: string } | null>;
  updateAffiliateLink(linkId: string, productId: string, data: AffiliateLinkUpdateData): Promise<{ id: string } | null>;
};

export type AffiliateLinkCommandResult =
  | { ok: true; linkId: string }
  | { ok: false; reason: 'invalid-input' | 'not-found' };

const AFFILIATE_NETWORKS: readonly AffiliateNetwork[] = ['amazon', 'walmart', 'target', 'awin', 'impact', 'cj'];
// A product ID must be one URL path segment: ASCII letters, digits, underscores, or hyphens.
const SAFE_PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

export function isSafeAffiliateLinkProductId(productId: string): boolean {
  return SAFE_PRODUCT_ID_PATTERN.test(productId);
}

function requiredText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${key} is required`);
  return value.trim();
}

function optionalText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  return value.trim();
}

function normalizeSafeAffiliateLinkRawUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') throw new Error('invalid raw url');
  const normalizedRawUrl = rawUrl.trim();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedRawUrl);
  } catch {
    throw new Error('invalid raw url');
  }
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') throw new Error('invalid raw url');
  return normalizedRawUrl;
}

function requiredProductId(formData: FormData): string {
  const productId = requiredText(formData, 'productId');
  if (!isSafeAffiliateLinkProductId(productId)) throw new Error('invalid productId');
  return productId;
}

function parseOfferInput(formData: FormData): CreateAffiliateLinkInput {
  const network = requiredText(formData, 'network');
  if (!AFFILIATE_NETWORKS.includes(network as AffiliateNetwork)) throw new Error('invalid network');

  const price = Number(requiredText(formData, 'price'));
  if (!Number.isFinite(price) || price <= 0) throw new Error('invalid price');

  const rawUrl = normalizeSafeAffiliateLinkRawUrl(requiredText(formData, 'raw_url'));

  const priorityOrderText = optionalText(formData, 'priority_order');
  const priorityOrder = priorityOrderText === undefined ? 1 : Number(priorityOrderText);
  if (!Number.isInteger(priorityOrder) || priorityOrder <= 0) throw new Error('invalid priority');

  return {
    productId: requiredProductId(formData),
    network: network as AffiliateNetwork,
    price,
    rawUrl,
    isInStock: formData.has('is_in_stock'),
    priorityOrder,
  };
}

export function parseCreateAffiliateLinkInput(formData: FormData): CreateAffiliateLinkInput {
  return parseOfferInput(formData);
}

export function parseUpdateAffiliateLinkInput(formData: FormData): UpdateAffiliateLinkInput {
  return { ...parseOfferInput(formData), linkId: requiredText(formData, 'linkId') };
}

export function deriveTrackingUrl(rawUrl: string): string {
  // deskholt-pending is intentional until real affiliate tags exist.
  const fragmentIndex = rawUrl.indexOf('#');
  const urlBeforeFragment = fragmentIndex === -1 ? rawUrl : rawUrl.slice(0, fragmentIndex);
  const fragment = fragmentIndex === -1 ? '' : rawUrl.slice(fragmentIndex);
  return `${urlBeforeFragment}${urlBeforeFragment.includes('?') ? '&' : '?'}tag=deskholt-pending${fragment}`;
}

function offerData(productId: string, input: CreateAffiliateLinkInput): AffiliateLinkData {
  return {
    product_id: productId,
    network: input.network,
    price: input.price,
    raw_url: input.rawUrl,
    tracking_url: deriveTrackingUrl(input.rawUrl),
    is_in_stock: input.isInStock,
    priority_order: input.priorityOrder,
  };
}

function updateData(input: CreateAffiliateLinkInput): AffiliateLinkUpdateData {
  return {
    price: input.price,
    raw_url: input.rawUrl,
    tracking_url: deriveTrackingUrl(input.rawUrl),
    is_in_stock: input.isInStock,
    priority_order: input.priorityOrder,
  };
}

export async function executeCreateAffiliateLink(
  store: AffiliateLinkStore,
  productId: string,
  input: CreateAffiliateLinkInput
): Promise<AffiliateLinkCommandResult> {
  if (!isSafeAffiliateLinkProductId(productId)) return { ok: false, reason: 'invalid-input' };

  let normalizedInput: CreateAffiliateLinkInput;
  try {
    normalizedInput = { ...input, rawUrl: normalizeSafeAffiliateLinkRawUrl(input.rawUrl) };
  } catch {
    return { ok: false, reason: 'invalid-input' };
  }

  try {
    const link = await store.createAffiliateLink(offerData(productId, normalizedInput));
    return { ok: true, linkId: link.id };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2003') {
      return { ok: false, reason: 'invalid-input' };
    }
    throw error;
  }
}

export async function executeUpdateAffiliateLink(
  store: AffiliateLinkStore,
  linkId: string,
  input: UpdateAffiliateLinkInput
): Promise<AffiliateLinkCommandResult> {
  if (linkId.trim() === '' || !isSafeAffiliateLinkProductId(input.productId)) {
    return { ok: false, reason: 'invalid-input' };
  }

  let normalizedInput: UpdateAffiliateLinkInput;
  try {
    normalizedInput = { ...input, rawUrl: normalizeSafeAffiliateLinkRawUrl(input.rawUrl) };
  } catch {
    return { ok: false, reason: 'invalid-input' };
  }

  const existing = await store.findAffiliateLinkForProduct(linkId, normalizedInput.productId);
  if (!existing) return { ok: false, reason: 'not-found' };

  const link = await store.updateAffiliateLink(linkId, normalizedInput.productId, updateData(normalizedInput));
  if (!link) return { ok: false, reason: 'not-found' };
  return { ok: true, linkId: link.id };
}

export function createPrismaAffiliateLinkStore(prisma: Prisma.TransactionClient): AffiliateLinkStore {
  return {
    createAffiliateLink: async (data) => prisma.affiliateLink.create({ data, select: { id: true } }),
    findAffiliateLinkForProduct: async (linkId, productId) => prisma.affiliateLink.findFirst({
      where: { id: linkId, product_id: productId },
      select: { id: true },
    }),
    updateAffiliateLink: async (linkId, productId, data) => {
      const result = await prisma.affiliateLink.updateMany({
        where: { id: linkId, product_id: productId },
        data,
      });
      return result.count === 1 ? { id: linkId } : null;
    },
  };
}
