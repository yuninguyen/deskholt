import { PrismaClient, type Prisma, type ProductStatus } from '@prisma/client';
import {
  createPrismaPublishingStore,
  executePublishingCommand,
  type PublishingCommand,
  type PublishingResult,
} from '../src/lib/products/productPublishingCommands.ts';
import { collectReadOnlyInventory } from './snapshot-p0-a3-database.ts';

type TargetFingerprint = {
  clusterSystemIdentifier: string;
  databaseOid: string;
  databaseName: string;
  schema: string;
  migrationStatus: string;
};

export type PublishingConcurrencyScenario = {
  name: string;
  command: 'enable-index' | 'disable-index';
  lifecycleStatus: ProductStatus;
  firstLock: 'index-command' | 'lifecycle-command';
  initialIndexed: boolean;
  expectedFinalState: { status: ProductStatus; is_indexed: boolean };
};

export const PUBLISHING_RACE_SCENARIOS: PublishingConcurrencyScenario[] = [
  ...(['DRAFT', 'BLOCKED', 'ARCHIVED'] as const).flatMap((status) =>
    (['index-command', 'lifecycle-command'] as const).map((firstLock) => ({
      name: `enable-vs-${status.toLowerCase()}-${firstLock}`,
      command: 'enable-index' as const,
      lifecycleStatus: status,
      firstLock,
      initialIndexed: false,
      expectedFinalState: { status, is_indexed: false },
    }))
  ),
  ...(['index-command', 'lifecycle-command'] as const).map((firstLock) => ({
    name: `disable-vs-active-transition-${firstLock}`,
    command: 'disable-index' as const,
    lifecycleStatus: 'BLOCKED' as const,
    firstLock,
    initialIndexed: true,
    expectedFinalState: { status: 'BLOCKED' as const, is_indexed: false },
  })),
];

export type PublishingConcurrencyState = {
  status: ProductStatus;
  is_indexed: boolean;
};

export type PublishingConcurrencySession = { name: string };

export type PublishingConcurrencyAdapter = {
  fingerprint(): Promise<TargetFingerprint>;
  createFixture(scenario: PublishingConcurrencyScenario): Promise<string>;
  openSession(name: string): Promise<PublishingConcurrencySession>;
  lockFixture(session: PublishingConcurrencySession, fixtureId: string): Promise<void>;
  runEnableIndex(session: PublishingConcurrencySession, fixtureId?: string): Promise<unknown>;
  runDisableIndex(session: PublishingConcurrencySession, fixtureId?: string): Promise<unknown>;
  runLifecycle(session: PublishingConcurrencySession, status: ProductStatus, fixtureId?: string): Promise<unknown>;
  commit(session: PublishingConcurrencySession): Promise<void>;
  readState(fixtureId: string): Promise<PublishingConcurrencyState>;
  cleanupFixture(fixtureId: string): Promise<void>;
  closeSession(session: PublishingConcurrencySession): Promise<void>;
};

function fingerprintString(fingerprint: TargetFingerprint): string {
  return [
    fingerprint.clusterSystemIdentifier ?? 'unavailable',
    fingerprint.databaseOid,
    fingerprint.databaseName,
    fingerprint.schema,
  ].join('/');
}

const EXPECTED_MIGRATIONS = [
  {
    migration_name: '20260827014500_baseline_existing_schema',
    checksum: '03d3378b0acb2ecde7d797b8061e485159c114ed64504f4f9ad0fa877565103f',
  },
  {
    migration_name: '20260827020000_p0_a3_basic_index_gate',
    checksum: '263f524ee8357ae863677ea88fdff10b2909803dbb01f907e9c5df867f6eaab6',
  },
] as const;

function migrationStatus(inventory: Awaited<ReturnType<typeof collectReadOnlyInventory>>['inventory']): string {
  const migrationRows = inventory.migrationRows;
  const current =
    inventory.migrationTable !== null &&
    migrationRows.length === EXPECTED_MIGRATIONS.length &&
    migrationRows.every((record, index) => {
      const expected = EXPECTED_MIGRATIONS[index];
      return (
        record.migration_name === expected?.migration_name &&
        record.checksum === expected.checksum &&
        record.finished_at != null &&
        record.rolled_back_at == null
      );
    });
  return current ? 'current' : 'not-current';
}

