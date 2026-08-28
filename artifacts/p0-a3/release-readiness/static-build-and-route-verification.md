# P0-A3 Static, Build, and Route Verification

Date: 2026-08-27

Fresh results:

- `npm run lint`: PASS, zero warnings;
- `npx tsc --noEmit --incremental false --pretty false`: PASS;
- `npm test`: PASS, 171/171;
- `npm run build`: PASS with Next.js 16.3.0 and React 19.0.0.

Build route classification:

- homepage `/`: static with 1-day revalidation;
- `/category/[slug]`: dynamic;
- `/products/[slug]`: dynamic;
- `/sitemap.xml`: dynamic;
- `/go/[slug]`: dynamic;
- `/admin/products`: dynamic.

Built artifact smoke on `127.0.0.1:49780` against the explicit disposable migrated database:

- `/`: 200;
- `/category/standing-desks`: 200;
- `/products/nonexistent-p0-a3-smoke`: 404;
- `/sitemap.xml`: 200;
- `/admin/products`: 307 to authentication;
- `/go/nonexistent-p0-a3-smoke`: 302 preserving approved missing-product fallback.

Non-blocking warning: Next reports the existing middleware convention is deprecated in favor of proxy. FR-061 explicitly excludes middleware/proxy migration from P0-A3.