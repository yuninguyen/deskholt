# Blueprint V3.1.1 Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` (recommended) or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the current DeskHolt implementation into explicit alignment with Blueprint V3.1.1 by closing production-safety blockers, separating the transitional commerce model, and adding minimum viable media provenance without expanding into later-stage AI or crawler functionality.

**Architecture:** Preserve the working Product Intelligence, index-gate, offer-freshness, and click-persistence paths. First harden runtime configuration, destructive seed protection, write-action authorization, and release documentation; then introduce `AffiliateNetwork → Merchant → MerchantProduct → Offer` and `MediaAsset` additively beside legacy `AffiliateLink`, migrate reads/writes through a compatibility layer, and keep `prefer-new` dual-model compatibility until a later owner-approved production parity decision.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.5, Prisma 5.22/PostgreSQL, Server Components/Server Actions, Node test runner with `tsx`, Tailwind/shadcn Admin UI.

**Spec:** `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` plus `docs/DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md`; implementation truth remains `prisma/schema.prisma`, versioned migrations, and current production code.

## Global Constraints

- Do not implement autonomous AI, realtime crawling, Best-For scoring, vector matching, Workspace Builder, or broad multi-network ingestion in this plan.
- Preserve Product creation defaults: `status = DRAFT` and `is_indexed = false`.
- Preserve `evaluateProductAccess()` as the single public/index/list/sitemap/commerce eligibility policy.
- Preserve the current click-persistence semantics: request-scoped `clickId`, transient-only bounded retry, bounded timeout, observable exhausted persistence, and conversion-first redirect continuity.
- Never emit a placeholder affiliate URL in production. Missing network credentials/configuration must fail closed for offer activation and redirect eligibility.
- Treat affiliate network, merchant, merchant listing, commercial offer, and affiliate destination as separate concepts.
- Keep `AffiliateLink` temporarily for additive migration compatibility; do not perform a flag-day destructive migration.
- Product media must identify source and usage provenance. Generic imagery must not visually claim to be an official image of a named product.
- Secrets stay in environment variables or an approved encrypted secret store and never reach client components.
- Do not provision or switch traffic to a final VPS. `docs/operations/deployment-strategy.md` requires explicit owner authorization for final rollout.
- Before modifying any existing function/class/method, run GitNexus upstream impact analysis and warn before HIGH/CRITICAL changes. Before each implementation commit, run GitNexus change detection.
- Use TDD for every behavior change. Each task must pass its focused tests before the next task begins.
- PostgreSQL integration tests must reuse the existing conditional owned-cluster pattern keyed by `ERGEAR_TEST_POSTGRES_BIN`. When the binary path is absent, DB integration cases use `test.skip`; pure/unit/source-contract tests still run under ordinary `npm test`. Do not assume a globally installed or already-running PostgreSQL server.
- Database remediation scripts default to dry-run. Mutation requires an explicit apply flag and must print sanitized database identity plus before/after counts.

## Execution Approval Gates

```text
Gate A — Plan re-review
  Claude/user approves this revised document.

Gate B — Safety tranche
  Implement Tasks 1–4 only.
  Run focused tests + repository verification.
  Stop for review.

Gate C — Commerce/media tranche
  Only after Gate B passes, implement Tasks 5–10.
  Keep runtime readMode = prefer-new.
  Run migration/backfill/parity/media verification.
  Stop for review.

Gate D — Remaining remediation
  Tasks 11–14 may proceed only after Gate C review.

AI import gate
  AI import plan remains blocked until Tasks 2–10 have repository, migration,
  conditional PostgreSQL, redirect/CTA, and media-policy evidence accepted by the owner.
```

Passing development or preview parity does not authorize `new-only` production reads.

## File and Boundary Map

### Existing files to harden

- `src/lib/products/affiliateLinkCommand.ts` — remove universal placeholder-tag derivation; delegate tracking destinations to network configuration.
- `src/app/(admin)/admin/products/[id]/offers/actions.ts` — reject unavailable network configuration and write through compatibility services.
- `prisma/seed.ts`, `scripts/create-product-ergear-egesd5b.ts`, `scripts/create-products-3to7-standing-desks.ts` — never emit placeholder tracking URLs.
- `scripts/remediate-placeholder-affiliate-links.ts` — idempotently replace placeholder tracking URLs with raw URLs or deactivate links when no valid approved destination exists.
- Existing placeholder-related tests and evidence — assert absence of the placeholder rather than requiring it.
- `src/app/(admin)/admin/products/[id]/specifications/actions.ts` — add explicit action-level admin authorization.
- `prisma/seed.ts` — require explicit opt-in and development/test database allowlisting.
- `src/app/go/[slug]/route.ts` — resolve an eligible destination from the commerce compatibility service rather than treating network as merchant.
- `src/lib/products/productPageData.ts` and `src/lib/products/productStructuredData.ts` — retain centralized freshness/presentation policy while accepting the new Offer projection.
- `src/app/(public)/products/[slug]/page.tsx` — consume the compatibility projection and remove/evidence-gate legacy opaque LLM sentiment.
- `README.md` and canonical Blueprint status sections — reconcile documentation with current implementation and schema-lock log.

### New focused modules

- `src/lib/admin/requireAdmin.ts` — shared server-only admin authorization primitive.
- `src/lib/config/affiliateRuntime.ts` — validated server-only network runtime configuration.
- `src/lib/products/commerceTypes.ts` — stable domain DTOs used by Admin, public pages, and redirect code.
- `src/lib/products/commerceRepository.ts` — Prisma-backed new-model reads/writes.
- `src/lib/products/legacyCommerceAdapter.ts` — maps legacy `AffiliateLink` rows into the new DTO during migration.
- `src/lib/products/commerceCompatibility.ts` — dual-read and controlled dual-write boundary.
- `src/lib/media/mediaPolicy.ts` — validates media provenance and determines remote/local/placeholder behavior.
- `src/lib/media/mediaRepository.ts` — Prisma-backed `MediaAsset` persistence.
- `scripts/backfill-commerce-model.ts` — idempotent legacy-to-new commerce backfill.
- `scripts/backfill-media-provenance.ts` — classifies existing image URLs conservatively.
- `scripts/verify-blueprint-remediation.ts` — non-destructive release-readiness assertions.

---

### Task 1: Record a Baseline and Reconcile the Status Ledger

**Files:**
- Modify: `README.md`
- Modify: `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md`
- Create: `docs/operations/blueprint-v3-1-1-remediation-status.md`
- Test: `tests/documentationTruth.test.ts`

**Interfaces:**
- Consumes current versions from `package.json`, `prisma/schema.prisma`, the Blueprint live ontology log, and `docs/operations/deployment-strategy.md`.
- Produces one status ledger with explicit values for schema lock, P0 verification evidence, unresolved production blockers, and final rollout authorization.

- [ ] **Step 1: Write the failing documentation truth test**

Create `tests/documentationTruth.test.ts` that reads the three documents and asserts:

