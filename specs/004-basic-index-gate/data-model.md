# Phase 1 Data Model: P0-A3 Basic Index Gate

## ProductStatus enum (new)

```prisma
enum ProductStatus {
  DRAFT
  ACTIVE
  BLOCKED
  ARCHIVED
}
```

Lifecycle is persisted independently from search-index enablement.

## Product (existing model, changed fields)

| Field | Type | Default after P0-A3 | Meaning |
|---|---|---:|---|
| `status` | `ProductStatus` | `DRAFT` | Editorial/public lifecycle |
| `is_indexed` | `Boolean` | `false` | Explicit search/listing/sitemap enablement for an active Product |

All other Product fields and relationships are unchanged.

### Insert invariant

A Product inserted without explicit publishing values becomes:

```text
DRAFT + non-indexable
```

The active seed must create this same safe state.

### Existing-row backfill

Every Product present at P0-A3 migration execution becomes:

```text
ACTIVE + non-indexable
```

The approved current environment is expected to contain 20 such Products, but the migration applies the backfill to every existing Product rather than hardcoding a row count.

## Stored state matrix

Eight stored combinations are representable so malformed/legacy data can be evaluated deterministically:

| Status | `is_indexed` | Public | Index/List/Sitemap | Commerce | Reason |
|---|---:|---:|---:|---:|---|
| `DRAFT` | false | no | no | no | `draft` |
| `DRAFT` | true | no | no | no | `draft` |
| `BLOCKED` | false | no | no | no | `blocked` |
| `BLOCKED` | true | no | no | no | `blocked` |
| `ARCHIVED` | false | no | no | no | `archived` |
| `ARCHIVED` | true | no | no | no | `archived` |
| `ACTIVE` | false | yes | no | yes | `explicit-noindex` |
| `ACTIVE` | true | yes | yes | yes | `eligible` |

Lifecycle always takes precedence over the index flag.

## Product lookup result

Missing Product is not a Product status and does not create a Product access decision:

```ts
type ProductLookupResult<T> =
  | { kind: 'missing' }
  | { kind: 'found'; product: T };
```

## ProductAccessDecision (derived, not persisted)

```ts
type ProductAccessReason =
  | 'draft'
  | 'blocked'
  | 'archived'
  | 'explicit-noindex'
  | 'eligible';

type ProductAccessDecision = {
  reason: ProductAccessReason;
  isPublic: boolean;
  isIndexable: boolean;
  isListable: boolean;
  isInSitemap: boolean;
  isCommerceEligible: boolean;
  robots: {
    index: boolean;
    follow: true;
  } | null;
};
```

`robots` is meaningful only for public Product pages. Non-public/missing routes terminate as not found.

## Shared indexable query predicate

Homepage, category, and sitemap must select by one equivalent predicate:

```ts
{
  status: 'ACTIVE',
  is_indexed: true,
}
```

The concrete exported constant/type must remain compatible with Prisma's generated Product where input. Query-side filtering is mandatory even though the pure decision policy is also authoritative for per-record decisions.

## PublishingCommand (input)

```ts
type PublishingCommand =
  | { kind: 'set-lifecycle'; status: ProductStatus }
  | { kind: 'enable-index' }
  | { kind: 'disable-index' };
```

## ProductPublishingOperation (normalized output)

```ts
type ProductPublishingOperation =
  | {
      kind: 'set-lifecycle';
      status: ProductStatus;
      is_indexed: false;
    }
  | {
      kind: 'enable-index-if-active';
    }
  | {
      kind: 'disable-index';
      is_indexed: false;
    };
```

The operation type deliberately prevents enable/disable commands from carrying a stale lifecycle value.

### Transition rules

| Current state | Command | Result |
|---|---|---|
| any existing state | set lifecycle `DRAFT` | `DRAFT + false` |
| any existing state | set lifecycle `BLOCKED` | `BLOCKED + false` |
| any existing state | set lifecycle `ARCHIVED` | `ARCHIVED + false` |
| any existing state, including malformed index=true | set lifecycle `ACTIVE` | `ACTIVE + false` |
| `ACTIVE + false` | enable index | `ACTIVE + true` |
| `ACTIVE + true` | enable index | idempotent `ACTIVE + true` or accepted no-op |
| any non-`ACTIVE` state | enable index | reject, no write |
| any state | disable index | preserve status, set false |

