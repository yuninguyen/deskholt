import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildProductJsonLd, serializeProductJsonLd } from '../src/components/ProductSchema.tsx';
import PriceTable from '../src/components/ui/PriceTable.tsx';
import {
  CATALOG_CURRENCY,
  STRUCTURED_OFFER_MAX_AGE_MS,
  buildOfferPresentation,
  getOfferDisplayState,
  isCurrentOffer,
  selectCanonicalOffer,
  toProductStructuredOffer,
  type OfferCandidate,
  type OfferSelectionPolicy,
} from '../src/lib/products/productStructuredData.ts';

const NOW = new Date('2026-08-25T12:00:00.000Z');
const POLICY: OfferSelectionPolicy = {
  now: NOW,
  maxAgeMs: STRUCTURED_OFFER_MAX_AGE_MS,
  currency: CATALOG_CURRENCY,
};

function candidate(overrides: Partial<OfferCandidate> = {}): OfferCandidate {
  return {
    price: 400,
    is_in_stock: true,
    priority_order: 1,
    last_crawled_at: new Date('2026-08-25T11:00:00.000Z'),
    ...overrides,
  };
}

test('isCurrentOffer accepts an observation exactly at the 24-hour cutoff', () => {
  const link = candidate({
    last_crawled_at: new Date(NOW.getTime() - STRUCTURED_OFFER_MAX_AGE_MS),
  });

  assert.equal(isCurrentOffer(link, POLICY), true);
});

test('isCurrentOffer rejects stale, future, and invalid timestamps', () => {
  assert.equal(
    isCurrentOffer(
      candidate({ last_crawled_at: new Date(NOW.getTime() - STRUCTURED_OFFER_MAX_AGE_MS - 1) }),
      POLICY
    ),
    false
  );
  assert.equal(
    isCurrentOffer(candidate({ last_crawled_at: new Date(NOW.getTime() + 1) }), POLICY),
    false
  );
  assert.equal(isCurrentOffer(candidate({ last_crawled_at: new Date('invalid') }), POLICY), false);
});

test('isCurrentOffer rejects out-of-stock and invalid-price candidates', () => {
  assert.equal(isCurrentOffer(candidate({ is_in_stock: false }), POLICY), false);
  assert.equal(isCurrentOffer(candidate({ price: 0 }), POLICY), false);
  assert.equal(isCurrentOffer(candidate({ price: -1 }), POLICY), false);
  assert.equal(isCurrentOffer(candidate({ price: Number.NaN }), POLICY), false);
  assert.equal(isCurrentOffer(candidate({ price: Number.POSITIVE_INFINITY }), POLICY), false);
});

test('selectCanonicalOffer chooses the lowest eligible current price', () => {
  const priorityOne = { ...candidate({ price: 500, priority_order: 1 }), id: 'priority-one' };
  const lowerPrice = { ...candidate({ price: 400, priority_order: 2 }), id: 'lower-price' };

  assert.equal(selectCanonicalOffer([priorityOne, lowerPrice], POLICY)?.id, 'lower-price');
});

test('selectCanonicalOffer excludes stale and out-of-stock lower prices', () => {
  const staleLower = {
    ...candidate({
      price: 300,
      last_crawled_at: new Date(NOW.getTime() - STRUCTURED_OFFER_MAX_AGE_MS - 1),
    }),
    id: 'stale-lower',
  };
  const outOfStockLower = {
    ...candidate({ price: 250, is_in_stock: false }),
    id: 'out-of-stock-lower',
  };
  const freshHigher = { ...candidate({ price: 400 }), id: 'fresh-higher' };

  assert.equal(
    selectCanonicalOffer([staleLower, outOfStockLower, freshHigher], POLICY)?.id,
    'fresh-higher'
  );
});

test('selectCanonicalOffer uses priority and input order as deterministic tie-breakers', () => {
  const priorityTwo = { ...candidate({ price: 400, priority_order: 2 }), id: 'priority-two' };
  const priorityOneFirst = { ...candidate({ price: 400, priority_order: 1 }), id: 'first' };
  const priorityOneSecond = { ...candidate({ price: 400, priority_order: 1 }), id: 'second' };

  assert.equal(
    selectCanonicalOffer([priorityTwo, priorityOneFirst, priorityOneSecond], POLICY)?.id,
    'first'
  );
});

test('selectCanonicalOffer returns undefined when every candidate is stale or out of stock', () => {
  const stale = candidate({
    last_crawled_at: new Date(NOW.getTime() - STRUCTURED_OFFER_MAX_AGE_MS - 1),
  });
  const outOfStock = candidate({ is_in_stock: false });

  assert.equal(selectCanonicalOffer([stale, outOfStock], POLICY), undefined);
});

