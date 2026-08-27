# P0-B Click Persistence Architecture Decision

## Status

Accepted: **Option A** — remove the Redis enqueue and destructive-pop worker path for P0-B, and implement click persistence synchronously and idempotently in the `/go/[slug]` request lifecycle with bounded retry and timeout.

This artifact records the architecture gate only. No production code or tests are changed by this decision step.

## Evidence

### GitNexus impact

- `processClickQueue`: **LOW** impact, with one direct relationship to its own file (`src/workers/clickWorker.ts`) and **0 execution flows**.
- `/go/[slug]` route `GET`: **LOW** impact, with **0 indexed callers** and **0 execution flows**.

The index therefore identifies no cross-file caller or execution-flow dependency that requires retaining the worker. The route remains a live HTTP entry point even though it has no indexed code caller.

### Repository runtime and deployment evidence

- `package.json` starts only Next.js through `next start`; it has no script for `src/workers/clickWorker.ts`.
- `docker-compose.yml` starts PostgreSQL and Redis only; it does not start the application worker.
- No repository process-manager or service configuration (`ecosystem*`, `Procfile*`, or `*.service`) starts the worker.
- `README.md` describes serving Next.js through PM2/Nginx but does not instruct production to start the click worker.
- The legacy `DESKHOLT_FULL_SPECIFICATION.md` does contain a PM2 command for a click worker, but it refers to `src/workers/click-worker.ts`, while the current file is `src/workers/clickWorker.ts`. This is legacy documentation rather than an active deployment/process-manager configuration.
- The current route enqueues to `deskholt:click_queue`; `src/workers/clickWorker.ts` destructively removes entries with `RPOP` before inserting them into PostgreSQL, so a database failure after the pop can permanently lose a click.

### Operator confirmation

The operator was explicitly asked to resolve the legacy-documentation ambiguity and confirmed that production **does not run** `src/workers/clickWorker.ts`.

## Blast radius

Removing the P0 Redis enqueue and `clickWorker.ts` path affects only click persistence plumbing:

- `/go/[slug]` will stop writing click payloads to `deskholt:click_queue` and will persist directly instead.
- `src/workers/clickWorker.ts` can be removed because it has no established production start path and no indexed external caller or execution flow.
- Redis itself is not removed; other repository uses are outside this decision.
- Product eligibility, affiliate-link selection, redirect fallbacks, tracking URL construction, and `clickId` generation semantics must remain unchanged.

The expected code blast radius is low, but the route is commerce-critical: implementation must preserve merchant redirects even when persistence fails.

## Decision rationale

Option A is selected because the worker is not running in production, the queue consumer uses an unsafe destructive-pop pattern, and P0 does not require a durable asynchronous queue. Retaining and redesigning the queue would add claim/acknowledgement, retry, dead-letter, and operational complexity without established P0 latency, burst, outage-survival, or failure-rate evidence.

Synchronous, idempotent persistence keeps the failure surface in one request lifecycle and directly supports the required P0-B retry, timeout, unique-conflict, logging, and redirect invariants.

## Implementation constraints

The subsequent implementation must:

1. Generate exactly one `clickId` per request lifecycle and reuse it for retries of that request; do not deduplicate distinct user clicks.
2. Treat only canonical `click_id` unique conflicts (Prisma `P2002` / PostgreSQL `23505`) as already persisted.
3. Retry only classified transient or ambiguous-response failures, with bounded attempts, small configurable backoff, and an overall timeout budget.
4. Never interpret validation, foreign-key, schema, malformed-data, or generic errors as success.
5. Preserve the merchant redirect after exhausted persistence attempts.
6. Emit structured failure evidence containing click, time, product/merchant/destination context, and error classification; do not create new metrics infrastructure beyond the scoped structured log.
7. Document the accepted V1 attribution-loss trade-off and the ambiguous-commit false-negative metric caveat.
8. Preserve current product-access eligibility order, missing-product/no-link redirect-home behavior, affiliate selection, and tracking URL behavior.
9. Do not introduce a durable queue, dead-letter system, or unrelated Redis removal in P0-B.

## Cost if this decision is wrong

If the operator confirmation or deployment evidence is wrong and an untracked production process actually runs the worker, removing the enqueue/worker path without deployment coordination could strand an existing Redis backlog, leave an obsolete PM2 process polling indefinitely, or cause duplicate persistence during a mixed-version rollout. Before deployment, operations should stop any legacy worker and inspect/drain or deliberately reconcile `deskholt:click_queue`.

Option A also moves database latency and connection usage into the redirect request. If measured p95/p99 redirect latency, burst pool contention, operational failure rate, or database-outage survival requirements later exceed the bounded synchronous budget, DeskHolt must revisit a durable claim/persist/ack queue design rather than restore the destructive-pop worker.
