# Task 5 verification evidence

Date: 2026-08-29
Base: `dc8d8b5`

## Disposable PostgreSQL verification

Used PostgreSQL 18 binaries from `C:\Program Files\PostgreSQL\18\bin` to initialize an owned trust-auth cluster on loopback port 55432 and database `task5_db`, applied all three migrations, then ran `npm run db:seed` and the real `prisma/seed-standing-desk-attributes.ts`.

Production-equivalent server/action/form verification (not browser/auth transport): temporary ignored harness invoked `loadSpecificationData`, the shared validator, `createSaveSpecificationsAction`, and Prisma `$transaction`.

Target product: `autonomous-smartdesk-dual-motor-white`.

Manual transcript:

```text
submit max_height_in: raw value=118, sourceUnit=cm
save redirect: /admin/products/<target>/specifications?saved=1
query stored value_number: 46.456693
reload loadSpecificationData valueNumber: 46.456693
expected mathematical conversion: 118 / 2.54 = 46.45669291338583

submit min_height_in: raw value=28.35, sourceUnit omitted
save redirect: /admin/products/<target>/specifications?saved=1
query stored value_number: 28.35
reload loadSpecificationData valueNumber: 28.35

submit desktop_material: ENGINEERED_WOOD
query stored value_string: ENGINEERED_WOOD
```

PostgreSQL DECIMAL storage returns `46.456693` (scale 6), while the in-memory conversion is `46.45669291338583`; this is the expected database rounding and is ~46.46 inches. The omitted source unit remains unchanged at exactly `28.35`.

Enum proof from the database after the real seed:

```text
[MDF, BAMBOO, SOLID_WOOD, LAMINATE, ENGINEERED_WOOD]
```

All pre-existing values remain present and `ENGINEERED_WOOD` is accepted and persisted through the shared action.

## Checks

- `npm test`: PASS, 277 tests.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run build` against disposable DB: PASS.
- All migrations: PASS (3 applied).
- `npm run db:seed`: PASS (20 products).
- real standing-desk attribute seed: PASS (35 definitions, 5 default variants).

## §70 blocker closure

- Canonical inch normalization blocker: CLOSED. The real mixed-unit case `118 cm` now stores/reloads as canonical inches (`46.456693`, mathematically `46.45669291338583`) while an omitted-unit inch value remains exactly unchanged.
- `desktop_material` Engineered Wood ontology blocker: CLOSED. The real seed and validator/action path include and persist `ENGINEERED_WOOD` without removing old values.

The §70 non-blockers concerning often-missing `motor_count` and `warranty_months` remain editorial/data-sourcing gaps and were not changed.

## Cleanup and limitations

The disposable cluster was stopped after verification with PostgreSQL 18 `pg_ctl stop -D .tmp-pgdata -m fast`, and the owned temporary data directory was removed. The ignored harness and report remain only under the plan SDD workspace. Verification proves the production-equivalent server/action/form path; it does not claim browser rendering, authentication, or HTTP transport.
