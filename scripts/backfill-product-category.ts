import { PrismaClient } from '@prisma/client';

export type ResolverProduct = {
  id: string;
  slug: string;
  category: string;
  category_id: string | null;
};

export type ResolverCategory = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryBackfillResult = {
  updates: Array<{ productId: string; categoryId: string }>;
  unchanged: Array<{ productId: string; slug: string; category: string }>;
  unmatched: Array<{ productId: string; slug: string; category: string }>;
};

const normalize = (value: string) => value.trim().toLocaleLowerCase();

export function resolveCategoryBackfill(
  products: readonly ResolverProduct[],
  categories: readonly ResolverCategory[],
): CategoryBackfillResult {
  const byName = new Map<string, ResolverCategory>();
  const bySlug = new Map<string, ResolverCategory>();
  for (const category of [...categories].sort((a, b) => a.id.localeCompare(b.id))) {
    byName.set(normalize(category.name), category);
    bySlug.set(normalize(category.slug), category);
  }

  const updates: CategoryBackfillResult['updates'] = [];
  const unchanged: CategoryBackfillResult['unchanged'] = [];
  const unmatched: CategoryBackfillResult['unmatched'] = [];
  for (const product of [...products].sort((a, b) => a.id.localeCompare(b.id))) {
    const category = byName.get(normalize(product.category)) ?? bySlug.get(normalize(product.category));
    if (!category) {
      unmatched.push({ productId: product.id, slug: product.slug, category: product.category });
    } else if (product.category_id === category.id) {
      unchanged.push({ productId: product.id, slug: product.slug, category: product.category });
    } else {
      updates.push({ productId: product.id, categoryId: category.id });
    }
  }
  return { updates, unchanged, unmatched };
}

export async function runBackfill(prisma: PrismaClient): Promise<CategoryBackfillResult> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ select: { id: true, slug: true, category: true, category_id: true } }),
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
  ]);
  const result = resolveCategoryBackfill(products, categories);
  for (const update of result.updates) {
    await prisma.product.update({ where: { id: update.productId }, data: { category_id: update.categoryId } });
  }
  return result;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await runBackfill(prisma);
    console.log(`matched: ${result.updates.length + result.unchanged.length}`);
    console.log(`updated: ${result.updates.length}`);
    console.log(`unchanged: ${result.unchanged.length}`);
    console.log(`unmatched: ${result.unmatched.length}`);
    for (const product of result.unmatched) {
      console.log(`unmatched product id=${product.productId} slug=${product.slug} category=${JSON.stringify(product.category)}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/backfill-product-category.ts')) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
