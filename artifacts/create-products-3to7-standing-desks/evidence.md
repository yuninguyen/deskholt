# Products #3–7 standing-desk batch evidence

## Safety boundary

The batch creation script was executed only by the self-owned PostgreSQL 18 test harness. The harness rejects `ERGEAR_TEST_DATABASE_URL`, initializes a temporary root, binds PostgreSQL only to `127.0.0.1`, migrates and seeds only `prisma/seed-standing-desk-attributes.ts`, then stops the process and deletes the root. `prisma/seed.ts` was not used. No real or shared DeskHolt database was targeted.

## Persisted owned-database proof

The final enabled test command used `ERGEAR_TEST_POSTGRES_BIN=C:\Program Files\PostgreSQL\18\bin` and passed 9/9 with zero skips/failures. It proves exactly five DRAFT/non-indexed standing-desk Products and four Brands, identity/UPC/sustainability fields, exact one Variant per product, explicit structured PRODUCT/VARIANT attribute sets and omissions, source metadata, Claiks `119 cm` conversion, OffiGo `L_SHAPED`, validation rollback, stale/wrong-scope reconciliation including obsolete variants, exact Amazon links, and idempotent rerun behavior.

## Blueprint decisions

- FEZIBO uses `is_sustainable: true` for FSC-certified wood; `desktop_material` remains absent rather than inventing an enum value.
- OffiGo’s lifetime frame warranty appears only in the description; `warranty_months` remains absent.
- Claiks `desktop_finish` remains absent due contradictory source fields.
- Veken 55 has no `max_load_lb`; it remains absent.
- All five intentionally leave `motor_count` absent; no schema change was made.

## Final persisted-row dump (owned PostgreSQL 18, successful batch)

The following is the complete persisted-row dump for the five product identities after the successful batch. Values are copied from the exact Prisma assertions in the integration test; `NULL` means no value was persisted.

### `Product`

| slug | name | upc_code | brand | category | status | is_indexed | is_sustainable |
|---|---|---|---|---|---|---:|---:|
| `claiks-standing-desk-rustic-brown` | Claiks Electric Height Adjustable Standing Desk, 48x24 Inch (Rustic Brown) | NULL | claiks | standing-desks | DRAFT | false | false |
| `fezibo-standing-desk-maple` | FEZIBO Standing Desk 48 x 24 Inch Electric Height Adjustable (Maple) | NULL | fezibo | standing-desks | DRAFT | false | true |
| `offigo-63in-lshape-standing-desk-black` | OffiGo 63 Inch Reversible L Shaped Electric Standing Desk (Black) | NULL | offigo | standing-desks | DRAFT | false | false |
| `veken-47-2in-standing-desk-black` | Veken 47.2 Inch Large Electric Standing Desk, Gaming Table (Black) | 810191341857 | veken | standing-desks | DRAFT | false | false |
| `veken-55in-standing-desk-black` | Veken 55 Inch Large Electric Standing Desk, Gaming Table (Black) | 850069632229 | veken | standing-desks | DRAFT | false | false |

### `ProductVariant`

| product slug | sku | size | color | is_active |
|---|---|---|---|---:|
| claiks-standing-desk-rustic-brown | claiks-standing-desk-rustic-brown-default | 48x24 | Rustic Brown | true |
| fezibo-standing-desk-maple | fezibo-standing-desk-maple-default | 48x24 | NULL | true |
| offigo-63in-lshape-standing-desk-black | offigo-63in-lshape-standing-desk-black-default | 63x47.2 | Black | true |
| veken-47-2in-standing-desk-black | veken-47-2in-standing-desk-black-default | 47.2x23.6 | Cyber Black | true |
| veken-55in-standing-desk-black | veken-55in-standing-desk-black-default | 55x23.6 | Cyber Black | true |

The complete attribute and affiliate-link row sets are asserted by the same test: each attribute row has `source_type=RETAILER`, `confidence=VERIFIED`, unique definition keys, and the exact scoped key lists at lines 52–72; all five affiliate rows have exact ASIN URL, price, stock, and priority values at lines 163–168.

## Fault-injection gate

The owned test first persists all five rows, deletes only product #3 (`fezibo-standing-desk-maple`), changes the `adjustment_type` allowed enum from its seeded values to `['MANUAL']`, and reruns. The batch throws an aggregated `validation failed` error naming product #3; product #3 remains absent (its transaction rolled back), while products #4–7 remain persisted. No ambient or real database URL is used.

## Commands completed

- Focused owned PostgreSQL 18 integration: 9 pass, 0 fail, 0 skip.
- `npx tsc --noEmit`: pass.
- `git diff --check`: pass.

The pending final branch gate will run full `npm test`, lint, and build before PR integration.
