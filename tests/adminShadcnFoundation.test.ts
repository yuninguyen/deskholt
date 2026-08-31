import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const selectSourcePath = new URL('../src/components/ui/select.tsx', import.meta.url);

// Break caught: a body-level Select portal cannot inherit Admin-scoped CSS variables.
test('SelectContent anchors its portal to the SSR-safe Admin theme root', async () => {
  const source = await readFile(selectSourcePath, 'utf8');

  assert.match(
    source,
    /const adminThemeRoot = typeof document !== ["']undefined["']\s*\?\s*document\.getElementById\(["']admin-theme-root["']\)\s*:\s*null;/
  );
  assert.match(source, /<SelectPrimitive\.Portal container=\{adminThemeRoot\}>/);
});