export function assertDisposablePublishingTarget(input: {
  datasourceUrl: string | undefined;
  ambientDatabaseUrl: string | undefined;
  expectedFingerprint: string;
  populatedFingerprint: string | undefined;
  actualFingerprint: TargetFingerprint;
}): void {
  if (!input.datasourceUrl?.trim()) {
    throw new Error('P0_A3_PUBLISHING_DATABASE_URL must be explicit');
  }
  if (input.ambientDatabaseUrl && input.datasourceUrl === input.ambientDatabaseUrl) {
    throw new Error('publishing verifier cannot use the ambient populated DATABASE_URL');
  }
  if (input.populatedFingerprint && fingerprintString(input.actualFingerprint) === input.populatedFingerprint) {
    throw new Error('publishing verifier target must be disposable and distinct from populated target');
  }
  if (fingerprintString(input.actualFingerprint) !== input.expectedFingerprint) {
    throw new Error(`publishing fingerprint mismatch: expected ${input.expectedFingerprint}, got ${fingerprintString(input.actualFingerprint)}`);
  }
  if (input.actualFingerprint.migrationStatus !== 'current') {
    throw new Error('publishing target migration status must be current after baseline-to-P0-A3');
  }
}

export async function runPublishingConcurrencyVerification(input: {
  datasourceUrl: string;
  expectedFingerprint: string;
  adapter: PublishingConcurrencyAdapter;
  scenarios?: PublishingConcurrencyScenario[];
}): Promise<{
  target: string;
  scenarios: Array<PublishingConcurrencyScenario & { passed: boolean; finalState: PublishingConcurrencyState }>;
}> {
  if (!input.datasourceUrl.trim()) throw new Error('explicit publishing datasource URL is required');
  const fingerprint = await input.adapter.fingerprint();
  assertDisposablePublishingTarget({
    datasourceUrl: input.datasourceUrl,
    ambientDatabaseUrl: process.env.DATABASE_URL,
    expectedFingerprint: input.expectedFingerprint,
    populatedFingerprint: process.env.P0_A3_POPULATED_DATABASE_FINGERPRINT,
    actualFingerprint: fingerprint,
  });

  const scenarios = input.scenarios ?? PUBLISHING_RACE_SCENARIOS;
  const reports: Array<PublishingConcurrencyScenario & { passed: boolean; finalState: PublishingConcurrencyState }> = [];
  for (const scenario of scenarios) {
    const fixtureId = await input.adapter.createFixture(scenario);
    const indexSession = await input.adapter.openSession('index-command');
    const lifecycleSession = await input.adapter.openSession('lifecycle-command');
    try {
      const firstSession = scenario.firstLock === 'index-command' ? indexSession : lifecycleSession;
      await input.adapter.lockFixture(firstSession, fixtureId);

      if (scenario.firstLock === 'index-command') {
        if (scenario.command === 'enable-index') await input.adapter.runEnableIndex(indexSession, fixtureId);
        else await input.adapter.runDisableIndex(indexSession, fixtureId);
        await input.adapter.runLifecycle(lifecycleSession, scenario.lifecycleStatus, fixtureId);
      } else {
        await input.adapter.runLifecycle(lifecycleSession, scenario.lifecycleStatus, fixtureId);
        if (scenario.command === 'enable-index') await input.adapter.runEnableIndex(indexSession, fixtureId);
        else await input.adapter.runDisableIndex(indexSession, fixtureId);
      }

      await input.adapter.commit(indexSession);
      await input.adapter.commit(lifecycleSession);
      const finalState = await input.adapter.readState(fixtureId);
      const passed =
        finalState.status === scenario.expectedFinalState.status &&
        finalState.is_indexed === scenario.expectedFinalState.is_indexed;
      if (!passed) {
        throw new Error(`scenario ${scenario.name} final state mismatch: ${JSON.stringify(finalState)}`);
      }
      reports.push({ ...scenario, passed, finalState });
    } finally {
      try {
        await input.adapter.cleanupFixture(fixtureId);
      } finally {
        await Promise.all([
          input.adapter.closeSession(indexSession),
          input.adapter.closeSession(lifecycleSession),
        ]);
      }
    }
  }

  return { target: input.expectedFingerprint, scenarios: reports };
}

