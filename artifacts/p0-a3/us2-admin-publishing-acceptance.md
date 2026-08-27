# P0-A3 US2 Admin Publishing Acceptance

Date: 2026-08-27

Result: **PASS for disposable-development acceptance**.

Evidence:

- Admin source/action tests pass for lifecycle normalization, active-only index enable, lifecycle-preserving disable, zero-row/concurrency classification, homepage-only invalidation, and Save→Redirect.
- Operator feedback maps stable machine reasons to readable copy, uses `aria-live`, focuses the affected Product control after redirect, and explains disabled Enable index controls.
- Stored lifecycle, explicit index state, and effective access are displayed with operator-facing labels.
- PostgreSQL race verifier passes all 8 scenarios; see `artifacts/p0-a3/us2-concurrency.md`.

Fresh full suite: `npm test` — 171/171 PASS. Lint and TypeScript checks pass.