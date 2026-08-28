# P0-A3 M0 Read-only Migration-role Privilege Inventory

Date: 2026-08-27

Target: local `deskholt_db`, schema `public`.

```text
current role:             deskholt_user
products owner:           deskholt_user
owner/member sufficient:  true
schema USAGE:             true
schema CREATE:            true
products UPDATE:          true
preservation SELECT:      true
pg_catalog readability:   true
classification:           PASS
```

The evidence was collected by read-only `has_schema_privilege`, `has_table_privilege`, `pg_class.relowner`, and role-membership/catalog queries. No write probe was used against the source database. The detailed machine-readable result is in `read-only-inventory.json`.
