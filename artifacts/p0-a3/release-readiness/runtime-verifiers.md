# P0-A3 Final Runtime Verifiers

Date: 2026-08-27

Explicit disposable target fingerprint: `7674334565232096068/16389/deskholt_db/public`.

- Publishing concurrency verifier: PASS, 8/8 deterministic PostgreSQL scenarios.
- Built-Next cache runtime verifier: PASS, two distinct request sessions, first-request shared result/time, second-request fresh result/time.
- Both verifiers rejected ambient datasource use; the command environment supplied a distinct invalid ambient URL and the explicit P0-A3 URL independently.
- Owned publishing fixtures, cache Product/AffiliateLink fixture, server child process and filesystem sessions were cleaned.

Detailed reports: `artifacts/p0-a3/us2-concurrency.md` and `artifacts/p0-a3/us3-cache-runtime.md`.