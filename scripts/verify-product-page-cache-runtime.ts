import { randomUUID } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { lstat, mkdtemp, open, readFile, realpath, rm, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:net';
import { PrismaClient } from '@prisma/client';

const TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 25;
const LOOPBACK_HOST = '127.0.0.1';

type AllocationRecord = {
  root: string;
  slug: string;
  token: string;
  port: number;
  ownedSessions: string[];
};

type ProbeEvent = {
  type: 'claim' | 'observation';
  consumer: 'metadata' | 'body';
  slug?: string;
  resultVersion?: string;
  evaluatedAt?: string;
};

type ProbeSession = {
  id: string;
  expectedSlug: string;
  counters: {
    claims: number;
    observations: number;
    repositoryLoads: number;
    accessEvaluations: number;
    offerEvaluations: number;
  };
  barriers: { firstResultReady: boolean; mutationComplete: boolean };
  resultVersion: string | null;
  evaluatedAt: string | null;
  events: ProbeEvent[];
};

type FixtureMutation = {
  prisma: PrismaClient;
  productId: string;
  slug: string;
};

type CacheRuntimeInput = {
  databaseUrl: string;
  expectedFingerprint: string;
  mutate: (fixture: FixtureMutation) => Promise<void>;
};

export type CacheRuntimeReport = {
  target: string;
  slug: string;
  port: number;
  firstSessionId: string;
  secondSessionId: string;
  firstResultVersion: string;
  secondResultVersion: string;
  firstEvaluatedAt: string;
  secondEvaluatedAt: string;
};

export function assertLoopbackUrl(url: string): URL {
  const parsed = new URL(url);
  if (parsed.hostname !== LOOPBACK_HOST) throw new Error('cache verifier requires loopback 127.0.0.1');
  if (!parsed.port) throw new Error('cache verifier requires a dedicated high port');
  return parsed;
}

export async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type ProductRequest = {
  controller: AbortController;
  deadline: number;
  timer: ReturnType<typeof setTimeout>;
  response: Promise<Response>;
};

function startProductRequest(
  url: URL,
  label: string,
  activeRequestControllers: Set<AbortController>
): ProductRequest {
  const controller = new AbortController();
  const deadline = Date.now() + TIMEOUT_MS;
  activeRequestControllers.add(controller);
  const timer = setTimeout(
    () => controller.abort(new Error(`${label} exceeded its absolute request deadline`)),
    TIMEOUT_MS
  );
  return {
    controller,
    deadline,
    timer,
    response: fetch(url, { signal: controller.signal }),
  };
}

function remainingProductRequestMs(request: ProductRequest, label: string): number {
  const remainingMs = Math.max(0, request.deadline - Date.now());
  if (remainingMs === 0) {
    request.controller.abort(new Error(`${label} exceeded its absolute request deadline`));
    throw new Error(`${label} absolute request deadline exhausted`);
  }
  return remainingMs;
}

function finishProductRequest(request: ProductRequest, activeRequestControllers: Set<AbortController>): void {
  clearTimeout(request.timer);
  activeRequestControllers.delete(request.controller);
}

async function poll<T>(label: string, read: (remainingMs: number) => Promise<T | null>): Promise<T> {
  const deadline = Date.now() + TIMEOUT_MS;
  let lastDiagnostic = 'no observation';
  while (Date.now() < deadline) {
    const remainingMs = Math.max(1, deadline - Date.now());
    try {
      const value = await withTimeout(read(remainingMs), `${label} poll operation`, remainingMs);
      if (value !== null) return value;
    } catch (error) {
      lastDiagnostic = error instanceof Error ? error.message : String(error);
    }
    const sleepMs = Math.min(POLL_INTERVAL_MS, Math.max(0, deadline - Date.now()));
    if (sleepMs > 0) await new Promise((resolve) => setTimeout(resolve, sleepMs));
  }
  throw new Error(`${label} timeout after ${TIMEOUT_MS}ms (${lastDiagnostic})`);
}

async function allocateOwnedProbeRoot(): Promise<string> {
  const parent = await realpath(tmpdir());
  const child = await mkdtemp(path.join(parent, 'deskholt-p0-a3-cache-'));
  const canonicalChild = await realpath(child);
  if (canonicalChild === parent || canonicalChild === path.parse(parent).root || !canonicalChild.startsWith(`${parent}${path.sep}`)) {
    throw new Error('owned probe child escaped temp parent');
  }
  return canonicalChild;
}

export async function findAvailableLoopbackPort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, LOOPBACK_HOST, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('could not allocate loopback port')));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForOwnedNextExit(child: ChildProcess, label: string): Promise<void> {
  if (child.exitCode !== null) return;
  await withTimeout(new Promise<void>((resolve) => child.once('exit', () => resolve())), label);
}

