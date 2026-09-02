import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { en } from '../src/lib/admin/i18n/en';
import { vi } from '../src/lib/admin/i18n/vi';

const editPagePath = resolve(process.cwd(), 'src/app/(admin)/admin/products/[id]/edit/page.tsx');
const productsPagePath = resolve(process.cwd(), 'src/app/(admin)/admin/products/page.tsx');

// Break caught: drift in EN/VI keys leaves one locale unable to render the edit form.
test('edit product dictionaries preserve EN/VI shape and translated product edit action', () => {
  assert.deepEqual(Object.keys(en.editProduct).sort(), Object.keys(vi.editProduct).sort());
  assert.deepEqual(Object.keys(en.editProduct.errors).sort(), Object.keys(vi.editProduct.errors).sort());
  assert.equal(en.products.actions.edit, 'Edit');
  assert.equal(vi.products.actions.edit, 'Sửa');
});

// Break caught: a missing product must use Next notFound rather than showing an empty editor.
test('edit page uses Promise route props and guards a missing product with notFound', () => {
  const source = readFileSync(editPagePath, 'utf8');

  assert.match(source, /params:\s*Promise<\{ id: string \}>/);
  assert.match(source, /searchParams:\s*Promise<\{ saved\?: string; error\?: string \}>/);
  assert.match(source, /const \{ id \} = await params;/);
  assert.match(source, /if \(!product\) \{\s*notFound\(\);\s*\}/);
  assert.match(source, /select:\s*\{[\s\S]*?id: true,[\s\S]*?name: true,[\s\S]*?slug: true,[\s\S]*?status: true,[\s\S]*?description: true,[\s\S]*?image_url: true,[\s\S]*?upc_code: true,[\s\S]*?is_sustainable: true,[\s\S]*?brand: \{ select: \{ name: true \} \}/);
});

// Break caught: lifecycle-unaware form markup can round-trip a locked slug or expose category edits.
test('edit page renders tokenized Card controls, DRAFT-only slug marker, locked help, and no category input', () => {
  const source = readFileSync(editPagePath, 'utf8');

  assert.match(source, /import \{ Card, CardContent, CardHeader, CardTitle \} from '@\/components\/ui\/card';/);
  assert.match(source, /import \{ Input \} from '@\/components\/ui\/input';/);
  assert.match(source, /import \{ Label \} from '@\/components\/ui\/label';/);
  assert.match(source, /import \{ Textarea \} from '@\/components\/ui\/textarea';/);
  assert.match(source, /import \{ Checkbox \} from '@\/components\/ui\/checkbox';/);
  assert.match(source, /const slugEditable = product\.status === 'DRAFT';/);
  assert.match(source, /<Input id="slug" name="slug" defaultValue=\{product\.slug\} disabled=\{!slugEditable\}/);
  assert.match(source, /slugEditable && \(<input type="hidden" name="slugEditable" value="1" \/>\)/);
  assert.match(source, /!slugEditable && \(<p[^>]*>\{translations\.editProduct\.slugLockedHelp\}<\/p>\)/);
  assert.match(source, /<Textarea id="description" name="description"[^>]*required/);
  assert.match(source, /<Checkbox id="isSustainable" name="isSustainable" value="on" defaultChecked=\{product\.is_sustainable\}/);
  assert.doesNotMatch(source, /name="category"|name="categorySlug"/);
  assert.match(source, /text-admin-primary|text-admin-foreground|text-admin-muted-foreground/);
});

// Break caught: moving edit into the publishing control row changes its compact first-row control geometry.
test('products page keeps the translated edit link in the second action row', () => {
  const source = readFileSync(productsPagePath, 'utf8');
  const rows = source.match(/<div className="flex flex-nowrap items-center gap-2">([\s\S]*?)<\/div>\s*<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">([\s\S]*?)<\/div>/);

  assert.ok(rows);
  assert.doesNotMatch(rows[1], /\/admin\/products\/\$\{product\.id\}\/edit/);
  assert.match(rows[2], /href=\{`\/admin\/products\/\$\{product\.id\}\/edit`\}[\s\S]*?translations\.products\.actions\.edit/);
});
