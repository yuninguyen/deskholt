# P0-A3 M0 Safety Tool Tests

Date: 2026-08-27

The parked T005/T006 work was reviewed only after T004-L passed.

## TDD evidence

- RED: `npx tsx --test tests/p0A3MigrationSafety.test.ts` failed because the parked import target `scripts/snapshot-p0-a3-database.ts` did not yet exist (`MODULE_NOT_FOUND`).
- GREEN: after the read-only tooling was reviewed and available, the same test command passed.

## GREEN result

```text
tests: 5
pass: 5
fail: 0
```

Covered pure behaviors:

- deterministic keyed ordering;
- order-independent stable snapshot hash and content sensitivity;
- field-by-field identity comparison;
- explicit limitation classification for unproven privileges;
- datasource credential redaction while retaining target identity.

## Parked-work review

`tests/p0A3MigrationSafety.test.ts` remains a pure read-only safety test module. `scripts/snapshot-p0-a3-database.ts` requires the explicit `P0_A3_TARGET_DATABASE_URL`, rejects ambient `DATABASE_URL` fallback, uses read-only catalog/data queries, records `writeProbe: NOT PERFORMED`, and does not invoke DDL/DML. Its CLI output is written only to an explicitly named evidence file.

The tool is used for M0 inventory evidence; T008–T010 still require the complete rerun and review against the approved M0 contract before being marked complete.
