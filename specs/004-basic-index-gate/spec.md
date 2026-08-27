# Feature Specification: P0-A3 Basic Index Gate

**Feature Branch**: `[004-basic-index-gate]`

**Created**: 2026-08-25

**Status**: Approved for planning on 2026-08-25 — implementation remains unapproved

**Input**: Complete the remaining P0-A public-safety blocker by separating database existence, public eligibility, search indexability, listing eligibility, sitemap eligibility, and commerce eligibility through one canonical Basic Index Gate.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prevent unpublished products from becoming public or indexable (Priority: P1)

As the site operator, I need every new product to begin unpublished and non-indexable so that creating or importing a database record cannot accidentally expose unfinished content to users or search engines.

**Why this priority**: This is the core production-safety invariant from Blueprint V3.1.1: database existence must not imply publication or index eligibility.

**Independent Test**: Create a product without an explicit publishing decision and verify that it is absent from public listings and the sitemap, its detail URL is unavailable, and its commerce redirect is unavailable.

**Acceptance Scenarios**:

1. **Given** a newly created Product, **When** no publishing action has occurred, **Then** it is in `DRAFT` state and is explicitly non-indexable.
2. **Given** a `DRAFT`, `BLOCKED`, or `ARCHIVED` Product, **When** its public detail URL is requested, **Then** the response is not found and no product structured data is rendered.
3. **Given** a `DRAFT`, `BLOCKED`, or `ARCHIVED` Product, **When** its commerce redirect URL is requested, **Then** the response is HTTP 404 with no merchant `Location`, no click UUID generation, no Redis call, no Click insert, and no tracking-URL mutation.
4. **Given** a non-public Product whose index flag is true because of malformed or legacy data, **When** the gate evaluates it, **Then** lifecycle state still prevents public, listing, sitemap, index, and commerce eligibility.
5. **Given** the active seed path creates Products, **When** seed execution completes, **Then** every created Product is `DRAFT + non-indexable`.
6. **Given** the legacy destructive JavaScript seed path, **When** repository files and operational references are audited, **Then** `prisma/seed.js` does not exist and no package script, source import, executable/configuration reference, or operational instruction targets it; historical specification/review documentation may retain the filename as audit evidence.

---

### User Story 2 - Publish and unpublish products safely from Admin (Priority: P1)

As an authenticated administrator, I need compact publishing controls on the product list so that I can change lifecycle and index state deliberately without using database tools or a full product editor.

**Why this priority**: A fail-closed gate needs an operational way to activate, de-index, block, or archive a Product safely.

**Independent Test**: Change one Product through each lifecycle/index combination from Admin and verify the saved state, effective eligibility badges, redirect-after-save behavior, and public outcomes.

**Acceptance Scenarios**:

1. **Given** an Admin product row, **When** the administrator saves `ACTIVE` with indexing disabled, **Then** the Product is publicly accessible by direct URL but absent from listings and sitemap.
2. **Given** an `ACTIVE` Product, **When** the administrator enables indexing, **Then** it becomes eligible for listings, sitemap, and indexable metadata.
3. **Given** an indexed `ACTIVE` Product, **When** a lifecycle command changes it to `DRAFT`, `BLOCKED`, or `ARCHIVED`, **Then** indexing is normalized to false in the same saved transition.
4. **Given** a non-`ACTIVE` Product, **When** an explicit enable-index command is submitted, **Then** the command is rejected and no state changes.
5. **Given** any Product, including malformed legacy `DRAFT + indexable` data, **When** a lifecycle command sets it to `ACTIVE`, **Then** the persisted result is always `ACTIVE + non-indexable` until a separate enable-index command succeeds.
6. **Given** an `ACTIVE` Product, **When** an explicit disable-index command is submitted, **Then** lifecycle remains `ACTIVE` and indexing becomes false.
7. **Given** a successful command, **When** the Admin action completes, **Then** it performs a full-page redirect and the next Admin read shows current database state.

---

### User Story 3 - Keep every public discovery surface consistent (Priority: P1)

As a visitor or crawler, I need detail pages, robots directives, homepage/category listings, canonical URLs, sitemap entries, and commerce redirects to agree on a Product's effective eligibility.

