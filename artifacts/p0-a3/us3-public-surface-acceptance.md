# P0-A3 US3 Public Surface Acceptance

Date: 2026-08-27

Result: **PASS on disposable migrated infrastructure**.

- Full lifecycle/index matrix passes for detail, metadata, listing, sitemap and commerce consistency.
- Product metadata/body use the shared request-cached Product page result.
- Homepage retains exact one-day ISR and uses the shared `ACTIVE + indexed` predicate.
- Category is request-time and uses the shared predicate.
- Canonical origin/path tests pass, including exact once-encoded raw slugs.
- Built runtime cache race proof passes; see `artifacts/p0-a3/us3-cache-runtime.md`.
- Built route smoke: `/` 200, category 200, missing Product 404, `/sitemap.xml` 200.

No populated or production migration operation was performed.