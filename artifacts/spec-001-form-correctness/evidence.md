# Spec 001 Form-Correctness Gaps — Task 5 Verification Evidence

Date: 2026-08-28

Branch: `spec-001-form-correctness-gaps`

Task 5 verification base: `78203c1b19b81f7c7bcdc41ae48d583d22a8ee93`

## Result

**DONE_WITH_CONCERNS** — Gap A and Gap B are verified closed through the production action/data/page/form seams against an owned disposable loopback PostgreSQL database. The complete 249-test suite, lint, typecheck, and production build pass. A browser was not available, and the managed temporary Next dev process terminated after the initial live login-page request, so the complete browser-driven Server Action POST was not claimed or fabricated.

## Environment ownership and safety

- Work was confined to `C:\laragon\www\deskholt\.worktrees\spec-001-form-correctness-gaps`.
- Verified starting `HEAD`: `78203c1b19b81f7c7bcdc41ae48d583d22a8ee93`.
- PostgreSQL 18 binaries came from `C:\Program Files\PostgreSQL\18\bin`.
- A new cluster was initialized inside the worktree at `.tmp-task5-pg` with local and host trust authentication, bound only to `127.0.0.1`, on randomly selected high port `53217`.
- A new database named `deskholt_task5` was created inside that owned cluster.
- `DATABASE_URL` used only `postgresql://postgres@127.0.0.1:53217/deskholt_task5?schema=public`; no ambient or production database URL was read or used.
- Clean migrations were applied with `npx prisma migrate deploy` (2/2 migrations).
- The destructive development seed was run only against this disposable database with `NODE_ENV=development`; it created 20 Products. `prisma/seed-standing-desk-attributes.ts` then created 35 Attribute Definitions and 5 active default Variants.
- Temporary admin credentials used for the loopback dev attempt were synthetic task-owned values and are not recorded here.
- Final cleanup stopped PostgreSQL with `pg_ctl ... stop -m fast`, removed the cluster directory and every `.tmp-task5*` file, and confirmed `temp_count=0`, `pg_dir_exists=False`, and `pg_meta_exists=False`.
- The temporary Next job was observed as completed and no managed background job remained running.

## Exact setup commands and results

### Disposable PostgreSQL

Representative command sequence (the random port was selected at runtime):

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\initdb.exe' \
  -D .tmp-task5-pg -U postgres --auth-local=trust --auth-host=trust \
  --encoding=UTF8 --no-locale
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' \
  -D .tmp-task5-pg -l .tmp-task5-pg.log -o '-p 53217 -h 127.0.0.1' start
& 'C:\Program Files\PostgreSQL\18\bin\createdb.exe' \
  -h 127.0.0.1 -p 53217 -U postgres deskholt_task5
$env:DATABASE_URL='postgresql://postgres@127.0.0.1:53217/deskholt_task5?schema=public'
npx prisma migrate deploy
$env:NODE_ENV='development'
npm run db:seed
npx tsx prisma/seed-standing-desk-attributes.ts
```

Observed:

- cluster initialized and started successfully;
- both repository migrations applied successfully;
- 20 Products seeded;
- 35 standing-desk Attribute Definitions linked to the Category;
- 5 active default Product Variants created.

A follow-up `psql` count command had a PowerShell quoting error (`relation "product" does not exist`) and was not treated as evidence. Counts were instead obtained successfully through Prisma inside the integration harness.

## Live application attempt and limitation

A temporary Next dev server was started on `127.0.0.1:32990` with the owned database and synthetic admin configuration:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 32990
```

Observed startup: Next.js 16.3.0 reported `Ready in 404ms`.

A loopback HTTP GET to `/admin/login` returned `HTTP/1.1 200 OK`. The returned production HTML contained the real React/Next Server Action form wiring:

- `method="POST"`;
- `encType="multipart/form-data"`;
- hidden `$ACTION_ID_...` input;
- `password` field;
- resolved `loginAction` server reference.

