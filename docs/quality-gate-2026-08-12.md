# Quality Gate Migration — 2026-08-12

## Objective

Remove known dependency vulnerabilities and local quality warnings, then enforce the same checks in GitHub Actions.

## Dependency audit

The initial audit reported 6 vulnerabilities (1 moderate and 5 high):

- Next.js 14 advisories affecting server components, image optimization, caching, rewrites, and request handling.
- A vulnerable PostCSS version bundled by Next.js.
- A vulnerable `glob` version used by the legacy Next.js ESLint configuration.
- A bounds-check advisory affecting `uuid` versions below 11.1.1.

Next.js 15.5.21 removed the older framework advisories but still bundled vulnerable PostCSS and Sharp versions according to the current 2026 advisory database. The project therefore moved to Next.js 16.3.0 instead of forcing unsupported nested dependency overrides.

Final audit result:

- Full dependency tree: 0 vulnerabilities.
- Production dependency tree: 0 vulnerabilities.

## Framework and tooling migration

- Next.js: 14.x to 16.3.0.
- ESLint: 8.x to 9.35.0.
- `eslint-config-next`: 14.x to 16.3.0.
- `uuid`: 10.x to 11.1.1.
- PostCSS: 8.4.x to 8.5.23.
- Added `tsx` as the TypeScript test runner.
- Updated the Prisma seed command to use `tsx`, making it portable across local development and the Node.js 20 Linux CI runner.
- Replaced legacy `.eslintrc.json` with the ESLint 9 flat configuration in `eslint.config.mjs`.
- Updated dynamic route `params` and `searchParams` to the asynchronous Next.js 16 API.
- Accepted Next.js 16's required TypeScript JSX runtime and generated type includes.

## Image optimization

- Replaced the three plain product `<img>` elements with `next/image`.
- Added responsive `sizes` values and a priority hint for the product hero image.
- Restricted image optimization from the previous wildcard hostname to `images.unsplash.com`, the only remote image host currently used by seed data.

## Test runner

The native Node TypeScript path produced a module-type warning because the application remains CommonJS-compatible for the existing seed and worker entry points. Tests now run through `tsx --test`, eliminating that warning without changing the entire package module mode.

## Continuous integration

Added `.github/workflows/quality.yml`, which runs for pull requests and pushes to `main`:

1. Install dependencies with `npm ci` on Node.js 20.
2. Generate the Prisma client.
3. Create and seed the SQLite test database.
4. Audit production dependencies at high severity.
5. Run lint, type-check, tests, and the production build through `npm run check`.

The workflow has read-only repository permissions, concurrency cancellation, and a 15-minute timeout.

## Verification

- ESLint: passed with zero warnings (`--max-warnings=0`).
- TypeScript: passed.
- Tests: 4 passed, 0 failed.
- Next.js 16 production build: passed.
- `npm audit`: 0 vulnerabilities.
- `npm audit --omit=dev`: 0 vulnerabilities.
- GitNexus detected-change risk: LOW, with no affected execution flows.
