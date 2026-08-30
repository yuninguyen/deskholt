# Whitelist common Amazon image hosts for next/image

> **For agentic workers:** No TDD sub-skill needed — this is a config-only change with no application logic to unit test. Still use superpowers:using-git-worktrees to isolate the work.

**Goal:** Fix a real bug found by the user while manually testing the new Admin Create Product UI (`docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` — see the "Admin Create Product UI" follow-up work). The user pasted a real Amazon product image URL (`https://m.media-amazon.com/images/I/61ZR4GuC3FL._AC_SX679_.jpg`) into the Create Product form's Image URL field — completely legitimate, expected usage — and the public `/category/standing-desks` page crashed with:

```
Invalid src prop (https://m.media-amazon.com/images/I/61ZR4GuC3FL._AC_SX679_.jpg) on `next/image`,
hostname "m.media-amazon.com" is not configured under images in your `next.config.js`
```

`next.config.mjs` currently only whitelists `images.unsplash.com` (the shared stock-photo placeholder used by all prior products) — no real per-product image host has ever been used before, so this gap was never triggered until now.

## Required change

In `next.config.mjs`, add to `images.remotePatterns`:

```js
{ protocol: 'https', hostname: 'm.media-amazon.com' },
{ protocol: 'https', hostname: '**.ssl-images-amazon.com' },
```

- `m.media-amazon.com` — the exact host from the real error, Amazon's current primary product-image CDN.
- `**.ssl-images-amazon.com` — a wildcard covering Amazon's older/regional image CDN subdomains (`images-na.ssl-images-amazon.com`, `images-eu.ssl-images-amazon.com`, `images-fe.ssl-images-amazon.com`) that still appear on some product listings, per the user's explicit request to cover "several common Amazon hosts" proactively rather than adding them one crash at a time. Do not add hosts beyond these two entries (e.g. no generic `*.amazon.com` catch-all) — this is deliberately bounded to Amazon's known image-CDN patterns, not a general "allow any host" change.
- Do not change the existing `images.unsplash.com` entry or any other part of `next.config.mjs`.

## Global Constraints

- Only `next.config.mjs` changes.
- No application code, test, or script changes — this is a pure configuration fix.
- Verify by actually rendering an image from `m.media-amazon.com` in dev (or build), not just by reading the config.

---

### Task 1: Apply the config change and verify

**Files:** `next.config.mjs`

- [ ] **Step 1:** Add the two `remotePatterns` entries described above.
- [ ] **Step 2:** Verify against an owned, disposable, loopback-only Postgres database (same discipline as every prior plan): run `npm run dev` (or `npm run build` + a manual page load) and confirm a Product whose `image_url` is a real `m.media-amazon.com` URL renders without the `next/image` host error on its product detail page and on `/category/<its-category-slug>`. You can create a temporary test Product row for this (e.g. via the existing `scripts/create-product-ergear-egesd5b.ts` pattern or a one-off insert) against the disposable database only — do not use any real/shared database, and do not leave a lingering script file behind.
- [ ] **Step 3:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green (the build step itself will also exercise image config validity).
- [ ] **Step 4:** Record evidence in `artifacts/whitelist-amazon-image-hosts/evidence.md`: the exact config diff, the manual verification transcript (screenshot not required, describe what rendered), and confirmation of the four checks in Step 3.
- [ ] **Step 5:** Push the branch, open a PR against `main`. Do not merge locally.

**After this lands:** real Amazon product image URLs entered through the Admin Create Product UI (or any future script) render correctly across the public site.
