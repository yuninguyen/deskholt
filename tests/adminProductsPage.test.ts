import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { en } from '../src/lib/admin/i18n/en.ts';
import { vi } from '../src/lib/admin/i18n/vi.ts';

const pagePath = resolve(process.cwd(), 'src/app/(admin)/admin/products/page.tsx');

test('admin products page labels diagram-backed and real-photo rows distinctly', () => {
  const pageSource = readFileSync(pagePath, 'utf8');

  assert.match(pageSource, /isDiagramUrl\(product\.image_url\)/);
  assert.match(
    pageSource,
    /isDiagram\s*\? translations\.products\.imageOrigin\.diagram\s*: translations\.products\.imageOrigin\.photo/
  );
  assert.match(pageSource, /<AdminStatusBadge[^>]*>[\s\S]*\{imageOriginLabel\}[\s\S]*<\/AdminStatusBadge>/);
  assert.match(pageSource, /<TableCell colSpan=\{5\}/);
});

test('admin image-origin labels preserve the EN/VI dictionary shape', () => {
  assert.deepEqual(Object.keys(en.products.imageOrigin), ['diagram', 'photo']);
  assert.deepEqual(Object.keys(vi.products.imageOrigin), ['diagram', 'photo']);
  assert.equal(en.products.imageOrigin.diagram, 'Diagram');
  assert.equal(en.products.imageOrigin.photo, 'Photo');
  assert.equal(vi.products.imageOrigin.diagram, 'Sơ đồ');
  assert.equal(vi.products.imageOrigin.photo, 'Ảnh');
});
