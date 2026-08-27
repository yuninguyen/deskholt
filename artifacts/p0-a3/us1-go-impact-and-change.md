# P0-A3 US1 Commerce Route Impact and Change

Date: 2026-08-27

## GitNexus

The route file and `GET` symbol were present in the concept graph, but direct file-qualified impact queries returned `Target not found`; the concept query exposed `Function:src/app/go/[slug]/route.ts:GET` and the related click worker/seed definitions. `selectAffiliateLink` impact was LOW with one direct test caller. No HIGH/CRITICAL warning was returned.

## Change

`GET /go/[slug]` now evaluates the found Product through `evaluateProductAccess` before affiliate selection, UUID generation, Redis enqueue, Click fallback, URL mutation, or merchant redirect. Non-public lifecycle states return HTTP 404 with no Location header or side effects. Missing Products and Products without links preserve redirect-home behavior. ACTIVE Products preserve the existing affiliate fallback, click payload, and merchant redirect flow; ACTIVE + `is_indexed=false` remains commerce eligible.

## Verification

`node --experimental-test-module-mocks --import tsx --test tests/goProductAccess.test.ts` passes all 7 tests. Existing click-tracking tests remain part of the full suite.
