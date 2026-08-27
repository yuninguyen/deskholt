import { cache } from 'react';
import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  CATALOG_CURRENCY,
  STRUCTURED_OFFER_MAX_AGE_MS,
  buildOfferPresentation,
  type OfferCandidate,
} from './productStructuredData';
import { evaluateProductAccess } from './productAccessPolicy';
import { recordProductPageProbeCounter } from './productPageCacheProbe';

type NoInferLocal<T> = [T][T extends unknown ? 0 : never];

export type ProductPageDataDependencies<TProduct, TDecision, TOfferPresentation> = {
  awaitRequestBoundary(): Promise<void>;
  now(): Date;
  findProduct(slug: string): Promise<TProduct | null>;
  evaluateAccess(product: NoInferLocal<TProduct>): TDecision;
  buildOfferPresentation(product: NoInferLocal<TProduct>, now: Date): TOfferPresentation;
  recordRepositoryLoad?(): Promise<void>;
  recordAccessEvaluation?(): Promise<void>;
  recordOfferEvaluation?(): Promise<void>;
};

export type ProductPageDataResult<TProduct = unknown, TDecision = unknown, TOfferPresentation = unknown> =
  | { kind: 'missing'; evaluatedAt: Date }
  | { kind: 'non-public'; evaluatedAt: Date; product: TProduct; decision: TDecision }
  | {
      kind: 'public';
      evaluatedAt: Date;
      product: TProduct;
      decision: TDecision;
      offerPresentation: TOfferPresentation;
    };

export async function loadProductPageDataUncached<TProduct, TDecision, TOfferPresentation>(
  slug: string,
  dependencies: ProductPageDataDependencies<TProduct, TDecision, TOfferPresentation>
): Promise<ProductPageDataResult<TProduct, TDecision, TOfferPresentation>> {
  await dependencies.awaitRequestBoundary();
  const evaluatedAt = dependencies.now();
  const product = await dependencies.findProduct(slug);
  await dependencies.recordRepositoryLoad?.();
  if (!product) return { kind: 'missing', evaluatedAt };

  const decision = dependencies.evaluateAccess(product);
  await dependencies.recordAccessEvaluation?.();
  const snapshot = structuredClone(product);
  if (!(decision as { isPublic?: boolean }).isPublic) {
    return { kind: 'non-public', evaluatedAt, product: snapshot, decision };
  }

  const offerPresentation = dependencies.buildOfferPresentation(snapshot, evaluatedAt);
  await dependencies.recordOfferEvaluation?.();
  return {
    kind: 'public',
    evaluatedAt,
    product: snapshot,
    decision,
    offerPresentation,
  };
}

type ProductPageSnapshot = Prisma.ProductGetPayload<{ include: { affiliate_links: true } }>;

type ProductPageDecision = ReturnType<typeof evaluateProductAccess>;
type ProductPageOffer = OfferCandidate & { id: string; network: string };
type ProductPageOfferPresentation = ReturnType<typeof buildOfferPresentation<ProductPageOffer>>;

export const getProductPageData = cache(async (lookupSlug: string) =>
  loadProductPageDataUncached<ProductPageSnapshot, ProductPageDecision, ProductPageOfferPresentation>(lookupSlug, {
    awaitRequestBoundary: async () => {
      await connection();
    },
    now: () => new Date(),
    findProduct: (slug) =>
      prisma.product.findUnique({
        where: { slug },
        include: {
          affiliate_links: {
            orderBy: [
              { is_in_stock: 'desc' },
              { priority_order: 'asc' },
              { id: 'asc' },
            ],
          },
        },
      }),
    evaluateAccess: evaluateProductAccess,
    buildOfferPresentation: (product, now) =>
      buildOfferPresentation<ProductPageOffer>(product.affiliate_links, {
        now,
        maxAgeMs: STRUCTURED_OFFER_MAX_AGE_MS,
        currency: CATALOG_CURRENCY,
      }),
    recordRepositoryLoad: () => recordProductPageProbeCounter(lookupSlug, 'repositoryLoads'),
    recordAccessEvaluation: () => recordProductPageProbeCounter(lookupSlug, 'accessEvaluations'),
    recordOfferEvaluation: () => recordProductPageProbeCounter(lookupSlug, 'offerEvaluations'),
  })
);