async function forceTerminateOwnedNext(child: ChildProcess): Promise<void> {
  if (process.platform !== 'win32' || !child.pid) {
    if (!child.kill('SIGKILL')) throw new Error('Next process rejected forced termination');
    return;
  }
  const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
  await withTimeout(
    new Promise<void>((resolve, reject) => {
      killer.once('error', reject);
      killer.once('close', (code) => (code === 0 ? resolve() : reject(new Error(`taskkill exited ${code}`))));
    }),
    'Next process forced termination'
  );
}

async function terminateOwnedNext(child: ChildProcess): Promise<void> {
  if (child.exitCode === null) {
    if (!child.kill('SIGTERM')) throw new Error('Next process rejected SIGTERM');
    try {
      await waitForOwnedNextExit(child, 'Next process termination');
    } catch {
      await forceTerminateOwnedNext(child);
      return;
    }
  }
}

async function waitForReady(baseUrl: URL, child: ChildProcess, diagnostics: string[]): Promise<void> {
  await poll('built Next loopback readiness', async (remainingMs) => {
    if (child.exitCode !== null) throw new Error(`Next exited early with code ${child.exitCode}: ${diagnostics.join('')}`);
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(remainingMs) });
      return response.ok || response.status === 404 ? true : null;
    } catch {
      return null;
    }
  });
}

async function fingerprintDatabase(prisma: PrismaClient): Promise<string> {
  const identity = await prisma.$queryRaw<Array<{ databaseOid: bigint; databaseName: string; schema: string }>>`
    SELECT d.oid AS "databaseOid", current_database() AS "databaseName", current_schema() AS "schema"
    FROM pg_database d
    WHERE d.datname = current_database()
  `;
  let clusterSystemIdentifier = 'unavailable';
  try {
    const cluster = await prisma.$queryRaw<Array<{ clusterSystemIdentifier: bigint }>>`
      SELECT system_identifier AS "clusterSystemIdentifier" FROM pg_control_system()
    `;
    clusterSystemIdentifier = String(cluster[0]?.clusterSystemIdentifier ?? 'unavailable');
  } catch {
    // Some disposable roles cannot execute pg_control_system(); the approved fingerprint records that as unavailable.
  }
  const row = identity[0];
  if (!row) throw new Error('cache verifier could not fingerprint PostgreSQL target');
  return [clusterSystemIdentifier, String(row.databaseOid), row.databaseName, row.schema].join('/');
}

async function readAllocationRecord(root: string, timeoutMs = TIMEOUT_MS): Promise<AllocationRecord> {
  const contents = await withTimeout(
    readFile(path.join(root, 'allocation.json'), 'utf8'),
    'allocation record read',
    timeoutMs
  );
  const record = JSON.parse(contents) as AllocationRecord;
  if (record.root !== root || !Array.isArray(record.ownedSessions)) throw new Error('allocation record ownership mismatch');
  return record;
}

async function readSession(sessionRoot: string, timeoutMs = TIMEOUT_MS): Promise<ProbeSession> {
  const contents = await withTimeout(
    readFile(path.join(sessionRoot, 'session.json'), 'utf8'),
    'probe session read',
    timeoutMs
  );
  return JSON.parse(contents) as ProbeSession;
}

async function waitForSessionBarrier(root: string, expectedSessionCount: number): Promise<{ root: string; session: ProbeSession }> {
  return await poll(`first-result-ready for request ${expectedSessionCount}`, async (remainingMs) => {
    const allocationRecord = await readAllocationRecord(root, remainingMs);
    if (allocationRecord.ownedSessions.length > expectedSessionCount) {
      throw new Error(`unexpected ${allocationRecord.ownedSessions.length} owned sessions`);
    }
    if (allocationRecord.ownedSessions.length !== expectedSessionCount) return null;
    const sessionRoot = allocationRecord.ownedSessions[expectedSessionCount - 1];
    if (!sessionRoot || !existsSync(path.join(sessionRoot, 'first-result-ready'))) return null;
    return { root: sessionRoot, session: await readSession(sessionRoot, remainingMs) };
  });
}

