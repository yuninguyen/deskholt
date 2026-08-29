export function convertLengthToCanonicalInches(
  value: number,
  sourceUnit: 'in' | 'cm',
): number {
  if (sourceUnit === 'in') {
    return value;
  }

  if (sourceUnit === 'cm') {
    return value / 2.54;
  }

  throw new Error(`Unsupported length unit: ${String(sourceUnit)}`);
}
