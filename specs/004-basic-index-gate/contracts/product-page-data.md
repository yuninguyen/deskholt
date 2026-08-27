# Contract: Shared Product Page Data

## Purpose

Ensure Product metadata and visible body for one render observe one Product/AffiliateLink snapshot, access decision, evaluation timestamp, and P0-A2 offer presentation.

## Public interface

```ts
export const getProductPageData: (
  lookupSlug: string
) => Promise<ProductPageDataResult>;
```

The exported function is one module-level React `cache()` wrapper. `generateMetadata` and the page import this exact function identity and pass the same primitive slug value.

## Request-time sequence

Inside the cached callback:

1. Await the framework request-time boundary.
2. Capture one `evaluatedAt` timestamp before lookup; therefore even a `missing` result carries the time at which that request-scoped lookup was evaluated.
3. Query one Product plus the AffiliateLinks required by P0-A2.
4. If missing, return `{kind: 'missing'}` with no Product decision.
5. Evaluate Product access exactly once.
6. If non-public, return `{kind: 'non-public'}` immediately.
7. If public, derive the canonical P0-A2 offer presentation using the same timestamp and snapshot.
8. Return `{kind: 'public'}`.

Public-only specifications are not part of the shared database snapshot contract. The page loads them only after the shared result confirms public eligibility; metadata never loads them.

## Result union

```ts
type ProductPageDataResult =
  | {
      kind: 'missing';
      evaluatedAt: Date;
    }
  | {
      kind: 'non-public';
      product: ProductPageSnapshot;
      decision: ProductAccessDecision;
      evaluatedAt: Date;
    }
  | {
      kind: 'public';
      product: ProductPageSnapshot;
      decision: ProductAccessDecision;
      evaluatedAt: Date;
      offerPresentation: ProductOfferPresentation;
    };
```

## Consumer behavior

### Metadata

- missing/non-public → call `notFound()`; do not catch the interrupt;
- public → pure metadata mapping:
  - title `product.name`;
  - description trimmed non-empty `product.description`, else `product.name`;
  - robots based on decision;
  - canonical Product URL from shared builder.

### Page body

- missing/non-public → call `notFound()` before specification loading;
- public → load specifications, render Product body, schema, and price table from the shared public result plus specification data.

## Race invariant

For one render:

```text
first consumer (metadata or body) gets result R at evaluatedAt T
→ Product status/AffiliateLink changes in database
→ second consumer asks for the same slug
→ both consumers retain R and T for that render
→ next independent request receives fresh result R2/T2
```

No consumer may independently query Product/AffiliateLinks, recompute access, capture another offer clock, or rebuild offer presentation.

## Test seam

Keep an uncached orchestration core that accepts injected repository and time input. Tests prove:

- one Product/AffiliateLink load;
- one access evaluation;
- one evaluation timestamp;
- no specifications read for missing/non-public;
- same timestamp passed to P0-A2 offer presentation;
- returned snapshot/result remains stable after backing fake data changes;
- next independent core invocation sees changed state.

## Focused real-Next runtime harness

A deterministic integration acceptance exercises the built existing application through a real HTTP Product request, not an ordinary `tsx` call to React `cache()`.

### Probe safety

- The managed Next process binds only to `127.0.0.1` on a randomly allocated available high port; probe-enabled execution on `0.0.0.0` or a non-loopback bind fails.
- Each run creates a random unguessable Product slug. A server-only probe module reads activation variables at runtime and activates only when random token, exact expected slug, owned probe allocation record, and disposable datasource fingerprint all match. Unexpected Product requests never allocate or claim a probe session.
- The driver allocates a new empty unique child under the platform temp root, canonicalizes parent/child, and rejects root/parent paths, pre-existing content, symlink/junction/reparse escape, or a child resolving outside the owned parent. Environment input may identify only that recorded allocation.
- Cleanup never recursively deletes an arbitrary environment-provided path. It removes only session subtrees listed in the allocation record, verifies they remain inside the canonical owned child, then removes the empty owned child.
- No test control Route Handler, public endpoint, cookie, header, or production UI is added.
- One activation token/probe root stays fixed for the server. A separate module-level request-cached `getProbeSession()` atomically allocates a unique session directory/counter; metadata and page in one render must receive the same session ID, and a later HTTP request must receive a different ID. Split or reused sessions fail acceptance.
- Probe files contain only session ID, counters, barrier signals, expected slug, result version, and timestamp.

### Deterministic sequence

1. Build the existing Next application and start it as a managed background process on a dedicated test URL with the isolated test database and probe variables.
2. Seed one Product/AffiliateLink fixture and start one HTTP request to its real Product route.
3. Immediately before loader use, both metadata and page call an order-independent probe hook. The first arriving consumer atomically creates a `first-consumer` claim and proceeds; the second waits for `mutation-complete` before invoking the loader.
4. After the first consumer receives the loader result, it records consumer kind, slug, result version, and `evaluatedAt`, creates `first-result-ready`, and waits for the bounded `mutation-complete` barrier before returning.
5. The external driver observes `first-result-ready`, mutates lifecycle or AffiliateLink data in the isolated database, then creates `mutation-complete`.
6. A concurrently waiting second consumer proceeds immediately. If Next schedules consumers sequentially, the first now returns and the later second observes the already-released barrier, so the harness does not depend on metadata-first/page-first or concurrent scheduling.
7. The second consumer calls the same exported loader with the same primitive slug and records its result.
8. The first response must show both consumers ran, one repository load, one access evaluation, one offer evaluation, and identical metadata/body result version and timestamp despite the intervening mutation.
9. Without restarting the server or changing its activation token/root, make a second independent HTTP request. Request-scoped `getProbeSession()` must allocate a distinct session ID; the request must record a second load/evaluation and observe the changed state with a fresh version/timestamp.
10. Assert request one metadata/page shared exactly one session, request two used a different session, and counters/events never crossed session directories.
11. Lifecycle is allocate → bind loopback → readiness → run → cleanup. A `finally` path always requests server termination, verifies process exit, removes only owned fixture rows/session subtrees, and verifies the owned child is removed. Failure to kill the process or remove owned database/filesystem state fails the verifier.

Every readiness, barrier, request, and shutdown wait has a bounded timeout and diagnostic event log. Static same-import evidence plus uncached-core tests alone do not satisfy SC-003/SC-003A. Avoid mocks of Next, React cache, or Prisma globals.
