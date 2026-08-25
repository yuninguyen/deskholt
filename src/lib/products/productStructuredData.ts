// P0 catalog policy: DeskHolt is US/USD-only. Do not infer currency from merchant URLs or locale;
// per-offer currency data is required before supporting non-USD catalogs.
export const CATALOG_CURRENCY = 'USD' as const;
export const STRUCTURED_OFFER_MAX_AGE_MS = 86_400_000;

export type OfferCandidate = {
  price: number;
  is_in_stock: boolean;
  priority_order: number;
  last_crawled_at: Date;
};

export type OfferSelectionPolicy = {
  now: Date;
  maxAgeMs: number;
  currency: typeof CATALOG_CURRENCY;
};

export type OfferDisplayState = 'current-in-stock' | 'out-of-stock' | 'stale-or-unknown';

export type ProductStructuredOffer = {
  price: number;
  priceCurrency: typeof CATALOG_CURRENCY;
  availability: 'https://schema.org/InStock';
};

function hasValidPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

function hasCurrentObservation(candidate: OfferCandidate, policy: OfferSelectionPolicy): boolean {
  const observedAt = candidate.last_crawled_at.getTime();
  const now = policy.now.getTime();
  if (!Number.isFinite(observedAt) || !Number.isFinite(now)) return false;
  if (!Number.isFinite(policy.maxAgeMs) || policy.maxAgeMs < 0) return false;
  if (observedAt > now) return false;
  return now - observedAt <= policy.maxAgeMs;
}

export function getOfferDisplayState(
  candidate: OfferCandidate,
  policy: OfferSelectionPolicy
): OfferDisplayState {
  if (!hasCurrentObservation(candidate, policy) || !hasValidPrice(candidate.price)) {
    return 'stale-or-unknown';
  }

  return candidate.is_in_stock ? 'current-in-stock' : 'out-of-stock';
}

export function isCurrentOffer(
  candidate: OfferCandidate,
  policy: OfferSelectionPolicy
): boolean {
  return getOfferDisplayState(candidate, policy) === 'current-in-stock';
}

export function selectCanonicalOffer<T extends OfferCandidate>(
  candidates: T[],
  policy: OfferSelectionPolicy
): T | undefined {
  return candidates.reduce<T | undefined>((selected, candidate) => {
    if (!isCurrentOffer(candidate, policy)) return selected;
    if (!selected) return candidate;
    if (candidate.price < selected.price) return candidate;
    if (candidate.price > selected.price) return selected;
    if (candidate.priority_order < selected.priority_order) return candidate;
    return selected;
  }, undefined);
}

export function buildOfferPresentation<T extends OfferCandidate>(
  candidates: T[],
  policy: OfferSelectionPolicy
): {
  canonicalOffer: T | undefined;
  rows: Array<{
    offer: T;
    availability: OfferDisplayState;
    displayPrice: number | undefined;
    observedAt: Date | undefined;
    isBestCurrentOffer: boolean;
  }>;
} {
  const canonicalOffer = selectCanonicalOffer(candidates, policy);

  return {
    canonicalOffer,
    rows: candidates.map((offer) => ({
      offer,
      availability: getOfferDisplayState(offer, policy),
      displayPrice: hasValidPrice(offer.price) ? offer.price : undefined,
      observedAt: Number.isFinite(offer.last_crawled_at.getTime())
        ? offer.last_crawled_at
        : undefined,
      isBestCurrentOffer: offer === canonicalOffer,
    })),
  };
}

// Precondition: candidate came from selectCanonicalOffer under the active request policy.
export function toProductStructuredOffer(
  candidate: OfferCandidate | undefined,
  currency: typeof CATALOG_CURRENCY
): ProductStructuredOffer | undefined {
  if (!candidate) return undefined;

  return {
    price: candidate.price,
    priceCurrency: currency,
    availability: 'https://schema.org/InStock',
  };
}
