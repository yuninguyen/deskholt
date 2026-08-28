# P0-A3 M3 Migration Verifier Tests

Date: 2026-08-27

Command:

```text
npx tsx --test tests/p0A3MigrationVerifier.test.ts tests/p0A3MigrationSafety.test.ts
```

Result:

```text
tests: 8
pass: 8
fail: 0
```

The tests cover explicit populated-postcheck inputs, ambient URL refusal, owned temporary-root boundaries, baseline-only migration-tree assertions, deterministic inventory helpers, identity comparison, privilege limitation classification, and datasource redaction.

Integration verifier evidence is recorded in:

- `artifacts/p0-a3/m4/clean-chain/result.md`
- `artifacts/p0-a3/m4/rollback-fixture/result.md`
- `artifacts/p0-a3/m4/m4-review.md`
