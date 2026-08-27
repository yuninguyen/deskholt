import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareIdentityFingerprint,
  classifyRolePrivileges,
  redactDatasourceUrl,
  stableSnapshotHash,
  sortSnapshotRecords,
} from '../scripts/snapshot-p0-a3-database.ts';

test('sortSnapshotRecords produces deterministic keyed ordering', () => {
  const records = [
    { table: 'products', id: 'p-2', slug: 'zeta' },
    { table: 'products', id: 'p-1', slug: 'alpha' },
  ];

  assert.deepEqual(sortSnapshotRecords(records), [
    { table: 'products', id: 'p-1', slug: 'alpha' },
    { table: 'products', id: 'p-2', slug: 'zeta' },
  ]);
});

test('stableSnapshotHash ignores input order but changes keyed content', () => {
  const first = stableSnapshotHash([
    { table: 'products', id: 'p-2', slug: 'zeta' },
    { table: 'products', id: 'p-1', slug: 'alpha' },
  ]);
  const reordered = stableSnapshotHash([
    { table: 'products', id: 'p-1', slug: 'alpha' },
    { table: 'products', id: 'p-2', slug: 'zeta' },
  ]);
  const changed = stableSnapshotHash([
    { table: 'products', id: 'p-1', slug: 'changed' },
    { table: 'products', id: 'p-2', slug: 'zeta' },
  ]);

  assert.equal(first, reordered);
  assert.notEqual(first, changed);
});

test('compareIdentityFingerprint requires every approved field to match', () => {
  const approved = {
    clusterSystemIdentifier: 'cluster-a',
    databaseOid: '123',
    databaseName: 'deskholt_db',
    schema: 'public',
    searchPath: '"$user", public',
  };

  assert.equal(compareIdentityFingerprint(approved, { ...approved }), true);
  assert.equal(
    compareIdentityFingerprint(approved, { ...approved, databaseOid: '124' }),
    false
  );
});

test('classifyRolePrivileges reports missing proof instead of treating it as pass', () => {
  assert.deepEqual(
    classifyRolePrivileges({
      schemaUsage: true,
      schemaCreate: false,
      productOwnerOrMember: true,
      productUpdate: true,
      preservationSelect: true,
      catalogRead: true,
    }),
    { status: 'LIMITATION', missing: ['schemaCreate'] }
  );
});

test('redactDatasourceUrl removes credentials while retaining target identity', () => {
  const redacted = redactDatasourceUrl(
    'postgresql://user:secret@localhost:5432/deskholt_db?schema=public'
  );

  assert.equal(redacted, 'postgresql://user:[REDACTED]@localhost:5432/deskholt_db?schema=public');
  assert.ok(!redacted.includes('secret'));
});
