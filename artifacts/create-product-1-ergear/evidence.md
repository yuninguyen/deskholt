# ErGear EGESD5B Product #1 verification evidence

Date: 2026-08-29

## Safety boundary

All execution in this evidence used an owned, initialized PostgreSQL 18 cluster on loopback `127.0.0.1:57001`, database `ergear_final`, under the worktree temporary root `.tmp-pg-ergear-final`. It was initialized with trust authentication, migrated, seeded, and removed after verification. The content script was **not** run against a real or shared DeskHolt database.

## Fresh database procedure

1. `prisma migrate deploy` applied all 3 migrations.
2. `npx tsx prisma/seed-standing-desk-attributes.ts` created the real `standing-desks` Category plus 35 definitions.
3. `npx tsx scripts/create-product-ergear-egesd5b.ts` ran twice. Both runs reported the same Product ID.
4. Direct PostgreSQL queries dumped the script-owned persisted records below.

## Persisted record dump

Product and relations:

```text
ergear-egesd5b-standing-desk-black
ErGear 48 x 24 Inch Height Adjustable Electric Standing Desk (Black)
category=standing-desks; category_ref=standing-desks; brand=ergear
status=DRAFT; is_indexed=false; is_sustainable=false; upc_code=B0B41YH9B6
```

Variant:

```text
sku=ergear-egesd5b-48x24-black; size=48x24; color=Black; is_active=true
```

Product attributes (`scope` is inferred from `variant` — `PRODUCT` means null `variant_id`). Every row has `source_type=RETAILER`, `confidence=VERIFIED`, the exact Amazon source URL, and a non-null `verified_at`.

```text
adjustment_type=ELECTRIC | PRODUCT
desktop_depth_in=23.600000 | ergear-egesd5b-48x24-black
desktop_finish=Laminated | ergear-egesd5b-48x24-black
desktop_included=true | PRODUCT
desktop_material=ENGINEERED_WOOD | ergear-egesd5b-48x24-black
desktop_shape=RECTANGULAR | PRODUCT
desktop_thickness_in=0.670000 | PRODUCT
desktop_width_in=47.200000 | ergear-egesd5b-48x24-black
frame_color=Black | ergear-egesd5b-48x24-black
frame_material=STEEL | PRODUCT
max_height_in=46.456693 | PRODUCT
max_load_lb=176.000000 | PRODUCT
memory_presets=4.000000 | PRODUCT
min_height_in=28.350000 | PRODUCT
product_weight_lb=43.800000 | PRODUCT
```

`max_height_in` is the database-scale-6 value of the real narrow converter result: `convertLengthToCanonicalInches(118, 'cm') = 46.45669291338583`; PostgreSQL persisted `46.456693`. The measured variant dimensions are `47.2` and `23.6`, not the marketing `48` and `24` labels.

Forbidden/missing keys have no rows: `motor_count`, `warranty_months`, `leg_count`, `leg_design`, `lifting_speed_in_s`, `noise_db`, `anti_collision`, `crossbar`, `casters_compatible`, `certification_greenguard`, `certification_bifma`, `assembly_time_minutes`.

AffiliateLink:

```text
network=amazon
price=139.99
raw_url=https://www.amazon.com/dp/B0B41YH9B6
tracking_url=https://www.amazon.com/dp/B0B41YH9B6?tag=deskholt-pending
is_in_stock=true; priority_order=1
```

After two script runs, direct counts were:

```text
Brand=1; Product=1; ProductVariant=1; ProductAttribute=15; AffiliateLink=1
```

## Automated checks

- Owned-cluster integration: 8/8 pass, including real validator rejection with complete transactional rollback, source metadata, conversion, and idempotency.
- `npm test`: 279 pass, 1 intentional owned-cluster integration skip when the binary opt-in is absent, 0 failures.
- `npm run lint`: PASS after replacing an unsafe `any` JSON fixture restore with `Prisma.JsonNull`.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS, 13/13 static pages, against the owned migrated database.
- `git diff --check`: PASS at verification time.

## P2 dry-run conclusion

Product #1 of the §58 P2 dry run is now enter-able end-to-end using real confirmed values. The only deliberately unset listed NON-BLOCKER gaps are `motor_count` and `warranty_months`; their absence does not publish the Product, which remains `DRAFT`.

## Cleanup

PostgreSQL was stopped with `pg_ctl -m immediate -w stop`; `127.0.0.1:57001` had no listener afterward and `.tmp-pg-ergear-final` was removed.
