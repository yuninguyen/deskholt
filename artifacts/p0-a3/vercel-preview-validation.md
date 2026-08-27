# P0-A3 Vercel Preview Validation

Date: 2026-08-27

## Deployment

- Git branch: `p0-a3-vercel-preview`
- Remote HEAD: `d8d2839fa6f63aab9cf3c7b3a628cca1c383dc08`
- Vercel project: `yuninguyens-projects/deskholt`
- Preview deployment: `https://deskholt-cyaybuocz-yuninguyens-projects.vercel.app`
- Deployment ID: `dpl_2LgemxiCFYrGT5KVpZZsVxMRm7Rc`
- Target/status: `preview` / `READY`
- Runtime: Node.js 24.x, Next.js 16.3.0, Prisma 5.22.0

Preview uses the separately provisioned Neon staging resource `neon-byzantine-fence`. Baseline and P0-A3 migrations applied successfully and the staging seed created 20 `DRAFT + non-indexed` Products.

## Preview-only configuration

Generated, non-production values were configured for Preview only:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `CLICK_HASH_SALT`
- `NEXT_PUBLIC_APP_URL`

Neon supplies the Preview database variables. No credential values are recorded in this evidence.

## Route smoke

- `/`: 200
- `/category/standing-desks`: 200
- `/sitemap.xml`: 200
- `/admin/products`: 307 to authentication
- seeded DRAFT Product detail: 404
- seeded DRAFT Product commerce route: 404

## Lifecycle verification on Neon staging

The production `createPrismaPublishingStore` and `executePublishingCommand` path was used against one owned staging Product, with HTTP observations through the protected Vercel Preview deployment:

1. `DRAFT + false`: command PASS; Product detail 404.
2. `ACTIVE + false`: command PASS; Product detail 200; sitemap 200 without the slug.
3. `ACTIVE + true`: enable-index command PASS; sitemap 200 containing the slug; category 200 containing the slug.
4. `BLOCKED + false`: lifecycle command PASS and index normalized false; Product detail 404; sitemap 200 without the slug.
5. Cleanup: Product restored to `DRAFT + false`.

Local connections to the serverless Neon endpoint required retries during wake/connect periods; Vercel runtime requests remained successful. This was staging-only validation. No production database was used or modified.