### Concurrency-safe persistence

- **Set lifecycle** uses one atomic update by Product ID that writes only `status = target` and `is_indexed = false`.
- **Enable index** uses one atomic conditional update equivalent to `WHERE id = productId AND status = ACTIVE SET is_indexed = true`; success requires affected-row count exactly one. PostgreSQL reevaluates the predicate after any row-lock wait, so a concurrent lifecycle change cannot be overwritten by stale normalization.
- **Disable index** updates only `is_indexed = false` by Product ID and never writes `status`.
- If conditional enable affects zero rows, a follow-up read distinguishes missing from currently non-active. If the row is active by the follow-up read because another transition occurred between statements, return a controlled concurrent-change conflict/no-write rather than guessing or applying a stale write.

No publishing command performs read-then-full-row-write under default `READ COMMITTED` isolation.

## ProductPageDataResult (request-scoped, derived)

```ts
type ProductPageDataResult =
  | {
      kind: 'missing';
      evaluatedAt: Date;
    }
  | {
      kind: 'non-public';
      product: ProductPageSnapshot;
      decision: ProductAccessDecision;
      evaluatedAt: Date;
    }
  | {
      kind: 'public';
      product: ProductPageSnapshot;
      decision: ProductAccessDecision;
      evaluatedAt: Date;
      offerPresentation: ProductOfferPresentation;
    };
```

`ProductPageSnapshot` contains the Product fields and ordered AffiliateLinks needed by metadata, body, JSON-LD, and offer UI. It is loaded once per render result. Public-only specifications are loaded by the page after this result confirms public eligibility; metadata does not trigger specification loading.

Properties:

- `evaluatedAt` is captured before lookup, so `missing` also records when the request-scoped lookup was evaluated;
- exactly one Product/AffiliateLink snapshot for found Products;
- exactly one access decision for a found Product;
- exactly one evaluation timestamp;
- exactly one P0-A2 offer presentation for a public Product;
- metadata/body receive the same cached result identity/value for one render;
- a separate request gets a fresh result.

## Canonical origin and Product URL (derived)

### Origin

`URL` value satisfying:

- protocol `http:` or `https:`;
- hostname present;
- no username/password;
- pathname exactly `/`;
- no query/hash;
- optional explicit port;
- absent/blank environment input falls back to `https://deskholt.com`.

### Product path

```text
/products/${encodeURIComponent(rawPersistedSlug)}
```

No trailing slash, case normalization, or second encoding pass.

## SitemapProductRow (query projection)

```ts
type SitemapProductRow = {
  slug: string;
  updated_at: Date;
};
```

Rows are selected only for `ACTIVE + indexed`, ordered by raw persisted slug ascending, then mapped to:

```ts
type SitemapProductEntry = {
  url: string;
  lastModified: Date;
};
```

The mapper must use `getProductCanonicalUrl(row.slug, siteUrl).toString()` so the framework sitemap receives a string rather than a `URL` object. No priority or change frequency fields.

## Migration preservation snapshot (verification artifact)

The snapshot is an execution-time deterministic document, not an application table. It excludes intended Product status/index changes from its equality hash and includes:

- row counts for all application tables;
- orphan counts for all foreign keys;
- sorted `Product.id ↔ slug`;
- sorted `AffiliateLink.id → product_id`;
- sorted `Click.id/click_id → product_id`;
- sorted Conversion-to-Click linkage;
- sorted `ProductVariant.id → product_id`;
- sorted `ProductAttribute.id → product_id/variant_id`.

Before/after documents must be byte-equivalent or structurally exactly equal. Product backfill is asserted separately.

## Existing relationships preserved unchanged

- Product → Category
- AffiliateLink → Product
- Click → Product
- Conversion → Click by public click ID
- ProductVariant → Product
- ProductAttribute → Product
- ProductAttribute → ProductVariant when non-null
- ProductAttribute → AttributeDefinition
- CategoryAttribute → Category and AttributeDefinition

P0-A3 introduces no new relationship and changes no primary or foreign key.
