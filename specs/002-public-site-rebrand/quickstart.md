# Quickstart: Validating the Public Site Rebrand

No new external interfaces are introduced by this feature (see data-model.md — internal UI
components only), so no `contracts/` directory is generated for this feature.

## Prerequisites

- Postgres running locally (per project memory: `deskholt_user`/`deskholt_db` already set up)
- `.env` configured (existing setup, unchanged by this feature)
- `npm install` already run

## Setup

```bash
npm run dev
```

Dev server runs with `--webpack` (per `package.json`) — Turbopack is known to have a Server
Actions bug on this Next.js version per prior project notes, unaffected by this feature but
worth keeping in mind if the dev command changes.

## Validation Scenarios

### 1. Public pages use the new design system (SC-001, SC-002)

- Visit `http://localhost:3000/` — confirm paper-grid background, ink text, Space Grotesk
  headings, real logo in the header (not the icon+text placeholder).
- Visit `http://localhost:3000/category/standing-desks` — confirm filter/grid area uses the
  new tokens; sort/eco-filter links still work.
- Visit `http://localhost:3000/products/<any-existing-slug>` — confirm the price table is
  above the fold, uses mono numerals, sage-highlighted best row, blueprint Go buttons.

### 2. Admin is untouched (SC-003)

- Visit `http://localhost:3000/admin/login`, then `/admin/products` after authenticating —
  confirm both render with the exact same look as before this feature (dark `bg-gray-950`
  chrome, no paper background, no new nav/footer).
- Run: `grep -rE "brand-|dark-(900|800|700|600)" src/app/(public) src/components/ui` — expect
  zero matches (confirms old tokens were fully replaced in the restyled surfaces).

### 3. Cookie banner works end-to-end (SC-004, User Story 3)

- Clear site data / open a private window, visit `/` — confirm the cookie banner appears
  with ink/paper styling.
- Click "Customize" — confirm the modal shows Necessary (locked on), Analytics,
  Functionality, Advertising toggles; toggle a couple and save; reload — banner should not
  reappear and choice should persist (check `localStorage`).
- In browser devtools console, run `Object.defineProperty(navigator, 'globalPrivacyControl', { value: true })` before a fresh page load (private window, cleared storage) — confirm the
  banner never renders and a "declined" record is written.

### 4. Accessibility spot-check (SC-005, SC-006)

- Tab through the nav, a product card's buttons, and the price table's Go buttons — confirm
  a visible 2px blueprint focus outline on every stop.
- Use a contrast checker on `ink` (#1F2421) vs `paper` (#F3F1EA) — should read AAA; `ink-soft`
  (#565B54) vs `paper` — should read at least AA at ≥14px.

### 5. Existing functionality unaffected (SC-004)

- `/category/standing-desks?eco=true` still filters to sustainable products only.
- Any `Go →` button still opens `/go/[slug]?network=...` in a new tab.
- `npm run lint && npm run typecheck && npm test` all pass.
