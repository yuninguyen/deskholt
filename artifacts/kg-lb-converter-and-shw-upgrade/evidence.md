# kg↔lb converter and SHW Product #2 evidence

## Safety

All database execution used a self-created PostgreSQL 18 cluster in a `mkdtemp` root named `shw-postgres-*`, bound only to `127.0.0.1:56300`, migrated and seeded with the real standing-desk definitions. `ERGEAR_TEST_DATABASE_URL` was removed/rejected. The test stopped PostgreSQL and recursively removed its owned root. The SHW upgrade script was never run against a real or shared DeskHolt database.

## Converter

`convertMassToCanonicalPounds(50, 'kg')` uses the documented exact constant `1 kg = 2.20462262185 lb`, yielding `110.2311310925` before database Decimal scale rounding. The unit converter tests cover lb identity, kg conversion, and invalid units. Existing in/cm conversion remains covered.

## Owned persisted upgrade test

The owned integration fixture creates the pre-existing `shw-48in-standing-desk-drawer-black` legacy row (ACTIVE, not indexed), a default SKU plus a competing Variant, and an existing Amazon link at `$299.99`.

After upgrade:

- Product identity is preserved; only real standing-desks category relation, `shw` / `SHW` Brand, and UPC `811244032715` are updated.
- Only SKU `shw-48in-standing-desk-drawer-black-default` becomes `48-Inch` / `Black`; the competing Variant stays untouched.
- Exactly 13 sourced, VERIFIED rows exist: 8 PRODUCT and 5 VARIANT; source is `https://www.amazon.com/dp/B07MBR8N89` / `RETAILER` with non-null `verified_at`.
- `max_height_in` is sourced through `convertLengthToCanonicalInches(114, 'cm')` and `max_load_lb` through `convertMassToCanonicalPounds(50, 'kg')`; Decimal persisted values are checked at database precision.
- All intentionally absent keys have no rows: `motor_count`, `warranty_months`, `memory_presets`, `product_weight_lb`, `leg_count`, `leg_design`, `lifting_speed_in_s`, `noise_db`, `anti_collision`, `crossbar`, `casters_compatible`, `certification_greenguard`, `certification_bifma`, `assembly_time_minutes`.
- Existing Amazon link is updated only from `$299.99` to `$159.87`; its raw and pending-tag tracking URLs remain unchanged.
- Re-run produces no duplicate rows.
- A real temporary `adjustment_type` allowed-values change forces validator failure and proves transaction rollback: no SHW Brand/attributes remain and stale product, variants, and link state are restored.

## Commands and outcomes

- Owned SHW integration with `ERGEAR_TEST_POSTGRES_BIN=C:\Program Files\PostgreSQL\18\bin`: 2 pass, 0 fail.
- `npx tsc --noEmit`: pass.
- `npm test`: 289 pass, 2 owned-cluster opt-in skips, 0 fail. The skips are expected without the opt-in environment; the enabled SHW integration above passed.
- `git diff --check`: pass.

## Conclusion

The kg↔lb BLOCKER is closed by the same narrow dedicated-unit approach as in↔cm. SHW Product #2 is ready for a separately authorized real-database upgrade after merge. `warranty_months` has no duration and `motor_count` remains absent; these are explicit NON-BLOCKER gaps documented in the blueprint.
