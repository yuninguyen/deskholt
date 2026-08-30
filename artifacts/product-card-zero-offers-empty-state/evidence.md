# ProductCard zero-offers empty state — evidence

## TDD evidence

`tests/productCard.test.ts` follows the project's `node:test` plus `renderToStaticMarkup` convention.

- RED: with the ProductCard baseline restored, the zero-offer test failed because the rendered markup contained `Best price from`, `N/A`, and `Compare 0 stores →`, and did not contain the new placeholder copy.
- GREEN: `node --experimental-test-module-mocks --import tsx --test tests/productCard.test.ts` completed with 2 pass, 0 fail.
- The zero-offer test covers both `linkCount: 0, lowestPrice: undefined` (the expected normal case) and `linkCount: 0, lowestPrice: 499` (a defensive regression case), ensuring the UI is driven by `linkCount === 0` rather than price absence.
- The priced-offer test confirms `linkCount: 1, lowestPrice: 499` retains `Best price from`, `$499.00`, and `Compare 1 stores →`.

## Independent disposable-database verification

An external verification run used a disposable PostgreSQL database and two real active/indexed Product fixtures: one with zero AffiliateLinks and one with a priced AffiliateLink.

With the dev server running, `/category/standing-desks` rendered:

| Fixture | Verified card output |
| --- | --- |
| `Zero Offer Test Desk` | `Price coming soon` and `View product →`; did not include `N/A`, `Best price from`, or `Compare 0 stores` |
| `Priced Test Desk` | `Best price from`, `$199.99`, and `Compare 1 stores →` unchanged |

The temporary Product rows, disposable database, and all temporary files were removed after verification.

## Checks

| Command | Result |
| --- | --- |
| `npm run lint` | pass |
| `npx tsc --noEmit` | pass |
| `tests/productCard.test.ts` | 2 pass, 0 fail |
| `npm test` | 312 pass, 0 fail, 8 opt-in skip |
| `npm run build` | pass, 13/13 pages |
