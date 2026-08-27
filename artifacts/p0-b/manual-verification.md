# P0-B Manual `/go` Verification Transcript

## Result

**PASS.** `artifacts/p0-b/verification-transcript.txt` is a sanitized transcript backed by the exact fresh controller command output. It records automated gates, a disposable trust-auth PostgreSQL cluster and uniquely owned database, repository migration deployment, the actual `/go/[slug]` normal/transient/permanent scenarios, `npm run build`, and confirmed cleanup. Final status is PASS (`verification-transcript.txt:48`).

## Safety boundary

- Worktree: `C:\laragon\www\deskholt\.worktrees\p0-b-click-data-durability`.
- The original datasource was not consulted; an explicit owned `DATABASE_URL` was supplied to the database child processes. This is the narrow claim emitted by the controller guard (`verification-transcript.txt:11-20`), not a claim that no process could read any `.env` file.
- The fresh run used owned database `deskholt_p0b_da9d08a5d026452a` under the recorded owned root (`verification-transcript.txt:18-19`).
- Trust authentication was used, and the server listened only on loopback high port `127.0.0.1:59258` (`verification-transcript.txt:14-18`).
- No password, credential, token, full `DATABASE_URL`, or original environment value is retained in the sanitized transcript.

## Retained sanitized transcript

Path: `artifacts/p0-b/verification-transcript.txt`

The artifact is backed by the exact fresh controller command output. Relevant ranges:

- automated lint, TypeScript, and 210-test gates: lines `5-9`;
- owned guard, datasource boundary, port, database, and root: lines `11-20`;
- both applied migrations: lines `22-25`;
- actual route scenarios, fixture cleanup, and manual verifier total: lines `27-32`;
- build: lines `34-40`;
- cleanup: lines `42-46`;
- final status: line `48`.

## Exact scenario results

1. **Normal:** HTTP 302 merchant redirect, one persistence attempt, one Click row, zero failure events (`verification-transcript.txt:28`).
2. **Transient:** simulated Prisma `P1001`, two attempts with the same `clickId`, HTTP 302 merchant redirect, one Click row, zero failure events (`verification-transcript.txt:29`).
3. **Permanent:** simulated Prisma `P2003`, one attempt, HTTP 302 merchant redirect, zero Click rows, one structured sanitized exhausted-failure event (`verification-transcript.txt:30`).
4. **Fixture cleanup:** Product `0`, AffiliateLink `0`, Click `0` (`verification-transcript.txt:31`).
5. **Manual verifier:** `1` test passed and `0` failed; duration `630.0076 ms` (`verification-transcript.txt:32`).

## Migration and build results

- Migrations `20260827014500_baseline_existing_schema` and `20260827020000_p0_a3_basic_index_gate` were applied successfully (`verification-transcript.txt:22-25`).
- `npm run build` generated Prisma Client, completed Next.js 16.3.0 optimized compilation and TypeScript, generated `13/13` static pages, retained `/go/[slug]` as dynamic, and exited `0` (`verification-transcript.txt:34-40`).

## Cleanup proof

The fresh run reported pre-stop status exit `0`, confirmed fast cluster stop, and confirmed deletion of the owned directory with `remaining=no` (`verification-transcript.txt:42-46`). The transcript also records that an interrupted prior capture cluster was separately stopped and removed, with no owned cluster residue before the final run (`verification-transcript.txt:46`). That earlier attempt is historical context only and is not presented as final verification evidence.
