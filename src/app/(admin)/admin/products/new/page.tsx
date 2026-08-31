import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createProductAction } from '../actions';

export const dynamic = 'force-dynamic';

type Category = { slug: string; name: string };

type NewProductPageProps = {
  searchParams: Promise<{ error?: string }>;
};

type NewProductPageDependencies = {
  findCategories(): Promise<Category[]>;
  action(formData: FormData): void | Promise<void>;
};

const CREATION_ERROR_MESSAGES: Record<string, string> = {
  'invalid-input': 'Review the required Product fields and try again.',
  'category-missing': 'The selected Category no longer exists. Refresh and choose another Category.',
  'slug-taken': 'That Product slug is already in use. Choose a different slug.',
};

export function createNewProductPage({
  findCategories,
  action,
}: NewProductPageDependencies) {
  return async function NewProductPage({ searchParams }: NewProductPageProps) {
    const [query, categories] = await Promise.all([searchParams, findCategories()]);
    const errorMessage = query.error
      ? CREATION_ERROR_MESSAGES[query.error] ?? 'Product could not be created. Review the form and try again.'
      : undefined;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/admin/products" className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300">
            ← Products
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Create Product</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create the Product identity, then continue to specifications.
          </p>
        </div>

        {errorMessage && (
          <p aria-live="polite" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            Product creation rejected. {errorMessage}
          </p>
        )}

        <form action={action} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-2xl dark:shadow-black/40">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Name</label>
            <input id="name" name="name" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Slug</label>
            <input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Lowercase letters, digits, and hyphens only.</p>
          </div>

          <div>
            <label htmlFor="categorySlug" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Category</label>
            <select id="categorySlug" name="categorySlug" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="">Select a Category</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="brandName" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Brand name <span className="text-gray-500 dark:text-gray-500">(optional)</span></label>
            <input id="brandName" name="brandName" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Description</label>
            <textarea id="description" name="description" required rows={4} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Image URL</label>
            <input id="imageUrl" name="imageUrl" type="url" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label htmlFor="upcCode" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">UPC/SKU <span className="text-gray-500 dark:text-gray-500">(optional)</span></label>
            <input id="upcCode" name="upcCode" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input name="isSustainable" type="checkbox" value="on" className="rounded border-gray-300 bg-white text-brand-600 dark:border-gray-700 dark:bg-gray-800" />
            Sustainable product
          </label>

          <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 dark:shadow-lg dark:shadow-black/30">
            Create Product
          </button>
        </form>
      </div>
    );
  };
}

export default createNewProductPage({
  findCategories: () => prisma.category.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
  action: createProductAction,
});