The managed dev process then terminated with PowerShell exit code `4294967295` after compiling that route. This runtime exposes no browser-driving tool and Playwright is not installed. Because a complete authenticated browser/Server Action HTTP submission could not be driven reliably, no browser-level success claim is made.

## Production-equivalent integration harness

A temporary, deleted-after-use TypeScript harness was used. It imported and invoked the production wiring rather than copying the behavior:

- `createSaveSpecificationsAction` from `src/lib/products/specificationSaveAction.ts`;
- real `loadSpecificationData`;
- real `validateProductAttributeInput`;
- real Prisma transactions through `PrismaClient`;
- singleton production draft functions from `src/lib/products/specificationDraftStore.ts`;
- `createProductSpecificationsPage` from the production page module;
- production `ProductSpecificationsForm` reached through that page;
- React server rendering via `renderToStaticMarkup` to inspect the exact rendered defaults.

The only substituted dependency was `redirect`, replaced by a throwing redirect-capture function because `next/navigation` redirects require an active Next request. This retains the production action sequence and exact redirect URL while allowing assertions. Therefore the harness is equivalent for action validation, transaction behavior, draft creation/consumption, page token handling, form default rendering, and database reload behavior. It is **not fully equivalent** to browser transport, authentication middleware, React hydration, or Next's encrypted Server Action POST protocol.

Command:

```powershell
$env:DATABASE_URL='postgresql://postgres@127.0.0.1:53217/deskholt_task5?schema=public'
npx tsx .tmp-task5-harness.ts
```

Result: `PASS`, exit 0.

## Manual/integration verification transcript

Target Product: seeded `autonomous-smartdesk-dual-motor-white`.

### 1. Clean starting state

- Deleted ProductAttribute rows only for the owned target Product.
- Confirmed target ProductAttribute count: `0`.

### 2. Invalid submission — Gap A

Submitted three rows in one real `FormData` payload:

1. Product-level bad row: value `25.300`, confidence `VERIFIED`, empty source URL and source type.
2. Different Product-level row: exact raw value ` 50.900 `, exact raw source URL ` https://example.test/product-proof `, source type `MANUFACTURER`, confidence `LIKELY`.
3. Variant-level row: exact raw value `48.125`, source URL `https://example.test/variant-proof`, source type `RETAILER`, confidence `UNVERIFIED`.

Observed:

- redirect retained `error=1`, `count`, and the clear message `VERIFIED requires a valid source URL and source type.`;
- redirect appended an opaque UUID-shaped `draft` token;
- redirect contained none of the unrelated typed values;
- database writes after invalid submission: exactly `0`.

This proves the invalid Gap A source behavior follows the existing aggregated validation path and remains atomic.

### 3. Error page render — Gap B cross-section preservation

Before the rightful read, the same token was requested using a different Product ID. Result: `null`, without consuming the rightful draft.

The production page factory was then rendered for the correct Product with the real error query and token. The resulting production form HTML contained:

- the Gap A error text;
- Product bad-row default `25.300`;
- unrelated Product-row exact raw default ` 50.900 `;
- unrelated Product-row exact raw source URL ` https://example.test/product-proof `;
- unrelated Variant-row exact raw default `48.125`;
- unrelated Variant source URL `https://example.test/variant-proof`.

A second rightful read of the token returned `null`, proving read-once consumption.

### 4. Expiry

Using the production draft-store factory with an injected clock:

- saved at time `0`;
- read at exactly `5 * 60 * 1000` ms;
- result: `null`.

This proves the five-minute TTL boundary expires as designed.

### 5. Correct and resubmit — Gap A valid source behavior

Corrected the bad row to:

- value `25.300`;
- source URL `https://manufacturer.example/spec`;
- source type `MANUFACTURER`;
- confidence `VERIFIED`.

Resubmitted it with the same unrelated Product and Variant values. Before submission, a sentinel Product draft was created to prove successful-save clearing.

Observed:

- exact success redirect: `/admin/products/<owned-product-id>/specifications?saved=1`;
- sentinel draft was unavailable after success;
- exactly 3 ProductAttribute rows persisted;
- VERIFIED row persisted source URL and type and `verified_at=2026-08-28T12:00:00.000Z`;
- unrelated Product and Variant rows also persisted.

