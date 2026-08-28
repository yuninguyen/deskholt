# Untangle Working Tree and Land Spec 001 Convergence

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. This plan operates on the CURRENT checkout (`p0-a3-vercel-preview`), which already contains the desired uncommitted work — do NOT discard it and do NOT create a throwaway worktree that leaves it behind. Where isolation is needed, isolate the *committed result*, not the source of the changes.

**Goal:** `main` now has P0-A + P0-B + P0-C complete. Per blueprint §5/§39, P1 work (Spec 001 Admin Product Specifications) is execution-eligible again. This plan (a) brings the stale local branch up to date with `main`, and (b) lands the already-implemented, already-evidenced Spec 001 convergence work (T017–T021, per `artifacts/spec-001/convergence-progress.md`) as clean, scoped commits — instead of leaving it sitting in an untracked/dirty working tree indefinitely.

## Why this is messier than the last two PRs

Unlike the middleware and P0-B work (single-concern, done from a fresh worktree), the current working tree already mixes **five distinct concerns** that arrived across earlier sessions. Do not commit them together.

Run `git status --short` yourself to get the live list; as of this writing it groups into:

1. **Spec 001 convergence (the actual goal of this plan):** `specs/001-admin-product-specifications/tasks.md`, `src/app/(admin)/admin/products/[id]/specifications/actions.ts`, `src/components/admin/products/ProductSpecificationsForm.tsx`, plus untracked `src/lib/products/specificationSaveAction.ts`, `tests/productAttributeValidator.test.ts`, `tests/productSpecificationsAction.test.ts`, `tests/productSpecificationsForm.test.ts`, `scripts/verify-spec-001-acceptance.ts`, `artifacts/spec-001/*`.
2. **P0-A3 evidence backfill:** `artifacts/p0-a3/*` was never committed when P0-A3 merged (commit `10df67d` only touched `src`/`tests`). This is pure evidence for already-shipped code — no behavior change.
3. **A P0-A3 follow-up plan doc:** `docs/superpowers/plans/2026-08-27-p0-a3-runtime-proof-completion.md` — same category as (2), also never committed.
4. **Repo housekeeping / doc reorganization:** deletions of legacy root docs (`Admin_Panel_for_Deskholt.md`, `Create_Post_for_Deskholt.md`, `DESKHOLT_FULL_SPECIFICATION.md`, `Deskholt-Master-Product-Database-v1-Technical-Spec.md`, `Deskholt-Master-Strategy-Product-Intelligence-Technical-Blueprint.md`, `Deskholt-Master-System-Blueprint-V2-V1-to-V5.md`, `Email_system_for_Deskholt.md`, `Legal_Content_for_Deskholt.md`, `Stage-0.md`, `Tong-hop-dinh-huong-Affiliate-Marketing*`), alongside untracked `docs/archive/` and `docs/DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md` that appear to be where that content moved.
5. **Tooling/config drift:** modified `.claude/skills/gitnexus/*.md`, `AGENTS.md`, `CLAUDE.md`.

**Excluded from every commit:** `.claude/settings.local.json` — machine-local, never commit it. If it must persist, confirm it's already covered by `.gitignore`; if not, add it there in its own trivial commit, not bundled with anything else.

## Global Constraints

- One concern per commit. Do not let (2)–(5) ride in on the Spec 001 commit just because they happen to be sitting in the same tree.
- Before committing (4) housekeeping/doc moves, diff each deleted root file against its apparent destination under `docs/archive/` or the new consolidated doc — confirm content was actually preserved, not silently dropped, before deleting. If a deleted file's content is NOT recoverable from any untracked replacement, stop and ask rather than commit the deletion.
- Before committing (5), read each modified file's diff and confirm the change is intentional and not an artifact of tooling auto-edits from an unrelated session.
- Do not re-implement or modify Spec 001 behavior in this plan — T017–T021 are already done and evidenced in `artifacts/spec-001/convergence-progress.md`. This plan only lands what already exists and passed verification.
- Full test suite, lint, and typecheck must pass after every commit in the sequence, not just at the end — if commit N breaks something, you must know which commit did it.
- Do not touch P0-A3/P0-B code (`src/lib/products/productAccessPolicy.ts`, `clickPersistence.ts`, `src/app/go/[slug]/route.ts`, etc.) — those are done and merged; this plan is additive/organizational plus the Spec 001 code that was already reviewed.

---

### Task 1: Sync the branch with `main`