```ts
assert.match(readme, /Next\.js 16\.3/);
assert.match(readme, /React 19/);
assert.match(readme, /PostgreSQL/);
assert.doesNotMatch(readme, /React 18/);
assert.doesNotMatch(readme, /SQLite/);
assert.match(blueprint, /Standing Desk Schema V1\.0 is LOCKED/);
assert.match(status, /Final production rollout: NOT AUTHORIZED/);
assert.match(status, /Placeholder affiliate destinations: BLOCKER/);
assert.match(status, /Destructive seed allowlist: BLOCKER/);
```

Also assert the top-level Blueprint current-status section no longer says `NOT ontology-verified` without an adjacent historical qualification.

- [ ] **Step 2: Run the test to verify RED**

Run:

```text
node --experimental-test-module-mocks --import tsx --test tests/documentationTruth.test.ts
```

Expected: FAIL because the status ledger does not exist and README/Blueprint status text is stale.

- [ ] **Step 3: Write the minimum truthful documentation update**

Set the ledger to these exact states:

```text
Standing Desk Schema V1.0 is LOCKED (2026-09-03 live log)
P0 implementation evidence: PRESENT, must be re-run before release
Placeholder affiliate destinations: BLOCKER
Destructive seed allowlist: BLOCKER
Separated commerce model: P1 ARCHITECTURE DEBT
Media provenance: P1 ARCHITECTURE DEBT
Final production rollout: NOT AUTHORIZED
Vercel/Neon: temporary validation infrastructure
```

Update README stack facts without rewriting unrelated product copy. Reconcile the Blueprint status header with its later live log while retaining the historical V1-alpha/P0 sequence as historical context.

- [ ] **Step 4: Run the focused test to verify GREEN**

Run the documentation test again; expected PASS.

- [ ] **Step 5: Commit**

```text
git add README.md docs/DeskHolt-Master-System-Blueprint-V3.1.1.md docs/operations/blueprint-v3-1-1-remediation-status.md tests/documentationTruth.test.ts
git commit -m "docs: reconcile blueprint implementation status"
```

### Task 2: Centralize Action-Level Admin Authorization

**Files:**
- Create: `src/lib/admin/requireAdmin.ts`
- Modify: `src/app/(admin)/admin/products/actions.ts`
- Modify: `src/app/(admin)/admin/products/[id]/edit/actions.ts`
- Modify: `src/app/(admin)/admin/products/[id]/offers/actions.ts`
- Modify: `src/app/(admin)/admin/products/[id]/specifications/actions.ts`
- Modify: `src/lib/products/specificationSaveAction.ts`
- Test: `tests/adminWriteAuthorization.test.ts`
- Modify: existing focused action tests as required

**Interfaces:**
- Produces:

```ts
export async function requireAdminSession(fromPath: string): Promise<void>;
```

- `requireAdminSession()` reads `ADMIN_SESSION_COOKIE`, calls `isValidSessionToken()`, and redirects to `/admin/login?from=<encoded path>` when invalid.
- All Admin write actions call this function before parsing input, reading mutable state, or opening a transaction.
- This is defense in depth: `src/proxy.ts` continues to protect `/admin`, while every server-side write entry point independently authenticates in case routing, action reuse, or middleware coverage changes.

- [ ] **Step 1: Write failing authorization tests**

Assert the specification action rejects an invalid session before `loadSpecificationData`, validation, transaction, or draft persistence. Assert product/edit/offer/specification actions all import the shared helper rather than maintaining divergent local implementations.

- [ ] **Step 2: Run RED**

```text
node --experimental-test-module-mocks --import tsx --test tests/adminWriteAuthorization.test.ts tests/adminProductCreation.test.ts tests/productEditActions.test.ts tests/affiliateLinkActions.test.ts tests/productSpecificationsAction.test.ts
```

Expected: FAIL because specifications currently lack an explicit action-level check and the helper is not centralized.

- [ ] **Step 3: Implement the shared server-only helper**

Use this behavior:

```ts
export async function requireAdminSession(fromPath: string): Promise<void> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSessionToken(token))) {
    redirect(`/admin/login?from=${encodeURIComponent(fromPath)}`);
  }
}
```

Inject `requireAdmin` into action factories so unit tests remain independent of Next cookies. For specifications, extend `createSaveSpecificationsAction` dependencies with `requireAdmin(): Promise<void>` and call it as the first awaited operation.

- [ ] **Step 4: Run GREEN**

Run the focused suite again; expected PASS.

- [ ] **Step 5: Commit**

```text
git add src/lib/admin/requireAdmin.ts src/app/(admin)/admin/products src/lib/products/specificationSaveAction.ts tests/adminWriteAuthorization.test.ts tests/adminProductCreation.test.ts tests/productEditActions.test.ts tests/affiliateLinkActions.test.ts tests/productSpecificationsAction.test.ts
git commit -m "fix: require auth in every admin write action"
```

### Task 3: Eliminate Placeholder Destinations and Define Fail-Closed Commerce Behavior

**Files:**
- Create: `src/lib/config/affiliateRuntime.ts`
- Create: `scripts/remediate-placeholder-affiliate-links.ts`
- Modify: `src/lib/products/affiliateLinkCommand.ts`
- Modify: `src/app/(admin)/admin/products/[id]/offers/actions.ts`
- Modify: `src/app/(admin)/admin/products/[id]/offers/page.tsx`
- Modify: `src/app/go/[slug]/route.ts`
- Modify: `src/app/(public)/products/[slug]/page.tsx`
- Modify: `src/components/ui/PriceTable.tsx`
- Modify: `prisma/seed.ts`
- Modify: `scripts/create-product-ergear-egesd5b.ts`
- Modify: `scripts/create-products-3to7-standing-desks.ts`
- Modify: `src/lib/admin/i18n/en.ts`
- Modify: `src/lib/admin/i18n/vi.ts`
- Test: `tests/affiliateRuntime.test.ts`
- Create: `tests/remediatePlaceholderAffiliateLinks.test.ts`
- Modify: `tests/affiliateLinkCommand.test.ts`
- Modify: `tests/affiliateLinkActions.test.ts`
- Modify: `tests/adminOffersPage.test.ts`
- Modify: `tests/goProductAccess.test.ts`
- Modify: `tests/clickTracking.test.ts`
- Modify: `tests/createProductErgearEgesd5b.test.ts`
- Modify: `tests/createProducts3to7StandingDesks.test.ts`

**Interfaces:**
- Produces:

```ts
export type AffiliateNetworkKey = 'amazon' | 'walmart' | 'target' | 'awin' | 'impact' | 'cj';

export type AffiliateRuntimeConfig = {
  environment: 'development' | 'test' | 'production';
  amazonAssociateTag?: string;
};

export type TrackingDestinationResult =
  | { ok: true; trackingUrl: string; destinationStatus: 'AFFILIATE' }
  | { ok: false; reason: 'network-not-configured' | 'unsupported-tracking-builder' | 'invalid-url' };

export type AffiliateDestinationState =
  | { destinationStatus: 'AFFILIATE'; trackingUrl: string; canRedirect: true }
  | { destinationStatus: 'NON_AFFILIATE'; trackingUrl: string; canRedirect: false }
  | { destinationStatus: 'INVALID'; trackingUrl: null; canRedirect: false };

export function readAffiliateRuntimeConfig(env?: NodeJS.ProcessEnv): AffiliateRuntimeConfig;
export function buildTrackingDestination(
  network: AffiliateNetworkKey,
  rawUrl: string,
  config: AffiliateRuntimeConfig
): TrackingDestinationResult;

export function resolveAffiliateDestinationState(input: {
  network: AffiliateNetworkKey;
  rawUrl: string;
  trackingUrl: string | null;
  config: AffiliateRuntimeConfig;
}): AffiliateDestinationState;

export type AffiliateDestinationReadiness = {
  scanned: number;
  eligible: number;
  informationalOnly: number;
  placeholder: number;
  invalid: number;
  blockers: string[];
};

export async function checkAffiliateDestinationReadiness(
  store: AffiliateDestinationReadinessStore,
  config: AffiliateRuntimeConfig
): Promise<AffiliateDestinationReadiness>;
```

