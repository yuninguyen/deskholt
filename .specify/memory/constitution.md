<!--
Sync Impact Report
- Version change: (template) → 1.0.0 (initial ratification)
- Modified principles: n/a (first ratification)
- Added sections: Core Principles (I–VII), Additional Constraints, Development Workflow, Governance
- Removed sections: none
- Deferred TODOs: none — all placeholders resolved from project docs
-->

# Deskholt Constitution

## Core Principles

### I. Affiliate Data Integrity (NON-NEGOTIABLE)
`Product`, `AffiliateLink`, `Click`, and `Conversion` records are the site's core revenue
asset and MUST NOT be lost or corrupted. IP addresses MUST be stored only as
`SHA-256(IP + salt)` — raw IP addresses MUST NEVER be persisted. Blog content MUST
reference products via ID shortcode (e.g. `{{product:id}}`), never by copying price or
stock data inline, so rendered pages always reflect current DB state instead of going
stale when price/stock changes.
**Rationale:** click/conversion data is how the business gets paid; stale or lost data
directly costs revenue and breaks affiliate network reconciliation.

### II. Legal & Platform Compliance (NON-NEGOTIABLE)
Any page containing an affiliate link MUST carry an Affiliate Disclosure (site default or
per-post override). Advertising/attribution cookies MUST NOT be set before the user
consents, or before checking for a Global Privacy Control (GPC) signal. Amazon product
data MUST be entered manually or sourced via third-party API — direct HTML scraping of
Amazon is FORBIDDEN (Terms of Service violation, account-ban risk). Affiliate network API
keys MUST be encrypted with AES-256-GCM before being persisted to the database.
**Rationale:** violations here risk Amazon Associates account termination and state
privacy-law liability — both are existential risks to the business, not style preferences.

### III. Flat Permissions, No Role Hierarchy
The admin system MUST NOT implement Editor/Reviewer/Admin role distinctions or an
approval/pending state. Every authenticated account has equal permissions. Features MUST
be designed assuming any team member can publish, edit, or delete any content directly.
**Rationale:** the team is small (1–3 people) by deliberate choice; a review pipeline would
add friction with no corresponding benefit at this scale.

### IV. Save → Redirect, Never Silent AJAX Save
Every admin mutation (create/update/delete) MUST perform a full-page redirect via Server
Actions + `redirect()` after a successful save. Client-side AJAX-and-toast saves without a
redirect are FORBIDDEN in the admin area.
**Rationale:** guarantees the UI always reflects the latest server state and keeps save
behavior consistent and predictable across every admin module.

### V. No Thin pSEO Content
Every programmatically generated page (product, comparison, listicle) MUST include at
least one distinctive value element — real user sentiment, an interactive calculator, or
genuine photos/testing notes — not just templated text with the product name swapped.
Public-facing pages MUST be rendered via ISR/SSR; content required for SEO/AEO MUST NOT
depend on client-side fetching.
**Rationale:** search engines demote templated/duplicate content at scale; the whole
traffic strategy depends on being treated as a trustworthy, non-thin site.

### VI. Infrastructure Resilience
Database backups MUST be shipped off the VPS that runs production (e.g. to Google Drive or
object storage) on an automatic schedule, with old backups (>30 days) auto-deleted. Any
code path that computes `ipHash` or enforces rate limiting MUST assume Cloudflare sits in
front of Nginx and MUST rely on `ngx_http_realip_module` (via `CF-Connecting-IP`) — reading
`$remote_addr` directly without real-IP resolution is FORBIDDEN in that context.
**Rationale:** a same-VPS-only backup is lost in the same incident as production data; an
unresolved real IP silently breaks fraud prevention and privacy compliance at once.

### VII. Niche Separation by Audience/Intent
A new content vertical is added as a tag/filter on an existing site ONLY if it shares the
same target audience and search intent as that site (e.g. "Eco-friendly" on Deskholt). A
vertical with a different audience or intent MUST be built as a separate site, no matter
how topically related it seems (e.g. Steadylifeaids vs. Deskholt), and MUST NOT be merged
into an existing site's schema/categories.
**Rationale:** mixing unrelated audiences dilutes topical authority for SEO and confuses
site positioning — this call was made deliberately after evaluating alternatives (see
`Tong-hop-dinh-huong-Affiliate-Marketing.md` §2).

## Additional Constraints

- **Route Handler, not Middleware, for `/go/[slug]`**: Next.js Middleware runs on the Edge
  Runtime, which does not support the Node.js APIs `ioredis`/Prisma require. Affiliate
  redirect logic MUST live in a Route Handler (Node.js runtime), never in `middleware.ts`.
- **Entity Matching before multi-network price comparison**: products sold across multiple
  networks (Amazon/Walmart/Target/...) MUST be matched to a single `Product` record via
  UPC/EAN (or similarity matching when no shared code exists) before being shown in a price
  comparison table — otherwise the table will show duplicate or mismatched listings.
- **Automatic out-of-stock fallback**: when an `AffiliateLink.isInStock` flips to `false`,
  `/go/[slug]` MUST redirect to another in-stock network for the same product (by
  `priorityOrder`) instead of sending the user to an error or dead page.

## Development Workflow

Spec-kit governs feature work: `speckit-specify` → `speckit-plan` → `speckit-tasks` →
`speckit-implement`, per the auto-activation rule in `CLAUDE.md`. GitNexus impact analysis
(`gitnexus_impact`) MUST be run before editing any existing symbol, per `CLAUDE.md`. This
constitution takes precedence over implementation detail found in the planning docs at the
repo root (`DESKHOLT_FULL_SPECIFICATION.md`, `Admin_Panel_for_Deskholt.md`, etc.) — those
documents describe how features were designed; this document states what MUST always hold
true regardless of how a feature is implemented.

## Governance

This constitution supersedes conflicting guidance in any other project document. Amendments
require: (1) a stated reason, (2) a version bump per semantic versioning (MAJOR = principle
removed/redefined, MINOR = principle added, PATCH = wording/clarification), (3) updating
`Last Amended` below. Any PR or Server Action touching affiliate links, click tracking, or
the admin save flow SHOULD be checked against Principles I, II, IV, and VI before merging.

**Version**: 1.0.0 | **Ratified**: 2026-08-11 | **Last Amended**: 2026-08-11
