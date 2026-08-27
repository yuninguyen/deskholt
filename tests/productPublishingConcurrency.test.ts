import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import {
  PUBLISHING_RACE_SCENARIOS,
  assertDisposablePublishingTarget,
  runPublishingConcurrencyVerification,
} from '../scripts/verify-product-publishing-concurrency.ts';
import {
  executePublishingCommand,
  type ProductPublishingStore,
  type PublishingCommand,
} from '../src/lib/products/productPublishingCommands.ts';

type ProductStatus = 'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';
type RaceScenario = {
  name: string;
  command: 'enable-index' | 'disable-index';
  lifecycleStatus: Exclude<ProductStatus, 'ACTIVE'>;
  firstLock: 'index-command' | 'lifecycle-command';
  initialIndexed: boolean;
  expectedFinalState: { status: ProductStatus; is_indexed: boolean };
};
type Session = { name: 'index-command' | 'lifecycle-command' };
type PublishingConcurrencyAdapter = {
  fingerprint(): Promise<{
    clusterSystemIdentifier: string;
    databaseOid: string;
    databaseName: string;
    schema: string;
    migrationStatus: 'current' | 'pending';
  }>;
  createFixture(scenario: RaceScenario): Promise<string>;
  openSession(name: Session['name']): Promise<Session>;
  lockFixture(session: Session, fixtureId: string): Promise<void>;
  runEnableIndex(session: Session): Promise<void>;
  runDisableIndex(session: Session): Promise<void>;
  runLifecycle(session: Session, status: RaceScenario['lifecycleStatus']): Promise<void>;
  commit(session: Session): Promise<void>;
  readState(fixtureId: string): Promise<{ status: ProductStatus; is_indexed: boolean }>;
  cleanupFixture(fixtureId: string): Promise<void>;
  closeSession(session: Session): Promise<void>;
};

const scenarios = PUBLISHING_RACE_SCENARIOS as RaceScenario[];
const DISPOSABLE_URL = 'postgresql://tester:secret@localhost:5432/deskholt_p0_a3_publishing_test?schema=public';
const realVerifierSource = readFileSync(
  resolve(process.cwd(), 'scripts/verify-product-publishing-concurrency.ts'),
  'utf8'
);
const concurrencyTestSource = readFileSync(
  resolve(process.cwd(), 'tests/productPublishingConcurrency.test.ts'),
  'utf8'
);

function deterministicAdapter() {
  const events: string[] = [];
  const cleanedFixtures: string[] = [];
  const closedSessions: string[] = [];
  let state: { status: ProductStatus; is_indexed: boolean } = {
    status: 'ACTIVE',
    is_indexed: false,
  };
  const store: ProductPublishingStore = {
    setLifecycle: async (_productId, status) => {
      state = { status, is_indexed: false };
      return 1;
    },
    enableIndexWhenActive: async () => {
      if (state.status !== 'ACTIVE') return 0;
      state = { ...state, is_indexed: true };
      return 1;
    },
    disableIndex: async () => {
      state = { ...state, is_indexed: false };
      return 1;
    },
    findPublishingState: async () => state,
  };

  const adapter: PublishingConcurrencyAdapter = {
    fingerprint: async () => ({
      clusterSystemIdentifier: 'test-cluster',
      databaseOid: '9037',
      databaseName: 'deskholt_p0_a3_publishing_test',
      schema: 'public',
      migrationStatus: 'current',
    }),
    createFixture: async (scenario) => {
      const fixtureId = `fixture-${scenario.name}`;
      state = { status: 'ACTIVE', is_indexed: scenario.initialIndexed };
      events.push(`fixture:${scenario.name}`);
      return fixtureId;
    },
    openSession: async (name) => {
      events.push(`open:${name}`);
      return { name };
    },
    lockFixture: async (session, fixtureId) => {
      events.push(`lock:${session.name}:${fixtureId}`);
    },
    runEnableIndex: async (session) => {
      events.push(`enable:${session.name}`);
      const command: PublishingCommand = { kind: 'enable-index' };
      await executePublishingCommand(store, 'fixture', command);
    },
    runDisableIndex: async (session) => {
      events.push(`disable:${session.name}`);
      const command: PublishingCommand = { kind: 'disable-index' };
      await executePublishingCommand(store, 'fixture', command);
    },
    runLifecycle: async (session, status) => {
      events.push(`lifecycle:${session.name}:${status}`);
      const command: PublishingCommand = { kind: 'set-lifecycle', status };
      await executePublishingCommand(store, 'fixture', command);
    },
    commit: async (session) => {
      events.push(`commit:${session.name}`);
    },
    readState: async () => state,
    cleanupFixture: async (fixtureId) => {
      cleanedFixtures.push(fixtureId);
    },
    closeSession: async (session) => {
      closedSessions.push(session.name);
    },
  };

  return { adapter, events, cleanedFixtures, closedSessions };
}

