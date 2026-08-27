import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(process.cwd());
const publishingVerifierPath = join(root, 'scripts/verify-product-publishing-concurrency.ts');
const cacheVerifierPath = join(root, 'scripts/verify-product-page-cache-runtime.ts');

function source(path: string): string {
  return readFileSync(path, 'utf8');
}

const publishingVerifier = source(publishingVerifierPath);
const cacheVerifier = source(cacheVerifierPath);
const cacheProbe = source(join(root, 'src/lib/products/productPageCacheProbe.ts'));

test('production publishing adapter holds the fixture row with a real PostgreSQL row lock', () => {
  assert.match(
    publishingVerifier,
    /SELECT[^;]*(?:FOR\s+(?:NO\s+KEY\s+)?UPDATE|FOR\s+SHARE)/i,
    'the production adapter must execute SELECT ... FOR UPDATE/SHARE against the fixture row'
  );
});

test('production publishing adapter keeps each racing command in an explicit transaction', () => {
  assert.match(
    publishingVerifier,
    /\$transaction\s*\(|\bBEGIN\b[^]*\bCOMMIT\b/i,
    'the production adapter must use real PostgreSQL transactions rather than no-op commit methods'
  );
  assert.doesNotMatch(
    publishingVerifier,
    /commit:\s*async\s*\([^)]*\)\s*=>\s*undefined/,
    'the production adapter commit operation must not be a no-op'
  );
});

