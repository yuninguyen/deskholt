# P0-B Seed/Migration Re-verification

## Status

PASS — the P0-A3 seed and migration safeguards remain intact. No regression was found, no database was accessed, and no seed or migration file was modified.

## Prior evidence

This re-verification confirms the earlier P0-A3 evidence recorded at:

- `C:\laragon\www\deskholt\artifacts\p0-a3\us1-seed-impact-and-change.md` supports the seed-side conclusion: the active seed was changed to explicit `DRAFT` plus `is_indexed: false`, `prisma/seed.js` was removed, operational references were removed, and `tests/p0A3SeedSafety.test.ts` passed.
- `C:\laragon\www\deskholt\artifacts\p0-a3\m1\baseline-inspection.md:5-12,14-39` supports the migration-side conclusion: it identifies the version-controlled baseline migration and SHA-256, records two approved ProductAttribute partial indexes, and reproduces their exact complementary `variant_id IS NULL` / `IS NOT NULL` definitions while confirming the baseline contained no P0-A3 lifecycle fields or destructive SQL.
- `C:\laragon\www\deskholt\artifacts\p0-a3\m2-baseline-artifact-packet.md:5-13,53-74` corroborates the same proposed baseline path and SHA-256 and its review of the exact two partial indexes, no destructive SQL, and no populated-database command. Its status is explicitly awaiting human approval, so it supports artifact review and safety boundaries only; it is not evidence that approval or populated deployment occurred.

## Source confirmation

- Active seed entrypoint: `package.json:15` maps `db:seed` to `tsx prisma/seed.ts`.
- Legacy seed absence: `prisma/seed.js` does not exist, while `prisma/seed.ts` is tracked by Git.
- Explicit fail-closed Product creation: `prisma/seed.ts:237-252` creates each Product; `prisma/seed.ts:246-248` documents and sets `status: 'DRAFT'` and `is_indexed: false`.
- Operational-reference guard: `tests/p0A3SeedSafety.test.ts:10-32` defines the operational scan scope, and `tests/p0A3SeedSafety.test.ts:56-68` rejects any operational `prisma/seed.js` reference.
- Product-scope partial unique index: `prisma/migrations/20260827014500_baseline_existing_schema/migration.sql:227-230` defines `product_attributes_product_attribute_unique` with `WHERE "variant_id" IS NULL`.
- Variant-scope partial unique index: `prisma/migrations/20260827014500_baseline_existing_schema/migration.sql:232-234` defines `product_attributes_variant_attribute_unique` with `WHERE "variant_id" IS NOT NULL`.
- Version control: `git ls-files` confirms `prisma/migrations/20260827014500_baseline_existing_schema/migration.sql` is tracked.

## Commands and results

All commands ran from `C:\laragon\www\deskholt\.worktrees\p0-b-click-data-durability`.

```powershell
git ls-files --error-unmatch prisma/seed.ts
if (Test-Path 'prisma/seed.js') { Write-Error 'prisma/seed.js exists'; exit 1 } else { 'PASS: prisma/seed.js absent' }
git ls-files 'prisma/migrations/*/migration.sql'
git grep -n -I -E 'prisma[/\\]seed\.js' -- package.json package-lock.json eslint.config.mjs README.md prisma scripts src ':!tests/**' ':!docs/**' ':!artifacts/**'
```

Result: PASS. `prisma/seed.ts` is tracked; `prisma/seed.js` is absent; the migration SQL files are tracked; no operational seed.js reference was found.

```powershell
git ls-files --error-unmatch prisma/migrations/20260827014500_baseline_existing_schema/migration.sql
Select-String -Path 'prisma/migrations/*/migration.sql' -Pattern 'CREATE UNIQUE INDEX "product_attributes_(product|variant)_attribute_unique"'
```

Result: PASS. Exactly two matching ProductAttribute unique indexes were found, at migration lines 228 and 232. Inspection of lines 227-234 confirms their complementary partial predicates.

```text
npm test -- tests/p0A3SeedSafety.test.ts tests/p0A3MigrationVerifier.test.ts tests/p0A3SourceAcceptance.test.ts
```

Result: PASS — 205 tests, 205 passed, 0 failed. The repository `test` script includes `tests/*.test.ts`, so this command ran the complete tracked test suite plus the explicitly named files. Relevant passing checks included:

- active TypeScript seed creates no indexable Product;
- legacy JavaScript seed file is removed;
- operational files do not reference the legacy JavaScript seed;
- migration verifier safety/unit checks;
- normative P0-A3 verifier script mappings.

The database-backed modes of `npm run verify:p0-a3:migrations` were intentionally not run because they require explicit database URLs and the Task 4 constraint forbids touching a populated database. Static migration inspection and tracked non-database tests were sufficient for this regression check.

## Regression decision

No regression exists. Task 4 Step 2's stop condition was not triggered; the regression check completed with none found.
