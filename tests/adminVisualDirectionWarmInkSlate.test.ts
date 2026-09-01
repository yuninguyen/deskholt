import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const productsPage = readFileSync(join(root, 'src/app/(admin)/admin/products/page.tsx'), 'utf8');
const publicBadgeSource = readFileSync(join(root, 'src/components/ui/Badge.tsx'), 'utf8');
const adminBadgeSource = readFileSync(join(root, 'src/components/admin/AdminStatusBadge.tsx'), 'utf8');
const specificationsFormSource = readFileSync(join(root, 'src/components/admin/products/ProductSpecificationsForm.tsx'), 'utf8');
const confidenceSelectSource = readFileSync(join(root, 'src/components/admin/products/SpecificationConfidenceSelect.tsx'), 'utf8');
const adminLayoutSource = readFileSync(join(root, 'src/app/(admin)/layout.tsx'), 'utf8');
const adminHeaderSource = readFileSync(join(root, 'src/components/admin/AdminHeader.tsx'), 'utf8');
const themeToggleSource = readFileSync(join(root, 'src/components/admin/ThemeToggle.tsx'), 'utf8');
const localeToggleSource = readFileSync(join(root, 'src/components/admin/LocaleToggle.tsx'), 'utf8');
const specificationsPageSource = readFileSync(join(root, 'src/app/(admin)/admin/products/[id]/specifications/page.tsx'), 'utf8');

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
    primary: '#7C93AC',
    'primary-foreground': '#101418',
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
  assert.match(productsPage, /<AdminStatusBadge variant=\{product\.is_indexed \? 'success' : 'outline'\}>/);

  assert.match(adminBadgeSource, /success: 'border-\[rgba\(63,145,66,0\.18\)\] bg-\[rgba\(63,145,66,0\.08\)\] text-\[#3F6B3F\]/);
  assert.match(adminBadgeSource, /brand: 'border-\[rgba\(34,197,94,0\.18\)\] bg-\[rgba\(34,197,94,0\.08\)\] text-\[#15803D\]/);
  assert.match(adminBadgeSource, /warning: 'border-\[rgba\(169,118,46,0\.18\)\] bg-\[rgba\(169,118,46,0\.08\)\] text-\[#80551C\]/);
  assert.match(adminBadgeSource, /destructive: 'border-\[rgba\(168,67,43,0\.18\)\] bg-\[rgba\(168,67,43,0\.08\)\] text-\[#8B3827\]/);
  assert.match(adminBadgeSource, /neutral: 'border-\[rgba\(140,129,104,0\.18\)\] bg-\[rgba\(140,129,104,0\.08\)\] text-\[#655D4D\]/);

  assert.match(specificationsFormSource, /import SpecificationConfidenceSelect from '\.\/SpecificationConfidenceSelect';/);
  assert.match(specificationsFormSource, /<SpecificationConfidenceSelect[\s\S]*?labels=\{translations\.confidences\}/);
  assert.match(confidenceSelectSource, /const confidenceVariants = \{\s*VERIFIED: 'success',\s*LIKELY: 'warning',\s*UNVERIFIED: 'neutral',\s*\} as const;/);
  assert.match(confidenceSelectSource, /<AdminStatusBadge variant=\{presentation\.variant\}/);
});

test('Admin surfaces consume warm ink and slate tokens instead of raw neutral or green utilities', () => {
  assert.match(adminLayoutSource, /className=\{`\$\{ibmPlexSans\.variable\} min-h-screen font-body bg-admin-background text-admin-foreground`\}/);
  assert.match(adminHeaderSource, /border-b border-admin-border bg-admin-card/);
  assert.match(adminHeaderSource, /text-admin-foreground/);
  assert.match(themeToggleSource, /h-\[34px\][^"']*border-admin-input[^"']*text-admin-foreground hover:border-admin-primary/);
  assert.match(localeToggleSource, /h-\[34px\][^"']*border border-\[#E3DACB\] bg-\[#EFE9DC\]/);
  assert.match(localeToggleSource, /bg-admin-primary text-admin-primary-foreground shadow-sm/);
  assert.match(localeToggleSource, /text-admin-muted-foreground hover:text-admin-foreground/);
  assert.match(productsPage, /bg-admin-primary[^"']*text-admin-primary-foreground[^"']*hover:bg-admin-primary\/90/);
  assert.match(productsPage, /<SelectTrigger[\s\S]*?className="box-border h-\[34px\] rounded-\[7px\] px-3 text-\[13px\] font-semibold"/);
  assert.match(productsPage, /border-admin-input[^"']*text-admin-foreground enabled:hover:border-admin-primary/);
  assert.match(productsPage, /text-admin-primary hover:text-admin-primary\/90/);
  assert.match(specificationsFormSource, /bg-admin-primary[^"']*text-admin-primary-foreground hover:bg-admin-primary\/90/);

});

test('Admin semantic status exceptions remain context-bound and all other reviewed utilities consume tokens', () => {
  const badgeSuccessVariant = "success: 'border-[rgba(63,145,66,0.18)] bg-[rgba(63,145,66,0.08)] text-[#3F6B3F] dark:border-[rgba(94,196,98,0.18)] dark:bg-[rgba(94,196,98,0.10)] dark:text-[#8FCB8F]',";
  const badgeBrandVariant = "brand: 'border-[rgba(34,197,94,0.18)] bg-[rgba(34,197,94,0.08)] text-[#15803D] dark:border-[rgba(74,222,128,0.18)] dark:bg-[rgba(74,222,128,0.10)] dark:text-[#86EFAC]',";
  const productsSavedFeedback = /\{query\.saved && \(\s*<p className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950\/40 dark:text-emerald-300">\s*\{translations\.products\.saved\}\s*<\/p>\s*\)\}/;
  const specificationsSavedFeedback = /\{saved && \(\s*<div className="border border-emerald-500\/30 bg-emerald-500\/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">\s*\{translations\.specifications\.saved\}\s*<\/div>\s*\)\}/;

  assert.ok(adminBadgeSource.includes(badgeSuccessVariant), 'Admin status badge success must retain its approved semantic emerald classes');
  assert.ok(adminBadgeSource.includes(badgeBrandVariant), 'Admin status badge brand must retain its approved semantic brand classes');
  assert.doesNotMatch(publicBadgeSource, /AdminStatusBadge/);
  assert.match(productsPage, productsSavedFeedback);
  assert.match(specificationsPageSource, specificationsSavedFeedback);

  const rawPaletteUtility = /(?:bg|text|border)-(?:gray-\d+|white|brand-\d+|emerald-\d+)/;
  const reviewedSources = {
    adminLayoutSource,
    adminHeaderSource,
    themeToggleSource,
    localeToggleSource,
    productsPage: productsPage.replace(productsSavedFeedback, ''),
    specificationsPageSource: specificationsPageSource.replace(specificationsSavedFeedback, ''),
    specificationsFormSource,
    confidenceSelectSource,
    adminBadgeSource: adminBadgeSource.replace(badgeSuccessVariant, '').replace(badgeBrandVariant, ''),
  };
  for (const [surface, source] of Object.entries(reviewedSources)) {
    assert.doesNotMatch(source, rawPaletteUtility, `${surface} bypasses the Admin token palette outside an approved semantic exception`);
  }
});

test('Admin product Actions cell keeps controls in two horizontal rows', () => {
  const actionForm = productsPage.indexOf('<form action={productPublishingAction}', productsPage.indexOf('const isEnableDisabled'));
  assert.notEqual(actionForm, -1, 'missing lifecycle action form');
  const actionsCell = productsPage.slice(
    productsPage.lastIndexOf('<TableCell className="px-4 py-4">', actionForm),
    productsPage.indexOf('</TableCell>', actionForm)
  );

  assert.doesNotMatch(actionsCell, /flex flex-col/);
  assert.match(actionsCell, /<div className="flex flex-nowrap items-center gap-2">[\s\S]*?<form action=\{productPublishingAction\} className="contents">[\s\S]*?name="status"[\s\S]*?type="submit"/);
  assert.match(
    actionsCell,
    /<form action=\{productPublishingAction\} className="contents">[\s\S]*?name="command" value=\{product\.is_indexed \? 'disable-index' : 'enable-index'\}[\s\S]*?<\/form>[\s\S]*?<\/div>\s*<div className="mt-2 flex items-center gap-2">[\s\S]*?<Link[\s\S]*?href=\{`\/admin\/products\/\$\{product\.id\}\/specifications`\}/
  );
  assert.match(actionsCell, /<\/div>\s*\{isEnableDisabled && \(/);
});
