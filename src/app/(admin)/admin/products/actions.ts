import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from '@/lib/admin/auth';
import {
  createPrismaPublishingStore,
  executePublishingCommand,
  parsePublishingCommand,
  type ProductPublishingStore,
} from '@/lib/products/productPublishingCommands';

export type ProductPublishingActionDependencies = {
  requireAdmin(): Promise<void>;
  publishingStore: ProductPublishingStore;
  revalidatePath(path: string): void;
  redirect(path: string): never;
};

async function requireAdminSession(): Promise<void> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSessionToken(token))) {
    redirect('/admin/login?from=%2Fadmin%2Fproducts');
  }
}

function errorPath(reason: string, productId?: string): string {
  const suffix = productId ? `&productId=${encodeURIComponent(productId)}` : '';
  return `/admin/products?error=${encodeURIComponent(reason)}${suffix}`;
}

export function createProductPublishingAction(
  dependencies: ProductPublishingActionDependencies
): (formData: FormData) => Promise<void> {
  return async (formData) => {
    await dependencies.requireAdmin();

    let parsed: ReturnType<typeof parsePublishingCommand>;
    try {
      parsed = parsePublishingCommand(formData);
    } catch {
      dependencies.redirect(errorPath('invalid-input'));
    }

    const result = await executePublishingCommand(
      dependencies.publishingStore,
      parsed.productId,
      parsed.command
    );
    if (!result.ok) {
      dependencies.redirect(errorPath(result.reason, parsed.productId));
    }

    dependencies.revalidatePath('/');
    dependencies.redirect(
      `/admin/products?saved=1&productId=${encodeURIComponent(parsed.productId)}`
    );
  };
}

export async function productPublishingAction(formData: FormData): Promise<void> {
  'use server';
  return createProductPublishingAction({
    requireAdmin: requireAdminSession,
    publishingStore: createPrismaPublishingStore(prisma),
    revalidatePath,
    redirect,
  })(formData);
}
