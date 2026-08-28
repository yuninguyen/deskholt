# P0-A3 US1 Seed Impact and Change

Date: 2026-08-27

## GitNexus

The direct symbol query for `prisma/seed.ts:main` was not indexed. The fallback file target `seed.ts` returned:

```text
upstream impacted: 0
risk: LOW
```

A concept query identified the active seed entrypoint and related Product/affiliate flows. No HIGH/CRITICAL warning was returned. Generated Prisma Client consumers are not indexed as editable symbols.

## Change

- `prisma/seed.ts` now explicitly creates every seeded Product as `status: 'DRAFT'` and `is_indexed: false`.
- The temporary auto-index comment was removed.
- `prisma/seed.js` was deleted.
- The stale ESLint ignore entry for `prisma/seed.js` was removed.
- Operational scan confirms no package script, source import, executable/configuration reference, or operational instruction targets the removed seed. Historical spec/review mentions remain audit evidence only.

## Verification

`tests/p0A3SeedSafety.test.ts` passes all 3 tests. No production database was seeded or modified.
