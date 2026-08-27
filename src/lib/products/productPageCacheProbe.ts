import { randomUUID } from 'node:crypto';
import { lstat } from 'node:fs/promises';
import { mkdir, open, readFile, realpath, rename, rmdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';

const WAIT_TIMEOUT_MS = 5_000;
const POLL_INTERVAL_MS = 10;

type ProbeConsumer = 'metadata' | 'body';
export type ProductPageProbeCounter = 'repositoryLoads' | 'accessEvaluations' | 'offerEvaluations';

type AllocationRecord = {
  root: string;
  slug: string;
  token: string;
  port: number;
  ownedSessions: string[];
};

type ProbeEvent = {
  type: 'claim' | 'observation';
  consumer: ProbeConsumer;
  slug?: string;
  resultVersion?: string;
  evaluatedAt?: string;
};

type PersistedProbeSession = {
  id: string;
  expectedSlug: string;
  counters: {
    claims: number;
    observations: number;
    repositoryLoads: number;
    accessEvaluations: number;
    offerEvaluations: number;
  };
  barriers: {
    firstResultReady: boolean;
    mutationComplete: boolean;
  };
  resultVersion: string | null;
  evaluatedAt: string | null;
  events: ProbeEvent[];
};

export type ProbeSession = {
  id: string;
  root: string;
  slug: string;
};

export type ProductPageConsumerSession = ProbeSession & {
  consumer: ProbeConsumer;
  isFirstConsumer: boolean;
};

export type ProductPageProbeObservation = {
  resultVersion: string;
  evaluatedAt: Date | string;
};

function failClosed(message: string): never {
  throw new Error(`P0-A3 probe refused: ${message}`);
}

function isAlreadyExists(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'EEXIST';
}

async function withBoundedProbeOperation<T>(
  operation: Promise<T>,
  label: string,
  timeoutMs = WAIT_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`P0-A3 probe refused: ${label} timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function canonicalOwnedRoot(rootInput: string): Promise<string> {
  const resolvedRoot = path.resolve(rootInput);
  const rootStat = await lstat(resolvedRoot);
  if (rootStat.isSymbolicLink()) failClosed('probe root may not be a symlink or junction');
  if (!rootStat.isDirectory()) failClosed('probe root must be an allocated directory');

  const canonicalParent = await realpath(path.dirname(resolvedRoot));
  const canonicalRoot = await realpath(resolvedRoot);
  if (canonicalRoot === canonicalParent || canonicalRoot === path.parse(canonicalParent).root) {
    failClosed('probe root may not be its parent or filesystem root');
  }
  if (canonicalRoot !== path.resolve(canonicalParent, path.basename(resolvedRoot))) {
    failClosed('probe root canonical path does not match its allocation');
  }
  if (!canonicalRoot.startsWith(`${canonicalParent}${path.sep}`)) {
    failClosed('probe root escapes its owned parent');
  }
  return canonicalRoot;
}

async function readAllocationRecord(root: string): Promise<AllocationRecord> {
  const contents = await withBoundedProbeOperation(
    readFile(path.join(root, 'allocation.json'), 'utf8'),
    'allocation record read'
  );
  const parsed = JSON.parse(contents) as AllocationRecord;
  if (
    parsed.root !== root ||
    !Array.isArray(parsed.ownedSessions) ||
    parsed.ownedSessions.some((sessionRoot) => !sessionRoot.startsWith(`${root}${path.sep}`))
  ) {
    failClosed('probe allocation ownership mismatch');
  }
  return parsed;
}

async function withDirectoryLock<T>(lockPath: string, run: () => Promise<T>): Promise<T> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (true) {
    const remainingMs = Math.max(1, deadline - Date.now());
    try {
      await withBoundedProbeOperation(mkdir(lockPath), `lock mkdir ${path.basename(lockPath)}`, remainingMs);
      break;
    } catch (error) {
      if (!isAlreadyExists(error)) throw error;
      const remainingAfterMkdirMs = Math.max(0, deadline - Date.now());
      if (remainingAfterMkdirMs === 0) failClosed(`timeout waiting for ${path.basename(lockPath)}`);
      const lockSleepMs = Math.min(POLL_INTERVAL_MS, remainingAfterMkdirMs);
      await new Promise((resolve) => setTimeout(resolve, lockSleepMs));
    }
  }

  try {
    return await run();
  } finally {
    await withBoundedProbeOperation(rmdir(lockPath), `lock rmdir ${path.basename(lockPath)}`);
  }
}

async function writeJsonAtomically(filePath: string, value: unknown): Promise<void> {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  await withBoundedProbeOperation(
    writeFile(temporaryPath, JSON.stringify(value), { flag: 'wx' }),
    'atomic JSON temporary write'
  );
  await withBoundedProbeOperation(rename(temporaryPath, filePath), 'atomic JSON rename');
}

async function recordOwnedSession(root: string, sessionRoot: string): Promise<void> {
  await withDirectoryLock(path.join(root, '.allocation-lock'), async () => {
    const allocation = await readAllocationRecord(root);
    if (allocation.ownedSessions.includes(sessionRoot)) failClosed('probe session was already allocated');
    allocation.ownedSessions.push(sessionRoot);
    await writeJsonAtomically(path.join(root, 'allocation.json'), allocation);
  });
}

async function updateSession(
  session: ProbeSession,
  update: (persisted: PersistedProbeSession) => void
): Promise<void> {
  await withDirectoryLock(path.join(session.root, '.session-lock'), async () => {
    const sessionPath = path.join(session.root, 'session.json');
    const contents = await withBoundedProbeOperation(readFile(sessionPath, 'utf8'), 'probe session read');
    const persisted = JSON.parse(contents) as PersistedProbeSession;
    if (persisted.id !== session.id) failClosed('probe session ownership mismatch');
    update(persisted);
    await writeJsonAtomically(sessionPath, persisted);
  });
}

async function createSignal(filePath: string): Promise<void> {
  const handle = await withBoundedProbeOperation(open(filePath, 'wx'), `signal open ${path.basename(filePath)}`);
  await withBoundedProbeOperation(handle.close(), `signal close ${path.basename(filePath)}`);
}

async function waitForSignal(filePath: string, label: string): Promise<void> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const remainingMs = Math.max(1, deadline - Date.now());
    try {
      const handle = await withBoundedProbeOperation(
        open(filePath, 'r'),
        `signal open ${path.basename(filePath)}`,
        remainingMs
      );
      const remainingAfterOpenMs = Math.max(0, deadline - Date.now());
      if (remainingAfterOpenMs === 0) failClosed(`timeout waiting for ${label}`);
      await withBoundedProbeOperation(
        handle.close(),
        `signal close ${path.basename(filePath)}`,
        remainingAfterOpenMs
      );
      const remainingAfterCloseMs = Math.max(0, deadline - Date.now());
      if (remainingAfterCloseMs === 0) failClosed(`timeout waiting for ${label}`);
      return;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const remainingAfterCloseMs = Math.max(0, deadline - Date.now());
      if (remainingAfterCloseMs === 0) failClosed(`timeout waiting for ${label}`);
      const sleepMs = Math.min(POLL_INTERVAL_MS, remainingAfterCloseMs);
      await new Promise((resolve) => setTimeout(resolve, sleepMs));
    }
  }
  failClosed(`timeout waiting for ${label}`);
}

export async function allocateProbeSession(lookupSlug: string): Promise<ProbeSession | null> {
  const token = process.env.P0_A3_PROBE_TOKEN;
  const expectedSlug = process.env.P0_A3_PROBE_EXPECTED_SLUG;
  const expectedFingerprint = process.env.P0_A3_PROBE_EXPECTED_FINGERPRINT;
  const actualFingerprint = process.env.P0_A3_PROBE_DATABASE_FINGERPRINT;
  const rootInput = process.env.P0_A3_PROBE_ROOT;
  const host = process.env.P0_A3_PROBE_HOST;

  if (!token || !expectedSlug || !expectedFingerprint || !actualFingerprint || !rootInput) return null;
  if (lookupSlug !== expectedSlug || token !== process.env.P0_A3_PROBE_ACTIVATION_TOKEN) return null;
  if (host !== '127.0.0.1') failClosed('probe-enabled execution must bind to 127.0.0.1');
  if (actualFingerprint !== expectedFingerprint) failClosed('disposable datasource fingerprint mismatch');

  const root = await canonicalOwnedRoot(rootInput);
  const allocation = await readAllocationRecord(root);
  if (allocation.slug !== expectedSlug || allocation.token !== token) {
    failClosed('probe allocation activation mismatch');
  }

  const sessionId = randomUUID();
  const sessionRoot = path.resolve(root, sessionId);
  if (!sessionRoot.startsWith(`${root}${path.sep}`)) failClosed('session escapes owned probe root');
  await mkdir(sessionRoot, { recursive: false });
  const persisted: PersistedProbeSession = {
    id: sessionId,
    expectedSlug,
    counters: {
      claims: 0,
      observations: 0,
      repositoryLoads: 0,
      accessEvaluations: 0,
      offerEvaluations: 0,
    },
    barriers: { firstResultReady: false, mutationComplete: false },
    resultVersion: null,
    evaluatedAt: null,
    events: [],
  };
  await writeFile(path.join(sessionRoot, 'session.json'), JSON.stringify(persisted), { flag: 'wx' });
  await recordOwnedSession(root, sessionRoot);
  return { id: sessionId, root: sessionRoot, slug: expectedSlug };
}

export const getProbeSession = cache(allocateProbeSession);

export async function recordProductPageProbeCounter(
  slug: string,
  counter: ProductPageProbeCounter,
  activeSession?: ProbeSession
): Promise<void> {
  const session = activeSession ?? (await getProbeSession(slug));
  if (!session) return;
  await updateSession(session, (persisted) => {
    persisted.counters[counter] += 1;
  });
}

export async function claimProductPageConsumer(
  session: ProbeSession,
  consumer: ProbeConsumer
): Promise<ProductPageConsumerSession> {
  await createSignal(path.join(session.root, `${consumer}.claim`));
  let isFirstConsumer = false;
  try {
    await createSignal(path.join(session.root, 'first-consumer'));
    isFirstConsumer = true;
  } catch (error) {
    if (!isAlreadyExists(error)) throw error;
  }

  await updateSession(session, (persisted) => {
    persisted.counters.claims += 1;
    persisted.events.push({ type: 'claim', consumer });
  });

  if (!isFirstConsumer) {
    await waitForSignal(path.join(session.root, 'mutation-complete'), 'mutation-complete');
    await updateSession(session, (persisted) => {
      persisted.barriers.mutationComplete = true;
    });
  }

  return { ...session, consumer, isFirstConsumer };
}

export async function beforeProductPageConsumer(
  consumer: ProbeConsumer,
  slug: string
): Promise<ProductPageConsumerSession | null> {
  const session = await getProbeSession(slug);
  return session ? claimProductPageConsumer(session, consumer) : null;
}

export async function afterProductPageConsumer(
  session: ProductPageConsumerSession | null,
  observation: ProductPageProbeObservation
): Promise<void> {
  if (!session) return;
  const evaluatedAt =
    observation.evaluatedAt instanceof Date
      ? observation.evaluatedAt.toISOString()
      : new Date(observation.evaluatedAt).toISOString();

  await updateSession(session, (persisted) => {
    persisted.counters.observations += 1;
    persisted.resultVersion = observation.resultVersion;
    persisted.evaluatedAt = evaluatedAt;
    persisted.events.push({
      type: 'observation',
      consumer: session.consumer,
      slug: persisted.expectedSlug,
      resultVersion: observation.resultVersion,
      evaluatedAt,
    });
  });

  if (!session.isFirstConsumer) return;
  await createSignal(path.join(session.root, 'first-result-ready'));
  await updateSession(session, (persisted) => {
    persisted.barriers.firstResultReady = true;
  });
  await waitForSignal(path.join(session.root, 'mutation-complete'), 'mutation-complete');
  await updateSession(session, (persisted) => {
    persisted.barriers.mutationComplete = true;
  });
}

export async function readOwnedProbeSession(session: ProbeSession): Promise<PersistedProbeSession> {
  const parsed = JSON.parse(await readFile(path.join(session.root, 'session.json'), 'utf8')) as PersistedProbeSession;
  if (parsed.id !== session.id) failClosed('probe session ownership mismatch');
  return parsed;
}
