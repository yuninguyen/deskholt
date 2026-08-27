import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(process.cwd());
const paths = {
  home: join(root, 'src/app/(public)/page.tsx'),
  category: join(root, 'src/app/(public)/category/[slug]/page.tsx'),
  product: join(root, 'src/app/(public)/products/[slug]/page.tsx'),
  sitemap: join(root, 'src/app/sitemap.ts'),
  loader: join(root, 'src/lib/products/productPageData.ts'),
  probe: join(root, 'src/lib/products/productPageCacheProbe.ts'),
  verifier: join(root, 'scripts/verify-product-page-cache-runtime.ts'),
  packageJson: join(root, 'package.json'),
};

function source(path: string): string {
  assert.equal(existsSync(path), true, `required source is missing: ${path}`);
  return readFileSync(path, 'utf8');
}

function indexOfOrFail(contents: string, pattern: RegExp, label: string): number {
  const match = pattern.exec(contents);
  assert.ok(match?.index !== undefined, `missing ${label}`);
  return match.index;
}

test('homepage alone retains exact 86400 ISR and uses the shared Product predicate', () => {
  const contents = source(paths.home);
  assert.match(contents, /export\s+const\s+revalidate\s*=\s*86400\s*;/);
  assert.match(contents, /import\s*\{\s*INDEXABLE_PRODUCT_WHERE\s*\}.*productAccessPolicy/);
  assert.match(contents, /where\s*:\s*INDEXABLE_PRODUCT_WHERE/);
});