function createPrismaAdapter(databaseUrl: string): PublishingConcurrencyAdapter {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const sessions = new Map<string, PrismaClient>();
  return {
    fingerprint: async () => {
      const inventory = await collectReadOnlyInventory(databaseUrl);
      return {
        clusterSystemIdentifier: inventory.identity.clusterSystemIdentifier ?? 'unavailable',
        databaseOid: inventory.identity.databaseOid,
        databaseName: inventory.identity.databaseName,
        schema: inventory.identity.schema,
        migrationStatus: migrationStatus(inventory.inventory),
      };
    },
    createFixture: async (scenario) => {
      const fixtureId = `p0-a3-publishing-${scenario.name}`;
      await prisma.product.create({
        data: {
          id: fixtureId,
          name: fixtureId,
          slug: fixtureId,
          category: 'p0-a3-fixture',
          image_url: 'https://example.test/publishing.png',
          status: 'ACTIVE',
          is_indexed: scenario.initialIndexed,
        },
      });
      return fixtureId;
    },
    openSession: async (name) => {
      const session = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      sessions.set(name, session);
      return { name };
    },
    lockFixture: async () => {
      // The generic adapter exists only for pure orchestrator tests.
    },
    runEnableIndex: async (_, fixtureId) => {
      if (!fixtureId) throw new Error('fixture id required');
      const session = sessions.get('index-command') ?? prisma;
      return executePublishingCommand(createPrismaPublishingStore(session), fixtureId, { kind: 'enable-index' });
    },
    runDisableIndex: async (_, fixtureId) => {
      if (!fixtureId) throw new Error('fixture id required');
      const session = sessions.get('index-command') ?? prisma;
      return executePublishingCommand(createPrismaPublishingStore(session), fixtureId, { kind: 'disable-index' });
    },
    runLifecycle: async (_, status, fixtureId) => {
      if (!fixtureId) throw new Error('fixture id required');
      const session = sessions.get('lifecycle-command') ?? prisma;
      return executePublishingCommand(createPrismaPublishingStore(session), fixtureId, { kind: 'set-lifecycle', status });
    },
    commit: async () => {
      // The generic adapter exists only for pure orchestrator tests.
    },
    readState: async (fixtureId) => {
      const row = await prisma.product.findUnique({ where: { id: fixtureId }, select: { status: true, is_indexed: true } });
      if (!row) throw new Error(`fixture missing: ${fixtureId}`);
      return row;
    },
    cleanupFixture: async (fixtureId) => {
      await prisma.product.delete({ where: { id: fixtureId } });
    },
    closeSession: async (session) => {
      const client = sessions.get(session.name);
      sessions.delete(session.name);
      await client?.$disconnect();
    },
  };
}

type Deferred = { promise: Promise<void>; resolve(): void };

function deferred(): Deferred {
  let resolve: (() => void) | undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve: () => resolve?.() };
}

function assertRealCommandResult(
  scenario: PublishingConcurrencyScenario,
  role: 'index-command' | 'lifecycle-command',
  result: PublishingResult
): void {
  const expectedResult: PublishingResult =
    role === 'index-command' && scenario.command === 'enable-index' && scenario.firstLock === 'lifecycle-command'
      ? { ok: false, reason: 'active-only' }
      : { ok: true };
  if (JSON.stringify(result) !== JSON.stringify(expectedResult)) {
    throw new Error(
      `scenario ${scenario.name} ${role} result mismatch: expected ${JSON.stringify(expectedResult)}, got ${JSON.stringify(result)}`
    );
  }
}

async function runRealCommand(
  tx: Prisma.TransactionClient,
  fixtureId: string,
  scenario: PublishingConcurrencyScenario,
  role: 'index-command' | 'lifecycle-command'
): Promise<void> {
  const command: PublishingCommand =
    role === 'lifecycle-command'
      ? { kind: 'set-lifecycle', status: scenario.lifecycleStatus }
      : { kind: scenario.command };
  const store = createPrismaPublishingStore(tx);
  const result = await executePublishingCommand(store, fixtureId, command);
  assertRealCommandResult(scenario, role, result);
}

