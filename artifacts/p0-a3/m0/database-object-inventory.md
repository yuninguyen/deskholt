# P0-A3 M0 Read-only Database Object Inventory

Date: 2026-08-27
Target fingerprint: cluster `7674334565232096068`, database OID `16389`, database `deskholt_db`, schema `public`, search path `"public"`.

## Application object classes

```text
application tables:       10
application enums:         4
columns:                  88
constraints:              84
views:                     0
materialized views:        0
sequences:                 0
public routines:           0
non-internal triggers:     0
extensions:                1 (standard plpgsql infrastructure)
```

## Tables and row counts

```text
affiliate_links:          20
attribute_definitions:    35
brands:                    0
categories:                1
category_attributes:      35
clicks:                    2
conversions:               0
product_attributes:      62
product_variants:          5
products:                 20
```

## Application-owned database-only partial indexes

Exactly two were found:

```sql
CREATE UNIQUE INDEX product_attributes_product_attribute_unique
ON public.product_attributes (product_id, attribute_definition_id)
WHERE (variant_id IS NULL);

CREATE UNIQUE INDEX product_attributes_variant_attribute_unique
ON public.product_attributes (variant_id, attribute_definition_id)
WHERE (variant_id IS NOT NULL);
```

No other application-owned unsupported object was found. The complete row/keyed inventory and snapshot hash are in `read-only-inventory.json`.
