# Task2 evidence: optional standing-desk motor/warranty attributes

- Database: fresh disposable PostgreSQL 18.6 cluster initialized locally with `initdb`, owned by the current Windows user.
- Network scope: loopback only, `127.0.0.1:55487` (not the shared application database on port 5432).
- Database: `task2_fresh`, owner `task2_owner`.
- Migrations: `npx prisma migrate deploy` applied all 3 migrations successfully.
- Seed: `npx tsx prisma/seed-standing-desk-attributes.ts` run twice; both runs completed successfully (second run was idempotent).
- Verification query:

```sql
SELECT ad.key, ca.is_required
FROM category_attributes ca
JOIN attribute_definitions ad ON ad.id = ca.attribute_definition_id
WHERE ad.key IN ('motor_count','warranty_months')
ORDER BY ad.key;
```

Result:

```text
       key       | is_required
-----------------+-------------
 motor_count     | f
 warranty_months | f
(2 rows)
```

The disposable cluster data directory is `.task2-pg18` and is intentionally untracked/ignored.
