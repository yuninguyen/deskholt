import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, realpath, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import * as React from 'react';
import {
  afterProductPageConsumer,
  allocateProbeSession,
  claimProductPageConsumer,
  recordProductPageProbeCounter,
} from '../src/lib/products/productPageCacheProbe.ts';
import { loadProductPageDataUncached } from '../src/lib/products/productPageData.ts';

const evaluatedAt = new Date('2026-08-25T12:00:00.000Z');

const probeEnvironmentKeys = [
  'P0_A3_PROBE_TOKEN',
  'P0_A3_PROBE_ACTIVATION_TOKEN',
  'P0_A3_PROBE_EXPECTED_SLUG',
  'P0_A3_PROBE_EXPECTED_FINGERPRINT',
  'P0_A3_PROBE_DATABASE_FINGERPRINT',
  'P0_A3_PROBE_ROOT',
  'P0_A3_PROBE_HOST',
] as const;

async function withProbeEnvironment<T>(
  root: string,
  slug: string,
  run: () => Promise<T>,
  canonicalizeRoot = true
): Promise<T> {
  const previous = Object.fromEntries(probeEnvironmentKeys.map((key) => [key, process.env[key]]));
  const canonicalRoot = canonicalizeRoot ? await realpath(root) : root;
  const token = `token-${slug}`;
  process.env.P0_A3_PROBE_TOKEN = token;
  process.env.P0_A3_PROBE_ACTIVATION_TOKEN = token;
  process.env.P0_A3_PROBE_EXPECTED_SLUG = slug;
  process.env.P0_A3_PROBE_EXPECTED_FINGERPRINT = 'disposable-fingerprint';
  process.env.P0_A3_PROBE_DATABASE_FINGERPRINT = 'disposable-fingerprint';
  process.env.P0_A3_PROBE_ROOT = canonicalRoot;
  process.env.P0_A3_PROBE_HOST = '127.0.0.1';
  await writeFile(
    path.join(canonicalRoot, 'allocation.json'),
    JSON.stringify({ root: canonicalRoot, slug, token, port: 49152, ownedSessions: [] }),
    { flag: 'wx' }
  );

  try {
    return await run();
  } finally {
    for (const key of probeEnvironmentKeys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function snapshot(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1',
    name: 'Truthful Desk',
    slug: 'truthful-desk',
    description: 'A desk',
    status: 'ACTIVE' as const,
    is_indexed: true,
    affiliate_links: [
      {
        id: 'offer-1',
        network: 'amazon',
        price: 399,
        is_in_stock: true,
        priority_order: 1,
        last_crawled_at: new Date('2026-08-25T11:00:00.000Z'),
      },
    ],
    ...overrides,
  };
}

function dependencies(initialProduct: ReturnType<typeof snapshot> | null) {
  let storedProduct = initialProduct;
  const calls: string[] = [];
  const deps = {
    awaitRequestBoundary: async () => {
      calls.push('boundary');
    },
    now: () => {
      calls.push('clock');
      return evaluatedAt;
    },
    findProduct: async (slug: string) => {
      calls.push(`product:${slug}`);
      return storedProduct;
    },
    evaluateAccess: (product: { status: 'ACTIVE' | 'DRAFT'; is_indexed: boolean }) => {
      calls.push('decision');
      const isPublic = product.status === 'ACTIVE';
      return {
        reason: isPublic ? (product.is_indexed ? 'eligible' : 'explicit-noindex') : 'draft',
        isPublic,
        isIndexable: isPublic && product.is_indexed,
        isListable: isPublic && product.is_indexed,
        isInSitemap: isPublic && product.is_indexed,
        isCommerceEligible: isPublic,
        robots: isPublic ? { index: product.is_indexed, follow: true } : null,
      };
    },
    buildOfferPresentation: (product: ReturnType<typeof snapshot>, now: Date) => {
      calls.push(`offer:${now.toISOString()}`);
      return { version: product.affiliate_links[0]?.id ?? 'none' };
    },
  };

  return {
    calls,
    deps,
    replaceProduct(next: ReturnType<typeof snapshot> | null) {
      storedProduct = next;
    },
  };
}

test('installed React exports request-scoped cache', () => {
  assert.equal(typeof (React as unknown as { cache?: unknown }).cache, 'function');
});

test('missing Product stops after one boundary, clock, and snapshot lookup', async () => {
  const harness = dependencies(null);
  const result = await loadProductPageDataUncached('missing', harness.deps);

  assert.deepEqual(result, { kind: 'missing', evaluatedAt });
  assert.deepEqual(harness.calls, ['boundary', 'clock', 'product:missing']);
});

test('non-public Product evaluates access once and exits before offer work', async () => {
  const harness = dependencies(snapshot({ status: 'DRAFT', is_indexed: true }));
  const result = await loadProductPageDataUncached('truthful-desk', harness.deps);

  assert.equal(result.kind, 'non-public');
  assert.equal(result.evaluatedAt, evaluatedAt);
  assert.deepEqual(harness.calls, ['boundary', 'clock', 'product:truthful-desk', 'decision']);
});

test('public Product uses one snapshot, decision, clock, and offer evaluation in order', async () => {
  const harness = dependencies(snapshot());
  const result = await loadProductPageDataUncached('truthful-desk', harness.deps);

  assert.equal(result.kind, 'public');
  assert.equal(result.evaluatedAt, evaluatedAt);
  assert.deepEqual(harness.calls, [
    'boundary',
    'clock',
    'product:truthful-desk',
    'decision',
    `offer:${evaluatedAt.toISOString()}`,
  ]);
});

test('public Product awaits optional probe counters exactly adjacent to real orchestration calls', async () => {
  const harness = dependencies(snapshot());
  const counterCalls: string[] = [];
  const result = await loadProductPageDataUncached('truthful-desk', {
    ...harness.deps,
    recordRepositoryLoad: async () => {
      counterCalls.push('repository-load');
    },
    recordAccessEvaluation: async () => {
      counterCalls.push('access-evaluation');
    },
    recordOfferEvaluation: async () => {
      counterCalls.push('offer-evaluation');
    },
  });

  assert.equal(result.kind, 'public');
  assert.deepEqual(counterCalls, ['repository-load', 'access-evaluation', 'offer-evaluation']);
});

test('specifications remain a post-public consumer read, not loader work', async () => {
  const harness = dependencies(snapshot({ status: 'DRAFT' }));
  const result = await loadProductPageDataUncached('truthful-desk', harness.deps);

  assert.equal(result.kind, 'non-public');
  assert.equal(harness.calls.some((call) => call.includes('spec')), false);
});

test('returned public result is immutable across a backing-data race and next load is fresh', async () => {
  const firstProduct = snapshot();
  const harness = dependencies(firstProduct);
  const first = await loadProductPageDataUncached('truthful-desk', harness.deps);

  firstProduct.name = 'Mutated object';
  firstProduct.affiliate_links[0]!.id = 'mutated-offer';
  harness.replaceProduct(snapshot({ name: 'Next request desk', affiliate_links: [] }));
  const second = await loadProductPageDataUncached('truthful-desk', harness.deps);

  assert.equal(first.kind, 'public');
  assert.equal(first.product.name, 'Truthful Desk');
  assert.equal(first.offerPresentation.version, 'offer-1');
  assert.equal(second.kind, 'public');
  assert.equal(second.product.name, 'Next request desk');
  assert.equal(second.offerPresentation.version, 'none');
});

test('probe rejects a symlink or junction root without swallowing its refusal', async () => {
  const parent = await mkdtemp(path.join(tmpdir(), 'deskholt-probe-link-test-'));
  const target = path.join(parent, 'target');
  const linkedRoot = path.join(parent, 'linked-root');
  await mkdir(target);
  await symlink(target, linkedRoot, process.platform === 'win32' ? 'junction' : 'dir');

  await assert.rejects(
    withProbeEnvironment(linkedRoot, 'linked-product', () => allocateProbeSession('linked-product'), false),
    /probe root may not be a symlink or junction/
  );
});

test('unexpected slug never allocates or claims a probe session', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'deskholt-probe-slug-test-'));

  await withProbeEnvironment(root, 'expected-product', async () => {
    assert.equal(await allocateProbeSession('unexpected-product'), null);
    assert.deepEqual((await readdir(root)).sort(), ['allocation.json']);
  });
});

