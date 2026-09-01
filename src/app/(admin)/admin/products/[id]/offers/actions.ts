import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from '@/lib/admin/auth';
import {
  createPrismaAffiliateLinkStore,
  executeCreateAffiliateLink,
  executeUpdateAffiliateLink,
  isSafeAffiliateLinkProductId,
  parseCreateAffiliateLinkInput,
  parseUpdateAffiliateLinkInput,
  type AffiliateLinkStore,
} from '@/lib/products/affiliateLinkCommand';

export type AffiliateLinkActionDependencies = {
  requireAdmin(): Promise<void>;
  store: AffiliateLinkStore;
  revalidatePath(path: string): void;
  redirect(path: string): never;
};

async function requireAdminSession(): Promise<void> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSessionToken(token))) {
    redirect('/admin/login?from=%2Fadmin%2Fproducts');
  }
}

function submittedProductId(formData: FormData): string | undefined {
  const productId = formData.get('productId');
  if (typeof productId !== 'string' || productId.trim() === '') return undefined;
  const trimmedProductId = productId.trim();
  return isSafeAffiliateLinkProductId(trimmedProductId) ? trimmedProductId : undefined;
}

function invalidInputPath(formData: FormData): string {
  const productId = submittedProductId(formData);
  return productId
    ? `/admin/products/${productId}/offers?error=invalid-input`
    : '/admin/products?error=invalid-input';
}

function offersPath(productId: string): string {
  return `/admin/products/${productId}/offers`;
}

export function createCreateAffiliateLinkAction(
  dependencies: AffiliateLinkActionDependencies
): (formData: FormData) => Promise<void> {
  return async (formData) => {
    await dependencies.requireAdmin();

    let input: ReturnType<typeof parseCreateAffiliateLinkInput>;
    try {
      input = parseCreateAffiliateLinkInput(formData);
    } catch {
      dependencies.redirect(invalidInputPath(formData));
    }

    const result = await executeCreateAffiliateLink(dependencies.store, input.productId, input);
    if (!result.ok) {
      dependencies.redirect(`${offersPath(input.productId)}?error=${result.reason}`);
    }

    dependencies.revalidatePath('/');
    dependencies.revalidatePath(offersPath(input.productId));
    dependencies.redirect(`${offersPath(input.productId)}?saved=1`);
  };
}

export function createUpdateAffiliateLinkAction(
  dependencies: AffiliateLinkActionDependencies
): (formData: FormData) => Promise<void> {
  return async (formData) => {
    await dependencies.requireAdmin();

    let input: ReturnType<typeof parseUpdateAffiliateLinkInput>;
    try {
      input = parseUpdateAffiliateLinkInput(formData);
    } catch {
      dependencies.redirect(invalidInputPath(formData));
    }

    const result = await executeUpdateAffiliateLink(dependencies.store, input.linkId, input);
    if (!result.ok) {
      dependencies.redirect(`${offersPath(input.productId)}?error=${result.reason}`);
    }

    dependencies.revalidatePath('/');
    dependencies.revalidatePath(offersPath(input.productId));
    dependencies.redirect(`${offersPath(input.productId)}?saved=1`);
  };
}

export async function createAffiliateLinkAction(formData: FormData): Promise<void> {
  'use server';
  return createCreateAffiliateLinkAction({
    requireAdmin: requireAdminSession,
    store: createPrismaAffiliateLinkStore(prisma),
    revalidatePath,
    redirect,
  })(formData);
}

export async function updateAffiliateLinkAction(formData: FormData): Promise<void> {
  'use server';
  return createUpdateAffiliateLinkAction({
    requireAdmin: requireAdminSession,
    store: createPrismaAffiliateLinkStore(prisma),
    revalidatePath,
    redirect,
  })(formData);
}
