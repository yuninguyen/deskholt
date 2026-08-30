# Relax isRequired for motor_count and warranty_months

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Close the real ontology finding logged in `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §70 ("`isRequired` reconsidered for motor_count/warranty_months") — across all 7 real standing desks entered so far, `motor_count` was absent from the Amazon source data 7/7 times and `warranty_months` had no usable duration 6/7 times. Per §59's own exit criterion ("required attributes are realistic"), `isRequired: true` on these two attributes doesn't match reality. This is a small, precisely-scoped change — do not touch anything else.

## What `is_required` actually does (verified, do not assume more)

Read `src/lib/products/specificationRows.ts` and `src/components/admin/products/ProductSpecificationsForm.tsx` before starting. `CategoryAttribute.is_required` drives exactly two things:
1. A red `*` marker next to the field label in the Admin specifications form.
2. The "Completeness: met/total" counter shown on the Admin specifications page (`total` only counts rows where `is_required` is true).

It does **not** block save (confirmed in blueprint §18) and has no other effect anywhere in the codebase.

## Required change

In `prisma/seed-standing-desk-attributes.ts`, change:
```ts
{ key: 'motor_count', ..., isRequired: true },
```
to `isRequired: false`, and change:
```ts
{ key: 'warranty_months', ..., isRequired: true },
```
to `isRequired: false`. Do not change any other field on either entry (label, scope, dataType, unit, isFilterable, isComparable must stay exactly as they are). Do not touch any other attribute's `isRequired` value.

## Global Constraints

- Only `prisma/seed-standing-desk-attributes.ts` changes. Do not touch `schema.prisma` (no migration needed — this only updates a `CategoryAttribute` row's boolean via the seed's existing idempotent upsert), and do not touch any P0-A/P0-B/other product-script files.
- Do not run the seed script against any real/shared database as part of this PR — verify only against an owned, disposable, loopback-only Postgres instance, same discipline as every prior plan.

---

### Task 1: Update the seed data (tests first)

**Files:** `prisma/seed-standing-desk-attributes.ts`, and wherever the seed's exported `STANDING_DESK_ATTRIBUTES` array or resulting `CategoryAttribute.is_required` values are already covered by a test (search for existing coverage before adding new — e.g. `tests/productAttributeValidator.test.ts` imports this array per PR #8's earlier change)

- [ ] **Step 1:** Add a failing test asserting `motor_count` and `warranty_months` have `isRequired: false` in the exported `STANDING_DESK_ATTRIBUTES` array (read the array directly, don't hardcode a duplicate expected list — assert on the two specific entries by `key`).
- [ ] **Step 2:** Make the two-line change described above.
- [ ] **Step 3:** Run the test. Expected: PASS. Run the full suite: no regressions.

### Task 2: Verification and evidence

- [ ] **Step 1:** Run the seed script against a fresh disposable Postgres (owned, loopback, high port) that already has migrations applied. Confirm the resulting `CategoryAttribute` rows for `motor_count` and `warranty_months` have `is_required: false`, and that re-running the seed again (idempotency check) doesn't change anything further or error.
- [ ] **Step 2:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green.
- [ ] **Step 3:** Record evidence in `artifacts/relax-motor-count-warranty-required/evidence.md`: the before/after `CategoryAttribute.is_required` values for both keys, test output, and a one-line note citing the 7/7 and 6/7 real-product statistics from blueprint §70 that motivated this change.
- [ ] **Step 4:** Push the branch, open a PR against `main`. Do not merge locally. **Do not run the seed script against any real/shared database** — that is a separate, explicit step the user approves after this PR is reviewed and merged (it needs to run against the real dev database to actually take effect there, same as every prior data-affecting script this session).

**After this lands:** `motor_count` and `warranty_months` stop being marked required in the Admin UI and stop counting against the "Completeness" total for every standing desk product — matching what real Amazon-sourced data can actually provide, per the evidence gathered across Products #1–7.
