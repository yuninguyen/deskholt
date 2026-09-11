# Claiks remediation and future Amazon API handoff

## Authority and scope

This handoff records user decisions from the current session. It is not execution authorization for future API integration, publishing, migrations, or governance changes. Re-check live state before any mutation.

## Local target and completed remediation

- Workspace: `C:\laragon\www\deskholt`
- Database used: `localhost/deskholt_db` (never assume future localhost config still targets this database).
- Product: `claiks-standing-desk-rustic-brown`
- Product ID: `cmtf2u5l70011smw2mpc9450n`
- Amazon ASIN: `B0BZ7GXM4M`
- Variant: 48x24, Rustic Brown; ID `cmtf2u5l90013smw2u837ewc4`.
- Last verified lifecycle: `DRAFT`, `is_indexed=false`.

User-authorized ProductAttribute remediation was executed in guarded Serializable transactions:

1. Updated `motor_count=1` and `warranty_months=18`, both `OTHER`, `LIKELY`, `verified_at=null`, source `https://standingdeskreference.com/desks/claiks-48x24/`.
   - Product/ASIN binding and source text were reported as directly checked by the user/reviewer, not independently fetched successfully by this assistant.
2. Deleted 13 rows across 10 keys: desktop_finish, certification_greenguard, certification_bifma, assembly_time_minutes, anti_collision, lifting_speed_in_s, noise_db, keyboard_tray_compatible, assembly_difficulty, stability_rating. The last three had Product and Variant rows. Count: 41 -> 28. User independently verified this batch.
3. After explicit user selection, deleted 7 previously held Manuals.plus-backed rows: memory_presets, leg_count, leg_design, frame_width_min_in, frame_width_max_in, crossbar, casters_compatible. Count: 28 -> 21. Fresh post-commit query verified 21 rows and no remaining Manuals.plus sources.

Remaining 21 rows:
- 13 baseline attributes: min_height_in, max_height_in, max_load_lb, product_weight_lb, desktop_thickness_in, adjustment_type, frame_material, desktop_shape, desktop_included, desktop_width_in, desktop_depth_in, desktop_material, frame_color.
- 2 updated OTHER/LIKELY rows: motor_count, warranty_months.
- 6 DERIVED rows: monitor_arm_compatible, dual_monitor_suitable, ultrawide_suitable, each at Product and Variant level, LIKELY.

No Product, AffiliateLink, Variant, image_url, code, or other product was intentionally mutated. Product image remains the old Unsplash stock URL. AffiliateLink remains the legacy Amazon ASIN link, tracking tag `deskholt-pending`, stored price 109.99. These are not proof of affiliate approval or current pricing.

## DERIVED policy — settled, do not reopen gratuitously

- Product-level: judgment applying to the whole Product, independent of configuration.
- Variant-level: configuration-specific judgment.
- Both may coexist intentionally; equal values are permitted, not mandated.
- No implicit Variant override, effective-value, or fallback semantics.
- Form targets are optional. Rendering both scopes does not require filling both.
- Keep the current model. No redesign, dedupe task, or automatic deletion merely for equal cross-scope values.
- The later deletions above were explicitly authorized evidence remediation, not a reversal of the scope policy.

## Manuals.plus and evidence cautions

User opted out of this source and explicitly authorized deleting the 7 held rows. Do not ask them to register/login again merely to finish this product.

HTTP 403 or a login prompt does NOT prove phishing, malware, or false specifications. Earlier assistant wording about security was too strong: safety was not established, nor was maliciousness established. Deleted values may be re-sourced later from suitable evidence with separate authorization.

Likewise, third-party origin alone does not rule out VERIFIED: Blueprint defines VERIFIED as checked against the cited source, not physical testing. LIKELY on the two replacement rows is the explicit chosen state, not a universal rule for third-party sources.

## Media — unresolved

User copied this candidate image URL directly from the Amazon listing:

`https://m.media-amazon.com/images/I/71LMMCG-7hL._AC_SL1500_.jpg`

