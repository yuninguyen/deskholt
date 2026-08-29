import assert from 'node:assert/strict';
import test from 'node:test';
import { convertLengthToCanonicalInches } from '../src/lib/products/unitConversion.ts';

test('length conversion keeps inches unchanged, including zero and negative values', () => {
  assert.equal(convertLengthToCanonicalInches(0, 'in'), 0);
  assert.equal(convertLengthToCanonicalInches(-12.5, 'in'), -12.5);
});

test('length conversion converts centimeters to canonical inches', () => {
  assert.ok(Math.abs(convertLengthToCanonicalInches(118, 'cm') - 46.4566929134) < 1e-10);
});

test('length conversion rejects unsupported runtime units with a clear error', () => {
  assert.throws(
    () => convertLengthToCanonicalInches(10, 'mm' as 'in'),
    /unsupported.*unit/i,
  );
});