async function createMutationComplete(sessionRoot: string): Promise<void> {
  const handle = await open(path.join(sessionRoot, 'mutation-complete'), 'wx');
  await handle.close();
}

function assertCompleteSession(session: ProbeSession, slug: string, label: string): {
  resultVersion: string;
  evaluatedAt: string;
} {
  if (session.expectedSlug !== slug) throw new Error(`${label} expected slug mismatch`);
  if (session.counters.claims !== 2 || session.counters.observations !== 2) {
    throw new Error(`${label} expected exactly two claims and observations: ${JSON.stringify(session)}`);
  }
  if (
    session.counters.repositoryLoads !== 1 ||
    session.counters.accessEvaluations !== 1 ||
    session.counters.offerEvaluations !== 1
  ) {
    throw new Error(`${label} expected exactly one repository load, access evaluation, and offer evaluation: ${JSON.stringify(session.counters)}`);
  }
  const claims = session.events.filter((event) => event.type === 'claim');
  const observations = session.events.filter((event) => event.type === 'observation');
  const consumers = new Set(observations.map((event) => event.consumer));
  if (claims.length !== 2 || observations.length !== 2 || !consumers.has('metadata') || !consumers.has('body')) {
    throw new Error(`${label} must contain metadata/body claims and observations: ${JSON.stringify(session.events)}`);
  }
  const resultVersions = new Set(observations.map((event) => event.resultVersion));
  const evaluatedTimes = new Set(observations.map((event) => event.evaluatedAt));
  if (resultVersions.size !== 1 || evaluatedTimes.size !== 1 || !session.resultVersion || !session.evaluatedAt) {
    throw new Error(`${label} metadata/body did not share one loader result and evaluation timestamp`);
  }
  if (!session.barriers.firstResultReady || !session.barriers.mutationComplete) {
    throw new Error(`${label} did not complete both scheduling barriers`);
  }
  return { resultVersion: session.resultVersion, evaluatedAt: session.evaluatedAt };
}

async function cleanupOwnedProbeRoot(root: string): Promise<void> {
  const rootStat = await lstat(root);
  if (rootStat.isSymbolicLink()) throw new Error('owned probe root may not be a symlink or junction');
  if (!rootStat.isDirectory()) throw new Error('owned probe root must remain a directory');
  const resolvedRoot = path.resolve(root);
  const canonicalRoot = await realpath(resolvedRoot);
  if (canonicalRoot !== resolvedRoot) throw new Error('owned probe root canonical identity changed');
  const allocationRecord = await readAllocationRecord(canonicalRoot);
  for (const sessionRoot of allocationRecord.ownedSessions) {
    const resolvedSession = path.resolve(sessionRoot);
    if (!resolvedSession.startsWith(`${canonicalRoot}${path.sep}`)) throw new Error('recorded session escapes owned root');
    const stat = await lstat(resolvedSession);
    if (stat.isSymbolicLink()) throw new Error('recorded session may not be a symlink or junction');
    const canonicalSession = await realpath(resolvedSession);
    if (canonicalSession !== resolvedSession || !canonicalSession.startsWith(`${canonicalRoot}${path.sep}`)) {
      throw new Error('recorded session canonical path mismatch');
    }
    await rm(canonicalSession, { recursive: true, force: false });
  }
  await unlink(path.join(canonicalRoot, 'allocation.json'));
  await rmdir(canonicalRoot);
  if (existsSync(canonicalRoot)) throw new Error('owned probe root still exists after cleanup');
}