**Why this priority**: Contradictory public surfaces can expose blocked content, leak draft records, or tell search engines to index pages that listings and operators consider unpublished.

**Independent Test**: Evaluate the full state matrix and verify every public surface produces the expected result from the same canonical policy.

**Acceptance Scenarios**:

1. **Given** `ACTIVE + non-indexable`, **When** the detail page is requested, **Then** it renders with `noindex, follow`, a canonical product URL, and truthful Product structured data.
2. **Given** `ACTIVE + indexable`, **When** the detail page is requested, **Then** it renders with `index, follow`, the canonical product URL, and truthful Product structured data.
3. **Given** `ACTIVE + non-indexable`, **When** homepage, category, and sitemap eligibility are evaluated, **Then** the Product is excluded from all three.
4. **Given** `ACTIVE + indexable`, **When** homepage, category, and sitemap eligibility are evaluated, **Then** the Product is eligible for all three.
5. **Given** `ACTIVE + non-indexable`, **When** the commerce redirect is requested, **Then** the existing commerce flow remains eligible.
6. **Given** any non-public lifecycle state, **When** metadata and body rendering occur during one request, **Then** both resolve the Product as unavailable from the same access decision.
7. **Given** a public Product, **When** metadata and body rendering occur during one request, **Then** both consume one shared Product-page data result containing one Product/AffiliateLink snapshot, one lifecycle/index decision, one evaluation timestamp, and one offer presentation; neither consumer independently reloads or reevaluates these values.
8. **Given** either metadata or page body is the first consumer to obtain the shared Product-page result, **When** lifecycle or AffiliateLink data changes before the other consumer resolves, **Then** both consumers use the same original result version and evaluation timestamp for that render, while the next separate request observes the changed database state.

---

### User Story 4 - Generate only current, deterministic sitemap entries (Priority: P1)

As a search crawler, I need the sitemap to contain only currently eligible Product URLs, using the same canonical origin and path policy as Product metadata.

**Why this priority**: Sitemap inclusion is an explicit Basic Index Gate acceptance requirement and must not remain stale after an operational state change.

**Independent Test**: Request the sitemap before and after indexing, blocking, or archiving a Product and verify deterministic entries without cache invalidation dependencies.

**Acceptance Scenarios**:

1. **Given** no Product is both `ACTIVE` and indexable, **When** the sitemap is requested, **Then** it returns a valid empty Product entry list.
2. **Given** one eligible Product, **When** the sitemap is requested, **Then** it contains exactly that canonical Product URL and its real last-updated timestamp.
3. **Given** multiple eligible Products, **When** the sitemap is requested repeatedly without data changes, **Then** entries are ordered deterministically by slug.
4. **Given** an eligible Product becomes blocked, archived, draft, or non-indexable, **When** the next sitemap request occurs, **Then** its URL is absent without requiring sitemap cache invalidation.
5. **Given** canonical-origin configuration is invalid or the Product query fails, **When** the sitemap is requested, **Then** generation fails visibly rather than emitting request-host URLs, stale entries, or a fabricated empty result.

---

### User Story 5 - Establish migration history without losing the populated database (Priority: P1)

As the operator, I need the existing unmanaged database to enter a reproducible migration chain without reset, data loss, or a misleading declaration that incompatible schema is already managed.

**Why this priority**: The configured database already contains the application schema and 20 Products but has no migration history. Feature migration cannot be considered safe until the existing state is baselined and verified.

**Independent Test**: Prove that a clean database can apply baseline plus P0-A3 in sequence and that the populated database can register the compatible baseline and apply only P0-A3 while preserving all existing records and relationships.

**Acceptance Scenarios**:

