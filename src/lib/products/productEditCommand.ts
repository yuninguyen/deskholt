import type { Prisma, ProductStatus } from '@prisma/client';

export type EditProductInput = {
  name: string;
  slug?: string;
  brandName?: string;
  description: string;
  imageUrl: string;
  upcCode?: string;
  isSustainable: boolean;
};

export type EditProductData = {
  name: string;
  slug?: string;
  brand_id: string | null;
  description: string;
  image_url: string;
  upc_code: string | null;
  is_sustainable: boolean;
};

export type ProductEditStore = {
  findProductForEdit(id: string): Promise<{ id: string; slug: string; status: ProductStatus } | null>;
  slugExists(slug: string, excludeProductId: string): Promise<boolean>;
  upsertBrand(name: string): Promise<{ id: string }>;
  updateProduct(id: string, data: EditProductData): Promise<void>;
};

export type EditProductResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-input' | 'not-found' | 'slug-taken' | 'slug-locked' };

const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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

export function parseEditProductInput(formData: FormData): EditProductInput {
  const slug = formData.get('slugEditable') === '1' && formData.has('slug')
    ? requiredText(formData, 'slug')
    : undefined;
  if (slug !== undefined && !PRODUCT_SLUG_PATTERN.test(slug)) throw new Error('invalid slug');

  const imageUrl = requiredText(formData, 'imageUrl');
  if (!URL.canParse(imageUrl)) throw new Error('invalid image URL');

  return {
    name: requiredText(formData, 'name'),
    slug,
    brandName: optionalText(formData, 'brandName'),
    description: requiredText(formData, 'description'),
    imageUrl,
    upcCode: optionalText(formData, 'upcCode'),
    isSustainable: formData.has('isSustainable'),
  };
}

export async function executeEditProduct(
  store: ProductEditStore,
  productId: string,
  input: EditProductInput
): Promise<EditProductResult> {
  const current = await store.findProductForEdit(productId);
  if (!current) return { ok: false, reason: 'not-found' };

  const data: EditProductData = {
    name: input.name,
    brand_id: null,
    description: input.description,
    image_url: input.imageUrl,
    upc_code: input.upcCode ?? null,
    is_sustainable: input.isSustainable,
  };
  if (input.slug !== undefined && input.slug !== current.slug) {
    if (current.status !== 'DRAFT') return { ok: false, reason: 'slug-locked' };
    if (await store.slugExists(input.slug, productId)) return { ok: false, reason: 'slug-taken' };
    data.slug = input.slug;
  }

  const brand = input.brandName ? await store.upsertBrand(input.brandName) : null;
  data.brand_id = brand?.id ?? null;
  try {
    await store.updateProduct(productId, data);
    return { ok: true };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return { ok: false, reason: 'slug-taken' };
    }
    throw error;
  }
}

function brandSlug(name: string): string {
  return `brand-${[...name].map((character) => character.codePointAt(0)?.toString(36)).join('-')}`;
}

export function createPrismaProductEditStore(prisma: Prisma.TransactionClient): ProductEditStore {
  return {
    findProductForEdit: async (id) => prisma.product.findUnique({
      where: { id },
      select: { id: true, slug: true, status: true },
    }),
    slugExists: async (slug, excludeProductId) =>
      (await prisma.product.count({ where: { slug, id: { not: excludeProductId } } })) > 0,
    upsertBrand: async (name) => {
      const existing = await prisma.brand.findFirst({ where: { name }, select: { id: true } });
      if (existing) return existing;

      const slug = brandSlug(name);
      return prisma.brand.upsert({
        where: { slug },
        update: {},
        create: { slug, name },
        select: { id: true },
      });
    },
    updateProduct: async (id, data) => {
      await prisma.product.update({ where: { id }, data });
    },
  };
}
