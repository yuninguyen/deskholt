# Task 3 Report — Gap B RED tests

## Status

DONE

## Base and commit

- Base: `c6da7d9f2bb479a7fba4438daa5de621d700dcc7`
- RED tests commit: `b01aab1` (`test: specify product draft recovery behavior`)
- Production code changed: none

## Designed interfaces

### Draft store

Target module: `src/lib/products/specificationDraftStore.ts`

```ts
type SpecificationDraftRows = Record<
  string,
  {
    value: string;
    sourceUrl: string;
    sourceType: string;
    confidence: string;
  }
>;

createSpecificationDraftStore(options?: { now?: () => number }): {
  saveDraft(productId: string, rows: SpecificationDraftRows): string;
  takeDraft(productId: string, token: string): SpecificationDraftRows | null;
  clearProductDrafts(productId: string): void;
};
```

The contract requires opaque unique URL-safe tokens, five-minute TTL, read-once consumption, Product scoping that does not consume on a wrong-Product read, and explicit Product-scoped clearing. Stored row payloads are limited to the four exact raw strings keyed by row key.

### Save action dependencies

`SaveSpecificationsDependencies` is expected to add:

```ts
saveDraft(productId: string, rows: SpecificationDraftRows): string;
clearProductDrafts(productId: string): void;
```

Validation failure saves the exact submitted row strings and appends only `draft=<opaque token>` to the existing error redirect. Success creates no draft and clears all prior drafts for the Product before the existing success redirect.

### Page seam

The page is expected to expose a dependency seam:

```ts
createProductSpecificationsPage({ takeDraft }): typeof ProductSpecificationsPage
```

The resulting Next 16 page awaits both `params` and `searchParams`, calls `takeDraft(currentProductId, draftToken)`, and passes the returned draft to the form. Missing tokens avoid a store read; null reads (expired, wrong Product, or already consumed) pass no draft and preserve the existing-data fallback.

### Form prop

`ProductSpecificationsForm` is expected to accept optional `draft: SpecificationDraftRows`. For every Product-level and active-Variant row, a matching draft row overrides `existing` for `value`, `sourceUrl`, `sourceType`, and `confidence` without parsing or normalizing the strings. Rows absent from the draft retain current existing/blank behavior.

## Test surfaces

1. `tests/specificationDraftStore.test.ts`
   - unique opaque tokens
   - read-once exact payload
   - five-minute expiry
   - wrong-Product isolation without consumption
   - Product-scoped clearing
2. `tests/productSpecificationsAction.test.ts`
   - validation failure saves exact row-keyed strings and redirects with opaque token
   - success creates no draft and clears Product drafts
   - all existing assertions retained
3. `tests/productSpecificationsPage.test.ts`
   - awaited current Product and token consumption
   - valid draft passed to form
   - missing, expired, wrong-Product, and already-consumed fallbacks
4. `tests/productSpecificationsForm.test.ts`
   - exact draft values override existing Product rows and blank Variant rows across sections
   - all existing assertions retained

## RED verification

Command:

```powershell
node --experimental-test-module-mocks --import tsx --test tests/specificationDraftStore.test.ts tests/productSpecificationsAction.test.ts tests/productSpecificationsPage.test.ts tests/productSpecificationsForm.test.ts
```

Result: expected non-zero exit; **24 tests observed, 15 passed, 9 failed**.

Expected missing behavior was demonstrated by:

- missing `src/lib/products/specificationDraftStore` module;
- action never invoking `saveDraft` on validation failure;
- action never invoking `clearProductDrafts` on success;
- form ignoring the draft prop and rendering existing/blank values;
- page missing the designed `createProductSpecificationsPage` draft-consumption seam for valid and all fallback cases.

Full captured output: `.superpowers/sdd/2026-08-28-spec-001-form-correctness-gaps/task-3-red-output.txt`.

## Staged and committed scope

Exactly four test files were staged and committed:

- `tests/productSpecificationsAction.test.ts`
- `tests/productSpecificationsForm.test.ts`
- `tests/productSpecificationsPage.test.ts`
- `tests/specificationDraftStore.test.ts`

`git diff --cached --check` was clean before commit. No production file, report artifact, generated GitNexus instruction update, or pre-existing untracked plan was included.

## Impact and change-scope review

- Binding ledger ruling used: save module, form, and page impacts are LOW; no indexed processes.
- GitNexus index was refreshed after its stale warning; generated instruction-file edits were reverted and excluded.
- The requested MCP-only `gitnexus_detect_changes()` operation was not exposed in this delegated runtime. Scope was instead verified with exact-path staging, `git diff --cached --name-status`, `git diff --cached --stat`, and `git diff --cached --check` before commit.

## Self-review

- Requirements are represented on all four requested surfaces.
- Existing assertions were preserved; only the form render helper gained an optional draft argument.
- Query contents assert opacity by requiring only the token and rejecting raw value/source leakage.
- TTL boundary is specified as expired at exactly five minutes.
- Wrong-Product reads are specified not to consume the rightful Product's draft.
- Form coverage includes both an existing Product row and a blank Variant row.
- No production implementation was added or modified.

## Concerns

- The page test deliberately specifies a small exported factory seam so the Server Component can be tested without relying on process-global module mocks for a not-yet-existing store module. The implementer should preserve the default page export while adding this seam.
- Node reports its module-mocking API as experimental; this is pre-existing project test infrastructure behavior.
- A pre-existing untracked file remains untouched: `docs/superpowers/plans/2026-08-28-spec-001-form-correctness-gaps.md`.

## Fix round 1 evidence

Controller ruling accepted: `createProductSpecificationsPage({ takeDraft })` remains the server-only testability seam, and the test continues to require the default page export.

The remaining Important findings were tightened as follows:

- TTL now uses separate read-once tokens to prove one draft is readable at `5 minutes - 1ms` and another is expired at exactly `5 minutes`.
- The blank Variant row now asserts its own row-keyed `value`, `sourceUrl`, `sourceType`, and non-default selected `confidence` (`LIKELY`).
- Validation-failure redirect now asserts the exact pathname and the complete ordered query set: preserved `error=1`, `count=1`, and exact `detail`, followed by only `draft=opaque_test_token`. It also rejects raw row values, field names, and common row-data/query-blob keys.
- Task 1 empty and invalid `sourceType` cases now register as independently named tests for clearer diagnostics.
- RED output was recaptured as plain UTF-8 text and is readable directly at `.superpowers/sdd/2026-08-28-spec-001-form-correctness-gaps/task-3-red-output.txt`.

Focused RED command:

```powershell
node --experimental-test-module-mocks --import tsx --test tests/specificationDraftStore.test.ts tests/productSpecificationsAction.test.ts tests/productSpecificationsPage.test.ts tests/productSpecificationsForm.test.ts
```

Fix-round result: expected non-zero exit; **25 tests observed, 16 passed, 9 failed**. Failures remain attributable to missing production behavior: the draft-store module does not exist; the action does not save or clear drafts; the form ignores draft rows; and the page does not yet export the accepted factory seam. The independently named empty/invalid `sourceType` diagnostics both pass.
