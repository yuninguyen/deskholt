# Unit Normalization (§17) — DEFERRED

**Decision record, not an implementation plan.** No code changes follow from this document.

## Question asked

Blueprint §17 states the principle "Editor nhập đúng unit của source; database lưu canonical unit" and gives metric examples (in → mm, lb → kg), with the note "Admin hiện tại đã có unit conversion" and "Không bắt editor tự quy đổi tay." This was flagged as a possible P1 gap: `ProductSpecificationsForm.tsx:32` shows `unit` only as a static label next to the input, with no conversion logic anywhere in `src/` — an editor entering a value must already know it in the canonical unit.

## Finding (verified by reading the code, not assumed)

`prisma/seed-standing-desk-attributes.ts` — the only real `AttributeDefinition` data in this project — defines the **canonical unit as imperial**, not metric: `min_height_in`/`max_height_in`/`max_load_lb`/`desktop_width_in`/`desktop_depth_in`/`lifting_speed_in_s` all use `in`, `lb`, `in/s` as their stored `unit`. This diverges from §17's own mm/kg example, but is the actual, deliberate V1-alpha canonical choice (matching the fact that US standing-desk manufacturer spec sheets are themselves published in inches/lbs).

Because the real-world source material (US manufacturer spec sheets) and the canonical unit are almost always the same unit system already, an editor typing a value from a spec sheet directly satisfies "editor nhập đúng unit của source" with **zero manual conversion** in the common case. The gap only exists for the edge case of a source spec sheet published in metric (e.g. an imported/European product listing cm or kg), forcing manual conversion by the editor.

No evidence exists that this edge case has actually occurred: all current Product/attribute data comes from seed scripts, not from a human typing values into `ProductSpecificationsForm` from a metric source sheet.

## Decision

**Defer.** Do not build a source-unit-selection + conversion mechanism now. This is the same "build ahead of validated need" pattern already declined for Group B-2 (Merchant/Offer) and Available Options — here applied to unit conversion instead of merchant/offer normalization or variant options.

User confirmed this choice explicitly (2026-08-29) after the corrected finding was presented alongside a narrower-scope alternative (in↔cm, lb↔kg conversion only).

## What would trigger revisiting this

A real product whose only available source specification is in metric (cm/kg or similar) needs to be entered via `ProductSpecificationsForm`, and the editor would otherwise have to hand-convert it. At that point, build only the specific unit pair(s) actually needed (e.g. cm→in, kg→lb), not a general-purpose unit conversion engine.

## SUPERSEDED (partial) — 2026-08-29

The trigger above occurred on the very first real product attempted under the §58 P2 dry run: ErGear EGESD5B (ASIN B0B41YH9B6) gives `Minimum Height` in inches and `Maximum Height` in centimeters on the same source table. See `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §70 (P2 Ontology Issue Log) for the full finding.

This defer decision is superseded **only for the in↔cm length pair**. A narrow conversion utility for that pair is being built (see `docs/superpowers/plans/2026-08-29-narrow-unit-conversion-and-material-enum.md`). All other unit pairs (e.g. lb↔kg) remain deferred until their own real-data trigger occurs — this is not a general reopening of unit-conversion scope.
