# Contract: Admin Product Publishing Commands

## Commands

```ts
type PublishingCommand =
  | { kind: 'set-lifecycle'; status: ProductStatus }
  | { kind: 'enable-index' }
  | { kind: 'disable-index' };
```

The HTTP/form boundary must reject missing/unknown command kinds, invalid Product IDs, and invalid lifecycle values before mutation.

## Normalization

```text
set DRAFT    → DRAFT + false
set BLOCKED  → BLOCKED + false
set ARCHIVED → ARCHIVED + false
set ACTIVE   → ACTIVE + false

enable index:
  current ACTIVE     → ACTIVE + true
  current non-ACTIVE → reject with no write

disable index:
  preserve current lifecycle
  set false
```

`set ACTIVE` always clears indexing even when the previous row is malformed `DRAFT + true` or already `ACTIVE + true`.

## Atomic persistence boundary

For every command:

1. Authenticate administrator through the existing fail-closed contract.
2. Parse Product ID and command.
3. Execute exactly one command-shaped write:
   - set lifecycle: update by ID with `{status: target, is_indexed: false}`;
   - enable index: conditional update with `WHERE id = productId AND status = ACTIVE`, writing only `is_indexed = true`;
   - disable index: update by ID, writing only `is_indexed = false`.
4. Require affected-row count one for success.
5. For a zero-row enable result, perform a read-only classification: missing → missing error; currently non-active → active-only rejection; currently active → concurrent-change conflict/no write.
6. After successful write only, revalidate `/` and redirect to the Admin success state.
7. Expected validation/rejection/conflict outcomes redirect to an error state with no invalidation. Unexpected infrastructure failures propagate fail-visible.

A plain read followed by a full `{status, is_indexed}` write is forbidden under PostgreSQL `READ COMMITTED`. Enable/disable operations never carry or rewrite a lifecycle value from a prior snapshot. No optimistic or silent AJAX save is permitted.

## UI contract

Each row presents:

- Product identity/name;
- stored lifecycle;
- stored index flag;
- derived effective reason/eligibility;
- lifecycle selection/save action;
- explicit enable or disable index action;
- existing specifications navigation without nested forms/links.

A non-active Product must not offer a misleading successful enable-index path. Server-side validation remains authoritative even if the UI disables or hides the action.

## Error behavior

| Failure | Write | Homepage invalidation | Redirect |
|---|---:|---:|---:|
| unauthenticated | none | no | existing Admin login flow |
| invalid form input | none | no | Admin products error state |
| Product missing | none | no | Admin products error state |
| enable on non-active | none | no | Admin products error state |
| concurrent-change conflict after zero-row enable | none | no | Admin products retry/error state |
| unexpected database/infrastructure failure | no successful write | no | propagate fail-visible error; do not report success |
| success | one atomic state write | yes, `/` only | Admin products success state |

## Test contract

- exhaustive lifecycle command normalization;
- malformed legacy index flags normalize safely;
- enable-index rejects all non-active statuses with zero write;
- disable-index preserves status;
- deterministic PostgreSQL concurrency tests race enable-index against set `BLOCKED`, `DRAFT`, and `ARCHIVED` in both lock/order outcomes; final state must remain the lifecycle target plus false whenever the lifecycle command participates;
- deterministic race proves disable-index never restores a stale lifecycle;
- no test outcome permits a stale full-row write or lost lifecycle transition;
- invalidation occurs only after an affected-row-count-one success;
- action adapter redirects after successful mutation or controlled rejection.