test('toProductStructuredOffer preserves selected price with the USD catalog invariant', () => {
  assert.deepEqual(toProductStructuredOffer(candidate(), CATALOG_CURRENCY), {
    price: 400,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  });
  assert.equal(toProductStructuredOffer(undefined, CATALOG_CURRENCY), undefined);
});

test('getOfferDisplayState gives stale timestamps precedence over stored stock', () => {
  const staleOutOfStock = candidate({
    is_in_stock: false,
    last_crawled_at: new Date(NOW.getTime() - STRUCTURED_OFFER_MAX_AGE_MS - 1),
  });
  const futureOutOfStock = candidate({
    is_in_stock: false,
    last_crawled_at: new Date(NOW.getTime() + 1),
  });

  assert.equal(getOfferDisplayState(staleOutOfStock, POLICY), 'stale-or-unknown');
  assert.equal(getOfferDisplayState(futureOutOfStock, POLICY), 'stale-or-unknown');
  assert.equal(getOfferDisplayState(candidate({ is_in_stock: false }), POLICY), 'out-of-stock');
});

test('getOfferDisplayState maps invalid prices to stale-or-unknown', () => {
  assert.equal(getOfferDisplayState(candidate({ price: 0 }), POLICY), 'stale-or-unknown');
  assert.equal(getOfferDisplayState(candidate({ price: Number.NaN }), POLICY), 'stale-or-unknown');
  assert.equal(getOfferDisplayState(candidate(), POLICY), 'current-in-stock');
});

const productInput = {
  name: 'Truthful Desk',
  image: 'https://example.com/desk.jpg',
  description: 'A product description',
  sku: 'DESK-1',
};

test('buildProductJsonLd preserves Product data while omitting a missing offer and rating', () => {
  const jsonLd = buildProductJsonLd(productInput);

  assert.equal(jsonLd['@type'], 'Product');
  assert.equal(jsonLd.name, productInput.name);
  assert.equal('offers' in jsonLd, false);
  assert.equal('aggregateRating' in jsonLd, false);
});

test('buildProductJsonLd emits the selected USD InStock offer', () => {
  const offer = toProductStructuredOffer(candidate({ price: 399.99 }), CATALOG_CURRENCY);
  const jsonLd = buildProductJsonLd({ ...productInput, offer });

  assert.deepEqual(jsonLd.offers, {
    '@type': 'Offer',
    price: 399.99,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  });
});

test('serializeProductJsonLd escapes less-than characters', () => {
  const serialized = serializeProductJsonLd(
    buildProductJsonLd({ ...productInput, description: 'Desk <script>alert(1)</script>' })
  );

  assert.doesNotMatch(serialized, /<script>/);
  assert.match(serialized, /\\u003cscript>/);
});

test('all stale or out-of-stock candidates compose to Product JSON-LD without offers', () => {
  const links = [
    candidate({
      price: 300,
      last_crawled_at: new Date(NOW.getTime() - STRUCTURED_OFFER_MAX_AGE_MS - 1),
    }),
    candidate({ price: 250, is_in_stock: false }),
  ];
  const selected = selectCanonicalOffer(links, POLICY);
  const offer = toProductStructuredOffer(selected, CATALOG_CURRENCY);
  const jsonLd = buildProductJsonLd({ ...productInput, offer });
  const serialized = serializeProductJsonLd(jsonLd);

  assert.equal('offers' in jsonLd, false);
  assert.doesNotMatch(serialized, /InStock/);
  assert.doesNotMatch(serialized, /300|250/);
});

test('offer presentation keeps JSON-LD and visible best-row identity consistent', () => {
  const links = [
    { ...candidate({ price: 500, priority_order: 1 }), id: 'five-hundred' },
    { ...candidate({ price: 400, priority_order: 2 }), id: 'four-hundred' },
  ];
  const presentation = buildOfferPresentation(links, POLICY);
  const offer = toProductStructuredOffer(presentation.canonicalOffer, CATALOG_CURRENCY);
  const jsonLd = buildProductJsonLd({ ...productInput, offer });

  assert.equal(presentation.canonicalOffer?.id, 'four-hundred');
  assert.equal(presentation.rows.filter((row) => row.isBestCurrentOffer).length, 1);
  assert.equal(
    presentation.rows.find((row) => row.isBestCurrentOffer)?.offer.id,
    'four-hundred'
  );
  assert.equal((jsonLd.offers as { price: number }).price, 400);
});

test('offer presentation has no best row when every offer is stale', () => {
  const links = [
    {
      ...candidate({
        last_crawled_at: new Date(NOW.getTime() - STRUCTURED_OFFER_MAX_AGE_MS - 1),
      }),
      id: 'stale',
    },
  ];
  const presentation = buildOfferPresentation(links, POLICY);

  assert.equal(presentation.canonicalOffer, undefined);
  assert.equal(presentation.rows.some((row) => row.isBestCurrentOffer), false);
  assert.equal(presentation.rows[0]?.availability, 'stale-or-unknown');
});

