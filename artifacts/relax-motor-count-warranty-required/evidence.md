# Task2 evidence: optional standing-desk motor/warranty attributes

## Owned PostgreSQL 18 verification

- Target was a fresh disposable PostgreSQL **18.6** cluster initialized locally with `initdb` and owned by the current Windows user.
- The cluster listened on loopback only at **127.0.0.1:55487**; this was not the shared application database on port 5432.
- Database: `task2_fresh`; owner: `task2_owner`.
- Migrations: `npx prisma migrate deploy` applied all 3 migrations successfully.
- Seed command was run twice against this owned disposable target. Both runs completed successfully; the second run was idempotent and produced no further changes or errors.
- The disposable cluster data directory was `.task2-pg18` and is intentionally untracked/ignored.

The verification query was:

```sql
SELECT ad.key, ca.is_required
FROM category_attributes ca
JOIN attribute_definitions ad ON ad.id = ca.attribute_definition_id
WHERE ad.key IN ('motor_count','warranty_months')
ORDER BY ad.key;
```

Before the change, both owned rows were required:

```text
       key       | is_required
-----------------+-------------
 motor_count     | t
 warranty_months | t
(2 rows)
```

After the change, both owned rows were optional:

```text
       key       | is_required
-----------------+-------------
 motor_count     | f
 warranty_months | f
(2 rows)
```

The resulting before/after is_required values are therefore:

| key | before | after |
|---|---:|---:|
| `motor_count` | `true` | `false` |
| `warranty_months` | `true` | `false` |

## Full verification gate results

These gates were run without running the seed script again and without using a real/shared database:

- `npm run lint` — **PASS**, exit code `0` (`eslint . --max-warnings=0`).
- `npx tsc --noEmit` — **PASS**, exit code `0`.
- `npm test` — **PASS**, exit code `0`: **301 tests**, **293 passed**, **0 failed**, **8 skipped**, **0 cancelled**, **0 todo**. The 8 skips are opt-in owned-cluster integration tests.
- Initial `npm run build` — blocked during Prisma Client generation by a shared Windows query-engine `EPERM` rename; no production code had started compiling.
- Final `npm run build` — **PASS**, exit code `0`, after restoring the worktree's local dependencies and using a fresh owned disposable PostgreSQL 18 database at `127.0.0.1:55489`. Prisma applied all three migrations, the build compiled, generated all 13 static pages, stopped the database, and removed the temporary root. No real/shared database or seed execution was used for this build.

## Blueprint §70 rationale

Blueprint §70 records that across all 7 real standing desks, `motor_count` was absent from the Amazon source table **7/7** times and `warranty_months` had no usable numeric duration **6/7** times (only SHW had a real value, from a pre-existing unrelated row). These statistics motivated making both `CategoryAttribute.is_required` values optional. Per §70 and §18, `is_required` does not block saving; it controls the Admin required-field marker and the specifications completeness total.