1. **Given** the populated unmanaged database, **When** baseline compatibility has not been proven, **Then** no baseline is marked applied and no feature migration is attempted.
2. **Given** an unexplained database-only object or destructive drift, **When** compatibility verification runs, **Then** migration work stops for explicit review.
3. **Given** a verified compatible baseline, **When** it is registered on the populated database, **Then** baseline DDL is not re-executed against existing objects.
4. **Given** a clean database, **When** baseline and P0-A3 migrations run in order, **Then** the target schema is reproduced without manual schema synchronization.
5. **Given** a deterministic pre-migration snapshot of keyed identities and foreign-key mappings, **When** the P0-A3 migration runs on the populated database, **Then** all 20 existing Products become `ACTIVE + non-indexable` and every snapshotted key-to-parent mapping remains exactly equal after migration.
6. **Given** post-migration state, **When** a new Product is created without explicit lifecycle/index values, **Then** it defaults to `DRAFT + non-indexable`.
7. **Given** a clean database, **When** the baseline is applied, **Then** both existing ProductAttribute partial unique indexes are created and enforce their null-scoped uniqueness invariants.
8. **Given** the live database object inventory, **When** every object is classified, **Then** the only application-owned database-only objects are the two known partial unique indexes and unexplained drift count is zero.

### Edge Cases

- A legacy or malformed Product has `is_indexed=true` while lifecycle is `DRAFT`, `BLOCKED`, or `ARCHIVED`; lifecycle must win.
- A Product changes from indexed `ACTIVE` directly to a non-public state; indexing must clear atomically.
- A malformed legacy Product is `DRAFT + indexable` and receives a set-lifecycle-`ACTIVE` command; the persisted result must be `ACTIVE + non-indexable` until a separate enable-index command succeeds.
- Metadata resolution occurs before body rendering; both must still reuse the same request-scoped Product snapshot and decision.
- A non-public Product must be rejected before loading specifications or deriving public offer presentation.
- A public non-indexable Product may have a current offer; it remains truthful and commerce eligible but excluded from listings and sitemap.
- The canonical-origin setting is undefined, empty, or whitespace-only; the production origin is used.
- An explicit origin contains a path, query, fragment, credentials, missing protocol, or unsupported protocol; configuration fails.
- An explicit origin contains a valid custom port; it is accepted for local or staging use.
- A raw persisted Product slug contains a space, Unicode, `%`, `/`, or `?`; metadata and sitemap must both use `/products/${encodeURIComponent(rawPersistedSlug)}` exactly once, without case normalization or a trailing slash.
- Sitemap has zero Product entries; the endpoint remains valid and does not add unrelated URLs merely to avoid emptiness.
- Sitemap data access fails; the error is not converted into an empty sitemap.
- The Admin transition succeeds while homepage content is cached; homepage invalidation makes the next rendered version use current eligibility.
- Product category, detail, sitemap, and Admin surfaces are request-time reads and must not depend on explicit cache invalidation.
- The live database contains manually created indexes or constraints not represented in the application schema; they must be inventoried before baseline registration.
- Clean-database migration succeeds but any populated-database keyed identity, foreign-key mapping, row count, or orphan count changes unexpectedly; the migration is considered failed.

## Closed Policy Decisions

### Lifecycle normalization and explicit index commands

Publishing mutations use separate command meanings rather than treating lifecycle and indexing as an unconstrained combined state:

| Command | Preconditions | Persisted result |
|---|---|---|
| Set lifecycle to `DRAFT` | Product exists | `DRAFT + non-indexable` |
| Set lifecycle to `BLOCKED` | Product exists | `BLOCKED + non-indexable` |
| Set lifecycle to `ARCHIVED` | Product exists | `ARCHIVED + non-indexable` |
| Set lifecycle to `ACTIVE` | Product exists | `ACTIVE + non-indexable`, regardless of the previously stored index flag |
| Enable index | Current effective lifecycle is `ACTIVE` | `ACTIVE + indexable` |
| Enable index | Current effective lifecycle is non-`ACTIVE` | Reject with no write |
| Disable index | Product exists | Preserve lifecycle and persist non-indexable |

A lifecycle command leaving `ACTIVE` is a normalization operation and MUST clear a previously true index flag. It is not treated as an invalid combined submission. By contrast, an explicit enable-index command against a non-`ACTIVE` Product is invalid and MUST be rejected.

### Closed access-decision reason set and precedence

The canonical gate returns exactly one reason from this closed set:

```text
draft
blocked
archived
explicit-noindex
eligible
```

Precedence is fixed:

