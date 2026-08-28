# P0-A3 US3 Built-Next Cache Runtime Evidence

Date: 2026-08-27

Target: explicit user-confirmed disposable local development database; non-secret fingerprint `7674334565232096068/16389/deskholt_db/public`.

Commands:

- `npm run build` — PASS;
- `npm run verify:p0-a3:cache-runtime` — PASS.

Runtime report:

- loopback host: `127.0.0.1`;
- random port: `49779`;
- first request session: `8cf9c853-82f7-4206-a912-823f96b35e18`;
- second request session: `f1bd6582-799c-4d77-aa94-9b1b943223b4`;
- first result version: `c5a07708d97b120a34fa6a27a15f4f4cb4c31fe2140e73769f2d5bde40ab3f5c`;
- second result version: `b33fd66735998620f38aca8bc23d31c5660aedabb102506b08cc17ca0161279e`;
- first evaluated at: `2026-08-27T09:21:10.796Z`;
- second evaluated at: `2026-08-27T09:21:11.022Z`.

The first request proved metadata/body shared one session, one repository load, one access evaluation, one offer evaluation, one version and one evaluation time across the between-consumer mutation. The second request used a distinct session and observed the changed version/time. The verifier owned and cleaned its Product/AffiliateLink fixture, child process, allocation record, and session paths.