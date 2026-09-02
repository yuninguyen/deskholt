import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import SlugAutoFillFields from '@/components/admin/products/SlugAutoFillFields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getAdminTranslations } from '@/lib/admin/i18n/server';
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

export function createNewProductPage({
  findCategories,
  action,
}: NewProductPageDependencies) {
  return async function NewProductPage({ searchParams }: NewProductPageProps) {
    const translations = await getAdminTranslations();
    const [query, categories] = await Promise.all([searchParams, findCategories()]);
    const creationErrorMessages: Record<string, string> = {
      'invalid-input': translations.createProduct.errors.invalidInput,
      'category-missing': translations.createProduct.errors.categoryMissing,
      'slug-taken': translations.createProduct.errors.slugTaken,
    };
    const errorMessage = query.error
      ? creationErrorMessages[query.error] ?? translations.createProduct.errors.fallback
      : undefined;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href="/admin/products"
            className="text-xs text-admin-muted-foreground hover:text-admin-foreground"
          >
            ← {translations.createProduct.back}
          </Link>
          <h1 className="mt-1 font-body text-2xl font-bold text-admin-foreground">
            {translations.createProduct.title}
          </h1>
          <p className="mt-1 font-body text-sm text-admin-muted-foreground">
            {translations.createProduct.description}
          </p>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-md border border-admin-destructive/40 bg-admin-destructive/10 px-4 py-3 text-sm text-admin-destructive"
          >
            {translations.createProduct.rejected} {errorMessage}
          </p>
        )}

        <Card>
          <CardContent className="p-5">
            <form action={action} className="space-y-5">
              <SlugAutoFillFields
                nameLabel={translations.createProduct.name}
                slugLabel={translations.createProduct.slug}
                slugHelp={translations.createProduct.slugHelp}
              />

              <div className="space-y-2">
                <Label htmlFor="categorySlug">{translations.createProduct.category}</Label>
                <Select name="categorySlug" required>
                  <SelectTrigger id="categorySlug">
                    <SelectValue placeholder={translations.createProduct.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.slug} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandName">
                  {translations.createProduct.brandName}{' '}
                  <span className="text-admin-muted-foreground">({translations.createProduct.optional})</span>
                </Label>
                <Input id="brandName" name="brandName" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{translations.createProduct.descriptionLabel}</Label>
                <Textarea id="description" name="description" required rows={4} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">{translations.createProduct.imageUrl}</Label>
                <Input id="imageUrl" name="imageUrl" type="url" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upcCode" className="font-mono text-xs uppercase tracking-wide">
                  {translations.createProduct.upcSku}{' '}
                  <span className="font-body normal-case text-admin-muted-foreground">
                    ({translations.createProduct.optional})
                  </span>
                </Label>
                <Input id="upcCode" name="upcCode" />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="isSustainable" name="isSustainable" value="on" />
                <Label htmlFor="isSustainable">{translations.createProduct.sustainable}</Label>
              </div>

              <Button type="submit">{translations.createProduct.submit}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  };
}

export default createNewProductPage({
  findCategories: () => prisma.category.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
  action: createProductAction,
});
