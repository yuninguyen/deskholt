# P0-B Click + Data Durability Evidence

## Verification status

**PASS — Task 5 Steps 1–4 complete. Step 5 remains unchecked.** The canonical checklist is `docs/superpowers/plans/2026-08-28-p0-b-click-data-durability.md`. No commit, push, PR, or merge was performed.

## Architecture decision

The accepted decision remains **Option A** from `artifacts/p0-b/architecture-decision.md`: remove the Redis enqueue/destructive-pop worker path and persist each click synchronously in the `/go/[slug]` lifecycle with one pre-generated `clickId`, canonical unique-conflict handling, bounded transient retry/backoff/timeout, structured exhausted-failure evidence, and merchant redirect continuity.

The repository does not start `src/workers/clickWorker.ts`; destructive `RPOP` could lose clicks, and a durable async queue is outside P0-B absent later operational evidence.

## Fresh verification gates

The sanitized transcript at `artifacts/p0-b/verification-transcript.txt` is backed by the exact fresh controller command output from `C:\laragon\www\deskholt\.worktrees\p0-b-click-data-durability`:

1. `npm run lint` — **PASS**, exit `0`, zero warnings/errors (`verification-transcript.txt:5-6`).
2. `npx tsc --noEmit` — **PASS**, exit `0`, no diagnostics (`verification-transcript.txt:5-7`).
3. `npm test` — **PASS**, exit `0`: `210` tests, `210` passed, `0` failed/cancelled/skipped/todo; duration `2045.4506 ms` (`verification-transcript.txt:8-9`).
4. Fully isolated PostgreSQL verifier and actual-route scenarios — **PASS** (`verification-transcript.txt:11-32`).
5. `npm run build` — **PASS**, exit `0`: Prisma generation, Next.js 16.3.0 optimized compilation, TypeScript, `13/13` static page generation, and dynamic `/go/[slug]` (`verification-transcript.txt:34-40`).
6. Cleanup — **confirmed** (`verification-transcript.txt:42-46`).

Historical focused RED/GREEN review evidence remains earlier-attempt context only: `42` tests with `39` passed and `3` expected failures before the allowlist change, followed by `42/42` after adding exact transient codes `40001` and `40P01`.

## Isolated PostgreSQL and actual-route evidence

The retained audit artifact is the sanitized transcript `artifacts/p0-b/verification-transcript.txt`, backed by the exact fresh controller command output:

- automated gates: lines `5-9`;
- disposable PostgreSQL guard and ownership: lines `11-20`;
- migration deployment: lines `22-25`;
- actual normal/transient/permanent route scenarios and fixture cleanup: lines `27-32`;
- build: lines `34-40`;
- cleanup: lines `42-46`;
- final status: line `48`.

Safety claim: the original datasource was not consulted; an explicit owned `DATABASE_URL` was supplied to database child processes (`verification-transcript.txt:11-20`). This deliberately does **not** claim that the original `.env` file was never read by any tool.

The retained transcript contains no password, credential, token, full `DATABASE_URL`, or original environment value; a credential-pattern scan returned no matches.

| Scenario | Redirect | Attempts | Click identity | Rows | Failure event |
|---|---|---:|---|---:|---|
| normal actual Prisma insert | 302 merchant | 1 | redirect `subid` matched insert | 1 | none |
| simulated transient Prisma `P1001` then actual Prisma insert | 302 merchant | 2 | same `clickId` both attempts | 1 | none |
| simulated permanent Prisma `P2003` | 302 merchant | 1 | one request identity | 0 | one sanitized permanent exhausted event |

The exact scenario lines are `verification-transcript.txt:28-30`; fixture cleanup is line `31`; the manual verifier total is line `32`.

## Cleanup proof

The verifier stopped and deleted the exact owned cluster (`verification-transcript.txt:42-46`): pre-stop status exited `0`, fast stop was confirmed, and the owned directory was deleted with `remaining=no`. The retained fresh run used loopback port `59258` and owned database `deskholt_p0b_da9d08a5d026452a` (`verification-transcript.txt:14-19`).

## Accepted V1 trade-off and metric caveat

P0-B explicitly accepts **attribution loss after exhausted persistence attempts** so that the merchant redirect remains available. This is an availability-over-attribution V1 trade-off, not guaranteed click durability during a database outage.

An application timeout does not prove PostgreSQL cancelled or failed the underlying insert. A late commit can occur after the route emits `click_persistence_failure_total`, so the metric may over-count actual attribution loss. Stable `click_id` uniqueness makes a later same-ID retry idempotent but cannot make the immediate metric perfectly accurate.

## Route configuration bounds

| Environment variable | Default | Accepted route range | Invalid-value behavior |
|---|---:|---:|---|
| `CLICK_PERSIST_MAX_ATTEMPTS` | 3 | 1–5 | falls back to 3 |
| `CLICK_PERSIST_BACKOFF_MS` | 10 ms | 0–100 ms | falls back to 10 ms |
| `CLICK_PERSIST_TIMEOUT_MS` | 150 ms | 1–1000 ms | falls back to 150 ms |

Route tests now observe the actual persistence timers/create calls: malformed and out-of-range backoff values produce the `10 ms` retry delay, while malformed and out-of-range timeout values produce the `150 ms` overall timer. Test-local environment changes are restored in `finally` blocks, in addition to the file-level restoration guard.

## Destination pathname privacy evidence

The structured failure event intentionally retains `destination.origin + destination.pathname` as operational destination context. `safeDestination` parses the URL and strips credentials, query parameters, and fragments from emitted evidence. No current repository or deployment evidence identifies affiliate destination paths as secret-bearing data, so production behavior was not changed in this review wave. Operational owners must switch this field to origin-only if an affiliate program encodes secrets, tokens, customer identifiers, or other sensitive material in pathname segments.

## Operational worker/backlog caveat

Before deployment, operations must stop any externally managed legacy worker and inspect/drain/reconcile any existing `deskholt:click_queue` backlog. If measured redirect latency, pool contention, failure rates, or outage-survival requirements later exceed the synchronous design, use a durable claim/persist/ack queue with retry/dead-letter behavior—not destructive pop.

## Scope audit

The committed implementation scope is the branch delta from `origin/main@079de12` to implementation commit `e08ac41`. It is not a comparison against stale local `main`, which remains behind the remote base.

GitNexus was indexed at committed base `079de12` and could not model relationships introduced by the then-uncommitted helper/route edits. Its status/impact output was supplemental; Git status/diff, tracked-plus-untracked path inspection, test/build evidence, and the operator-approved fallback were the controlling pre-commit scope checks.

The committed delta is confined to the planned route, click-persistence helper, legacy worker removal, route/persistence tests, P0-B artifacts, and canonical plan. No Spec 001, seed, migration, Prisma schema, package manifest, or unrelated source file is included.

## Task 5 completion

- Step 1: **checked** — current lint, TypeScript, full-suite, and isolated build evidence is recorded.
- Step 2: **checked** — actual normal/transient/permanent `/go` scenarios passed against brand-new owned PostgreSQL (`verification-transcript.txt:27-32`).
- Step 3: **checked** — final evidence retains architecture, gates, route transcript, trade-off, metric caveat, bounds, and cleanup.
- Step 4: **checked via operator-approved CLI/Git fallback** — `gitnexus_detect_changes()` was unavailable; scoped fallback verification completed before commit.
- Step 5: **checked** — branch `p0-b-click-data-durability` was pushed and PR #4 opened against `main`: https://github.com/yuninguyen/deskholt/pull/4. Implementation HEAD `e08ac41` was reported mergeable with both GitHub checks successful before the checklist-only follow-up commit.