| Priority | Product state | Decision reason |
|---:|---|---|
| 1 | Lifecycle is `DRAFT`, regardless of index flag | `draft` |
| 2 | Lifecycle is `BLOCKED`, regardless of index flag | `blocked` |
| 3 | Lifecycle is `ARCHIVED`, regardless of index flag | `archived` |
| 4 | Lifecycle is `ACTIVE` and index flag is false | `explicit-noindex` |
| 5 | Lifecycle is `ACTIVE` and index flag is true | `eligible` |

Lifecycle always wins over a conflicting legacy index flag. No consumer may invent additional reason strings or reinterpret precedence.

A missing Product is not a Product Access Decision and MUST NOT receive one of these reasons. It is a separate lookup outcome:

```text
Product lookup
├─ missing     → no Product gate evaluation; public not-found outcome
└─ found       → evaluate the closed Product access decision
```

The closed reason set applies only after a Product record has been found.

### Exact canonical Product path

Metadata and sitemap use one exact Product path contract:

```text
/products/${encodeURIComponent(rawPersistedSlug)}
```

Normative rules:

- prefix is exactly `/products/`;
- the raw persisted slug is percent-encoded exactly once;
- no trailing slash is added;
- no case normalization is performed;
- origin parsing and Product-path construction are separate operations;
- metadata and sitemap use the same builder and therefore produce byte-for-byte identical canonical Product URLs;
- constructing a Product URL does not mutate the supplied canonical-origin value.

Acceptance covers a normal slug, spaces, Unicode, `%`, `/`, `?`, a local origin with a port, and non-mutation of the supplied origin. This feature does not redesign slug validation or collision handling.

### Baseline database-object classification

The read-only pre-spec audit found:

- ten application tables matching the active data model;
- four application enum types matching the active data model;
- primary keys, foreign keys, ordinary unique indexes, and ordinary secondary indexes represented by the active data model;
- no application views, materialized views, sequences, routines, or triggers;
- only the standard `plpgsql` extension, which is database infrastructure rather than an application-owned object;
- two application-owned partial unique indexes that are present in the live database but cannot be represented by the active data-model language.

The two database-only partial unique indexes are:

```text
product_attributes_product_attribute_unique
  unique (product_id, attribute_definition_id)
  where variant_id is null

product_attributes_variant_attribute_unique
  unique (variant_id, attribute_definition_id)
  where variant_id is not null
```

They MUST be included explicitly in the baseline migration and verified after clean-database migration. The prior standalone manual SQL file is not an acceptable substitute for inclusion in migration history.

A live-database-to-active-model comparison reported no representable schema difference; this does not classify or reproduce unsupported partial indexes, so the explicit inventory above remains authoritative.

## Requirements *(mandatory)*

### Functional Requirements

#### Canonical lifecycle and access policy

- **FR-001**: The system MUST represent Product lifecycle with exactly `DRAFT`, `ACTIVE`, `BLOCKED`, and `ARCHIVED` states for this P0 scope.
- **FR-002**: A newly created Product MUST default to `DRAFT` and explicitly non-indexable.
- **FR-003**: `DRAFT`, `BLOCKED`, and `ARCHIVED` Products MUST be non-public, non-indexable, listing-ineligible, sitemap-ineligible, and commerce-ineligible.
- **FR-004**: An `ACTIVE` non-indexable Product MUST be public and commerce eligible but listing-ineligible and sitemap-ineligible.
- **FR-005**: An `ACTIVE` indexable Product MUST be public, indexable, listing eligible, sitemap eligible, and commerce eligible.
- **FR-006**: Lifecycle state MUST take precedence over a conflicting index flag.
- **FR-007**: One canonical decision contract MUST expose public, index, listing, sitemap/commerce implications and exactly one reason from the closed set `draft`, `blocked`, `archived`, `explicit-noindex`, or `eligible`.
- **FR-007A**: Decision precedence MUST evaluate lifecycle first (`DRAFT`, then `BLOCKED`, then `ARCHIVED`) and evaluate the explicit index flag only for `ACTIVE`; consumers MUST NOT introduce additional reasons or precedence.
- **FR-007B**: A missing Product MUST be represented as a lookup outcome outside the Product access gate and MUST NOT receive a Product access-decision reason; metadata, detail, and commerce must share that missing lookup result while retaining their separately approved response behavior.
- **FR-008**: Homepage, category, sitemap, detail, metadata, commerce, and Admin effective-state presentation MUST follow the same canonical policy.

