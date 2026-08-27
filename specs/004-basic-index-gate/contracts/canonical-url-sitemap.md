# Contract: Canonical URL and Product Sitemap

## Canonical origin API

```ts
export const DEFAULT_SITE_URL = 'https://deskholt.com';

export function getCanonicalSiteUrl(
  explicitSiteUrl = process.env.SITE_URL
): URL;
```

### Accepted explicit origin

- `http:` or `https:`;
- hostname present;
- optional port;
- no username/password;
- pathname exactly `/`;
- no query;
- no fragment.

Absent, empty, or whitespace-only input returns a new `URL(DEFAULT_SITE_URL)`. A non-empty malformed value throws. Request host is never consulted.

## Canonical Product API

```ts
export function getProductCanonicalUrl(
  rawPersistedSlug: string,
  siteUrl: URL
): URL;
```

Path is exactly:

```text
/products/${encodeURIComponent(rawPersistedSlug)}
```

Requirements:

- raw persisted slug is encoded exactly once;
- exact lowercase `/products/` prefix;
- no trailing slash;
- no case normalization of slug;
- no mutation of `siteUrl`;
- metadata and sitemap call this same function.

## Sitemap route

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap>;
```

Execution order:

1. Await the request-time boundary.
2. Resolve/validate canonical origin.
3. Query Products with shared `ACTIVE + indexed` predicate.
4. Select `slug` and `updated_at` only.
5. Order by raw slug ascending.
6. Map each row with `getProductCanonicalUrl(product.slug, siteUrl).toString()`; sitemap `url` is always a string even though the shared builder returns `URL`.
7. Return `{url, lastModified}` only.

## Failure and empty behavior

- zero eligible rows → valid empty Product sitemap;
- invalid explicit origin → throw;
- database query failure → throw;
- no request-host fallback;
- no catch-and-fabricate-empty behavior.

## Test matrix

### Origin

- undefined, empty, whitespace → `https://deskholt.com/`;
- HTTP and HTTPS origins accepted;
- custom port retained;
- credentials rejected;
- path other than `/` rejected;
- query/hash rejected;
- missing hostname or unsupported scheme rejected.

### Product path

- normal slug;
- spaces;
- Unicode;
- `%`;
- `/`;
- `?`;
- original case retained;
- no double encoding;
- no trailing slash;
- supplied origin object unchanged.

### Sitemap

- active indexed only;
- slug ascending;
- mapped `url` has runtime/type-level string shape and equals the shared builder's `.toString()`;
- exact Product URLs;
- `updated_at` maps to `lastModified`;
- no priority/change frequency;
- empty input maps to empty output;
- errors propagate;
- production build reports dynamic `/sitemap.xml`.
