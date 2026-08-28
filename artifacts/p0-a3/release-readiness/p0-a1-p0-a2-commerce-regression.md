# P0-A3 P0-A1, P0-A2, and Commerce Regression Evidence

Date: 2026-08-27

Fresh complete Node suite: **171/171 PASS**.

Verified unchanged behavior includes:

- P0-A1 Admin authentication fails closed for missing/empty password or session secret and accepts valid configuration;
- P0-A2 structured Offer freshness, valid price/stock eligibility, deterministic offer selection, truthful JSON-LD and visible-row consistency;
- ACTIVE Product click attribution and merchant redirect behavior;
- mandatory all-out-of-stock AffiliateLink fallback by priority order;
- missing Product and no-link fallback behavior;
- non-public commerce stops before UUID, Redis, Click persistence, tracking URL mutation or merchant redirect.

Lint, TypeScript and production build also pass.