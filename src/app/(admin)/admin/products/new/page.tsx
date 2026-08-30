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
          <Link href="/admin/products" className="text-xs text-gray-500 hover:text-gray-300">
            ← Products
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-white">Create Product</h1>
          <p className="mt-1 text-sm text-gray-400">
            Create the Product identity, then continue to specifications.
          </p>
        </div>

        {errorMessage && (
          <p aria-live="polite" className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            Product creation rejected. {errorMessage}
          </p>
        )}

        <form action={action} className="space-y-5 rounded-xl border border-gray-800 bg-gray-950/30 p-5">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-white">Name</label>
            <input id="name" name="name" required className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
          </div>

          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-white">Slug</label>
            <input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
            <p className="mt-1 text-xs text-gray-500">Lowercase letters, digits, and hyphens only.</p>
          </div>

          <div>
            <label htmlFor="categorySlug" className="mb-1 block text-sm font-medium text-white">Category</label>
            <select id="categorySlug" name="categorySlug" required className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
              <option value="">Select a Category</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="brandName" className="mb-1 block text-sm font-medium text-white">Brand name <span className="text-gray-500">(optional)</span></label>
            <input id="brandName" name="brandName" className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-white">Description</label>
            <textarea id="description" name="description" required rows={4} className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
          </div>

          <div>
            <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-white">Image URL</label>
            <input id="imageUrl" name="imageUrl" type="url" required className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
          </div>

          <div>
            <label htmlFor="upcCode" className="mb-1 block text-sm font-medium text-white">UPC/SKU <span className="text-gray-500">(optional)</span></label>
            <input id="upcCode" name="upcCode" className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input name="isSustainable" type="checkbox" value="on" className="rounded border-gray-700 bg-gray-800 text-brand-600" />
            Sustainable product
          </label>

          <button type="submit" className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500">
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
