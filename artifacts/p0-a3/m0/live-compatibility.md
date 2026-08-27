# P0-A3 M0 Live Compatibility Evidence

Date: 2026-08-27

Target: local `deskholt_db`, schema `public`.

Command:

```text
npx --no-install prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --exit-code
```

Result:

```text
No difference detected.
```

The representable Prisma diff is empty. PostgreSQL catalog inventory was reviewed separately because Prisma does not represent partial-index predicates. The only application-owned database-only objects are the two approved `ProductAttribute` partial unique indexes recorded in `database-object-inventory.md`.