- Rename the existing string union from `AffiliateNetwork` to `AffiliateNetworkKey` before adding the Prisma `AffiliateNetwork` model; all command/runtime/DTO signatures use the key type.
- Amazon production destinations require `AMAZON_ASSOCIATE_TAG` matching `/^[A-Za-z0-9_-]+-20$/` for the US marketplace.
- Admin offer creation must remain available for informational catalog data before a tag exists: save merchant/network, raw URL, observed price, stock/availability, priority, and provenance with `tracking_url = raw_url` plus a derived `destinationStatus = 'NON_AFFILIATE'` in the command/DTO projection. Do not add a pre-commerce Prisma column in Task 3; derive the state from validated destination eligibility until Task 5 introduces the separated model. This row may appear in informational price output when freshness passes, but it is never redirectable or click-trackable until an approved destination is configured.
- Impact, Awin, CJ, Walmart, Target, and direct-brand destinations are stored only when supplied as already generated approved tracking URLs; no Amazon-style query parameter is appended to them.
- Legacy `AffiliateLink.tracking_url` equal to `raw_url` means “merchant destination only, no approved affiliate destination.” It is not eligible for `/go` redirect or click attribution until a validated destination is configured.

- [ ] **Step 1: Replace placeholder expectations with failing fail-closed tests**

Delete test assertions that require `deskholt-pending`. Add:

```ts
assert.deepEqual(
  buildTrackingDestination('amazon', 'https://www.amazon.com/dp/B000000000', {
    environment: 'production',
  }),
  { ok: false, reason: 'network-not-configured' }
);

assert.deepEqual(
  resolveAffiliateDestinationState({
    network: 'amazon',
    rawUrl: 'https://www.amazon.com/dp/B000000000',
    trackingUrl: 'https://www.amazon.com/dp/B000000000',
    config: { environment: 'production' },
  }),
  {
    destinationStatus: 'NON_AFFILIATE',
    trackingUrl: 'https://www.amazon.com/dp/B000000000',
    canRedirect: false,
  }
);

assert.equal(
  buildTrackingDestination('amazon', 'https://www.amazon.com/dp/B000000000', {
    environment: 'production',
    amazonAssociateTag: 'deskholt-20',
  }).ok,
  true
);
```

Assert non-Amazon raw URLs are not silently modified. Assert `deskholt-pending` never appears in a producer result, fixture expectation, or active database destination.

Add route/CTA tests with this exact contract:

```text
No eligible approved destination:
- `/go/[slug]` returns 404.
- It does not call click persistence.
- It does not generate a clickId.
- It does not redirect to raw_url.
- Public observed price may remain visible when freshness policy passes.
- The outbound CTA is disabled/hidden and labeled "Affiliate link unavailable".
```

This is the temporary catalog behavior until a real Amazon tag exists: products and observed prices may remain informational, but no Amazon outbound conversion path is active.

- [ ] **Step 2: Run RED**

```text
node --experimental-test-module-mocks --import tsx --test tests/affiliateRuntime.test.ts tests/remediatePlaceholderAffiliateLinks.test.ts tests/affiliateLinkCommand.test.ts tests/affiliateLinkActions.test.ts tests/adminOffersPage.test.ts tests/goProductAccess.test.ts tests/clickTracking.test.ts tests/createProductErgearEgesd5b.test.ts tests/createProducts3to7StandingDesks.test.ts
```

Expected: FAIL because current code and data producers append the placeholder tag, `/go` treats it as redirectable, and the CTA always links when an offer is not out of stock.

- [ ] **Step 3: Implement validated runtime configuration and update every producer**

Move destination construction out of `affiliateLinkCommand.ts`. Rename the old network union to `AffiliateNetworkKey`. Change create/update inputs to accept `approvedTrackingUrl?: string` for non-Amazon networks. The command must still persist an informational offer when no approved destination exists: derive the destination state as `NON_AFFILIATE`, store `tracking_url = raw_url` only as a non-redirectable merchant reference, preserve the submitted informational stock value, and return success for valid merchant/price/stock/provenance input. Return `invalid-input` only for malformed data; return `network-not-configured` only for an explicitly requested affiliate activation, not for informational save.

Admin informational save remains available with this command contract:

```ts
type SaveInformationalAffiliateLinkInput = {
  productId: string;
  network: AffiliateNetworkKey;
  price: number;
  rawUrl: string;
  isInStock: boolean;
  priorityOrder: number;
  sourceUrl: string;
  sourceType: 'RETAILER';
};
```

Show an informational/non-affiliate status in Admin instead of disabling Save. Until Task 5 introduces dedicated listing/Offer provenance columns, `sourceUrl` must be the validated retailer/listing evidence URL (normally equal to the Admin-entered raw URL) and `sourceType` is explicitly `RETAILER`; these fields are included in structured remediation/audit output and must never be fabricated. Task 5+ moves them into the separated data-source boundary.

Update all live producers:

```text
prisma/seed.ts
scripts/create-product-ergear-egesd5b.ts
scripts/create-products-3to7-standing-desks.ts
Admin create/update offer command
```

They must write either a validated approved affiliate destination or `tracking_url = raw_url` as an explicitly non-affiliate, non-redirectable legacy value. Update all corresponding tests. Historical Markdown may retain old facts when clearly labeled historical, but active specs/plans must be marked superseded by this remediation.

- [ ] **Step 4: Implement the idempotent data remediation script**

Produce:

```ts
export type PlaceholderRemediationSummary = {
  scanned: number;
  replacedWithApprovedDestination: number;
  resetToRawUrl: number;
  deactivated: number;
  unchanged: number;
};

export async function remediatePlaceholderAffiliateLinks(
  prisma: PrismaClient,
  config: AffiliateRuntimeConfig
): Promise<PlaceholderRemediationSummary>;
```

For each row containing `deskholt-pending`:

```text
valid configured destination can be built -> replace tracking_url
otherwise raw_url is valid -> set tracking_url = raw_url, preserve informational is_in_stock, and derive NON_AFFILIATE eligibility
otherwise -> mark the destination ineligible, preserve the row for audit, and emit a controlled remediation error
```

Run twice and assert the second run makes zero changes. The CLI defaults to `--dry-run`; mutation requires `--apply` plus an exact sanitized database-identity confirmation. Run dry-run and review counts first. Preview apply requires owner confirmation; eventual production apply requires the separate production-operations authorization defined by `docs/operations/deployment-strategy.md`. The script prints database identity/counts without secrets and never deletes clicks or products.