- Not downloaded, converted, or assigned to Product.image_url.
- Access to a CDN URL is not permission to reuse it.
- Do not claim every Amazon image use is categorically prohibited. Applicable license/program terms or permission from a rights holder must establish the intended use.
- Unsplash stock is not an authenticated image of this Claiks model; do not present it as such on publication.
- Alternatives: owned photos, manufacturer/rightsholder permission, or officially supplied Amazon program content under applicable terms.
- No image change or publication currently authorized.

## Future Amazon Associates/API integration — deferred

User wants this remembered for when an Associates account/API access exists. No implementation plan or task execution is authorized now.

At that time:
1. Check current official Amazon documentation and which API the account is eligible to use. Do not assume account creation grants API access, or assume a historical API name, eligibility threshold, signing method, or cache TTL remains current.
2. Confirm marketplace, registered website, valid Associate tracking ID, credentials, API entitlement, and applicable content license.
3. Keep credentials server-side; never NEXT_PUBLIC, Git, browser bundles, or logs.
4. Use a narrowly scoped server adapter to look up ASIN B0BZ7GXM4M as the first case, with timeouts, quota handling, and explicit product/variant identity checks.
5. Do not overwrite reviewed specs, mark everything VERIFIED, publish automatically, or approve redirects merely because an API returned a URL.
6. Check permitted image hosting, resizing, proxying, caching, linking and refresh requirements. Next.js image optimization can proxy/transform/cache remote images; domain allowlisting alone does not establish license compliance. Do not default to downloading or WebP conversion.
7. Handle offer price/availability freshness under then-current terms. Legacy stored 109.99 is not a current price claim.
8. Integrate only with the approved commerce/affiliate model and gate scope. Amazon data integration is distinct from AI-assisted Product Import; it does not require or authorize opening AI import.

## Governance remains unchanged

- Gate B / RC5 Task 1 execution: PAUSED / not executed.
- SYSTEM P0: NOT VERIFIED COMPLETE.
- Tasks 5–10: BLOCKED.
- AI-assisted Product Import: BLOCKED.
- P3 scaling: BLOCKED.
- Production rollout/mutation: NOT AUTHORIZED.

Do not infer publication approval after resolving media or missing specifications. Reassess lifecycle, sources, affiliate eligibility and gates separately.

## Suggested next session

Read this handoff, establish cwd and sanitized database identity, and ask which objective the user authorizes. If they have Amazon API access, inspect current official program documentation before proposing a narrow integration plan. Otherwise keep Claiks DRAFT/noindex and leave its 21 rows and image untouched.

## ⚠️ Data-integrity warning — unexplained bulk write, 2026-09-07

A read-only forensic audit (2026-09-11) found that all 22 ProductAttribute rows for this Product currently carry evidence of a bulk write operation at `2026-09-07T09:50:37Z`:

- 14 rows (all VERIFIED-confidence) share the **exact same** `verified_at` timestamp down to the millisecond (`2026-09-07T09:50:37.206Z`) — this cannot result from independent manual saves through the Admin form, each of which would set `verified_at = now()` at a different moment.
- A new row, `noise_db = 45 dB` (source: Amazon `B0BZ7GXM4M`, RETAILER, VERIFIED), was inserted in the same event window and does not originate from `scripts/create-products-3to7-standing-desks.ts` (verified absent from that script).

**No audit trail exists to identify the source.** The database has no ActivityLog/audit table, no `pg_stat_statements`, and no change triggers. The operation cannot be attributed to any task authorized in the cross-agent session history reviewed so far.

**Consequence: the pre-2026-09-07 field values of the 21 previously-known rows cannot be verified as unchanged.** Content equality before/after this event cannot be proven from the database alone.

**Do not treat the current 22-row Claiks record as a finalized/audited baseline.** Before any publication decision:

1. Re-verify every VERIFIED-confidence row's value against its cited `source_url` directly (do not assume prior audit conclusions still hold).
2. Investigate whether this was a known script/tool run outside this session's authorized task history before assuming malicious or erroneous intent.
3. Treat this note as open until a future session either identifies the source or completes a full re-verification pass.