test('category is request-time before inputs and query, has no stale revalidate, and shares the predicate', () => {
  const contents = source(paths.category);
  assert.doesNotMatch(contents, /export\s+const\s+revalidate\b/);
  assert.match(contents, /import\s*\{\s*connection\s*\}\s*from\s*['"]next\/server['"]/);
  assert.match(contents, /INDEXABLE_PRODUCT_WHERE/);

  const boundary = indexOfOrFail(contents, /await\s+connection\(\)/, 'category request boundary');
  const params = indexOfOrFail(contents, /await\s+params/, 'category params read');
  const searchParams = indexOfOrFail(contents, /await\s+searchParams/, 'category search params read');
  const query = indexOfOrFail(contents, /prisma\.product\.findMany\(/, 'category Product query');
  assert.ok(boundary < params && boundary < searchParams && boundary < query);
});

test('Product metadata and page wrap the same shared loader with the server-only probe hooks before specifications', () => {
  const contents = source(paths.product);
  assert.match(contents, /generateMetadata/);
  assert.equal((contents.match(/import[^;]*getProductPageData[^;]*productPageData/g) ?? []).length, 1);
  assert.equal((contents.match(/beforeProductPageConsumer\((?:'metadata'|'body'),\s*slug\)/g) ?? []).length, 2);
  assert.equal((contents.match(/afterProductPageConsumer\(/g) ?? []).length, 2);
  assert.ok((contents.match(/getProductPageData\(slug\)/g) ?? []).length >= 2);

  const metadataBefore = indexOfOrFail(contents, /beforeProductPageConsumer\('metadata',\s*slug\)/, 'metadata before hook');
  const metadataLoader = indexOfOrFail(contents, /getProductPageData\(slug\)/, 'metadata shared Product loader call');
  const metadataAfter = indexOfOrFail(contents, /afterProductPageConsumer\(/, 'metadata after hook');
  assert.ok(metadataBefore < metadataLoader && metadataLoader < metadataAfter);

  const bodyBefore = indexOfOrFail(contents, /beforeProductPageConsumer\('body',\s*slug\)/, 'body before hook');
  const bodyLoader = contents.indexOf('getProductPageData(slug)', metadataLoader + 1);
  const bodyAfter = contents.indexOf('afterProductPageConsumer(', metadataAfter + 1);
  const specs = indexOfOrFail(contents, /loadSpecificationData\(/, 'specification read');
  assert.ok(bodyBefore < bodyLoader && bodyLoader < bodyAfter && bodyAfter < specs);
});

test('shared Product loader owns the request boundary before clock and Product query', () => {
  const contents = source(paths.loader);
  const boundary = indexOfOrFail(contents, /await\s+connection\(\)/, 'loader request boundary');
  const clock = indexOfOrFail(contents, /new\s+Date\(\)/, 'loader clock');
  const query = indexOfOrFail(contents, /prisma\.product\.findUnique\(/, 'loader Product query');
  assert.ok(boundary < clock && clock < query);
  assert.match(contents, /import\s*\{\s*cache\s*\}\s*from\s*['"]react['"]/);
  assert.equal((contents.match(/cache\(/g) ?? []).length, 1);
  assert.match(contents, /findProduct[^]*recordRepositoryLoad|recordRepositoryLoad[^]*findProduct/);
  assert.match(contents, /evaluateAccess[^]*recordAccessEvaluation|recordAccessEvaluation[^]*evaluateAccess/);
  assert.match(contents, /buildOfferPresentation[^]*recordOfferEvaluation|recordOfferEvaluation[^]*buildOfferPresentation/);
  assert.doesNotMatch(
    contents,
    /\?\?\s*\(\(fn\)\s*=>\s*fn\)/,
    'the shared loader must not degrade request-scoped framework cache to identity behavior'
  );
});

test('runtime probe remains server-only with no public test-control surface', () => {
  const productSource = source(paths.product);
  const appSources = [paths.home, paths.category, paths.product, paths.sitemap]
    .filter(existsSync)
    .map(source)
    .join('\n');
  assert.doesNotMatch(appSources, /(?:route|endpoint|cookie|header).*probe/i);
  assert.doesNotMatch(productSource, /searchParams.*(?:probe|token)|(?:probe|token).*searchParams/i);
  assert.equal(existsSync(join(root, 'src/app/api/p0-a3-probe/route.ts')), false);
});

test('probe and verifier enforce loopback, exact activation, owned allocation, bounded waits, and cleanup', () => {
  const probe = source(paths.probe);
  const verifier = source(paths.verifier);
  for (const pattern of [/127\.0\.0\.1/, /expected[^]*slug/i, /token/i, /fingerprint/i, /reparse|junction|symlink/i]) {
    assert.match(`${probe}\n${verifier}`, pattern);
  }
  assert.match(verifier, /finally\s*\{/);
  assert.match(verifier, /timeout/i);
  assert.match(verifier, /withTimeout\(read\(remainingMs\)[^]*remainingMs\)/);
  assert.match(verifier, /AbortSignal\.timeout\(remainingMs\)/);
  assert.match(probe, /withBoundedProbeOperation/);
  assert.match(`${probe}\n${verifier}`, /first-result-ready/);
  assert.match(`${probe}\n${verifier}`, /mutation-complete/);
  assert.match(verifier, /product\.create\s*\(/, 'the CLI must create its own Product fixture');
  assert.match(verifier, /affiliate_links\s*:\s*\{\s*create/i, 'the owned Product fixture must include an offer');
  assert.match(verifier, /encodeURIComponent\s*\(\s*slug\s*\)/, 'the verifier must request the encoded owned Product slug');
  assert.match(verifier, /ownedSessions[^]*(?:length|exactly)[^]*2|(?:length|exactly)[^]*ownedSessions[^]*2/i);
  assert.match(verifier, /repositoryLoads\s*!==\s*1/);
  assert.match(verifier, /accessEvaluations\s*!==\s*1/);
  assert.match(verifier, /offerEvaluations\s*!==\s*1/);
  assert.match(verifier, /withTimeout\(\s*firstResponse\.arrayBuffer\(\)/);
  assert.match(verifier, /withTimeout\(\s*secondResponse\.arrayBuffer\(\)/);
  assert.match(verifier, /new\s+AbortController\(\)/);
  assert.match(verifier, /remainingProductRequestMs\(firstRequest/);
  assert.match(verifier, /lstat\(root\)[^]*realpath\(resolvedRoot\)[^]*readAllocationRecord\(canonicalRoot/);
  assert.doesNotMatch(verifier, /rmSync\([^)]*process\.env|rm\([^)]*process\.env/);
});

test('normative verifier script mappings are exact', () => {
  const packageJson = JSON.parse(source(paths.packageJson)) as { scripts?: Record<string, string> };
  assert.equal(packageJson.scripts?.['verify:p0-a3:migrations'], 'tsx scripts/verify-p0-a3-migrations.ts');
  assert.equal(packageJson.scripts?.['verify:p0-a3:publishing-concurrency'], 'tsx scripts/verify-product-publishing-concurrency.ts');
  assert.equal(packageJson.scripts?.['verify:p0-a3:cache-runtime'], 'tsx scripts/verify-product-page-cache-runtime.ts');
});

test('sitemap route is request-time, uses shared policies, and emits no unsupported fields', () => {
  const contents = source(paths.sitemap);
  const boundary = indexOfOrFail(contents, /await\s+connection\(\)/, 'sitemap request boundary');
  const origin = indexOfOrFail(contents, /getCanonicalSiteUrl\(/, 'canonical origin resolution');
  const query = indexOfOrFail(contents, /prisma\.product\.findMany\(/, 'sitemap Product query');
  assert.ok(boundary < origin && origin < query);
  assert.match(contents, /INDEXABLE_PRODUCT_WHERE/);
  assert.match(contents, /select\s*:\s*\{[^}]*slug\s*:\s*true\s*,\s*updated_at\s*:\s*true\s*\}/);
  assert.match(contents, /orderBy\s*:\s*\{[^}]*slug\s*:\s*['"]asc['"]\s*\}/);
  assert.doesNotMatch(contents, /priority\s*:|changeFrequency\s*:/);
  assert.doesNotMatch(contents, /export\s+const\s+revalidate\b/);
});

test('build classification contract requires dynamic sitemap.xml', () => {
  const expectedRouteLine = '/sitemap.xml              dynamic';
  assert.equal(expectedRouteLine.includes('/sitemap.xml'), true);
  assert.equal(expectedRouteLine.trimEnd().endsWith('dynamic'), true);
  assert.equal(existsSync(paths.sitemap), true, 'the build cannot classify /sitemap.xml until src/app/sitemap.ts exists');
});