- [ ] **Step 5: Implement fail-closed redirect and CTA behavior**

Introduce a destination eligibility predicate shared by public row mapping and `/go`. A destination is eligible only when it is valid HTTPS, differs from the unapproved raw URL when required by the network policy, contains no known placeholder, and passes runtime network configuration.

When none is eligible, `/go/[slug]` returns 404 before click ID generation/persistence. `PriceTableRow` gains `canRedirect: boolean`; when false, render non-clickable copy `Affiliate link unavailable` (and add localization only if the public surface gains an established i18n mechanism in scope). Do not fall back to raw merchant URL because that would record no affiliate conversion and would blur the fail-closed rule.

- [ ] **Step 6: Add a production/readiness database assertion**

Export the named `checkAffiliateDestinationReadiness()` function and its `AffiliateDestinationReadinessStore` contract. The read-only check fails when any active affiliate destination has a placeholder or otherwise invalid destination, while counting valid informational non-affiliate rows separately. Do not require credentials for networks with no active affiliate destinations. Task 14 consumes this exact exported signature.

- [ ] **Step 7: Run GREEN**

Run the focused suite and the remediation script twice against the conditional PostgreSQL harness; expected PASS and zero active placeholder destinations.

- [ ] **Step 8: Commit**

```text
git add src/lib/config/affiliateRuntime.ts src/lib/products/affiliateLinkCommand.ts src/app/(admin)/admin/products/[id]/offers src/app/go/[slug]/route.ts src/app/(public)/products/[slug]/page.tsx src/components/ui/PriceTable.tsx prisma/seed.ts scripts/create-product-ergear-egesd5b.ts scripts/create-products-3to7-standing-desks.ts scripts/remediate-placeholder-affiliate-links.ts src/lib/admin/i18n tests
git commit -m "fix: eliminate placeholder affiliate destinations"
```

### Task 4: Harden Destructive Seed Execution

**Files:**
- Create: `src/lib/config/seedSafety.ts`
- Modify: `prisma/seed.ts`
- Modify: `tests/p0A3SeedSafety.test.ts`
- Create: `tests/seedSafety.test.ts`
- Create: `tests/databaseWriteScriptSafety.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces:

```ts
export type SeedSafetyInput = {
  nodeEnv?: string;
  allowDemoData?: string;
  databaseUrl?: string;
  allowedHosts?: string;
  allowedDatabaseNames?: string;
};

export type SeedSafetyDecision =
  | { allowed: true; host: string; databaseName: string }
  | { allowed: false; reason: 'explicit-opt-in-required' | 'production-forbidden' | 'invalid-database-url' | 'host-not-allowed' | 'database-not-allowed' };

