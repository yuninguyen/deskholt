import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertExplicitPopulatedPostcheckInputs,
  assertMigrationTreeShape,
  isPathInside,
  validateOwnedTempRoot,
} from '../scripts/verify-p0-a3-migrations.ts';

test('populated postcheck rejects ambient DATABASE_URL fallback and missing fingerprint', () => {
  assert.throws(
    () => assertExplicitPopulatedPostcheckInputs({}, undefined),
    /P0_A3_POPULATED_DATABASE_URL/
  );
  assert.throws(
    () =>
      assertExplicitPopulatedPostcheckInputs(
        { P0_A3_POPULATED_DATABASE_URL: 'postgresql://example/db', DATABASE_URL: 'postgresql://ambient/db' },
        undefined
      ),
    /expected fingerprint/
  );
});

test('owned temp root must remain inside its canonical parent', () => {
  assert.equal(isPathInside('C:/tmp/p0-a3/session', 'C:/tmp/p0-a3'), true);
  assert.equal(isPathInside('C:/tmp/p0-a3-other/session', 'C:/tmp/p0-a3'), false);
  assert.throws(
    () => validateOwnedTempRoot('C:/tmp/p0-a3/session', 'C:/tmp/p0-a3'),
    /unique|empty|owned/i
  );
});

test('migration tree shape permits lock plus approved baseline only before feature creation', () => {
  assert.doesNotThrow(() =>
    assertMigrationTreeShape(['migration_lock.toml', '20260827014500_baseline_existing_schema'])
  );
  assert.throws(
    () =>
      assertMigrationTreeShape([
        'migration_lock.toml',
        '20260827014500_baseline_existing_schema',
        '20260827020000_p0_a3_basic_index_gate',
      ]),
    /P0-A3|incomplete|feature/i
  );
});
