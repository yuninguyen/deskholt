import type { Prisma } from '@prisma/client';

export type CreateProductInput = {
  name: string;
  slug: string;
  categorySlug: string;
  brandName?: string;
  description: string;
  imageUrl: string;
  upcCode?: string;
  isSustainable: boolean;
};

export type CreateProductData = {
  name: string;
  slug: string;
  category: string;
  category_id: string;
  brand_id: string | null;
  description: string;
  image_url: string;
  upc_code: string | null;
  status: 'DRAFT';
  is_indexed: false;
  is_sustainable: boolean;
};

export type ProductCreationStore = {
  slugExists(slug: string): Promise<boolean>;
  findCategoryBySlug(slug: string): Promise<{ id: string } | null>;
  upsertBrand(name: string): Promise<{ id: string }>;
  createProduct(data: CreateProductData): Promise<{ id: string }>;
};

export type CreateProductResult =
  | { ok: true; productId: string }
  | { ok: false; reason: 'category-missing' | 'slug-taken' | 'invalid-input' };

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

export function parseCreateProductInput(formData: FormData): CreateProductInput {
  const slug = requiredText(formData, 'slug');
  if (!PRODUCT_SLUG_PATTERN.test(slug)) throw new Error('invalid slug');

  const imageUrl = requiredText(formData, 'imageUrl');
  if (!URL.canParse(imageUrl)) throw new Error('invalid image URL');

  return {
    name: requiredText(formData, 'name'),
    slug,
    categorySlug: requiredText(formData, 'categorySlug'),
    brandName: optionalText(formData, 'brandName'),
    description: requiredText(formData, 'description'),
    imageUrl,
    upcCode: optionalText(formData, 'upcCode'),
    isSustainable: formData.has('isSustainable'),
  };
}

export async function executeCreateProduct(
  store: ProductCreationStore,
  input: CreateProductInput
): Promise<CreateProductResult> {
  const category = await store.findCategoryBySlug(input.categorySlug);
  if (!category) return { ok: false, reason: 'category-missing' };

  if (await store.slugExists(input.slug)) return { ok: false, reason: 'slug-taken' };

  const brand = input.brandName ? await store.upsertBrand(input.brandName) : null;
  try {
    const product = await store.createProduct({
      name: input.name,
      slug: input.slug,
      category: input.categorySlug,
      category_id: category.id,
      brand_id: brand?.id ?? null,
      description: input.description,
      image_url: input.imageUrl,
      upc_code: input.upcCode ?? null,
      status: 'DRAFT',
      is_indexed: false,
      is_sustainable: input.isSustainable,
    });

    return { ok: true, productId: product.id };
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

export function createPrismaProductCreationStore(prisma: Prisma.TransactionClient): ProductCreationStore {
  return {
    slugExists: async (slug) => (await prisma.product.count({ where: { slug } })) > 0,
    findCategoryBySlug: async (slug) => prisma.category.findUnique({ where: { slug }, select: { id: true } }),
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
    createProduct: async (data) => prisma.product.create({ data, select: { id: true } }),
  };
}