test('PriceTable renders stale invalid prices without numeric formatting', () => {
  const html = renderToStaticMarkup(
    createElement(PriceTable, {
      rows: [
        {
          id: 'invalid-price',
          network: 'AMAZON',
          price: undefined,
          availability: 'stale-or-unknown',
          observedAt: new Date('2026-08-20T12:00:00.000Z'),
          isBestCurrentOffer: false,
          goHref: '/go/product?network=amazon',
        },
      ],
    })
  );

  assert.match(html, /Check retailer/);
  assert.match(html, /Check price/);
  assert.match(html, /Last checked/);
  assert.match(html, /—/);
  assert.doesNotMatch(html, /NaN|Infinity|\$0\.00/);
});

test('PriceTable labels a valid stale price as historical and never highlights it', () => {
  const html = renderToStaticMarkup(
    createElement(PriceTable, {
      rows: [
        {
          id: 'stale-price',
          network: 'AMAZON',
          price: 399.99,
          availability: 'stale-or-unknown',
          observedAt: new Date('2026-08-20T12:00:00.884Z'),
          isBestCurrentOffer: false,
          goHref: '/go/product?network=amazon',
        },
      ],
    })
  );

  assert.match(html, /\$399\.99/);
  assert.match(html, /Last checked 2026-08-20 12:00:00 UTC/);
  assert.match(html, /Check retailer/);
  assert.match(html, /Check price/);
  assert.doesNotMatch(html, /In Stock|bg-sage-soft/);
});

test('selector and presentation handle empty and all-out-of-stock inputs fail closed', () => {
  assert.equal(selectCanonicalOffer([], POLICY), undefined);

  const presentation = buildOfferPresentation(
    [
      { ...candidate({ price: 300, is_in_stock: false }), id: 'oos-one' },
      { ...candidate({ price: 250, is_in_stock: false }), id: 'oos-two' },
    ],
    POLICY
  );
  const offer = toProductStructuredOffer(presentation.canonicalOffer, CATALOG_CURRENCY);
  const jsonLd = buildProductJsonLd({ ...productInput, offer });

  assert.equal(presentation.canonicalOffer, undefined);
  assert.equal(presentation.rows.every((row) => row.availability === 'out-of-stock'), true);
  assert.equal(presentation.rows.some((row) => row.isBestCurrentOffer), false);
  assert.equal('offers' in jsonLd, false);
  assert.doesNotMatch(serializeProductJsonLd(jsonLd), /InStock|300|250/);
});

test('freshness and invalid values preserve row-state precedence and hide bad prices', () => {
  const withinCutoff = candidate({
    last_crawled_at: new Date(NOW.getTime() - STRUCTURED_OFFER_MAX_AGE_MS + 1),
  });
  const invalidDateOos = candidate({
    is_in_stock: false,
    last_crawled_at: new Date('invalid'),
  });
  const presentation = buildOfferPresentation(
    [
      { ...candidate({ price: -1 }), id: 'negative' },
      { ...candidate({ price: Number.POSITIVE_INFINITY }), id: 'infinite' },
    ],
    POLICY
  );

  assert.equal(isCurrentOffer(withinCutoff, POLICY), true);
  assert.equal(getOfferDisplayState(invalidDateOos, POLICY), 'stale-or-unknown');
  assert.equal(presentation.canonicalOffer, undefined);
  assert.equal(presentation.rows.every((row) => row.displayPrice === undefined), true);
  assert.equal(presentation.rows.every((row) => row.availability === 'stale-or-unknown'), true);
});

test('PriceTable renders fresh current and out-of-stock CTA behavior', () => {
  const html = renderToStaticMarkup(
    createElement(PriceTable, {
      rows: [
        {
          id: 'current',
          network: 'AMAZON',
          price: 399.99,
          availability: 'current-in-stock',
          observedAt: new Date('2026-08-25T11:00:00.000Z'),
          isBestCurrentOffer: true,
          goHref: '/go/product?network=amazon',
        },
        {
          id: 'oos',
          network: 'WALMART',
          price: 389.99,
          availability: 'out-of-stock',
          observedAt: new Date('2026-08-25T10:00:00.000Z'),
          isBestCurrentOffer: false,
          goHref: '/go/product?network=walmart',
        },
      ],
    })
  );

  assert.match(html, /bg-sage-soft/);
  assert.match(html, /In Stock/);
  assert.match(html, /Out of Stock/);
  assert.match(html, /Last checked 2026-08-25 11:00:00 UTC/);
  assert.equal((html.match(/href=/g) ?? []).length, 1);
  assert.doesNotMatch(html, /Check retailer|Check price/);
});
