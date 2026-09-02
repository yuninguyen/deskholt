import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from '@/lib/admin/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSessionToken(token))) {
    return NextResponse.redirect(new URL('/admin/login?from=%2Fadmin%2Fbackup', request.url));
  }

  const [categories, brands, attributeDefinitions, categoryAttributes, products, productVariants] = await prisma.$transaction([
    prisma.category.findMany(),
    prisma.brand.findMany(),
    prisma.attributeDefinition.findMany(),
    prisma.categoryAttribute.findMany(),
    prisma.product.findMany({ include: { product_attributes: true, affiliate_links: true } }),
    prisma.productVariant.findMany({ include: { product_attributes: true } }),
  ]);
  const exportedAt = new Date();

  return NextResponse.json(
    {
      exportedAt: exportedAt.toISOString(),
      categories,
      brands,
      attributeDefinitions,
      categoryAttributes,
      products,
      productVariants,
    },
    {
      headers: {
        'Content-Disposition': `attachment; filename="deskholt-backup-${exportedAt.toISOString().slice(0, 10)}.json"`,
      },
    }
  );
}