#### Public detail and metadata

- **FR-009**: Missing and non-public Products MUST produce not-found public detail behavior.
- **FR-010**: Missing and non-public Products MUST NOT render Product structured data or load additional public-only Product specifications.
- **FR-011**: Public non-indexable Products MUST render `noindex, follow` metadata.
- **FR-012**: Public indexable Products MUST render `index, follow` metadata.
- **FR-013**: Every public Product page MUST expose a canonical URL derived from the shared canonical-origin policy.
- **FR-014**: Public Product metadata and page body for one render MUST consume one shared Product-page data result containing one Product/AffiliateLink snapshot, one access decision, one evaluation timestamp, and one offer presentation; neither consumer may independently reload or reevaluate those values.
- **FR-014A**: Whichever of metadata or page body first obtains the shared result, if underlying lifecycle or AffiliateLink data changes before the other consumer resolves, both consumers MUST retain the same original result version and evaluation timestamp for that render, while the next separate request MUST observe the changed state.
- **FR-015**: The shared Product-page result MUST preserve P0-A2's single freshness clock and canonical offer presentation.
- **FR-016**: Product metadata title MUST equal `product.name`; description MUST equal the trimmed non-empty `product.description`, falling back exactly to `product.name` when description is missing, empty, or whitespace-only. No additional social or search copy may be fabricated.
- **FR-017**: Public non-indexable Products MAY retain truthful Product structured data; Offer data remains governed by P0-A2 freshness, price, and availability eligibility.

#### Listings and sitemap

- **FR-018**: Homepage and category Product listings MUST include only `ACTIVE + indexable` Products.
- **FR-019**: Homepage MUST retain its bounded cached-rendering policy and MUST be explicitly invalidated after a successful publishing transition.
- **FR-020**: Category Product reads MUST occur at request time and MUST NOT retain a contradictory time-based revalidation contract.
- **FR-021**: Sitemap Product reads MUST occur at request time.
- **FR-022**: Sitemap MUST contain only `ACTIVE + indexable` Products.
- **FR-023**: Sitemap entries MUST be ordered deterministically by slug.
- **FR-024**: Each sitemap Product entry MUST contain the shared canonical Product URL and the Product's real last-updated timestamp.
- **FR-025**: Sitemap MUST NOT invent priority or change-frequency values.
- **FR-026**: An empty eligible Product set MUST produce a valid empty Product sitemap.
- **FR-027**: Canonical-origin or sitemap data errors MUST fail visibly rather than falling back to request host, stale data, or a fabricated empty list.

#### Canonical origin

- **FR-028**: Canonical-origin parsing MUST be shared by metadata and sitemap behavior.
- **FR-029**: An absent, empty, or whitespace-only origin setting MUST use `https://deskholt.com`.
- **FR-030**: An explicit origin MUST use HTTP or HTTPS, include a hostname, contain no credentials, and contain no path beyond `/`, query, or fragment.
- **FR-031**: An explicit origin MAY include a port.
- **FR-032**: Malformed explicit origin configuration MUST fail rather than being normalized into a different meaning.
- **FR-033**: Product canonical paths MUST be exactly `/products/${encodeURIComponent(rawPersistedSlug)}`: exact `/products/` prefix, raw persisted slug percent-encoded exactly once, no trailing slash, and no case normalization.
- **FR-033A**: Metadata and sitemap MUST use the same canonical Product URL builder, MUST produce byte-for-byte identical URLs for the same Product/origin, and MUST NOT mutate the supplied origin value.
- **FR-034**: Non-production deployments that require a distinct canonical origin MUST provide an explicit valid origin; otherwise they intentionally canonicalize to production.

#### Commerce eligibility