- [ ] **Step 1:** `git fetch origin`. Confirm `origin/main` is at `7a54659` or later (P0-A + P0-B + doc backfill commit) and that current branch `p0-a3-vercel-preview` has **zero unique commits** ahead of the old `main` tip it forked from (verify with `git rev-list --left-right --count`).
- [ ] **Step 2:** Merge `origin/main` into the current branch (`git merge origin/main`). Do this with the working tree dirty — Git allows a merge that doesn't touch files with uncommitted local changes; if it refuses due to a real conflict on a file you have dirty, stop and report which file rather than force through it.
- [ ] **Step 3:** Re-run `npm test`, `npm run lint`, `npx tsc --noEmit` on the merged tree (dirty files included, since Node's test runner just picks up `tests/*.test.ts` regardless of git state) and confirm no regression versus the known-good 210/210 baseline from `main`.

### Task 2: Land P0-A3 evidence backfill (own commit)

- [ ] **Step 1:** `git add artifacts/p0-a3/ docs/superpowers/plans/2026-08-27-p0-a3-runtime-proof-completion.md`.
- [ ] **Step 2:** Commit with a message making clear this is evidence-only backfill for already-shipped P0-A3 code, e.g. `docs: backfill P0-A3 evidence artifacts that were never committed`.
- [ ] **Step 3:** Confirm `git status` no longer lists anything under `artifacts/p0-a3/`.

### Task 3: Land repo housekeeping / doc reorganization (own commit)

- [ ] **Step 1:** For each deleted root doc, confirm its content exists somewhere under `docs/archive/` or `docs/DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md` (or was superseded by `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md`, already committed in `7a54659`). Record a one-line mapping (old path → new path/superseded-by) for the commit message or a short note in `docs/archive/README.md` if one doesn't already explain it.
- [ ] **Step 2:** `git add -A` scoped to just the doc deletions and `docs/archive/`, `docs/DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md`. Commit, e.g. `docs: archive superseded planning docs, consolidate into V3.1.1 blueprint`.

### Task 4: Land tooling/config drift (own commit, only if intentional)

- [ ] **Step 1:** Diff `AGENTS.md`, `CLAUDE.md`, and each modified `.claude/skills/gitnexus/*.md`. If these are legitimate updates (e.g. reflecting the new GitNexus CLI limitations discovered during P0-A3/P0-B — no `detect-changes` command), commit them with a message explaining why, e.g. `docs: note GitNexus CLI detect-changes limitation in skill docs`.
- [ ] **Step 2:** If any diff looks accidental or unrelated, revert that specific file (`git checkout -- <file>`) rather than commit it, and note what was reverted.

### Task 5: Land Spec 001 convergence (the actual goal)

- [ ] **Step 1:** Confirm the working tree now contains only Spec 001 files as uncommitted/untracked (everything else landed in Tasks 2–4). `git status --short` should show only: `specs/001-admin-product-specifications/tasks.md`, `actions.ts`, `ProductSpecificationsForm.tsx`, `specificationSaveAction.ts`, the three new test files, `scripts/verify-spec-001-acceptance.ts`, `artifacts/spec-001/*`.
- [ ] **Step 2:** Run the full suite one more time (`npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`) against exactly this state.
- [ ] **Step 3:** `git add` those files and commit, referencing the convergence tasks closed: e.g. `feat(admin-specs): complete T017-T021 convergence (variant warning, validator/action tests, stale-ENUM preservation, disposable acceptance)`. Cite `artifacts/spec-001/convergence-progress.md` in the body as the evidence trail.
- [ ] **Step 4:** Update `specs/001-admin-product-specifications/tasks.md` checkboxes if any of T001–T016 are actually already implemented in the shipped code but were never ticked (verify against the real files before ticking — don't tick from assumption).

### Task 6: Push and integrate

- [ ] **Step 1:** Given none of Tasks 2–5 touch commerce-critical or shared-risk code (unlike P0-B), a single push of this branch with a PR covering all of Task 2–5's commits (kept as separate commits, not squashed) is sufficient — no need for per-concern PRs.
- [ ] **Step 2:** Consider renaming the branch before pushing — `p0-a3-vercel-preview` no longer reflects its contents (P0-A3 is long merged; this branch now carries Spec 001 + housekeeping). `git branch -m spec-001-admin-specifications-convergence` (or similar) is recommended so the PR title/branch aren't misleading.
- [ ] **Step 3:** Push, open a PR against `main`, confirm CI green and `mergeable_state: clean`, same as the last two PRs. Do not merge locally.

**After this lands:** Spec 001 is fully committed and current. Re-check the blueprint's P1 scope list (canonical metric units, Available Options, meaningful tracked Variants, Brand/Category relations, AffiliateNetwork/Merchant/MerchantProduct/current Offer, Admin Identity/Sources/Offers/queues, cache invalidation, form correctness) to identify what's genuinely next — do not assume Spec 001 covers all of P1.
