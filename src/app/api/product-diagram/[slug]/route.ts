import { prisma } from '@/lib/prisma';
import {
  getDiagramEligibility,
  renderDiagramSvg,
  type DiagramEligibility,
} from '@/lib/products/productDiagram';

type ProductDiagramRouteDependencies = {
  findProductBySlug(slug: string): Promise<{ id: string; name: string } | null>;
  getEligibility(productId: string): Promise<DiagramEligibility>;
};

type ProductDiagramRouteContext = { params: Promise<{ slug: string }> };

export function createProductDiagramGetHandler(dependencies: ProductDiagramRouteDependencies) {
  return async function GET(_request: Request, { params }: ProductDiagramRouteContext) {
    const { slug } = await params;
    const product = await dependencies.findProductBySlug(slug);
    if (!product) return new Response(null, { status: 404 });

    const eligibility = await dependencies.getEligibility(product.id);
    if (!eligibility.eligible) return new Response(null, { status: 404 });

    return new Response(renderDiagramSvg(eligibility.dimensions, product.name), {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  };
}

export const GET = createProductDiagramGetHandler({
  findProductBySlug: (slug) => prisma.product.findUnique({
    where: { slug },
    select: { id: true, name: true },
  }),
  getEligibility: (productId) => getDiagramEligibility(productId),
});