test('metadata and body claims share one session and enforce the mutation barrier around loader use', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'deskholt-probe-sequence-test-'));

  await withProbeEnvironment(root, 'barrier-product', async () => {
    const requestSession = await allocateProbeSession('barrier-product');
    assert.ok(requestSession);
    const first = await claimProductPageConsumer(requestSession, 'metadata');
    await recordProductPageProbeCounter('barrier-product', 'repositoryLoads', requestSession);
    await recordProductPageProbeCounter('barrier-product', 'accessEvaluations', requestSession);
    await recordProductPageProbeCounter('barrier-product', 'offerEvaluations', requestSession);

    let secondReleased = false;
    const secondPromise = claimProductPageConsumer(requestSession, 'body').then((session) => {
      secondReleased = true;
      return session;
    });
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(secondReleased, false, 'the second consumer must not invoke the loader before mutation-complete');

    const sessionEntriesBeforeObservation = await readdir(first.root);
    assert.equal(sessionEntriesBeforeObservation.includes('first-result-ready'), false);

    let firstReturned = false;
    first.slug = 'tampered-session-slug';
    const firstAfterPromise = afterProductPageConsumer(first, {
      resultVersion: 'version-before-mutation',
      evaluatedAt,
    }).then(() => {
      firstReturned = true;
    });

    const firstResultReady = path.join(first.root, 'first-result-ready');
    for (let attempt = 0; attempt < 100; attempt += 1) {
      try {
        await readFile(firstResultReady, 'utf8');
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    }
    assert.equal(firstReturned, false, 'the first consumer must wait after recording its result');

    await writeFile(path.join(first.root, 'mutation-complete'), '', { flag: 'wx' });
    const second = await secondPromise;
    assert.ok(second);
    assert.equal(second.id, first.id);
    await afterProductPageConsumer(second, {
      resultVersion: 'version-before-mutation',
      evaluatedAt,
    });
    await firstAfterPromise;

    const persisted = JSON.parse(await readFile(path.join(first.root, 'session.json'), 'utf8')) as {
      expectedSlug: string;
      counters: {
        claims: number;
        observations: number;
        repositoryLoads: number;
        accessEvaluations: number;
        offerEvaluations: number;
      };
      barriers: { firstResultReady: boolean; mutationComplete: boolean };
      events: Array<{ consumer: string; slug: string; resultVersion?: string; evaluatedAt?: string }>;
    };
    assert.equal(persisted.expectedSlug, 'barrier-product');
    assert.deepEqual(persisted.counters, {
      claims: 2,
      observations: 2,
      repositoryLoads: 1,
      accessEvaluations: 1,
      offerEvaluations: 1,
    });
    assert.deepEqual(persisted.barriers, { firstResultReady: true, mutationComplete: true });
    assert.deepEqual(
      persisted.events
        .filter((event) => event.resultVersion)
        .map((event) => [event.consumer, event.slug, event.resultVersion, event.evaluatedAt]),
      [
        ['metadata', 'barrier-product', 'version-before-mutation', evaluatedAt.toISOString()],
        ['body', 'barrier-product', 'version-before-mutation', evaluatedAt.toISOString()],
      ]
    );
    assert.deepEqual((await readdir(root)).filter((entry) => entry !== 'allocation.json'), [first.id]);
  });
});
