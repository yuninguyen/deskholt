import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const adminLayout = readFileSync(join(root, 'src/app/(admin)/layout.tsx'), 'utf8');
const rootLayout = readFileSync(join(root, 'src/app/layout.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/app/globals.css'), 'utf8');
const productsPage = readFileSync(join(root, 'src/app/(admin)/admin/products/page.tsx'), 'utf8');
const specificationsForm = readFileSync(join(root, 'src/components/admin/products/ProductSpecificationsForm.tsx'), 'utf8');
const confidenceSelect = readFileSync(join(root, 'src/components/admin/products/SpecificationConfidenceSelect.tsx'), 'utf8');
const adminBadgePath = join(root, 'src/components/admin/AdminStatusBadge.tsx');
const adminBadge = existsSync(adminBadgePath) ? readFileSync(adminBadgePath, 'utf8') : '';
const publicBadge = readFileSync(join(root, 'src/components/ui/Badge.tsx'), 'utf8');
const localeToggle = readFileSync(join(root, 'src/components/admin/LocaleToggle.tsx'), 'utf8');
const themeToggle = readFileSync(join(root, 'src/components/admin/ThemeToggle.tsx'), 'utf8');

test('Round 2 scopes IBM Plex Sans to Admin without changing the public root font setup', () => {
  assert.match(adminLayout, /import \{ IBM_Plex_Sans \} from 'next\/font\/google';/);
  assert.match(adminLayout, /IBM_Plex_Sans\(\{[\s\S]*weight: \['500', '600', '700'\],[\s\S]*variable: '--font-admin-sans'/);
  assert.match(adminLayout, /\$\{ibmPlexSans\.variable\}/);
  assert.match(globals, /#admin-theme-root \{[\s\S]*font-family: var\(--font-admin-sans\), sans-serif;/);
  assert.match(globals, /#admin-theme-root \.font-body \{[\s\S]*font-family: var\(--font-admin-sans\), sans-serif;/);
  assert.doesNotMatch(rootLayout, /IBM_Plex_Sans|font-admin-sans/);
  assert.doesNotMatch(publicBadge, /AdminStatusBadge|font-admin-sans/);
});

test('Round 2 uses the Admin-only tinted dot status badge for products and specifications', () => {
  assert.match(adminBadge, /inline-flex items-center gap-\[6px\] whitespace-nowrap rounded-\[5px\] border px-\[9px\] py-\[3px\] pl-\[7px\] text-\[11\.5px\] font-semibold/);
  assert.match(adminBadge, /<span aria-hidden className=\{cn\('h-\[6px\] w-\[6px\] shrink-0 rounded-full', dotVariants\[variant\]\)\} \/>/);
  assert.match(adminBadge, /bg-\[rgba\(63,145,66,0\.08\)\][\s\S]*text-\[#3F6B3F\][\s\S]*dark:bg-\[rgba\(94,196,98,0\.10\)\][\s\S]*dark:text-\[#8FCB8F\]/);
  assert.match(adminBadge, /bg-\[#3F9142\][\s\S]*dark:bg-\[#5EC462\]/);
  assert.match(adminBadge, /brand: 'border-\[rgba\(34,197,94,0\.18\)\] bg-\[rgba\(34,197,94,0\.08\)\] text-\[#15803D\] dark:border-\[rgba\(74,222,128,0\.18\)\] dark:bg-\[rgba\(74,222,128,0\.10\)\] dark:text-\[#86EFAC\]'/);
  assert.match(adminBadge, /brand: 'bg-\[#22C55E\] dark:bg-\[#4ADE80\]'/);
  assert.match(productsPage, /import \{ AdminStatusBadge \} from '@\/components\/admin\/AdminStatusBadge';/);
  assert.match(productsPage, /<AdminStatusBadge variant=\{accessVariant\[decision\.reason\]\}>/);
  assert.match(productsPage, /<AdminStatusBadge variant=\{lifecycleVariant\[product\.status\]\}>/);
  assert.match(productsPage, /<AdminStatusBadge variant=\{product\.is_indexed \? 'success' : 'outline'\}>/);
  assert.match(specificationsForm, /import \{ AdminStatusBadge \} from '@\/components\/admin\/AdminStatusBadge';/);
  assert.match(specificationsForm, /<AdminStatusBadge variant="warning">\{translations\.derived\}<\/AdminStatusBadge>/);
  assert.match(confidenceSelect, /import \{ AdminStatusBadge \} from '@\/components\/admin\/AdminStatusBadge';/);
  assert.match(confidenceSelect, /<AdminStatusBadge variant=\{presentation\.variant\} className="mt-2">/);
  assert.doesNotMatch(productsPage, /from '@\/components\/ui\/Badge'/);
  assert.doesNotMatch(specificationsForm, /from '@\/components\/ui\/Badge'/);
  assert.doesNotMatch(confidenceSelect, /from '@\/components\/ui\/Badge'/);
});

test('Round 2 makes product actions a two-row equal-control layout without changing form contracts', () => {
  const actionForm = productsPage.indexOf('<form action={productPublishingAction}', productsPage.indexOf('const isEnableDisabled'));
  const actionStart = productsPage.lastIndexOf('<TableCell className="px-4 py-4">', actionForm);
  const actions = productsPage.slice(actionStart, productsPage.indexOf('</TableCell>', actionStart));

  assert.match(actions, /<div className="flex flex-nowrap items-center gap-2">[\s\S]*?<form action=\{productPublishingAction\} className="contents">[\s\S]*?name="status"[\s\S]*?type="submit"[\s\S]*?<form action=\{productPublishingAction\} className="contents">[\s\S]*?name="command" value=\{product\.is_indexed \? 'disable-index' : 'enable-index'\}/);
  assert.match(actions, /className="box-border h-\[34px\] rounded-\[7px\] border border-admin-input bg-admin-card px-3 text-\[13px\] font-semibold text-admin-foreground/);
  assert.match(actions, /className="box-border h-\[34px\] rounded-\[7px\] bg-admin-primary px-3 text-\[13px\] font-semibold text-admin-primary-foreground/);
  assert.match(actions, /className="box-border h-\[34px\] rounded-\[7px\] border border-admin-input px-3 text-\[13px\] font-semibold text-admin-foreground/);
  assert.match(actions, /<div className="mt-2 flex items-center gap-2">[\s\S]*?<Link/);
  assert.match(actions, /disabled=\{isEnableDisabled\}[\s\S]*aria-describedby=\{isEnableDisabled \? enableIndexHelpId : undefined\}/);
});

test('Round 2 applies the exact dark primary, grid, and header control geometry', () => {
  assert.match(globals, /#admin-theme-root\[data-theme="dark"\] \{[\s\S]*--primary: 211\.25 22\.4299% 58\.0392%; \/\* #7C93AC \*\/[\s\S]*--primary-foreground: 210 18\.1818% 7\.8431%; \/\* #101418 \*\//);
  assert.match(specificationsForm, /<div className="sm:col-span-2">[\s\S]*name=\{`sourceType__/);
  assert.match(specificationsForm, /<div className="sm:col-span-2">[\s\S]*<SpecificationConfidenceSelect/);
  assert.match(localeToggle, /h-\[34px\] rounded-\[8px\] border border-\[#E3DACB\] bg-\[#EFE9DC\] p-\[3px\][\s\S]*dark:border-\[#34291E\][\s\S]*dark:bg-\[#17140F\]/);
  assert.match(localeToggle, /h-full w-\[38px\] rounded-\[6px\] text-xs font-bold/);
  assert.match(localeToggle, /bg-admin-primary text-admin-primary-foreground shadow-sm/);
  assert.match(themeToggle, /from 'lucide-react';/);
  assert.match(themeToggle, /h-\[34px\][\s\S]*rounded-\[8px\][\s\S]*border border-admin-input[\s\S]*px-\[14px\][\s\S]*text-\[12\.5px\] font-semibold/);
  assert.match(themeToggle, /gap-\[7px\]/);
});