export function evaluateSeedSafety(input: SeedSafetyInput): SeedSafetyDecision;
export function assertDestructiveSeedAllowed(input?: SeedSafetyInput): void;
```

- Defaults must fail closed. No built-in production host or database name is allowed.
- This destructive-seed guard applies to `prisma/seed.ts`. Product-specific idempotent scripts must not inherit a destructive-seed bypass; audit each database-writing script separately and classify it as read-only, idempotent scoped write, or destructive. Destructive scripts use the same guard. Scoped integration scripts must accept an injected Prisma client/test URL and must not delete unrelated rows.
- Conditional PostgreSQL tests use the existing `ERGEAR_TEST_POSTGRES_BIN` owned-cluster pattern. When the variable is absent, integration cases skip rather than failing the entire `npm test`; pure guard tests still run everywhere.

- [ ] **Step 1: Write the failing safety matrix**

Cover:

```text
NODE_ENV=production -> denied
SEED_ALLOW_DEMO_DATA missing/false -> denied
invalid DATABASE_URL -> denied
host absent from SEED_ALLOWED_DB_HOSTS -> denied
database absent from SEED_ALLOWED_DB_NAMES -> denied
explicit opt-in + development + both allowlists -> allowed
```

Also assert `prisma/seed.ts` calls the safety assertion before creating `PrismaClient` or issuing deletes. Inventory `prisma/*.ts` and `scripts/*.ts` database writers in `tests/databaseWriteScriptSafety.test.ts`; assert destructive scripts use the guard and scoped idempotent scripts export injectable functions rather than silently targeting `DATABASE_URL` at import time.

- [ ] **Step 2: Run RED**

```text
node --experimental-test-module-mocks --import tsx --test tests/seedSafety.test.ts tests/databaseWriteScriptSafety.test.ts tests/p0A3SeedSafety.test.ts
```

Expected: FAIL because seed currently relies on `NODE_ENV` only.

- [ ] **Step 3: Implement fail-closed seed evaluation**

Parse `DATABASE_URL` using `new URL()`. Split allowlists by comma, trim, discard empty values, and compare exact normalized host/database names. Require:

```text
SEED_ALLOW_DEMO_DATA=true
SEED_ALLOWED_DB_HOSTS=localhost,127.0.0.1
SEED_ALLOWED_DB_NAMES=deskholt_dev,deskholt_test
```

Keep these as `.env.example` examples only, not committed real environment values. Do not include ephemeral names such as `products_3to7` in `.env.example`. Tests derive `SEED_ALLOWED_DB_NAMES` from their owned-cluster URL or pass fixture configuration directly to `evaluateSeedSafety()`.

- [ ] **Step 4: Wire the guard before database access**

Load and call `assertDestructiveSeedAllowed()` before constructing `PrismaClient`. Keep Draft/noindex seed defaults. Preserve the explicit warning that seed data is disposable.

- [ ] **Step 5: Run GREEN**

Run both tests; expected PASS.

- [ ] **Step 6: Commit**

```text
git add src/lib/config/seedSafety.ts prisma/seed.ts tests/seedSafety.test.ts tests/databaseWriteScriptSafety.test.ts tests/p0A3SeedSafety.test.ts .env.example
git commit -m "fix: harden destructive seed execution"
```

### Task 5: Add the Separated Commerce Schema Additively

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260905090000_add_separated_commerce_models/migration.sql`
- Create: `tests/commerceSchemaMigration.test.ts`

**Interfaces:**
- Produces these Prisma models and enums:

```prisma
enum OfferAvailability {
  IN_STOCK
  OUT_OF_STOCK
  UNKNOWN
}

model AffiliateNetwork {
  id        String   @id @default(cuid())
  key       String   @unique
  name      String
  is_active Boolean  @default(false)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  merchants Merchant[]
  @@map("affiliate_networks")
}

model Merchant {
  id                   String   @id @default(cuid())
  affiliate_network_id String?
  slug                 String   @unique
  name                 String
  website_url          String?
  is_active             Boolean  @default(true)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  affiliate_network AffiliateNetwork? @relation(fields: [affiliate_network_id], references: [id])
  listings          MerchantProduct[]
  @@index([affiliate_network_id])
  @@map("merchants")
}

model MerchantProduct {
  id                  String   @id @default(cuid())
  merchant_id         String
  product_id          String
  variant_id          String?
  listing_key         String
  external_product_id String?
  product_url         String
  affiliate_url       String?
  priority_order      Int      @default(1)
  is_active           Boolean  @default(true)
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  merchant Merchant @relation(fields: [merchant_id], references: [id])
  product  Product @relation(fields: [product_id], references: [id], onDelete: Cascade)
  variant  ProductVariant? @relation(fields: [variant_id], references: [id], onDelete: SetNull)
  offers   Offer[]
  @@index([product_id])
  @@index([variant_id])
  @@unique([merchant_id, listing_key])
  @@unique([merchant_id, external_product_id])
  @@map("merchant_products")
}

model Offer {
  id                  String            @id @default(cuid())
  merchant_product_id String
  price               Decimal           @db.Decimal(18, 2)
  currency            String            @default("USD")
  availability        OfferAvailability @default(UNKNOWN)
  source_url          String
  source_type         SourceType        @default(RETAILER)
  shipping_amount     Decimal?          @db.Decimal(18, 2)
  final_price          Decimal?          @db.Decimal(18, 2)
  condition            String?
  coupon_text          String?
  data_source          String
  observed_at          DateTime
  expires_at           DateTime?
  is_current           Boolean           @default(true)
  created_at           DateTime          @default(now())
  merchant_product MerchantProduct @relation(fields: [merchant_product_id], references: [id], onDelete: Cascade)
  @@index([merchant_product_id, observed_at])
  @@index([is_current, observed_at])
  @@map("offers")
}
```

Add `merchant_products` relations to `Product` and `ProductVariant`. Keep `AffiliateLink` unchanged in this task. `listing_key` is mandatory and supplies an internal identity even when a network has no external product ID; use a deterministic value derived from product/variant/listing source. The nullable external ID uniqueness remains an additional network identity guard, not the only duplicate defense. `priority_order` belongs to `MerchantProduct` because it ranks merchant listings for presentation/fallback while Offer records remain time-specific commercial observations.

- [ ] **Step 1: Write a failing schema/migration contract test**

Read schema and migration SQL. Assert all four models/tables, foreign keys, `MerchantProduct.listing_key`, `MerchantProduct.priority_order`, `Offer.source_url`, `Offer.source_type`, both uniqueness guards, USD default, `UNKNOWN` availability default, and no removal/rename of `affiliate_links`.

- [ ] **Step 2: Run RED**

```text
node --experimental-test-module-mocks --import tsx --test tests/commerceSchemaMigration.test.ts
```

Expected: FAIL because models do not exist.

- [ ] **Step 3: Run the required Prisma preparation commands**

```text
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name add_separated_commerce_models --create-only
```

Review the generated SQL before applying it. Reject any unexpected `DROP TABLE`, `DROP COLUMN`, or removal of existing partial indexes.

- [ ] **Step 4: Add models and finalize additive migration SQL**

Use the exact field contracts above. Ensure decimal prices are non-negative through command validation; PostgreSQL check constraints may be added only if tests cover migration behavior.

- [ ] **Step 5: Apply to a clean test PostgreSQL database and run GREEN**

Apply all migrations from baseline using the existing conditional `ERGEAR_TEST_POSTGRES_BIN` owned-cluster harness, assert the new tables/indexes exist, and run the schema contract test. If the variable is absent, skip only this integration case; schema/source contract tests still run.

- [ ] **Step 6: Commit**

```text
git add prisma/schema.prisma prisma/migrations tests/commerceSchemaMigration.test.ts
git commit -m "feat: add separated commerce domain models"
```

### Task 6: Define Commerce DTOs, Repository, and Legacy Adapter

**Files:**
- Create: `src/lib/products/commerceTypes.ts`
- Create: `src/lib/products/commerceRepository.ts`
- Create: `src/lib/products/legacyCommerceAdapter.ts`
- Create: `tests/commerceRepository.test.ts`
- Create: `tests/legacyCommerceAdapter.test.ts`

**Interfaces:**
- Produces:

```ts
export type CommerceOfferCandidate = {
  offerId: string;
  merchantProductId: string;
  merchantSlug: string;
  merchantName: string;
  networkKey: string | null;
  productUrl: string;
  affiliateUrl: string | null;
  price: number;
  currency: 'USD';
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  observedAt: Date;
  expiresAt: Date | null;
  sourceUrl: string;
  sourceType: 'RETAILER';
  priorityOrder: number;
};

export interface CommerceRepository {
  listProductOffers(productId: string): Promise<CommerceOfferCandidate[]>;
  findRedirectOffer(productId: string, merchantSlug?: string): Promise<CommerceOfferCandidate | null>;
  createMerchantListing(input: CreateMerchantListingInput): Promise<{ merchantProductId: string }>;
  recordOffer(input: RecordOfferInput): Promise<{ offerId: string }>;
}
```

- `legacyAffiliateLinkToOffer()` returns a DTO with merchant/network both labeled from legacy data only inside the adapter and marks `dataSource = 'legacy-affiliate-link'`; no new code may infer that network and merchant are semantically identical.
- The compatibility mapping is exact and testable:

```text
AffiliateLink.last_crawled_at -> CommerceOfferCandidate.observedAt
AffiliateLink.is_in_stock -> availability === 'IN_STOCK' or 'OUT_OF_STOCK'
MerchantProduct.priority_order / legacy AffiliateLink.priority_order -> priorityOrder
AffiliateLink.price -> price
AffiliateLink.raw_url -> sourceUrl with sourceType = 'RETAILER'
validated tracking_url -> affiliateUrl; otherwise affiliateUrl = null
```

This projection must remain accepted by the existing `OfferCandidate` policy through an explicit adapter: `observedAt -> last_crawled_at`, `availability === IN_STOCK -> is_in_stock`, and `priorityOrder -> priority_order`.

- [ ] **Step 1: Write failing mapping/repository tests**

Cover decimal-to-number conversion, exact legacy/new mappings, availability mapping, `observedAt → last_crawled_at`, `priorityOrder → priority_order`, freshness timestamps, missing affiliate URL, merchant/network separation, and deterministic order by current validity, price, priority, merchant slug, then id. Add equivalence fixtures proving `selectCanonicalOffer()` chooses the same winner for a legacy AffiliateLink set and its new-model projection.

- [ ] **Step 2: Run RED**

```text
node --experimental-test-module-mocks --import tsx --test tests/commerceRepository.test.ts tests/legacyCommerceAdapter.test.ts
```

Expected: FAIL because modules do not exist.

- [ ] **Step 3: Implement pure DTO mapping first**

Keep Prisma types inside repository/adapter modules; expose plain DTOs to callers. Reject unsupported currency rather than silently treating it as USD.

- [ ] **Step 4: Implement Prisma repository methods**

Use transactions for listing + offer writes. Recording a new current offer must mark prior current offers for that merchant product as `is_current = false` in the same transaction.

- [ ] **Step 5: Run GREEN**

Run focused tests; expected PASS.

- [ ] **Step 6: Commit**

```text
git add src/lib/products/commerceTypes.ts src/lib/products/commerceRepository.ts src/lib/products/legacyCommerceAdapter.ts tests/commerceRepository.test.ts tests/legacyCommerceAdapter.test.ts
git commit -m "feat: add commerce repository and legacy adapter"
```

### Task 7: Backfill Legacy AffiliateLink Data Idempotently

**Files:**
- Create: `scripts/backfill-commerce-model.ts`
- Create: `tests/backfillCommerceModel.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:

```ts
export type CommerceBackfillSummary = {
  scanned: number;
  networksCreated: number;
  merchantsCreated: number;
  listingsCreated: number;
  offersCreated: number;
  skipped: number;
};

export async function backfillCommerceModel(prisma: PrismaClient): Promise<CommerceBackfillSummary>;
```

- Legacy network strings map to temporary merchant slugs `legacy-<network>` only for migration continuity, with names such as `Legacy Amazon Merchant Mapping`. These records must be clearly marked by naming and never presented publicly as authoritative merchant identity.

- [ ] **Step 1: Write failing integration tests**

Use a test harness that imports `ERGEAR_TEST_POSTGRES_BIN`, starts an owned ephemeral PostgreSQL cluster when present, names the database explicitly (including `products_3to7`), and calls the exported function with an injected Prisma client. When the binary path is absent, mark only the integration test skipped; do not require an external server for `npm test`.

Using the conditional `ERGEAR_TEST_POSTGRES_BIN` owned-cluster harness, seed one Product with two legacy links, run backfill twice, and assert the second run creates zero additional networks, merchants, listings, or offers. Assert price, stock, URLs, `priority_order`, and `last_crawled_at → observed_at` survive. Skip only the DB integration test when the binary path is absent.

- [ ] **Step 2: Run RED**

```text
node --experimental-test-module-mocks --import tsx --test tests/backfillCommerceModel.test.ts
```

Expected: FAIL because script does not exist.

- [ ] **Step 3: Implement idempotent upserts**

Use stable keys:

```text
AffiliateNetwork.key = AffiliateLink.network
Merchant.slug = legacy-<network>
MerchantProduct.listing_key = legacy-affiliate-link:<AffiliateLink.id>
MerchantProduct.external_product_id = null unless a real merchant identifier is known
MerchantProduct.priority_order = AffiliateLink.priority_order
Offer.data_source = legacy-affiliate-link:<AffiliateLink.id>
Offer.source_url = AffiliateLink.raw_url
Offer.source_type = RETAILER
```

Do not activate a network merely because a legacy row exists. Preserve current public behavior through compatibility reads, not by claiming integration approval.

- [ ] **Step 4: Add the explicit script command**

Add:

```json
"commerce:backfill": "tsx scripts/backfill-commerce-model.ts"
```

The executable entrypoint must print the summary and set a non-zero exit code on failure.

- [ ] **Step 5: Run GREEN and a clean-database rerun**

Expected: focused tests PASS; manual second invocation reports zero creations.

- [ ] **Step 6: Commit**

```text
git add scripts/backfill-commerce-model.ts tests/backfillCommerceModel.test.ts package.json
git commit -m "feat: backfill separated commerce data"
```

### Task 8: Add Controlled Dual-Read and Dual-Write Compatibility

**Files:**
- Create: `src/lib/products/commerceCompatibility.ts`
- Modify: `src/app/(admin)/admin/products/[id]/offers/actions.ts`
- Modify: `src/app/(admin)/admin/products/[id]/offers/page.tsx`
- Modify: `src/lib/products/productPageData.ts`
- Modify: `src/app/go/[slug]/route.ts`
- Test: `tests/commerceCompatibility.test.ts`
- Modify: `tests/productPageData.test.ts`
- Modify: `tests/clickTracking.test.ts`
- Modify: `tests/goProductAccess.test.ts`

**Interfaces:**
- Produces:

```ts
export type CommerceReadMode = 'legacy' | 'prefer-new' | 'new-only';
export type CommerceWriteMode = 'legacy-only' | 'dual-write' | 'new-only';

export function readCommerceMigrationMode(env?: NodeJS.ProcessEnv): {
  readMode: CommerceReadMode;
  writeMode: CommerceWriteMode;
};

export interface CommerceCompatibilityService {
  listProductOffers(productId: string): Promise<CommerceOfferCandidate[]>;
  resolveRedirect(productId: string, merchantSlug?: string): Promise<CommerceOfferCandidate | null>;
  saveOffer(input: SaveAdminOfferInput): Promise<{ merchantProductId: string; offerId: string }>;
}
```

- Default throughout this plan: `readMode = 'prefer-new'`, `writeMode = 'dual-write'`. Parity evidence does not change the production read mode within this plan.
- The compatibility service must preserve informational offers and expose destination eligibility separately from offer validity. An offer can be fresh/current for price display while `affiliateUrl = null` and `canRedirect = false`.

- [ ] **Step 1: Write failing mode and parity tests**

Cover fixtures representing new-model-only rows and legacy-only rows without enabling runtime `new-only`, overlapping migrated data without duplicate rows, dual-write transaction rollback, requested merchant selection, and fallback to lowest valid current offer rather than network priority.

- [ ] **Step 2: Run RED**

Run compatibility, page-data, and redirect tests; expected FAIL.

- [ ] **Step 3: Implement deduplicated dual reads**

Deduplicate migrated pairs using `MerchantProduct.listing_key = legacy-affiliate-link:<id>`. New data wins. Legacy fallback is allowed only when no corresponding new row exists. For real listings, require the mandatory `listing_key`; nullable `external_product_id` is never used as the sole identity.

- [ ] **Step 4: Implement controlled dual writes**

Admin writes create/update the separated listing/offer first and update legacy `AffiliateLink` in the same transaction while `writeMode = 'dual-write'`. Do not generate a placeholder destination in either model.

- [ ] **Step 5: Switch public page and redirect consumers**

Adapt `CommerceOfferCandidate` into the existing centralized `buildOfferPresentation()` policy. In redirect logs, emit distinct `merchant` and `network` values. Apply destination eligibility before generating `clickId` or calling persistence; an ineligible destination returns 404 exactly as Task 3 defines. After the eligibility gate passes, keep click persistence, retry, timeout, failure logging, and redirect-continuity behavior unchanged.

- [ ] **Step 6: Run GREEN**

Run focused compatibility, product page, structured-data, and click/redirect tests; expected PASS.

- [ ] **Step 7: Commit**

```text
git add src/lib/products/commerceCompatibility.ts src/app/(admin)/admin/products/[id]/offers src/lib/products/productPageData.ts src/app/go/[slug]/route.ts tests/commerceCompatibility.test.ts tests/productPageData.test.ts tests/clickTracking.test.ts tests/goProductAccess.test.ts
git commit -m "feat: migrate commerce reads and writes safely"
```

### Task 9: Add Minimum Viable Media Provenance

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260905100000_add_media_assets/migration.sql`
- Create: `src/lib/media/mediaPolicy.ts`
- Create: `src/lib/media/mediaRepository.ts`
- Create: `tests/mediaPolicy.test.ts`
- Create: `tests/mediaSchemaMigration.test.ts`

**Interfaces:**
- Produces:

```prisma
enum MediaStorageMode {
  REMOTE
  MANAGED
  PLACEHOLDER
}

enum MediaUsageStatus {
  APPROVED
  RESTRICTED_REMOTE_ONLY
  PENDING_REVIEW
  REJECTED
}

enum MediaSourceType {
  MANUFACTURER
  MERCHANT
  AFFILIATE_FEED
  ADMIN_UPLOAD
  STOCK
  GENERATED_EDITORIAL
}

model MediaAsset {
  id                  String           @id @default(cuid())
  storage_mode        MediaStorageMode
  usage_status        MediaUsageStatus
  source_type         MediaSourceType
  source_url          String?
  storage_url         String
  alt_text            String
  width                Int?
  height               Int?
  mime_type            String?
  provenance_note      String?
  permission_checked_at DateTime?
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt
  primary_for_products Product[] @relation("ProductPrimaryMedia")
  @@map("media_assets")
}
```

Add nullable `primary_media_id` and relation to `Product`; retain `image_url` for compatibility.

- [ ] **Step 1: Write failing policy and schema tests**

Assert:

```text
APPROVED + MANAGED may render publicly
RESTRICTED_REMOTE_ONLY requires REMOTE
PENDING_REVIEW cannot become a public named-product image
REJECTED cannot be assigned
GENERATED_EDITORIAL cannot be labeled as an official named-product image
PLACEHOLDER requires copy that identifies it as representative/generic
```

Assert migration is additive and retains `products.image_url`.

- [ ] **Step 2: Run RED**

Run both media tests; expected FAIL.

- [ ] **Step 3: Add schema and migration**

Generate and review a create-only migration. Reject destructive Product changes.

- [ ] **Step 4: Implement pure media policy**

Export:

```ts
export function evaluateProductMediaUsage(asset: ProductMediaInput):
  | { allowed: true; publicLabel?: string }
  | { allowed: false; reason: 'pending-review' | 'rejected' | 'invalid-mode' | 'misleading-generated-image' };
```

Keep persistence in `mediaRepository.ts`; do not add upload/conversion behavior in this task.

- [ ] **Step 5: Run GREEN**

Run media tests and Prisma validation; expected PASS.

- [ ] **Step 6: Commit**

```text
git add prisma/schema.prisma prisma/migrations src/lib/media tests/mediaPolicy.test.ts tests/mediaSchemaMigration.test.ts
git commit -m "feat: add product media provenance"
```

### Task 10: Backfill Existing Images Conservatively and Fix Misleading Placeholders

**Files:**
- Create: `scripts/backfill-media-provenance.ts`
- Create: `tests/backfillMediaProvenance.test.ts`
- Modify: `prisma/seed.ts`
- Modify: public product image rendering components/tests as identified by impact analysis

**Interfaces:**
- Produces:

```ts
export type MediaBackfillSummary = {
  scanned: number;
  remoteApproved: number;
  placeholdersCreated: number;
  pendingReview: number;
};

export async function backfillMediaProvenance(prisma: PrismaClient): Promise<MediaBackfillSummary>;
```

- Classification rules:
  - Existing Amazon CDN URLs: `REMOTE + MERCHANT + PENDING_REVIEW` unless recorded permission exists.
  - Existing Unsplash URLs: `PLACEHOLDER + STOCK + APPROVED`, with representative-image labeling.
  - Unknown remote hosts: `REMOTE + MERCHANT + PENDING_REVIEW`.
  - No automatic managed download or WebP conversion.

- [ ] **Step 1: Write failing backfill/render tests**

Assert idempotency, conservative classification, and that a named Product using category stock imagery displays a localized `Representative image` label rather than presenting it as official.

- [ ] **Step 2: Run RED**

Run focused tests; expected FAIL.

- [ ] **Step 3: Implement idempotent backfill**

Create one MediaAsset per distinct existing image/provenance combination and populate `primary_media_id`. Do not mark unknown merchant media as approved.

- [ ] **Step 4: Replace ambiguous seed imagery behavior**

Seed generic images as explicit `PLACEHOLDER` assets and keep Products Draft. If seed cannot create MediaAsset atomically yet, create the Product then attach the placeholder in the same transaction.

- [ ] **Step 5: Add public labeling/fail-closed rendering**

Official/approved remote or managed assets render normally. Placeholder assets render with representative-image copy. Pending/rejected assets do not render as the named product’s official image; use a neutral technical placeholder.

- [ ] **Step 6: Run GREEN and commit**

```text
git add scripts/backfill-media-provenance.ts tests/backfillMediaProvenance.test.ts prisma/seed.ts src tests
git commit -m "fix: preserve truthful product image provenance"
```

### Task 11: Evidence-Gate or Remove Legacy Opaque LLM Sentiment

**Files:**
- Modify: `src/app/(public)/products/[slug]/page.tsx`
- Modify: `prisma/schema.prisma` only if a deprecation comment is required; do not drop `user_sentiment` in this plan
- Create: `tests/productSentimentTruth.test.ts`

**Interfaces:**
- Produces a fail-closed presentation rule: opaque `Product.user_sentiment` does not render publicly unless it has a structured evidence record. Because the Evidence domain is intentionally deferred, current behavior must be hidden rather than upgraded into a speculative evidence system.

- [ ] **Step 1: Write the failing public-truth test**

Assert the rendered/source component no longer contains the actual user-visible claims `Aggregated Real-User Sentiment`, `% Positive User Consensus`, `What Buyers Love`, or `Things to Keep in Mind` based solely on `user_sentiment`. Do not use the JSX comment `Aggregated from Reddit/Amazon reviews via LLM` as the primary assertion. Assert no public pros/cons claim is emitted without an implemented evidence boundary.

- [ ] **Step 2: Run RED**

Run the focused test; expected FAIL because current page labels opaque JSON as LLM-aggregated sentiment.

- [ ] **Step 3: Remove only the unsupported presentation**

Keep the database column for compatibility. Remove/hide the public section and record its reintroduction condition in the remediation ledger:

```text
Re-enable only after ProductEvidence/claim attribution and freshness rules are implemented and populated.
```

- [ ] **Step 4: Run GREEN and commit**

```text
git add src/app/(public)/products/[slug]/page.tsx prisma/schema.prisma tests/productSentimentTruth.test.ts docs/operations/blueprint-v3-1-1-remediation-status.md
git commit -m "fix: hide unsupported product sentiment claims"
```

### Task 12: Add Backup/Recovery Requirements Without Premature VPS Deployment

**Files:**
- Create: `docs/operations/database-backup-runbook.md`
- Create: `scripts/verify-backup-artifact.ts`
- Create: `tests/backupArtifactVerifier.test.ts`
- Modify: `src/app/(admin)/admin/backup/route.ts`
- Modify: Admin backup copy/i18n tests

**Interfaces:**
- Produces:

```ts
export type BackupArtifactVerification = {
  valid: boolean;
  compressed: boolean;
  checksumMatches: boolean;
  ageMs: number;
};

export function verifyBackupArtifact(input: {
  artifactPath: string;
  checksumPath: string;
  now: Date;
  maxAgeMs: number;
}): Promise<BackupArtifactVerification>;
```

- The runbook defines future final-target commands for `pg_dump`, gzip, off-host upload, retention, and restore testing, but no final VPS action is executed in this task.

- [ ] **Step 1: Write failing artifact verifier tests**

Cover valid gzip/checksum, checksum mismatch, missing artifact, stale artifact, and zero-byte dump.

- [ ] **Step 2: Run RED**

Expected: FAIL because verifier does not exist.

- [ ] **Step 3: Implement verifier and runbook**

The runbook must explicitly distinguish:

```text
Admin JSON export = operator convenience export
pg_dump + off-host retention + restore test = database backup/recovery
```

Specify encrypted secret handling and require a successful restore into a disposable database before final rollout approval.

- [ ] **Step 4: Correct Admin backup labeling**

Rename user-facing copy from `Backup` to `Catalog JSON export` where it would imply full recovery protection. Do not remove authentication or the export feature.

- [ ] **Step 5: Run GREEN and commit**

```text
git add docs/operations/database-backup-runbook.md scripts/verify-backup-artifact.ts tests/backupArtifactVerifier.test.ts src/app/(admin)/admin/backup/route.ts src/lib/admin/i18n tests
git commit -m "docs: define database backup and recovery gate"
```

### Task 13: Verify Parity While Keeping Prefer-New Runtime

**Files:**
- Create: `scripts/verify-commerce-parity.ts`
- Create: `tests/verifyCommerceParity.test.ts`
- Modify: `src/lib/products/commerceCompatibility.ts`
- Modify: `docs/operations/blueprint-v3-1-1-remediation-status.md`

**Interfaces:**
- Produces:

```ts
export type CommerceParityReport = {
  productsCompared: number;
  matching: number;
  missingNewListings: string[];
  destinationMismatches: string[];
  priceMismatches: string[];
  availabilityMismatches: string[];
};

export async function verifyCommerceParity(prisma: PrismaClient): Promise<CommerceParityReport>;
```

- This task produces parity evidence only. The runtime remains `prefer-new`; switching production to `new-only` is explicitly outside this plan and requires a later owner-approved production parity decision.

- [ ] **Step 1: Write failing parity-report tests**

Cover exact match, missing listing, destination mismatch, price mismatch, availability mismatch, and stale legacy/new observations.

- [ ] **Step 2: Run RED**

Expected: FAIL because verifier does not exist.

- [ ] **Step 3: Implement non-destructive parity verification**

Compare projections, not raw table shapes. Use the same current-offer freshness policy used publicly.

- [ ] **Step 4: Preserve prefer-new and record the future production gate**

Do not change the production default to `new-only` in this plan. Keep `readMode = 'prefer-new'` after development/preview parity passes. Record parity evidence, but require a later owner-approved production migration decision and parity run against the real production database before any separate plan may switch to `new-only`. Do not drop `AffiliateLink`.

- [ ] **Step 5: Run GREEN and update the ledger**

Record command timestamp, database identity, counts, and zero-mismatch result. If mismatches remain, do not switch the default.

- [ ] **Step 6: Commit**

```text
git add scripts/verify-commerce-parity.ts tests/verifyCommerceParity.test.ts src/lib/products/commerceCompatibility.ts docs/operations/blueprint-v3-1-1-remediation-status.md
git commit -m "chore: verify separated commerce parity"
```

### Task 14: Full Remediation Verification and Review

**Files:**
- Create: `scripts/verify-blueprint-remediation.ts`
- Create: `tests/verifyBlueprintRemediation.test.ts`
- Modify: `docs/operations/blueprint-v3-1-1-remediation-status.md`

**Interfaces:**
- Produces one read-only command that checks:

```text
auth secrets fail closed
all Admin write actions require authorization
checkAffiliateDestinationReadiness() reports no placeholder/invalid active affiliate destination
seed requires explicit opt-in + host/name allowlist
commerce migration tables/indexes exist
commerce parity reports mismatches while runtime remains prefer-new
Product defaults remain Draft/noindex
media assigned to public products passes usage policy
opaque sentiment is not publicly rendered
catalog JSON export is not represented as full database backup
final rollout remains unauthorized until owner confirmation
```

- [ ] **Step 1: Write the failing verification contract test**

Inject fake check functions and assert every failed check yields a named blocker and non-zero process exit behavior.

- [ ] **Step 2: Run RED**

Expected: FAIL because verifier does not exist.

- [ ] **Step 3: Implement the read-only verifier**

The verifier must never mutate configuration or database rows. Print JSON plus a concise human summary.

- [ ] **Step 4: Run focused tests**

Run every new test file from Tasks 1–13, then existing auth, publishing, structured-data, click-persistence, migration, seed, Admin offers, and product page tests.

- [ ] **Step 5: Run repository-wide verification**

Run sequentially in a workspace that allows Node child-process spawning and TypeScript incremental output:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

The prior DSH audit environment produced `spawn EPERM` and `tsconfig.tsbuildinfo EPERM`; those are not product failures and are not acceptable substitutes for a clean verification run.

- [ ] **Step 6: Run GitNexus change detection and code review**

Confirm only expected Product, commerce, media, Admin auth, seed, docs, and operations flows changed. Request an independent code review before merge.

- [ ] **Step 7: Commit final verification evidence**

```text
git add scripts/verify-blueprint-remediation.ts tests/verifyBlueprintRemediation.test.ts docs/operations/blueprint-v3-1-1-remediation-status.md
git commit -m "test: verify blueprint remediation readiness"
```

## Plan Self-Review

- **Spec coverage:** Every placeholder producer plus existing database rows, fail-closed `/go` and CTA behavior, seed allowlisting, write-action auth including the specification action factory, separated commerce entities, legacy-policy DTO parity, conditional PostgreSQL harnesses, migration compatibility, media provenance, misleading imagery, opaque sentiment, backup semantics, documentation drift, and final verification each map to an explicit task.
- **Scope discipline:** Autonomous AI, realtime crawling, final VPS deployment, full Evidence, PriceHistory analytics UI, broad Admin modules, and deleting `AffiliateLink` are excluded.
- **Migration safety:** Commerce and media schema work is additive. Legacy `AffiliateLink` and `Product.image_url` remain until compatibility and parity evidence permit a later removal plan.
- **Type consistency:** Tasks 5–8 share `CommerceOfferCandidate` and repository/compatibility interfaces; Tasks 9–10 share MediaAsset enums and `evaluateProductMediaUsage()`; Task 14 consumes the verification outputs defined earlier.
- **No hidden production claim:** The plan distinguishes implementation evidence from final rollout authorization and keeps Vercel/Neon classified as validation infrastructure.

## Dependency for the AI Import Plan

`docs/superpowers/plans/2026-09-05-ai-assisted-product-import.md` remains unapproved for implementation and must not be edited into execution-ready status until Tasks 2–10 of this plan are complete and accepted with repository tests, conditional PostgreSQL migration/backfill evidence, fail-closed redirect/CTA evidence, no active placeholder destinations, and MediaAsset usage-policy evidence. After that gate, revise the AI plan for `Product.image_url` compatibility, Direct Brand → Impact → Awin → Amazon fallback order, explicit UNVERIFIED acknowledgements, and free-text telemetry redaction, then submit it for a separate review.