test('deterministic adapter delegates command semantics to the production publishing implementation', () => {
  const imports = concurrencyTestSource.slice(0, concurrencyTestSource.indexOf('type ProductStatus'));
  const adapterSource = concurrencyTestSource.slice(
    concurrencyTestSource.indexOf('function deterministicAdapter'),
    concurrencyTestSource.indexOf("test('deterministic adapter delegates")
  );
  const commandCallbacks = adapterSource.slice(
    adapterSource.indexOf('runEnableIndex:'),
    adapterSource.indexOf('commit:')
  );

  assert.match(imports, /executePublishingCommand/);
  assert.match(imports, /type\s+ProductPublishingStore/);
  assert.match(adapterSource, /const\s+store\s*:\s*ProductPublishingStore/);
  assert.equal((commandCallbacks.match(/executePublishingCommand\s*\(/g) ?? []).length, 3);
  assert.doesNotMatch(commandCallbacks, /\bstate\s*=/);
});

test('real PostgreSQL verifier delegates command writes to the production publishing implementation', () => {
  assert.match(
    realVerifierSource,
    /import\s*\{[\s\S]*?createPrismaPublishingStore[\s\S]*?executePublishingCommand[\s\S]*?\}\s*from\s*['"]\.\.\/src\/lib\/products\/productPublishingCommands\.ts['"]/
  );

  const realCommandHelper = realVerifierSource.slice(
    realVerifierSource.indexOf('async function runRealCommand'),
    realVerifierSource.indexOf('async function runRealPublishingConcurrencyVerification')
  );
  assert.match(realCommandHelper, /createPrismaPublishingStore\s*\(\s*tx\s*\)/);
  assert.match(realCommandHelper, /executePublishingCommand\s*\(/);
  assert.doesNotMatch(
    realVerifierSource,
    /\.product\.(?:update|updateMany)\s*\(/,
    'no verifier adapter or real transaction helper may carry a local copy of publishing command writes'
  );
});

test('scenario matrix covers enable versus every non-active lifecycle in both lock orders', () => {
  for (const status of ['DRAFT', 'BLOCKED', 'ARCHIVED'] as const) {
    const matching = scenarios.filter(
      (scenario) => scenario.command === 'enable-index' && scenario.lifecycleStatus === status
    );
    assert.deepEqual(
      matching.map((scenario) => scenario.firstLock).sort(),
      ['index-command', 'lifecycle-command']
    );
    for (const scenario of matching) {
      assert.deepEqual(scenario.expectedFinalState, { status, is_indexed: false });
    }
  }
});

test('scenario matrix proves disable-index never restores a stale lifecycle', () => {
  const disableScenarios = scenarios.filter(
    (scenario) => scenario.command === 'disable-index'
  );
  assert.ok(disableScenarios.length >= 2);
  assert.deepEqual(
    new Set(disableScenarios.map((scenario) => scenario.firstLock)),
    new Set(['index-command', 'lifecycle-command'])
  );
  for (const scenario of disableScenarios) {
    assert.equal(scenario.expectedFinalState.status, scenario.lifecycleStatus);
    assert.equal(scenario.expectedFinalState.is_indexed, false);
  }
});

test('verifier executes deterministic barriers and reaches each declared final state', async () => {
  const harness = deterministicAdapter();

  const report = await runPublishingConcurrencyVerification({
    datasourceUrl: DISPOSABLE_URL,
    expectedFingerprint: 'test-cluster/9037/deskholt_p0_a3_publishing_test/public',
    adapter: harness.adapter,
  });

  assert.equal(report.scenarios.length, scenarios.length);
  assert.equal(
    report.scenarios.every((scenario: { passed: boolean }) => scenario.passed),
    true
  );
  for (const scenario of scenarios) {
    assert.ok(harness.events.includes(`lock:${scenario.firstLock}:${`fixture-${scenario.name}`}`));
  }
});

test('verifier cleans owned fixtures and closes both sessions after a scenario failure', async () => {
  const harness = deterministicAdapter();
  const originalReadState = harness.adapter.readState;
  harness.adapter.readState = async (fixtureId) => {
    await originalReadState(fixtureId);
    throw new Error('forced assertion read failure');
  };

  await assert.rejects(
    () =>
      runPublishingConcurrencyVerification({
        datasourceUrl: DISPOSABLE_URL,
        expectedFingerprint: 'test-cluster/9037/deskholt_p0_a3_publishing_test/public',
        scenarios: [scenarios[0]],
        adapter: harness.adapter,
      }),
    /forced assertion read failure/
  );

  assert.deepEqual(harness.cleanedFixtures, [`fixture-${scenarios[0].name}`]);
  assert.deepEqual(new Set(harness.closedSessions), new Set(['index-command', 'lifecycle-command']));
});

test('disposable target guard rejects ambient, populated, mismatched, and unmigrated targets', () => {
  const fingerprint = {
    clusterSystemIdentifier: 'test-cluster',
    databaseOid: '9037',
    databaseName: 'deskholt_p0_a3_publishing_test',
    schema: 'public',
    migrationStatus: 'current' as const,
  };

  assert.throws(
    () =>
      assertDisposablePublishingTarget({
        datasourceUrl: undefined,
        ambientDatabaseUrl: DISPOSABLE_URL,
        expectedFingerprint: 'test-cluster/9037/deskholt_p0_a3_publishing_test/public',
        populatedFingerprint: undefined,
        actualFingerprint: fingerprint,
      }),
    /explicit|P0_A3_PUBLISHING_DATABASE_URL/i
  );
  assert.throws(
    () =>
      assertDisposablePublishingTarget({
        datasourceUrl: DISPOSABLE_URL,
        ambientDatabaseUrl: undefined,
        expectedFingerprint: 'test-cluster/9037/deskholt_p0_a3_publishing_test/public',
        populatedFingerprint: 'test-cluster/9037/deskholt_p0_a3_publishing_test/public',
        actualFingerprint: fingerprint,
      }),
    /populated|disposable/i
  );
  assert.throws(
    () =>
      assertDisposablePublishingTarget({
        datasourceUrl: DISPOSABLE_URL,
        ambientDatabaseUrl: undefined,
        expectedFingerprint: 'different-target',
        populatedFingerprint: undefined,
        actualFingerprint: fingerprint,
      }),
    /fingerprint|mismatch/i
  );
  assert.throws(
    () =>
      assertDisposablePublishingTarget({
        datasourceUrl: DISPOSABLE_URL,
        ambientDatabaseUrl: undefined,
        expectedFingerprint: 'test-cluster/9037/deskholt_p0_a3_publishing_test/public',
        populatedFingerprint: undefined,
        actualFingerprint: { ...fingerprint, migrationStatus: 'pending' },
      }),
    /migration|current|baseline.*P0-A3/i
  );
});