test('production publishing verifier uses a real barrier so the blocked command is pending before lock release', () => {
  assert.match(
    publishingVerifier,
    /barrier|deferred|blocked-command|lock-acquired|release-lock|waitFor/i,
    'the verifier must expose deterministic lock-acquired/blocked/release barrier semantics'
  );
  assert.match(
    publishingVerifier,
    /Promise\.all|Promise\.allSettled|\.then\s*\(/,
    'the two database commands must overlap instead of running sequentially'
  );
});

test('production publishing verifier derives migration currency from PostgreSQL migration history', () => {
  assert.match(
    publishingVerifier,
    /_prisma_migrations|migration[^]*history|finished_at|rolled_back_at/i,
    'the verifier must inspect applied migration history before declaring the target current'
  );
  assert.doesNotMatch(
    publishingVerifier,
    /migrationStatus:\s*['"]current['"]/,
    'the production fingerprint must not hard-code migrationStatus to current'
  );
  assert.match(
    publishingVerifier,
    /20260827014500_baseline_existing_schema[^]*03d3378b0acb2ecde7d797b8061e485159c114ed64504f4f9ad0fa877565103f/i,
    'the verifier must require the approved baseline migration name and checksum'
  );
  assert.match(
    publishingVerifier,
    /20260827020000_p0_a3_basic_index_gate[^]*263f524ee8357ae863677ea88fdff10b2909803dbb01f907e9c5df867f6eaab6/i,
    'the verifier must require the P0-A3 migration name and checksum'
  );
  assert.match(
    publishingVerifier,
    /migrationRows[^]*(?:length|every|some)[^]*(?:finished_at|rolled_back_at|checksum)/i,
    'the verifier must reject missing, failed, rolled-back, checksum-mismatched, and extra migration rows'
  );
});

test('cache probe validates owned allocation and filesystem identity without swallowing probe refusals', () => {
  assert.match(cacheProbe, /import\s*\{\s*cache\s*\}\s*from\s*['"]react['"]/);
  assert.match(cacheProbe, /lstat/);
  assert.match(cacheProbe, /realpath/);
  assert.match(cacheProbe, /allocation\.json/);
  assert.match(cacheProbe, /ownedSessions/);
  assert.match(cacheProbe, /flag:\s*['"]wx['"]/);
  assert.doesNotMatch(
    cacheProbe,
    /\?\?\s*\(\(fn\)\s*=>\s*fn\)/,
    'plain Node must not silently replace request-scoped React cache with identity behavior'
  );
  assert.doesNotMatch(
    cacheProbe,
    /catch\s*\{[^]*probe root may not be a symlink or junction/,
    'the probe must not catch and suppress its own fail-closed symlink/junction refusal'
  );
});

test('cache probe bounds each filesystem operation inside lock and signal waits', () => {
  assert.match(cacheProbe, /async\s+function\s+withBoundedProbeOperation/);
  for (const operation of ['mkdir', 'open', 'readFile', 'rename', 'rmdir']) {
    assert.match(
      cacheProbe,
      new RegExp(`withBoundedProbeOperation\\([^\\n]*${operation}|withBoundedProbeOperation\\([^]*?${operation}\\(`),
      `${operation} must not be able to outlive a probe deadline`
    );
  }
});

test('cache probe recomputes one absolute deadline across signal and lock attempts', () => {
  assert.match(cacheProbe, /remainingAfterOpenMs\s*=\s*Math\.max\(0,\s*deadline\s*-\s*Date\.now\(\)\)/);
  assert.match(cacheProbe, /remainingAfterCloseMs\s*=\s*Math\.max\(0,\s*deadline\s*-\s*Date\.now\(\)\)/);
  assert.match(cacheProbe, /Math\.min\(POLL_INTERVAL_MS,\s*remainingAfterCloseMs\)/);
  assert.match(cacheProbe, /lockSleepMs\s*=\s*Math\.min\(POLL_INTERVAL_MS/);
});

test('cache probe persists only bounded session events and barrier state', () => {
  assert.match(cacheProbe, /first-result-ready/);
  assert.match(cacheProbe, /mutation-complete/);
  assert.match(cacheProbe, /timeout/i);
  assert.match(cacheProbe, /session\.json/);
  assert.doesNotMatch(
    cacheProbe,
    /(?:header|cookie|route handler|searchParams)/i,
    'the cache probe must remain a server-only filesystem protocol'
  );
});

test('cache verifier CLI invokes verification instead of accepting configured no-op success', () => {
  assert.match(
    cacheVerifier,
    /async\s+function\s+main\s*\([^)]*\)[\s\S]*await\s+runCacheRuntimeVerification\s*\(/,
    'the CLI must invoke the verifier; environment validation alone is not evidence'
  );
  assert.match(
    cacheVerifier,
    /catch\s*\([^)]*\)[\s\S]*process\.exitCode\s*=\s*1/,
    'a failed runtime proof must exit non-zero rather than claim success'
  );
});

test('cache verifier bounds every poll attempt and aborts readiness fetches', () => {
  assert.match(cacheVerifier, /remainingMs\s*=\s*Math\.max/);
  assert.match(cacheVerifier, /withTimeout\(read\(remainingMs\)[^]*remainingMs\)/);
  assert.match(cacheVerifier, /fetch\(baseUrl,\s*\{\s*signal:\s*AbortSignal\.timeout\(remainingMs\)/);
  assert.match(cacheVerifier, /readAllocationRecord\([^,]+,\s*remainingMs\)/);
  assert.match(cacheVerifier, /readSession\([^,]+,\s*remainingMs\)/);
});

test('cache verifier starts the built Next application itself on loopback', () => {
  assert.match(
    cacheVerifier,
    /from\s+['"]node:child_process['"]|require\(['"]node:child_process['"]\)/,
    'the verifier must own a managed Next child process'
  );
  assert.match(
    cacheVerifier,
    /(?:next\s+start|['"]start['"])[^]*(?:127\.0\.0\.1|LOOPBACK_HOST)/i,
    'the managed process must run the built Next application bound to 127.0.0.1'
  );
  assert.match(
    cacheVerifier,
    /\.next[^]*(?:BUILD_ID|build)|(?:BUILD_ID|build)[^]*\.next/i,
    'the verifier must refuse to run unless a built Next output exists'
  );
});

test('cache verifier owns a random slug, activation token, and available port for every run', () => {
  assert.match(cacheVerifier, /randomUUID\s*\(|randomBytes\s*\(/, 'slug/token values must be unguessable');
  assert.match(
    cacheVerifier,
    /findAvailableLoopbackPort\s*\(\)/,
    'the verifier must allocate its own random loopback port'
  );
  assert.doesNotMatch(
    cacheVerifier,
    /input:\s*\{[^}]*(?:baseUrl|expectedSlug|activationToken)\s*:/,
    'callers must not supply the supposedly owned URL, slug, or activation token'
  );
});

test('cache verifier waits for first-result-ready before mutating and releases mutation-complete before awaiting the response', () => {
  const requestStart = cacheVerifier.search(/const\s+firstRequest\s*=\s*startProductRequest\s*\(/);
  const waitForFirstResultOffset = cacheVerifier.slice(requestStart).search(/const\s+firstPending\s*=\s*await\s+waitForSessionBarrier/);
  const waitForFirstResult = waitForFirstResultOffset < 0 ? -1 : requestStart + waitForFirstResultOffset;
  const mutation = cacheVerifier.search(/await\s+withTimeout\(input\.mutate\([^)]*\)/);
  const releaseMutation = cacheVerifier.search(/await\s+createMutationComplete\(firstPending\.root\)/);
  const awaitResponse = cacheVerifier.indexOf('const firstResponse', releaseMutation);

  assert.ok(requestStart >= 0, 'the first HTTP request must be started');
  assert.ok(waitForFirstResult > requestStart, 'the driver must await the real first-result-ready barrier');
  assert.ok(mutation > waitForFirstResult, 'isolated data mutation must happen only after the first consumer result');
  assert.ok(releaseMutation > mutation, 'mutation-complete must be signalled after the mutation');
  assert.ok(awaitResponse > releaseMutation, 'the response must remain pending until the between-consumer mutation is released');
});

test('cache verifier proves two independent HTTP requests use distinct request sessions', () => {
  assert.ok(
    (cacheVerifier.match(/(?:request|fetch)\s*\(/g) ?? []).length >= 2,
    'the verifier must make two Product requests without restarting the server'
  );
  assert.match(
    cacheVerifier,
    /session(?:Id|ID)[^]*(?:notEqual|!==|distinct|different)|(?:notEqual|!==|distinct|different)[^]*session(?:Id|ID)/i,
    'the verifier must compare request session IDs and reject reuse'
  );
  assert.match(
    cacheVerifier,
    /metadata[^]*(?:page|body)[^]*(?:session|result|timestamp)|(?:page|body)[^]*metadata[^]*(?:session|result|timestamp)/i,
    'the verifier must prove metadata and body observations belong to the same first-request session'
  );
});

test('cache verifier fingerprints PostgreSQL and owns one public Product plus AffiliateLink fixture', () => {
  assert.match(cacheVerifier, /@prisma\/client/, 'the verifier must use Prisma against the explicit PostgreSQL URL');
  assert.match(
    cacheVerifier,
    /clusterSystemIdentifier|pg_control_system|databaseOid|current_database|current_schema/i,
    'the verifier must derive and compare the disposable PostgreSQL fingerprint'
  );
  assert.match(cacheVerifier, /product\.create\s*\(/, 'the CLI workflow must create an owned Product fixture');
  assert.match(cacheVerifier, /affiliate_links\s*:\s*\{\s*create/i, 'the fixture must include an AffiliateLink');
  assert.match(cacheVerifier, /status\s*:\s*['"]ACTIVE['"]/);
  assert.match(cacheVerifier, /is_indexed\s*:\s*true/);
  assert.match(cacheVerifier, /encodeURIComponent\s*\(\s*slug\s*\)/, 'the real Product URL must encode the owned slug');
});

test('cache verifier validates complete per-request session evidence and changed second result', () => {
  assert.match(cacheVerifier, /counters\.claims|claims\s*===?\s*2/);
  assert.match(cacheVerifier, /counters\.observations|observations\s*===?\s*2/);
  assert.match(cacheVerifier, /repositoryLoads\s*!==\s*1/);
  assert.match(cacheVerifier, /accessEvaluations\s*!==\s*1/);
  assert.match(cacheVerifier, /offerEvaluations\s*!==\s*1/);
  assert.match(cacheVerifier, /metadata[^]*(?:body|page)[^]*(?:resultVersion|evaluatedAt)/i);
  assert.match(cacheVerifier, /resultVersion[^]*(?:notEqual|!==|changed|fresh)/i);
  assert.match(cacheVerifier, /evaluatedAt[^]*(?:notEqual|!==|changed|fresh)/i);
  assert.match(cacheVerifier, /ownedSessions[^]*(?:length|exactly)[^]*2|(?:length|exactly)[^]*ownedSessions[^]*2/i);
});

test('cache verifier gives each Product request one abortable absolute deadline across headers and bodies', () => {
  assert.match(cacheVerifier, /function\s+startProductRequest/);
  assert.match(cacheVerifier, /new\s+AbortController\(\)/);
  assert.match(cacheVerifier, /fetch\(url,\s*\{\s*signal:\s*controller\.signal\s*\}\)/);
  assert.match(cacheVerifier, /deadline\s*=\s*Date\.now\(\)\s*\+\s*TIMEOUT_MS/);
  assert.match(cacheVerifier, /remainingProductRequestMs\(firstRequest/);
  assert.match(cacheVerifier, /remainingProductRequestMs\(secondRequest/);
  assert.match(cacheVerifier, /activeRequestControllers[^]*controller\.abort/);
});

test('cache verifier bounds both Product response bodies and rejects privileged ports', () => {
  assert.match(cacheVerifier, /port\s*<\s*1024|port\s*>=\s*1024/, 'the allocated port must be non-privileged');
  assert.match(cacheVerifier, /withTimeout\(\s*firstResponse\.arrayBuffer\(\),\s*['"]first Product response body['"][^]*remainingProductRequestMs\(firstRequest/);
  assert.match(cacheVerifier, /withTimeout\(\s*secondResponse\.arrayBuffer\(\),\s*['"]second Product response body['"][^]*remainingProductRequestMs\(secondRequest/);
  assert.match(cacheVerifier, /withTimeout\(\s*firstResponse\.text\(\),\s*['"]first Product error response body['"][^]*remainingProductRequestMs\(firstRequest/);
  assert.match(cacheVerifier, /withTimeout\(\s*secondResponse\.text\(\),\s*['"]second Product error response body['"][^]*remainingProductRequestMs\(secondRequest/);
});

test('cache verifier rejects a replaced owned root before canonicalization or allocation reads', () => {
  const cleanup = cacheVerifier.slice(cacheVerifier.indexOf('async function cleanupOwnedProbeRoot'));
  const rootLstat = cleanup.indexOf('lstat(root)');
  const rootRealpath = cleanup.indexOf('realpath(resolvedRoot)');
  const allocationRead = cleanup.indexOf('readAllocationRecord(canonicalRoot');
  assert.ok(rootLstat >= 0 && rootLstat < rootRealpath, 'owned root lstat must precede realpath');
  assert.ok(rootRealpath < allocationRead, 'canonical identity must be verified before allocation reads');
  assert.match(cleanup, /rootStat\.isSymbolicLink\(\)/);
  assert.match(cleanup, /canonicalRoot\s*!==\s*resolvedRoot/);
});

test('cache verifier shares one bounded deadline across every finally cleanup operation', () => {
  assert.match(cacheVerifier, /cleanupDeadline\s*=\s*Date\.now\(\)\s*\+\s*TIMEOUT_MS/);
  assert.match(cacheVerifier, /runCleanupOperation\(['"]Next process termination['"]/);
  assert.match(cacheVerifier, /runCleanupOperation\(['"]owned fixture deletion['"]/);
  assert.match(cacheVerifier, /runCleanupOperation\(['"]Prisma disconnect['"]/);
  assert.match(cacheVerifier, /runCleanupOperation\(['"]owned probe root cleanup['"]/);
  assert.match(cacheVerifier, /withTimeout\(operation\(\),\s*label,\s*remainingMs\)/);
});

test('cache verifier cleanup terminates its server and removes only recorded owned database and session resources', () => {
  assert.match(cacheVerifier, /(?:kill|terminate|SIGTERM|taskkill)/i, 'cleanup must terminate the owned Next process');
  assert.match(
    cacheVerifier,
    /(?:deleteMany|DELETE\s+FROM|cleanupFixture|removeFixture)/i,
    'cleanup must remove only the verifier-owned Product/AffiliateLink fixture rows'
  );
  assert.match(
    cacheVerifier,
    /allocation(?:Record|Manifest)|ownedSessions|sessionSubtrees/i,
    'filesystem cleanup must be driven by an owned allocation record'
  );
  assert.doesNotMatch(
    cacheVerifier,
    /rm\(sessionRoot,\s*\{\s*recursive:\s*true,\s*force:\s*true\s*\}\)/,
    'cleanup must not recursively delete the entire root without validating recorded owned session subtrees'
  );
});
