import type { Prisma, ProductStatus } from '@prisma/client';

export type ProductAccessInput = {
  status: ProductStatus;
  is_indexed: boolean;
};

export type ProductAccessReason =
  | 'draft'
  | 'blocked'
  | 'archived'
  | 'explicit-noindex'
  | 'eligible';

export type ProductAccessDecision = {
  reason: ProductAccessReason;
  isPublic: boolean;
  isIndexable: boolean;
  isListable: boolean;
  isInSitemap: boolean;
  isCommerceEligible: boolean;
  robots: { index: boolean; follow: boolean } | null;
};

export const INDEXABLE_PRODUCT_WHERE = {
  status: 'ACTIVE',
  is_indexed: true,
} satisfies Prisma.ProductWhereInput;

export function evaluateProductAccess(input: ProductAccessInput): ProductAccessDecision {
  switch (input.status) {
    case 'DRAFT':
      return {
        reason: 'draft',
        isPublic: false,
        isIndexable: false,
        isListable: false,
        isInSitemap: false,
        isCommerceEligible: false,
        robots: null,
      };
    case 'BLOCKED':
      return {
        reason: 'blocked',
        isPublic: false,
        isIndexable: false,
        isListable: false,
        isInSitemap: false,
        isCommerceEligible: false,
        robots: null,
      };
    case 'ARCHIVED':
      return {
        reason: 'archived',
        isPublic: false,
        isIndexable: false,
        isListable: false,
        isInSitemap: false,
        isCommerceEligible: false,
        robots: null,
      };
    case 'ACTIVE':
      if (!input.is_indexed) {
        return {
          reason: 'explicit-noindex',
          isPublic: true,
          isIndexable: false,
          isListable: false,
          isInSitemap: false,
          isCommerceEligible: true,
          robots: { index: false, follow: true },
        };
      }
      return {
        reason: 'eligible',
        isPublic: true,
        isIndexable: true,
        isListable: true,
        isInSitemap: true,
        isCommerceEligible: true,
        robots: { index: true, follow: true },
      };
  }
}
