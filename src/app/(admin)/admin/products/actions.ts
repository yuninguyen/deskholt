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
import {
  createPrismaProductCreationStore,
  executeCreateProduct,
  parseCreateProductInput,
  type ProductCreationStore,
} from '@/lib/products/productCreationCommand';

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

export type ProductCreationActionDependencies = {
  requireAdmin(): Promise<void>;
  creationStore: ProductCreationStore;
  revalidatePath(path: string): void;
  redirect(path: string): never;
};

export function createCreateProductAction(
  dependencies: ProductCreationActionDependencies
): (formData: FormData) => Promise<void> {
  return async (formData) => {
    await dependencies.requireAdmin();

    let input: ReturnType<typeof parseCreateProductInput>;
    try {
      input = parseCreateProductInput(formData);
    } catch {
      dependencies.redirect('/admin/products/new?error=invalid-input');
    }

    const result = await executeCreateProduct(dependencies.creationStore, input);
    if (!result.ok) {
      dependencies.redirect(`/admin/products/new?error=${encodeURIComponent(result.reason)}`);
    }

    dependencies.revalidatePath('/admin/products');
    dependencies.redirect(`/admin/products/${result.productId}/specifications?created=1`);
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

export async function createProductAction(formData: FormData): Promise<void> {
  'use server';
  return createCreateProductAction({
    requireAdmin: requireAdminSession,
    creationStore: createPrismaProductCreationStore(prisma),
    revalidatePath,
    redirect,
  })(formData);
}
