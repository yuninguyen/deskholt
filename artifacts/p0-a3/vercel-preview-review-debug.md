# P0-A3 Vercel Preview Test / Review / Debug

Date: 2026-08-27

## Scope

Reviewed committed branch `p0-a3-vercel-preview` at `d8d2839fa6f63aab9cf3c7b3a628cca1c383dc08`. Existing unrelated working-tree changes were not staged, committed, or pushed.

## Local verification

- production dependency audit: 0 vulnerabilities;
- ESLint: PASS, zero warnings;
- TypeScript no-emit: PASS;
- full Node suite: 171/171 PASS;
- production build: PASS;
- GitNexus refreshed at commit `d8d2839`: 2,186 symbols, 3,066 relationships, 97 flows.

## Vercel review

Original reviewed Preview: `deskholt-cyaybuocz-yuninguyens-projects.vercel.app`, READY. Build logs showed Prisma Client generation, TypeScript, static generation and deployment all completed. No runtime error logs were present.

### Reproduced configuration defect

`NEXT_PUBLIC_APP_URL` was configured to an ephemeral Preview deployment URL. Every redeploy creates a new hostname, so Product canonical and sitemap URLs could become stale.

### Fix

Changed the Preview environment variable to the stable project alias:

`NEXT_PUBLIC_APP_URL=https://deskholt.vercel.app`

No source symbol or Git commit changed. Redeployed Preview:

- URL: `https://deskholt-k01uw5zf0-yuninguyens-projects.vercel.app`
- Deployment ID: `dpl_DyruqPef4mU33TwbMFWqaKnksynh`
- target/status: preview / READY

Canonical verification temporarily changed one Neon staging Product to `ACTIVE + indexed`, fetched the protected Preview sitemap, and observed:

`https://deskholt.vercel.app/products/uplift-v2-standing-desk-bamboo-gray`

The Product was restored to `DRAFT + non-indexed` in cleanup.

## Final Preview smoke

- `/`: 200
- `/category/standing-desks`: 200
- `/sitemap.xml`: 200
- `/admin/products`: 307 to authentication
- seeded DRAFT Product detail: 404
- seeded DRAFT Product commerce route: 404

Vercel error-log query after validation: no errors found.

## Review verdict

No reproducible Critical or Important source-code defect was found after the canonical configuration fix. Remaining non-blocking warning: Next.js deprecates the `middleware` filename in favor of `proxy`; migration is outside P0-A3 scope.
