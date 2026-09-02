import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { evaluateProductAccess } from '../src/lib/products/productAccessPolicy.ts';
import { createProductPublishingAction } from '../src/app/(admin)/admin/products/actions.ts';
import { en } from '../src/lib/admin/i18n/en.ts';
import { vi } from '../src/lib/admin/i18n/vi.ts';

const adminProductsPageSource = readFileSync(
  join(process.cwd(), 'src/app/(admin)/admin/products/page.tsx'),
  'utf8'
);
const adminLayoutSource = readFileSync(
  join(process.cwd(), 'src/app/(admin)/layout.tsx'),
  'utf8'
);

const PRODUCT_ID = '00000000-0000-4000-8000-000000000036';

type ProductStatus = 'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'ARCHIVED';
type StoredState = { status: ProductStatus; is_indexed: boolean };
type ProductPublishingActionDependencies = {
  requireAdmin(): Promise<void>;
  publishingStore: {
    setLifecycle(productId: string, status: ProductStatus): Promise<number>;
    enableIndexWhenActive(productId: string): Promise<number>;
    disableIndex(productId: string): Promise<number>;
    findPublishingState(productId: string): Promise<StoredState | null>;
  };
  revalidatePath(path: string): void;
  redirect(path: string): never;
};

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function actionHarness(initial: StoredState | null) {
  let state = initial;
  const writes: unknown[] = [];
  const invalidations: string[] = [];
  const redirects: string[] = [];

  const dependencies: ProductPublishingActionDependencies = {
    requireAdmin: async () => undefined,
    publishingStore: {
      setLifecycle: async (productId, status) => {
        if (!state) return 0;
        writes.push({ operation: 'setLifecycle', productId, status, is_indexed: false });
        state = { status, is_indexed: false };
        return 1;
      },
      enableIndexWhenActive: async (productId) => {
        if (!state || state.status !== 'ACTIVE') return 0;
        writes.push({ operation: 'enableIndexWhenActive', productId, is_indexed: true });
        state = { ...state, is_indexed: true };
        return 1;
      },
      disableIndex: async (productId) => {
        if (!state) return 0;
        writes.push({ operation: 'disableIndex', productId, is_indexed: false });
        state = { ...state, is_indexed: false };
        return 1;
      },
      findPublishingState: async () => state,
    },
    revalidatePath: (path: string) => invalidations.push(path),
    redirect: (path: string) => {
      redirects.push(path);
      throw new Error(`NEXT_REDIRECT:${path}`);
    },
  };

  return {
    action: createProductPublishingAction(dependencies),
    writes,
    invalidations,
    redirects,
    getState: () => state,
  };
}

async function captureRedirect(action: (data: FormData) => Promise<void>, data: FormData) {
  await assert.rejects(() => action(data), /NEXT_REDIRECT:/);
}

test('Admin theme root tolerates intentional pre-hydration theme initialization', () => {
  assert.match(
    adminLayoutSource,
    /id="admin-theme-root"[\s\S]*suppressHydrationWarning/
  );
});

test('Admin Products uses typed server translations for all operator copy', () => {
  assert.match(adminProductsPageSource, /import \{ getAdminTranslations \} from '@\/lib\/admin\/i18n\/server';/);
  assert.match(adminProductsPageSource, /const translations = await getAdminTranslations\(\);/);
  assert.match(adminProductsPageSource, /translations\.products\.(title|description|newProduct|saved|publishingRejected|table|lifecycle|access|index|actions|empty|errors)/);
  assert.doesNotMatch(adminProductsPageSource, /Manage product publication and search-index visibility\./);
  assert.doesNotMatch(adminProductsPageSource, /Chưa có Standing Desk product nào\./);
});

test('Admin translations provide localized backup download copy', () => {
  assert.equal(en.products.downloadBackup, 'Download backup (JSON)');
  assert.equal(vi.products.downloadBackup, 'Tải bản sao lưu (JSON)');
});

