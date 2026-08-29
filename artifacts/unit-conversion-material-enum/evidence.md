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

## Actual Next dev render (round 4)

A fresh owned PostgreSQL 18 cluster was initialized on `127.0.0.1:56432`, and a real Next dev server was started on `http://127.0.0.1:56321`. The readiness probe correctly used `/admin/login` (not nonexistent `/login`) and returned HTTP 200. A real `authenticateAdmin` call generated the session cookie; the complete form-shaped action submission then redirected to `/admin/products/cmte1nfi40004o2irdkrcofzh/specifications?saved=1`. This action submission is distinct from the subsequent authenticated server-rendered HTTP GET.

Authenticated GET: `http://127.0.0.1:56321/admin/products/cmte1nfi40004o2irdkrcofzh/specifications` → HTTP 200.

Rendered markup assertions (actual existing input/select names):

```text
value__cmte1ng9900041310xk5dy8p7__p value="46.456693"; sourceUnit__cmte1ng9900041310xk5dy8p7__p selected in
value__cmte1ng9500011310bh2fwuu8__p value="28.35"; sourceUnit__cmte1ng9500011310bh2fwuu8__p selected in
ENGINEERED_WOOD present
ASSERTIONS {"max":true,"min":true,"maxSelector":true,"minSelector":true,"mat":true}
```

## Cleanup and limitations

The disposable cluster was stopped after verification with PostgreSQL 18 `pg_ctl stop -D .tmp-pgdata-r4 -m fast`, and the owned temporary data directory, dev server, and temporary render harness were removed. Generated `next-env.d.ts` drift was restored. The evidence now covers the real action submission plus the actual authenticated server-rendered HTTP GET; it does not claim browser automation or browser POST transport.
