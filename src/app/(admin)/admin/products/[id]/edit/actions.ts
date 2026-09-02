import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from '@/lib/admin/auth';
import {
  createPrismaProductEditStore,
  executeEditProduct,
  parseEditProductInput,
  type ProductEditStore,
} from '@/lib/products/productEditCommand';

export type ProductEditActionDependencies = {
  requireAdmin(): Promise<void>;
  store: ProductEditStore;
  revalidatePath(path: string): void;
  redirect(path: string): never;
};

async function requireAdminSession(): Promise<void> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSessionToken(token))) {
    redirect('/admin/login?from=%2Fadmin%2Fproducts');
  }
}

function editPath(productId: string, suffix: string): string {
  return `/admin/products/${encodeURIComponent(productId)}/edit?${suffix}`;
}

export function createEditProductAction(
  dependencies: ProductEditActionDependencies,
  productId: string
): (formData: FormData) => Promise<void> {
  return async (formData) => {
    await dependencies.requireAdmin();

    let input: ReturnType<typeof parseEditProductInput>;
    try {
      input = parseEditProductInput(formData);
    } catch {
      dependencies.redirect(editPath(productId, 'error=invalid-input'));
    }

    const result = await executeEditProduct(dependencies.store, productId, input);
    if (!result.ok) {
      dependencies.redirect(editPath(productId, `error=${encodeURIComponent(result.reason)}`));
    }

    dependencies.revalidatePath('/');
    dependencies.revalidatePath('/admin/products');
    dependencies.redirect(editPath(productId, 'saved=1'));
  };
}

export async function editProductAction(productId: string, formData: FormData): Promise<void> {
  'use server';
  return createEditProductAction({
    requireAdmin: requireAdminSession,
    store: createPrismaProductEditStore(prisma),
    revalidatePath,
    redirect,
  }, productId)(formData);
}
