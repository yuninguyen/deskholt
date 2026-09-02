import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getAdminTranslations } from '@/lib/admin/i18n/server';
import { prisma } from '@/lib/prisma';
import { editProductAction } from './actions';

export const dynamic = 'force-dynamic';

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const [product, translations] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        description: true,
        image_url: true,
        upc_code: true,
        is_sustainable: true,
        brand: { select: { name: true } },
      },
    }),
    getAdminTranslations(),
  ]);

  if (!product) {
    notFound();
  }

  const slugEditable = product.status === 'DRAFT';
  const errorMessages: Record<string, string> = {
    'invalid-input': translations.editProduct.errors.invalidInput,
    'not-found': translations.editProduct.errors.notFound,
    'slug-taken': translations.editProduct.errors.slugTaken,
    'slug-locked': translations.editProduct.errors.slugLocked,
  };
  const errorMessage = error ? errorMessages[error] ?? translations.editProduct.errors.fallback : undefined;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-xs text-admin-muted-foreground hover:text-admin-foreground">
          ← {translations.editProduct.back}
        </Link>
        <h1 className="mt-1 font-body text-2xl font-bold text-admin-foreground">{translations.editProduct.title}</h1>
      </div>

      {saved && (
        <p
          role="status"
          className="rounded-md border border-admin-primary/30 bg-admin-primary/10 px-4 py-3 text-sm text-admin-foreground"
        >
          {translations.editProduct.saved}
        </p>
      )}
      {errorMessage && (
        <p
          role="alert"
          className="rounded-md border border-admin-destructive/40 bg-admin-destructive/10 px-4 py-3 text-sm text-admin-destructive"
        >
          {errorMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{translations.editProduct.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={editProductAction.bind(null, product.id)} className="space-y-5">
            {slugEditable && (<input type="hidden" name="slugEditable" value="1" />)}
            <div className="space-y-2">
              <Label htmlFor="name">{translations.editProduct.name}</Label>
              <Input id="name" name="name" defaultValue={product.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{translations.editProduct.slug}</Label>
              <Input id="slug" name="slug" defaultValue={product.slug} disabled={!slugEditable} />
              {!slugEditable && (<p className="text-sm text-admin-muted-foreground">{translations.editProduct.slugLockedHelp}</p>)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brandName">{translations.editProduct.brandName} ({translations.editProduct.optional})</Label>
              <Input id="brandName" name="brandName" defaultValue={product.brand?.name ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{translations.editProduct.descriptionLabel}</Label>
              <Textarea id="description" name="description" defaultValue={product.description ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">{translations.editProduct.imageUrl}</Label>
              <Input id="imageUrl" name="imageUrl" type="url" defaultValue={product.image_url} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upcCode">{translations.editProduct.upcSku} ({translations.editProduct.optional})</Label>
              <Input id="upcCode" name="upcCode" defaultValue={product.upc_code ?? ''} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isSustainable" name="isSustainable" value="on" defaultChecked={product.is_sustainable} />
              <Label htmlFor="isSustainable">{translations.editProduct.sustainable}</Label>
            </div>
            <Button type="submit">{translations.editProduct.submit}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
