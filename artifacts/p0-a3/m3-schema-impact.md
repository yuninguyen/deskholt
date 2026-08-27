# P0-A3 M3 Product Schema Impact

Date: 2026-08-27

## GitNexus result

GitNexus index is current for repository `deskholt`. Direct query for the Prisma model symbol `Product` returned `Target 'Product' not found`; Prisma schema models and generated-client symbols are not indexed as callable symbols.

Migration-adjacent indexed consumer checks were therefore run for the closest known Product consumers:

```text
ProductDetailPage:  upstream impacted=0, risk=LOW
HomePage:           upstream impacted=0, risk=LOW
ProductSchema:      upstream impacted=0, risk=LOW
seed main:          upstream impacted=1 (seed file), risk=LOW
```

A concept query for `Product model Prisma products` identified Product-related flows including `ProductDetailPage`, `ProductSpecificationsPage`, `SaveSpecificationsAction`, `HomePage`, `ProductSchema`, click processing, and seed entrypoints. Generated Prisma Client consumers are not represented as editable GitNexus symbols.

## Boundary decision

No HIGH/CRITICAL GitNexus blast-radius warning was returned. The schema edit is limited to the Prisma `Product` model and its generated-client shape. Existing runtime source files, including the unrelated working-tree change in `src/app/(public)/products/[slug]/page.tsx`, are not edited by T017/T018.