test('Admin Products renders a translated backup download Link beside New Product', () => {
  assert.match(
    adminProductsPageSource,
    /<div className="flex flex-wrap items-center gap-2">[\s\S]*?<Link\s+href="\/admin\/backup"[\s\S]*?translations\.products\.downloadBackup[\s\S]*?<\/Link>[\s\S]*?<Link\s+href="\/admin\/products\/new"/
  );
  assert.match(adminProductsPageSource, /translations\.products\.(newProduct|downloadBackup)/);
});

test('Admin Products uses shadcn Table and semantic named Badges in one direct horizontal scroll panel', () => {
  assert.match(adminProductsPageSource, /import \{ Table, TableBody, TableCell, TableHead, TableHeader, TableRow \} from '@\/components\/ui\/table';/);
  assert.match(adminProductsPageSource, /import \{ AdminStatusBadge \} from '@\/components\/admin\/AdminStatusBadge';/);
  assert.match(adminProductsPageSource, /<Table\s+containerClassName="overflow-x-auto[^\"]*"\s+className="min-w-\[900px\]/);
  assert.match(adminProductsPageSource, /<TableHeader(?:\s|>)/);
  assert.match(adminProductsPageSource, /<TableBody>/);
  assert.match(adminProductsPageSource, /<AdminStatusBadge variant=\{.*\}>/);
  assert.doesNotMatch(adminProductsPageSource, /overflow-hidden/);
});

test('Admin Products renders its translated empty state as a table row inside TableBody', () => {
  assert.match(
    adminProductsPageSource,
    /<TableBody>[\s\S]*?products\.length === 0[\s\S]*?<TableRow>[\s\S]*?<TableCell colSpan=\{5\}(?:\s|>)[\s\S]*?translations\.products\.empty[\s\S]*?<\/TableCell>[\s\S]*?<\/TableRow>[\s\S]*?<\/TableBody>/
  );
  assert.doesNotMatch(
    adminProductsPageSource,
    /<\/TableBody>\s*\{products\.length === 0 && \(\s*<caption/
  );
});

test('Admin Products loads and links to each product’s translated offer count in the second action row', () => {
  assert.match(
    adminProductsPageSource,
    /_count:\s*\{\s*select:\s*\{\s*product_attributes:\s*true,\s*affiliate_links:\s*true\s*\}\s*\}/
  );
  assert.match(
    adminProductsPageSource,
    /<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">[\s\S]*?href=\{`\/admin\/products\/\$\{product\.id\}\/offers`\}[\s\S]*?className="whitespace-nowrap text-xs text-admin-primary hover:text-admin-primary\/90"[\s\S]*?translations\.products\.actions\.offers\} \(\{product\._count\.affiliate_links\}\) →/
  );

  const controlsRow = adminProductsPageSource.match(
    /<div className="flex flex-nowrap items-center gap-2">([\s\S]*?)<\/div>\s*<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">/
  );
  assert.ok(controlsRow);
  assert.doesNotMatch(controlsRow[1], /\/admin\/products\/\$\{product\.id\}\/offers/);
});

test('Admin Products preserves publishing submission and feedback contracts with a Radix lifecycle select', () => {
  assert.match(adminProductsPageSource, /import \{ Select, SelectContent, SelectItem, SelectTrigger, SelectValue \} from '@\/components\/ui\/select';/);
  assert.match(adminProductsPageSource, /<form action=\{productPublishingAction\}[\s\S]*?<input type="hidden" name="productId" value=\{product\.id\} \/>[\s\S]*?<input type="hidden" name="command" value="set-lifecycle" \/>[\s\S]*?<Select name="status" defaultValue=\{product\.status\}>[\s\S]*?<SelectTrigger\s+id=\{`status-\$\{product\.id\}`\}\s+autoFocus=\{isFeedbackTarget\}\s+className="box-border h-\[34px\] rounded-\[7px\] px-3 py-0 text-\[13px\] font-semibold"[\s\S]*?<SelectValue \/>[\s\S]*?<SelectContent>[\s\S]*?STATUS_OPTIONS\.map\(\(status\) => <SelectItem key=\{status\} value=\{status\}>\{lifecycleLabels\[status\]\}<\/SelectItem>\)/);
  assert.doesNotMatch(adminProductsPageSource, /<select[\s\S]*?name="status"/);
  assert.match(adminProductsPageSource, /<form action=\{productPublishingAction\}[\s\S]*?<input type="hidden" name="productId" value=\{product\.id\} \/>[\s\S]*?<input type="hidden" name="command" value=\{product\.is_indexed \? 'disable-index' : 'enable-index'\} \/>[\s\S]*?disabled=\{isEnableDisabled\}[\s\S]*?aria-describedby=\{isEnableDisabled \? enableIndexHelpId : undefined\}/);
  assert.match(adminProductsPageSource, /id={`product-\$\{product\.id\}`}/);
  assert.match(adminProductsPageSource, /tabIndex=\{isFeedbackTarget \? 0 : undefined\}/);
  assert.match(adminProductsPageSource, /href=\{`\/admin\/products\/\$\{product\.id\}\/specifications`\}/);
  assert.match(adminProductsPageSource, /aria-live="polite"/);
  assert.match(adminProductsPageSource, /id=\{enableIndexHelpId\}/);
});

test('successful lifecycle save mutates before invalidating homepage and redirecting', async () => {
  const harness = actionHarness({ status: 'ACTIVE', is_indexed: true });

  await captureRedirect(
    harness.action,
    form({ productId: PRODUCT_ID, command: 'set-lifecycle', status: 'BLOCKED' })
  );

  assert.deepEqual(harness.writes, [
    {
      operation: 'setLifecycle',
      productId: PRODUCT_ID,
      status: 'BLOCKED',
      is_indexed: false,
    },
  ]);
  assert.deepEqual(harness.invalidations, ['/']);
  assert.deepEqual(harness.redirects, ['/admin/products?saved=1&productId=' + PRODUCT_ID]);
  assert.deepEqual(harness.getState(), { status: 'BLOCKED', is_indexed: false });
});

test('successful enable invalidates only homepage and redirects after save', async () => {
  const harness = actionHarness({ status: 'ACTIVE', is_indexed: false });

  await captureRedirect(
    harness.action,
    form({ productId: PRODUCT_ID, command: 'enable-index' })
  );

  assert.deepEqual(harness.writes, [
    { operation: 'enableIndexWhenActive', productId: PRODUCT_ID, is_indexed: true },
  ]);
  assert.deepEqual(harness.invalidations, ['/']);
  assert.deepEqual(harness.redirects, ['/admin/products?saved=1&productId=' + PRODUCT_ID]);
});

test('non-active enable rejection has zero writes and zero invalidation', async () => {
  const harness = actionHarness({ status: 'DRAFT', is_indexed: false });

  await captureRedirect(
    harness.action,
    form({ productId: PRODUCT_ID, command: 'enable-index' })
  );

  assert.deepEqual(harness.writes, []);
  assert.deepEqual(harness.invalidations, []);
  assert.deepEqual(harness.redirects, [
    '/admin/products?error=active-only&productId=' + PRODUCT_ID,
  ]);
  assert.deepEqual(harness.getState(), { status: 'DRAFT', is_indexed: false });
});

test('zero-row active classification redirects as concurrency conflict without invalidation', async () => {
  const harness = actionHarness({ status: 'ACTIVE', is_indexed: false });
  harness.action = createProductPublishingAction({
    requireAdmin: async () => undefined,
    publishingStore: {
      setLifecycle: async () => 0,
      enableIndexWhenActive: async () => 0,
      disableIndex: async () => 0,
      findPublishingState: async () => ({ status: 'ACTIVE', is_indexed: false }),
    },
    revalidatePath: (path: string) => harness.invalidations.push(path),
    redirect: (path: string) => {
      harness.redirects.push(path);
      throw new Error(`NEXT_REDIRECT:${path}`);
    },
  });

  await captureRedirect(
    harness.action,
    form({ productId: PRODUCT_ID, command: 'enable-index' })
  );

  assert.deepEqual(harness.invalidations, []);
  assert.deepEqual(harness.redirects, [
    '/admin/products?error=concurrency-conflict&productId=' + PRODUCT_ID,
  ]);
});

test('invalid input and missing Product redirect to controlled errors without invalidation', async () => {
  const invalid = actionHarness({ status: 'ACTIVE', is_indexed: false });
  await captureRedirect(invalid.action, form({ productId: 'invalid', command: 'enable-index' }));
  assert.deepEqual(invalid.writes, []);
  assert.deepEqual(invalid.invalidations, []);
  assert.match(invalid.redirects[0] ?? '', /error=invalid-input/);

  const missing = actionHarness(null);
  await captureRedirect(
    missing.action,
    form({ productId: PRODUCT_ID, command: 'disable-index' })
  );
  assert.deepEqual(missing.writes, []);
  assert.deepEqual(missing.invalidations, []);
  assert.deepEqual(missing.redirects, ['/admin/products?error=missing&productId=' + PRODUCT_ID]);
});

test('unexpected persistence failures propagate and never report success', async () => {
  const invalidations: string[] = [];
  const redirects: string[] = [];
  const action = createProductPublishingAction({
    requireAdmin: async () => undefined,
    publishingStore: {
      setLifecycle: async () => {
        throw new Error('database unavailable');
      },
      enableIndexWhenActive: async () => 0,
      disableIndex: async () => 0,
      findPublishingState: async () => null,
    },
    revalidatePath: (path: string) => invalidations.push(path),
    redirect: (path: string) => {
      redirects.push(path);
      throw new Error(`NEXT_REDIRECT:${path}`);
    },
  });

  await assert.rejects(
    () =>
      action(
        form({ productId: PRODUCT_ID, command: 'set-lifecycle', status: 'ACTIVE' })
      ),
    /database unavailable/
  );
  assert.deepEqual(invalidations, []);
  assert.deepEqual(redirects, []);
});

test('post-command stored state maps to the required public-surface outcomes', async () => {
  const harness = actionHarness({ status: 'DRAFT', is_indexed: true });

  await captureRedirect(
    harness.action,
    form({ productId: PRODUCT_ID, command: 'set-lifecycle', status: 'ACTIVE' })
  );
  assert.deepEqual(harness.getState(), { status: 'ACTIVE', is_indexed: false });
  assert.deepEqual(evaluateProductAccess(harness.getState()!), {
    reason: 'explicit-noindex',
    isPublic: true,
    isIndexable: false,
    isListable: false,
    isInSitemap: false,
    isCommerceEligible: true,
    robots: { index: false, follow: true },
  });

  const enable = actionHarness(harness.getState());
  await captureRedirect(enable.action, form({ productId: PRODUCT_ID, command: 'enable-index' }));
  assert.deepEqual(evaluateProductAccess(enable.getState()!), {
    reason: 'eligible',
    isPublic: true,
    isIndexable: true,
    isListable: true,
    isInSitemap: true,
    isCommerceEligible: true,
    robots: { index: true, follow: true },
  });

  const archive = actionHarness(enable.getState());
  await captureRedirect(
    archive.action,
    form({ productId: PRODUCT_ID, command: 'set-lifecycle', status: 'ARCHIVED' })
  );
  assert.deepEqual(evaluateProductAccess(archive.getState()!), {
    reason: 'archived',
    isPublic: false,
    isIndexable: false,
    isListable: false,
    isInSitemap: false,
    isCommerceEligible: false,
    robots: null,
  });
});