export async function runCacheRuntimeVerification(input: CacheRuntimeInput): Promise<CacheRuntimeReport> {
  if (!input.databaseUrl.trim() || !input.expectedFingerprint.trim()) {
    throw new Error('explicit disposable cache datasource URL and fingerprint are required');
  }
  if (process.env.DATABASE_URL && input.databaseUrl === process.env.DATABASE_URL) {
    throw new Error('cache verifier refuses ambient DATABASE_URL');
  }
  if (!existsSync(path.join(process.cwd(), '.next', 'BUILD_ID'))) {
    throw new Error('cache verifier requires a built .next BUILD_ID artifact');
  }

  const prisma = new PrismaClient({ datasources: { db: { url: input.databaseUrl } } });
  const fixtureId = `p0-a3-cache-${randomUUID()}`;
  const slug = `p0-a3-cache-${randomUUID()}`;
  const token = randomUUID();
  let root: string | undefined;
  let child: ChildProcess | undefined;
  let fixtureCreated = false;
  let report: CacheRuntimeReport | undefined;
  const cleanupErrors: string[] = [];
  const activeRequestControllers = new Set<AbortController>();

  try {
    const actualFingerprint = await fingerprintDatabase(prisma);
    if (actualFingerprint !== input.expectedFingerprint) {
      throw new Error(`cache fingerprint mismatch: expected ${input.expectedFingerprint}, got ${actualFingerprint}`);
    }

    await prisma.product.create({
      data: {
        id: fixtureId,
        name: `Owned cache fixture ${fixtureId}`,
        slug,
        category: 'p0-a3-fixture',
        description: 'Owned disposable cache runtime fixture',
        image_url: 'https://example.test/cache-runtime.png',
        status: 'ACTIVE',
        is_indexed: true,
        affiliate_links: {
          create: {
            id: `p0-a3-cache-link-${randomUUID()}`,
            network: 'amazon',
            price: 101.01,
            raw_url: 'https://example.test/item',
            tracking_url: 'https://example.test/item?tag=p0-a3',
            is_in_stock: true,
            priority_order: 1,
          },
        },
      },
    });
    fixtureCreated = true;

    root = await allocateOwnedProbeRoot();
    const port = await findAvailableLoopbackPort();
    if (port < 1024) throw new Error(`cache verifier requires a non-privileged port, got ${port}`);
    const baseUrl = assertLoopbackUrl(`http://${LOOPBACK_HOST}:${port}`);
    const allocationRecord: AllocationRecord = { root, slug, token, port, ownedSessions: [] };
    await writeFile(path.join(root, 'allocation.json'), JSON.stringify(allocationRecord), { flag: 'wx' });

    const diagnostics: string[] = [];
    const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
    child = spawn(process.execPath, [nextBin, 'start', '-H', LOOPBACK_HOST, '-p', String(port)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: input.databaseUrl,
        NEXT_PUBLIC_SITE_URL: baseUrl.origin,
        P0_A3_PROBE_ROOT: root,
        P0_A3_PROBE_EXPECTED_SLUG: slug,
        P0_A3_PROBE_TOKEN: token,
        P0_A3_PROBE_ACTIVATION_TOKEN: token,
        P0_A3_PROBE_EXPECTED_FINGERPRINT: input.expectedFingerprint,
        P0_A3_PROBE_DATABASE_FINGERPRINT: actualFingerprint,
        P0_A3_PROBE_HOST: LOOPBACK_HOST,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout?.on('data', (chunk) => diagnostics.push(String(chunk)));
    child.stderr?.on('data', (chunk) => diagnostics.push(String(chunk)));

    await waitForReady(baseUrl, child, diagnostics);
    const productUrl = new URL(`/products/${encodeURIComponent(slug)}`, baseUrl);

    const firstRequest = startProductRequest(productUrl, 'first Product request', activeRequestControllers);
    const firstPending = await waitForSessionBarrier(root, 1);
    await withTimeout(input.mutate({ prisma, productId: fixtureId, slug }), 'owned fixture mutation');
    await createMutationComplete(firstPending.root);
    const firstResponse = await withTimeout(
      firstRequest.response,
      'first Product response',
      remainingProductRequestMs(firstRequest, 'first Product response')
    );
    if (!firstResponse.ok) {
      const errorBody = await withTimeout(
        firstResponse.text(),
        'first Product error response body',
        remainingProductRequestMs(firstRequest, 'first Product error response body')
      );
      throw new Error(`first Product response failed: ${firstResponse.status} ${errorBody}`);
    }
    await withTimeout(
      firstResponse.arrayBuffer(),
      'first Product response body',
      remainingProductRequestMs(firstRequest, 'first Product response body')
    );
    finishProductRequest(firstRequest, activeRequestControllers);
    const firstSession = await poll('complete first request session', async (remainingMs) => {
      const session = await readSession(firstPending.root, remainingMs);
      return session.counters.observations === 2 && session.barriers.mutationComplete ? session : null;
    });
    const first = assertCompleteSession(firstSession, slug, 'first request');

    const secondRequest = startProductRequest(productUrl, 'second Product request', activeRequestControllers);
    const secondPending = await waitForSessionBarrier(root, 2);
    await createMutationComplete(secondPending.root);
    const secondResponse = await withTimeout(
      secondRequest.response,
      'second Product response',
      remainingProductRequestMs(secondRequest, 'second Product response')
    );
    if (!secondResponse.ok) {
      const errorBody = await withTimeout(
        secondResponse.text(),
        'second Product error response body',
        remainingProductRequestMs(secondRequest, 'second Product error response body')
      );
      throw new Error(`second Product response failed: ${secondResponse.status} ${errorBody}`);
    }
    await withTimeout(
      secondResponse.arrayBuffer(),
      'second Product response body',
      remainingProductRequestMs(secondRequest, 'second Product response body')
    );
    finishProductRequest(secondRequest, activeRequestControllers);
    const secondSession = await poll('complete second request session', async (remainingMs) => {
      const session = await readSession(secondPending.root, remainingMs);
      return session.counters.observations === 2 && session.barriers.mutationComplete ? session : null;
    });
    const second = assertCompleteSession(secondSession, slug, 'second request');

    const finalAllocation = await readAllocationRecord(root);
    if (finalAllocation.ownedSessions.length !== 2) throw new Error('expected exactly 2 ownedSessions');
    if (firstSession.id === secondSession.id) throw new Error('request session IDs must be distinct');
    if (first.resultVersion === second.resultVersion) throw new Error('second request must observe a changed resultVersion');
    if (first.evaluatedAt === second.evaluatedAt) throw new Error('second request must observe a fresh evaluatedAt timestamp');

    report = {
      target: actualFingerprint,
      slug,
      port,
      firstSessionId: firstSession.id,
      secondSessionId: secondSession.id,
      firstResultVersion: first.resultVersion,
      secondResultVersion: second.resultVersion,
      firstEvaluatedAt: first.evaluatedAt,
      secondEvaluatedAt: second.evaluatedAt,
    };
  } finally {
    for (const controller of activeRequestControllers) {
      controller.abort(new Error('Product request aborted before verifier cleanup'));
    }
    activeRequestControllers.clear();
    const cleanupDeadline = Date.now() + TIMEOUT_MS;
    const runCleanupOperation = async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
      const remainingMs = Math.max(0, cleanupDeadline - Date.now());
      if (remainingMs === 0) throw new Error(`${label} skipped because the cleanup deadline was exhausted`);
      return await withTimeout(operation(), label, remainingMs);
    };

    if (child) {
      const ownedChild = child;
      try {
        await runCleanupOperation('Next process termination', () => terminateOwnedNext(ownedChild));
      } catch (error) {
        cleanupErrors.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (fixtureCreated) {
      try {
        const deleted = await runCleanupOperation('owned fixture deletion', () =>
          prisma.product.deleteMany({ where: { id: fixtureId, slug } })
        );
        if (deleted.count !== 1) throw new Error(`owned fixture cleanup deleted ${deleted.count} rows`);
      } catch (error) {
        cleanupErrors.push(error instanceof Error ? error.message : String(error));
      }
    }
    try {
      await runCleanupOperation('Prisma disconnect', () => prisma.$disconnect());
    } catch (error) {
      cleanupErrors.push(error instanceof Error ? error.message : String(error));
    }
    if (root) {
      const ownedRoot = root;
      try {
        await runCleanupOperation('owned probe root cleanup', () => cleanupOwnedProbeRoot(ownedRoot));
      } catch (error) {
        cleanupErrors.push(error instanceof Error ? error.message : String(error));
      }
    }
    if (cleanupErrors.length > 0) throw new Error(`cache verifier cleanup failed: ${cleanupErrors.join('; ')}`);
  }

  if (!report) throw new Error('cache runtime verification produced no report');
  return report;
}

async function main() {
  const databaseUrl = process.env.P0_A3_CACHE_DATABASE_URL;
  const expectedFingerprint = process.env.P0_A3_CACHE_EXPECTED_FINGERPRINT;
  if (!databaseUrl || !expectedFingerprint) {
    throw new Error('P0_A3_CACHE_DATABASE_URL and P0_A3_CACHE_EXPECTED_FINGERPRINT are required');
  }

  const report = await runCacheRuntimeVerification({
    databaseUrl,
    expectedFingerprint,
    mutate: async ({ prisma, productId, slug }) => {
      const updated = await prisma.product.updateMany({
        where: { id: productId, slug, status: 'ACTIVE', is_indexed: true },
        data: { name: `Mutated cache fixture ${randomUUID()}` },
      });
      if (updated.count !== 1) throw new Error('owned fixture mutation did not update exactly one public Product');
    },
  });
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1]?.endsWith('verify-product-page-cache-runtime.ts')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