Persisted snapshot:

| Attribute | Scope | Value | Source type | Confidence | Verified at |
|---|---|---:|---|---|---|
| `min_height_in` | Product | `25.3` | `MANUFACTURER` | `VERIFIED` | `2026-08-28T12:00:00.000Z` |
| `max_height_in` | Product | `50.9` | `MANUFACTURER` | `LIKELY` | `null` |
| `desktop_width_in` | Variant | `48.125` | `RETAILER` | `UNVERIFIED` | `null` |

### 6. Reload after success

Rendered the production page again with no draft token.

Observed defaults came from normalized database values:

- `25.3` rather than raw draft `25.300`;
- `50.9` rather than raw draft ` 50.900 `;
- `48.125`;
- persisted `https://manufacturer.example/spec`;
- neither the raw whitespace-preserved draft value nor sentinel `stale` value appeared.

This distinguishes database-backed reload defaults from a stale draft and proves successful clearing.

### Final disposable database counts

- Products: `20`
- Attribute Definitions: `35`
- Product Variants: `5`
- Target ProductAttribute rows: `3`

## Gap closure against the blueprint P1 checklist

### Gap A — VERIFIED requires a valid source

**Closed.** An invalid VERIFIED row with no valid source URL/type is rejected before any transaction writes, while a corrected VERIFIED row with an absolute URL and allowed source type saves and receives `verified_at`. The 249-test suite additionally covers empty URL, malformed URL, empty source type, invalid source type, valid source, and unaffected LIKELY/UNVERIFIED behavior.

### Gap B — preserve unsaved values on validation failure

**Closed.** After Save→Redirect validation failure, exact submitted strings across the invalid row, an unrelated Product section row, and an unrelated Variant section row render from a short-lived opaque server-side draft. The token is Product-scoped, read-once, expires at five minutes, leaks no typed values into the URL, is cleared after success, and a tokenless reload uses database defaults.

## Full verification

### Tests

```powershell
npm test
```

Result: PASS, exit 0.

- tests: `249`
- passed: `249`
- failed: `0`
- cancelled/skipped/todo: `0`
- duration: `1564.9262 ms`

The existing Node experimental module-mocking warning was emitted.

### Lint

```powershell
npm run lint
```

Result: PASS, exit 0, zero warnings/errors.

### Typecheck

```powershell
npm run typecheck
```

Result: PASS, exit 0.

### Build

Run with only the owned disposable loopback `DATABASE_URL` in the process environment:

```powershell
npm run build
```

Result: PASS, exit 0.

- Prisma Client 5.22.0 generated successfully;
- Next.js 16.3.0 compiled successfully;
- TypeScript completed;
- page data collected;
- 13/13 static pages generated;
- page optimization finalized;
- `/admin/products/[id]/specifications` classified dynamic.

## GitNexus detect-changes and fallback

The runtime did not expose the GitNexus MCP `gitnexus_detect_changes()` operation. The required installed-CLI fallback was attempted exactly:

```powershell
npx gitnexus detect-changes
```

Result: exit 1, `error: unknown command 'detect-changes'`.

Scope verification therefore used exact-path staging followed by `git diff --cached --name-status`, `git diff --cached --stat`, `git diff --cached --check`, and a final working-tree status. Only this plan and evidence artifact were eligible for the documentation/evidence commit; no production or test symbol was edited in Task 5.

## Cleanup commands and result

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe' -D .tmp-task5-pg stop -m fast
Remove-Item .tmp-task5-pg -Recurse -Force
Remove-Item .tmp-task5* -Force
```

Observed:

- PostgreSQL reported `server stopped`;
- temporary cluster directory absent;
- temporary metadata absent;
- `.tmp-task5*` count `0`.

The cleanup PowerShell command itself ended with exit code 1 only because its final diagnostic `Get-NetTCPConnection` returned no matching listener; all preceding stop/removal operations succeeded, and a separate follow-up cleanup check passed.
