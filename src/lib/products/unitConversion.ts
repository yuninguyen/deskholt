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

export function convertMassToCanonicalPounds(
  value: number,
  sourceUnit: 'lb' | 'kg',
): number {
  if (sourceUnit === 'lb') {
    return value;
  }

  if (sourceUnit === 'kg') {
    // Exact standard conversion: 1 kg = 2.20462262185 lb.
    return value * 2.20462262185;
  }

  throw new Error(`Unsupported mass unit: ${String(sourceUnit)}`);
}