- **FR-035**: Commerce eligibility MUST be evaluated before click identifier generation, persistence, or merchant redirect.
- **FR-036**: `DRAFT`, `BLOCKED`, and `ARCHIVED` commerce requests MUST return HTTP 404 with no merchant `Location`, no click UUID generation, no Redis call, no Click insert, and no tracking-URL mutation.
- **FR-037**: `ACTIVE + non-indexable` and `ACTIVE + indexable` Products MUST remain eligible for the existing commerce flow.
- **FR-038**: Missing Product and unavailable affiliate-link behavior outside lifecycle eligibility MUST remain unchanged in this feature.
- **FR-039**: Click retry, timeout, idempotency, queue, and persistence failure semantics MUST remain outside this feature.

#### Admin publishing controls

- **FR-040**: The Admin product list MUST show lifecycle state, explicit index state, and effective gate state for each Product.
- **FR-041**: Each Product row MUST expose lifecycle commands separately from explicit enable-index and disable-index commands.
- **FR-042**: A lifecycle command moving a Product away from `ACTIVE` MUST normalize indexing to false in the same atomic transition, even if indexing was previously true.
- **FR-043**: A lifecycle command setting a Product to `ACTIVE` MUST always persist `ACTIVE + non-indexable`, regardless of its previous lifecycle or stored index flag; only a later explicit enable-index command may produce `ACTIVE + indexable`.
- **FR-044**: An explicit enable-index command MUST succeed only when the Product's effective lifecycle is `ACTIVE`; otherwise it MUST be rejected with no write.
- **FR-044A**: An explicit disable-index command MUST preserve lifecycle and set indexing to false.
- **FR-044B**: Publishing persistence MUST be concurrency-safe under PostgreSQL `READ COMMITTED`: enable-index MUST use an active-only atomic conditional write, disable-index MUST NOT rewrite lifecycle, and no stale full-row write may overwrite a concurrent lifecycle transition.
- **FR-045**: Successful Admin mutations MUST use save-then-redirect behavior and the redirected page MUST reflect current database state.
- **FR-046**: A successful publishing transition MUST invalidate only the cached homepage surface; request-time Product, category, sitemap, and Admin surfaces MUST not require invalidation.
- **FR-047**: This feature MUST NOT introduce bulk publishing, optimistic save, role hierarchy, approval workflow, or a full Product editor.

#### Migration and data preservation

- **FR-048**: The project MUST establish a version-controlled baseline representing the complete pre-P0-A3 application schema before introducing the feature migration.
- **FR-049**: The baseline and P0-A3 changes MUST exist as separate, auditable migration steps.
- **FR-050**: The populated database MUST NOT be reset, recreated, or synchronized through a non-migration schema push.
- **FR-051**: Baseline registration on the populated database MUST occur only after compatibility verification and MUST NOT execute baseline DDL against existing objects.
- **FR-052**: Compatibility verification MUST classify all live tables, enums, indexes, constraints, views, materialized views, sequences, routines, triggers, extensions, columns, and defaults as data-model represented, application-owned database-only, database infrastructure, or unexplained drift; unexplained drift MUST block baseline registration.
- **FR-052A**: The baseline migration MUST explicitly create the two existing ProductAttribute partial unique indexes with their current names, columns, and null predicates.
- **FR-052B**: Clean-database verification MUST assert that both partial unique indexes exist and enforce product-level and variant-level uniqueness after baseline application.
- **FR-052C**: The standard `plpgsql` extension MUST be classified as database infrastructure and MUST NOT be misrepresented as a P0-A3 application feature.
- **FR-053**: A clean database MUST reproduce the target schema by applying baseline followed by P0-A3 migration.
- **FR-054**: The populated database MUST apply only the P0-A3 migration after baseline registration.
- **FR-055**: Existing Products MUST be backfilled to `ACTIVE + non-indexable`.
- **FR-055A**: The P0-A3 feature migration MUST manually encode the approved backfill and place all feature enum/DDL/backfill statements inside one explicit PostgreSQL transaction; an intentional-failure fixture MUST prove complete rollback before populated deployment.
- **FR-056**: Migration preservation authority MUST be a deterministic execution-time snapshot or checksum that compares row counts, orphan counts, and exact sorted keyed mappings—not relationship counts alone.
- **FR-056A**: The pre/post preservation comparison MUST include at least `Product.id ↔ slug`, `AffiliateLink.id → product_id`, `Click.id/click_id → product_id`, Conversion-to-Click foreign-key linkage, `ProductVariant.id → product_id`, and `ProductAttribute.id → product_id/variant_id`.
- **FR-056B**: Every mapped key and foreign-key target MUST be exactly equal before and after migration except for the intended Product lifecycle/index backfill; equal aggregate counts do not satisfy preservation by themselves.
- **FR-057**: Migration status MUST report the clean and populated databases as current after their respective paths complete.

