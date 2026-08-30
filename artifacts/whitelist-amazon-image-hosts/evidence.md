# Whitelist Amazon image hosts — evidence

## Config change

`next.config.mjs` retains the existing Unsplash pattern and adds only:

```js
{ protocol: 'https', hostname: 'm.media-amazon.com' },
{ protocol: 'https', hostname: '**.ssl-images-amazon.com' },
```

No application logic, dependency, lockfile, test, or script changed.

## Local checks

- `npm run lint`: pass.
- `npx tsc --noEmit`: pass.
- `npm test`: 310 pass, 0 fail, 8 opt-in skip.
- `next.config.mjs` import showed the expected three remote patterns.

A local `npm run build` compiled and typechecked successfully, then stopped during prerender of `/` because this sandbox worktree has no `DATABASE_URL`.

## External disposable-database verification

An independent verification run on this exact worktree used a disposable PostgreSQL database, applied migrations, and created a temporary Product with this real Amazon image URL:

```
https://m.media-amazon.com/images/I/61ZR4GuC3FL._AC_SX679_.jpg
```

Results:

1. Dev-server requests to `/category/standing-desks` (the route that previously crashed) and `/products/image-host-test-desk` both returned HTTP 200 with no image-host error string.
2. The rendered `srcSet` contained the expected `/_next/image?url=...m.media-amazon.com...` URL.
3. Requesting that optimization endpoint returned HTTP 200 with `content-type: image/jpeg`, confirming Next.js fetched and optimized the Amazon image.
4. `npm test` completed with 310 pass, 0 fail, and 8 opt-in skip.
5. `npm run build` completed successfully with 13/13 pages.

The temporary Product, disposable database, and test script were removed after verification.