async function runRealPublishingConcurrencyVerification(
  datasourceUrl: string,
  expectedFingerprint: string
): Promise<{ target: string; scenarios: Array<PublishingConcurrencyScenario & { passed: boolean; finalState: PublishingConcurrencyState }> }> {
  const inspector = createPrismaAdapter(datasourceUrl);
  const fingerprint = await inspector.fingerprint();
  assertDisposablePublishingTarget({
    datasourceUrl,
    ambientDatabaseUrl: process.env.DATABASE_URL,
    expectedFingerprint,
    populatedFingerprint: process.env.P0_A3_POPULATED_DATABASE_FINGERPRINT,
    actualFingerprint: fingerprint,
  });

  const controller = new PrismaClient({ datasources: { db: { url: datasourceUrl } } });
  const reports: Array<PublishingConcurrencyScenario & { passed: boolean; finalState: PublishingConcurrencyState }> = [];
  try {
    for (const scenario of PUBLISHING_RACE_SCENARIOS) {
      const fixtureId = `p0-a3-publishing-${scenario.name}`;
      await controller.product.create({
        data: { id: fixtureId, name: fixtureId, slug: fixtureId, category: 'p0-a3-fixture', image_url: 'https://example.test/publishing.png', status: 'ACTIVE', is_indexed: scenario.initialIndexed },
      });
      const firstClient = new PrismaClient({ datasources: { db: { url: datasourceUrl } } });
      const secondClient = new PrismaClient({ datasources: { db: { url: datasourceUrl } } });
      const lockAcquired = deferred();
      const releaseLock = deferred();
      const blockedCommandStarted = deferred();
      let blockedCommandSettled = false;
      const firstRole = scenario.firstLock;
      const secondRole = firstRole === 'index-command' ? 'lifecycle-command' : 'index-command';
      try {
        const firstTransaction = firstClient.$transaction(async (tx) => {
          await tx.$queryRawUnsafe('SELECT id FROM "products" WHERE id = $1 FOR UPDATE', fixtureId);
          lockAcquired.resolve();
          await releaseLock.promise;
          await runRealCommand(tx, fixtureId, scenario, firstRole);
        }, { timeout: 15_000 });
        await lockAcquired.promise;

        const blockedTransaction = secondClient.$transaction(async (tx) => {
          blockedCommandStarted.resolve();
          await runRealCommand(tx, fixtureId, scenario, secondRole);
        }, { timeout: 15_000 }).finally(() => {
          blockedCommandSettled = true;
        });
        await blockedCommandStarted.promise;
        await new Promise((resolve) => setTimeout(resolve, 25));
        if (blockedCommandSettled) throw new Error(`blocked-command settled before release-lock for ${scenario.name}`);
        releaseLock.resolve();
        await Promise.all([firstTransaction, blockedTransaction]);

        const finalState = await controller.product.findUnique({ where: { id: fixtureId }, select: { status: true, is_indexed: true } });
        if (!finalState || finalState.status !== scenario.expectedFinalState.status || finalState.is_indexed !== scenario.expectedFinalState.is_indexed) {
          throw new Error(`scenario ${scenario.name} final state mismatch: ${JSON.stringify(finalState)}`);
        }
        reports.push({ ...scenario, passed: true, finalState });
      } finally {
        await Promise.allSettled([firstClient.$disconnect(), secondClient.$disconnect()]);
        await controller.product.delete({ where: { id: fixtureId } }).catch(() => undefined);
      }
    }
  } finally {
    await controller.$disconnect();
  }
  return { target: expectedFingerprint, scenarios: reports };
}

async function main() {
  const datasourceUrl = process.env.P0_A3_PUBLISHING_DATABASE_URL;
  const expectedFingerprint = process.env.P0_A3_PUBLISHING_EXPECTED_FINGERPRINT;
  if (!datasourceUrl || !expectedFingerprint) {
    throw new Error('P0_A3_PUBLISHING_DATABASE_URL and P0_A3_PUBLISHING_EXPECTED_FINGERPRINT are required');
  }
  const report = await runRealPublishingConcurrencyVerification(datasourceUrl, expectedFingerprint);
  console.log(JSON.stringify(report, null, 2));
}

if (process.argv[1]?.endsWith('verify-product-publishing-concurrency.ts')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