#### Seed and scope safety

- **FR-058**: The active seed entry point MUST create Products as `DRAFT + non-indexable` and MUST remove its current explicit auto-index behavior and comments authorizing temporary indexing.
- **FR-059**: The legacy duplicate JavaScript seed entry point MUST be removed because it is destructive, auto-indexes Products, lacks the active seed's production guard, and is not referenced by the package seed command.
- **FR-059A**: Automated acceptance checks MUST prove that the active seed cannot create an indexable Product, `prisma/seed.js` does not exist, and no package script, source import, executable/configuration reference, or operational instruction targets the removed file. Historical specification/review documentation may mention it as audit evidence.
- **FR-060**: This feature MUST NOT add advanced content-quality, image, source-coverage, specification-completeness, duplicate-risk, or merchant-availability gates.
- **FR-061**: This feature MUST NOT implement click-persistence redesign, broader seed allowlisting/opt-in policy, crawler operations, or middleware/proxy migration. Inclusion and verification of the two already-existing partial unique indexes in the baseline is required and is not considered a broader index redesign.

### Key Entities

- **Product**: A catalog record with lifecycle state, explicit index decision, stable identity, slug, category, content, affiliate links, and update timestamp.
- **Product Lifecycle State**: One mutually exclusive state—`DRAFT`, `ACTIVE`, `BLOCKED`, or `ARCHIVED`—that controls public and commerce eligibility.
- **Product Access Decision**: The canonical derived result describing public, index, listing, sitemap, commerce, robots, and one closed reason outcome with lifecycle-first precedence.
- **Publishing Command**: One explicit mutation intent: set lifecycle, enable index, or disable index. Lifecycle normalization and index enablement are not an unconstrained combined write.
- **Canonical Origin**: A validated origin used consistently for metadata and sitemap Product URLs.
- **Sitemap Product Entry**: A deterministic representation of one index-eligible Product URL and its real update timestamp.
- **Publishing Transition**: An authenticated Admin mutation that changes lifecycle/index state while enforcing invariants atomically.
- **Migration Baseline**: The version-controlled representation of the application's schema immediately before P0-A3, registered only after live compatibility is proven.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly created Products are unavailable publicly and absent from listings/sitemap until explicitly activated.
- **SC-002**: Across all eight lifecycle/index combinations, 100% of public, robots, listing, sitemap, commerce, and closed-reason outcomes match the approved precedence matrix.
- **SC-002A**: Lifecycle commands, enable-index commands, and disable-index commands pass 100% of the normalization/rejection cases in the approved command table.
- **SC-002B**: Deterministic PostgreSQL concurrency acceptance proves enable-index cannot overwrite concurrent `DRAFT`, `BLOCKED`, or `ARCHIVED` transitions and disable-index cannot restore a stale lifecycle; zero lost lifecycle transitions occur.
- **SC-003**: Race-oriented acceptance proves metadata and body consume one shared Product-page result regardless of consumer order: a lifecycle or AffiliateLink mutation after the first consumer obtains it but before the second resolves changes neither consumer's result version/evaluation timestamp for that render, and the next separate request observes the mutation.
- **SC-003A**: Instrumentation or an equivalent deterministic test records exactly one Product/AffiliateLink database load and one access/offer evaluation for metadata plus body within a single render.
- **SC-004**: 100% of non-public commerce requests stop before click generation, persistence, and merchant redirect.
- **SC-005**: After migration, all 20 existing Products remain present with unchanged identities/slugs and are `ACTIVE + non-indexable`.
- **SC-006**: After migration, homepage and category Product listings contain zero Products, direct URLs for the 20 active Products remain available with noindex metadata, and Product sitemap entries total zero.
- **SC-007**: After an administrator indexes one active Product, the next homepage render after invalidation, next category request, and next sitemap request consistently include that Product.
- **SC-008**: After an administrator blocks or archives that Product, its next detail and commerce requests return not found and its next category/sitemap reads exclude it.
- **SC-009**: Repeated sitemap requests over unchanged data produce identical slug ordering and canonical URLs.
- **SC-010**: All accepted canonical-origin inputs produce one normalized origin; all explicitly malformed inputs are rejected in 100% of specified validation cases.
- **SC-010A**: Canonical-path tests for normal, space, Unicode, `%`, `/`, and `?` slugs plus a local origin with port produce the exact once-encoded `/products/` path in metadata and sitemap, with no trailing slash, case normalization, double encoding, or origin mutation.
- **SC-011**: A clean database reaches the target schema by applying exactly baseline then P0-A3 migration without manual schema synchronization.
- **SC-011A**: Clean-database baseline verification finds both named partial unique indexes and proves: duplicate `(product_id, attribute_definition_id)` with `variant_id IS NULL` is rejected; the same attribute on different non-null variants is allowed; duplicate `(variant_id, attribute_definition_id)` for the same non-null variant is rejected.
- **SC-011B**: A disposable intentional-failure run after the P0-A3 backfill but before commit leaves no ProductStatus enum/column/default/data change, proving the explicit feature transaction rolls back completely.
- **SC-012**: The populated database reaches the target schema without reset, record loss, baseline DDL execution, or any difference in the required sorted keyed-relationship snapshot other than intended Product lifecycle/index values.
- **SC-012A**: Every audited live database object is classified; unexplained database-only object count is zero before baseline registration.
- **SC-013**: Automated acceptance coverage passes for lifecycle/reason matrix, command normalization, metadata, canonical origin, listings, sitemap, commerce eligibility, migration defaults/backfill, partial indexes, seed behavior, and preservation checks.
- **SC-014**: Repository-wide lint, type validation, automated tests, and production build complete successfully before the feature is considered complete.
- **SC-015**: Production route evidence shows category, Product detail, and sitemap are request-time rendered, while homepage retains its bounded cached-rendering policy.
- **SC-016**: The active seed creates zero indexable Products, `prisma/seed.js` does not exist, and operational-reference scans find zero package scripts, source imports, executable/configuration references, or operational instructions targeting it; historical planning/review mentions are excluded.

