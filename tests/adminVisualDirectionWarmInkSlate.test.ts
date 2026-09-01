import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const productsPage = readFileSync(join(root, 'src/app/(admin)/admin/products/page.tsx'), 'utf8');
const badgeSource = readFileSync(join(root, 'src/components/ui/Badge.tsx'), 'utf8');
const specificationsFormSource = readFileSync(join(root, 'src/components/admin/products/ProductSpecificationsForm.tsx'), 'utf8');
const confidenceSelectSource = readFileSync(join(root, 'src/components/admin/products/SpecificationConfidenceSelect.tsx'), 'utf8');

type Rgb = readonly [number, number, number];

function scopedBlock(selector: string): string {
  const start = globals.indexOf(selector);
  assert.notEqual(start, -1, `missing ${selector} scope`);
  const end = globals.indexOf('\n  }', start);
  assert.notEqual(end, -1, `missing closing brace for ${selector}`);
  return globals.slice(start, end);
}

function hexToRgb(hex: string): Rgb {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const second = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const match = lightness - chroma / 2;
  const [red, green, blue] =
    hue < 60 ? [chroma, second, 0] :
    hue < 120 ? [second, chroma, 0] :
    hue < 180 ? [0, chroma, second] :
    hue < 240 ? [0, second, chroma] :
    hue < 300 ? [second, 0, chroma] : [chroma, 0, second];
  return [
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ];
}

function expectTokens(scope: string, tokens: Record<string, string>) {
  for (const [token, expectedHex] of Object.entries(tokens)) {
    const declaration = new RegExp(`--${token}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%\\s*;`).exec(scope);
    assert.ok(declaration, `missing HSL declaration for --${token}`);
    const [, hue, saturation, lightness] = declaration;
    assert.deepEqual(
      hslToRgb(Number(hue), Number(saturation) / 100, Number(lightness) / 100),
      hexToRgb(expectedHex),
      `--${token} must evaluate to ${expectedHex}`
    );
  }
}

test('Admin warm ink and slate tokens retain the approved literal palette inside Admin scope', () => {
  const light = scopedBlock('#admin-theme-root {');
  const dark = scopedBlock('#admin-theme-root[data-theme="dark"] {');

  expectTokens(light, {
    background: '#F3EFE7',
    card: '#FBF9F4',
    foreground: '#2A2318',
    'muted-foreground': '#8C8168',
    border: '#E3DACB',
    primary: '#445263',
    'primary-foreground': '#FFFFFF',
    accent: '#E2E5E9',
    'accent-foreground': '#33404D',
  });
  expectTokens(dark, {
    background: '#1C1712',
    card: '#241E17',
    foreground: '#F3EFE7',
    'muted-foreground': '#A99C82',
    border: '#3A3226',
    primary: '#6B7D90',
    'primary-foreground': '#0E1216',
    accent: '#2A333D',
    'accent-foreground': '#9FB2C2',
  });

  assert.match(light, /--destructive: 0 0% 32%;/);
  assert.match(dark, /--destructive: 0 0% 70%;/);
  assert.doesNotMatch(globals, /(^|\n)\s*(?::root|html|body)\s*\{[^}]*--background:/);
});

test('Admin product status, access, index, Badge, and confidence mappings retain semantic colors', () => {
  assert.match(productsPage, /const lifecycleVariant = \{\s*DRAFT: 'warning',\s*ACTIVE: 'success',\s*BLOCKED: 'destructive',\s*ARCHIVED: 'outline',\s*\} as const;/);
  assert.match(productsPage, /const accessVariant = \{\s*eligible: 'brand',\s*'explicit-noindex': 'neutral',\s*draft: 'warning',\s*blocked: 'destructive',\s*archived: 'outline',\s*\} as const;/);
  assert.match(productsPage, /<Badge variant=\{product\.is_indexed \? 'success' : 'outline'\}>/);

  assert.match(badgeSource, /success: 'border-emerald-500\/30 bg-emerald-500\/10 text-emerald-700 dark:text-emerald-300',/);
  assert.match(badgeSource, /warning: 'border-amber-500\/30 bg-amber-500\/10 text-amber-800 dark:text-amber-300',/);
  assert.match(badgeSource, /destructive: 'bg-admin-destructive text-admin-primary-foreground',/);
  assert.match(badgeSource, /neutral: 'border-admin-border bg-admin-muted text-admin-muted-foreground',/);

  assert.match(specificationsFormSource, /import SpecificationConfidenceSelect from '\.\/SpecificationConfidenceSelect';/);
  assert.match(specificationsFormSource, /<SpecificationConfidenceSelect[\s\S]*?labels=\{translations\.confidences\}/);
  assert.match(confidenceSelectSource, /const confidenceVariants = \{\s*VERIFIED: 'success',\s*LIKELY: 'warning',\s*UNVERIFIED: 'neutral',\s*\} as const;/);
  assert.match(confidenceSelectSource, /<Badge variant=\{presentation\.variant\}/);
});

test('Admin product Actions cell keeps controls in two horizontal rows', () => {
  const actionForm = productsPage.indexOf('<form action={productPublishingAction}', productsPage.indexOf('const isEnableDisabled'));
  assert.notEqual(actionForm, -1, 'missing lifecycle action form');
  const actionsCell = productsPage.slice(
    productsPage.lastIndexOf('<TableCell className="px-4 py-4">', actionForm),
    productsPage.indexOf('</TableCell>', actionForm)
  );

  assert.doesNotMatch(actionsCell, /flex flex-col/);
  assert.match(actionsCell, /<form action=\{productPublishingAction\} className="flex flex-wrap items-center gap-2">[\s\S]*?name="status"[\s\S]*?type="submit"/);
  assert.match(
    actionsCell,
    /<div className="flex flex-wrap items-center gap-2">[\s\S]*?<form action=\{productPublishingAction\}[\s\S]*?name="command" value=\{product\.is_indexed \? 'disable-index' : 'enable-index'\}[\s\S]*?<\/form>[\s\S]*?<Link[\s\S]*?href=\{`\/admin\/products\/\$\{product\.id\}\/specifications`\}/
  );
  assert.match(actionsCell, /<\/div>\s*\{isEnableDisabled && \(/);
});
