import assert from 'node:assert/strict';
import test from 'node:test';
import {
  convertLengthToCanonicalInches,
  convertMassToCanonicalPounds,
} from '../src/lib/products/unitConversion.ts';

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

test('mass conversion keeps pounds unchanged, including zero and negative values', () => {
  assert.equal(convertMassToCanonicalPounds(0, 'lb'), 0);
  assert.equal(convertMassToCanonicalPounds(-12.5, 'lb'), -12.5);
});

test('mass conversion converts kilograms to canonical pounds using the exact standard constant', () => {
  assert.ok(
    Math.abs(convertMassToCanonicalPounds(50, 'kg') - 110.2311310925) < 1e-10,
  );
});

test('mass conversion rejects unsupported runtime units with a clear error', () => {
  assert.throws(
    () => convertMassToCanonicalPounds(10, 'oz' as 'lb'),
    /unsupported.*unit/i,
  );
});