## Assumptions

- P0-A1 Admin authentication fail-closed and P0-A2 structured-data truthfulness remain authoritative and must not regress.
- Existing Admin authentication applies to the new publishing mutation; no role hierarchy or approval workflow is introduced.
- The configured populated PostgreSQL database currently contains 20 Products and no Prisma migration history.
- Existing Products are intentionally preserved as public-by-direct-URL but non-indexable after migration.
- An empty homepage/category Product listing and empty Product sitemap immediately after migration are intentional fail-closed outcomes.
- The sitemap in this bounded feature contains Product entries only; unrelated static/legal/category URLs are not added merely to avoid an empty result.
- `https://deskholt.com` is the accepted fallback canonical origin. Local, preview, or staging environments needing another origin must configure one explicitly.
- Commerce eligibility is separate from search indexability: an `ACTIVE + non-indexable` Product may redirect to a merchant.
- Existing missing-Product and unavailable-affiliate-link fallbacks remain unchanged except where non-public lifecycle eligibility explicitly requires not-found behavior.
- Homepage is the only server-rendered surface requiring explicit invalidation after a publishing transition.
- Category, Product detail, sitemap, and Admin product list are request-time reads.
- The live database audit identified exactly two application-owned database-only objects: the existing ProductAttribute partial unique indexes. They are incorporated into the baseline in this feature; broader partial-index work is not added.
- The active package seed command uses `prisma/seed.ts`; the unreferenced destructive `prisma/seed.js` is legacy and will be removed.
- Advanced Index Gate, P0-B click persistence, and broader seed allowlisting/explicit-opt-in safety remain separate later P0 tasks.
