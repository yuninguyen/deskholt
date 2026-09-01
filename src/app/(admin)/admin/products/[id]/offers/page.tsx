import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAdminTranslations } from '@/lib/admin/i18n/server';
import { prisma } from '@/lib/prisma';
import { createAffiliateLinkAction, updateAffiliateLinkAction } from './actions';

export const dynamic = 'force-dynamic';

type OffersPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
};

const networks = ['amazon', 'walmart', 'target', 'awin', 'impact', 'cj'] as const;

export default async function OffersPage({ params, searchParams }: OffersPageProps) {
  const { id } = await params;
  const { saved, error } = await searchParams;
  const [product, translations] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, category: true },
    }),
    getAdminTranslations(),
  ]);

  if (!product) {
    notFound();
  }

  const links = await prisma.affiliateLink.findMany({
    where: { product_id: id },
    orderBy: { priority_order: 'asc' },
  });
  const offerErrorMessages: Record<string, string> = {
    'invalid-input': translations.offers.errors.invalidInput,
    'not-found': translations.offers.errors.notFound,
  };
  const errorMessage = error ? offerErrorMessages[error] ?? translations.offers.errors.fallback : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin/products" className="text-xs text-admin-muted-foreground hover:text-admin-foreground">
          ← {translations.offers.back}
        </Link>
        <h1 className="mt-1 font-body text-2xl font-bold text-admin-foreground">{translations.offers.title}</h1>
        <p className="mt-1 font-body text-sm text-admin-muted-foreground">
          {product.name} · {product.category}
        </p>
      </div>

      {saved && (
        <p
          role="status"
          className="rounded-md border border-admin-primary/30 bg-admin-primary/10 px-4 py-3 text-sm text-admin-foreground"
        >
          {translations.offers.saved}
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
          <CardTitle>{translations.offers.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pb-5">
          {links.length === 0 && (
            <p className="text-sm text-admin-muted-foreground">{translations.offers.empty}</p>
          )}

          {links.map((link) => (
            <form key={link.id} action={updateAffiliateLinkAction} className="space-y-4 border-b border-admin-border pb-6 last:border-b-0 last:pb-0">
              <Input type="hidden" name="productId" value={product.id} />
              <Input type="hidden" name="linkId" value={link.id} />
              <Input type="hidden" name="network" value={link.network} />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor={`network-${link.id}`}>{translations.offers.network}</Label>
                  <Select value={link.network} disabled>
                    <SelectTrigger id={`network-${link.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={link.network}>{translations.offers.networks[link.network as keyof typeof translations.offers.networks]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`price-${link.id}`}>{translations.offers.price}</Label>
                  <Input id={`price-${link.id}`} name="price" type="number" step="0.01" min="0.01" defaultValue={link.price} required />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor={`raw-url-${link.id}`}>{translations.offers.rawUrl}</Label>
                  <Input id={`raw-url-${link.id}`} name="raw_url" type="url" defaultValue={link.raw_url} required />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id={`stock-${link.id}`} name="is_in_stock" value="on" defaultChecked={link.is_in_stock} />
                  <Label htmlFor={`stock-${link.id}`}>{translations.offers.inStock}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`priority-${link.id}`}>{translations.offers.priorityOrder}</Label>
                  <Input id={`priority-${link.id}`} name="priority_order" type="number" step="1" min="1" defaultValue={link.priority_order} required className="w-20" />
                </div>
                <AdminStatusBadge variant={link.is_in_stock ? 'success' : 'outline'}>
                  {link.is_in_stock ? translations.offers.inStockBadge : translations.offers.outOfStockBadge}
                </AdminStatusBadge>
                <Button type="submit">{translations.offers.save}</Button>
              </div>
            </form>
          ))}

          <form action={createAffiliateLinkAction} className="space-y-4 border-t border-admin-border pt-6">
            <Input type="hidden" name="productId" value={product.id} />
            <h2 className="font-body text-base font-semibold text-admin-foreground">{translations.offers.addOffer}</h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="new-network">{translations.offers.network}</Label>
                <Select name="network" required>
                  <SelectTrigger id="new-network">
                    <SelectValue placeholder={translations.offers.selectNetwork} />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => (
                      <SelectItem key={network} value={network}>
                        {translations.offers.networks[network]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-price">{translations.offers.price}</Label>
                <Input id="new-price" name="price" type="number" step="0.01" min="0.01" required />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-raw-url">{translations.offers.rawUrl}</Label>
                <Input id="new-raw-url" name="raw_url" type="url" required />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="new-stock" name="is_in_stock" value="on" defaultChecked />
                <Label htmlFor="new-stock">{translations.offers.inStock}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="new-priority">{translations.offers.priorityOrder}</Label>
                <Input id="new-priority" name="priority_order" type="number" step="1" min="1" defaultValue="1" required className="w-20" />
              </div>
              <Button type="submit">{translations.offers.addOffer}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
