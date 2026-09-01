import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const productsPage = readFileSync(join(root, 'src/app/(admin)/admin/products/page.tsx'), 'utf8');

function scopedBlock(selector: string): string {
  const start = globals.indexOf(selector);
  assert.notEqual(start, -1, `missing ${selector} scope`);
  const end = globals.indexOf('\n  }', start);
  assert.notEqual(end, -1, `missing closing brace for ${selector}`);
  return globals.slice(start, end);
}

function expectTokens(scope: string, tokens: Record<string, string>) {
  for (const [token, value] of Object.entries(tokens)) {
    assert.match(scope, new RegExp(`--${token}: [^;]+; /\\* ${value} \\*/`));
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
