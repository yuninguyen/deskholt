import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPrismaAffiliateLinkStore,
  deriveTrackingUrl,
  executeCreateAffiliateLink,
  executeUpdateAffiliateLink,
  parseCreateAffiliateLinkInput,
  parseUpdateAffiliateLinkInput,
  type AffiliateLinkStore,
  type CreateAffiliateLinkInput,
} from '../src/lib/products/affiliateLinkCommand.ts';

type StoredLink = {
  id: string;
  product_id: string;
  network: string;
  price: number;
  raw_url: string;
  tracking_url: string;
  is_in_stock: boolean;
  priority_order: number;
};

function form(entries: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function validCreateForm(overrides: Record<string, string> = {}) {
  return form({
    productId: 'product-1',
    network: 'amazon',
    price: '199.99',
    raw_url: 'https://shop.test/product',
    is_in_stock: 'on',
    priority_order: '2',
    ...overrides,
  });
}

// Break caught: changing the placeholder-tag delimiter loses valid merchant URL query syntax.
test('deriveTrackingUrl appends the pending tag with the correct delimiter', () => {
  assert.deepEqual(deriveTrackingUrl('https://shop.test/product'), 'https://shop.test/product?tag=deskholt-pending');
  assert.deepEqual(deriveTrackingUrl('https://shop.test/product?sku=1'), 'https://shop.test/product?sku=1&tag=deskholt-pending');
});

// Break caught: appending a tag after a fragment leaves it inside the non-request fragment instead of the merchant URL query.
test('deriveTrackingUrl inserts the pending tag before a preserved fragment', () => {
  assert.deepEqual(
    deriveTrackingUrl('https://shop.test/item#details'),
    'https://shop.test/item?tag=deskholt-pending#details'
  );
  assert.deepEqual(
    deriveTrackingUrl('https://shop.test/item#details?tab=1'),
    'https://shop.test/item?tag=deskholt-pending#details?tab=1'
  );
});

// Break caught: splitting a fragment at every hash drops valid literal fragment text after the first hash.
test('deriveTrackingUrl preserves every character in a multi-hash fragment', () => {
  assert.deepEqual(
    deriveTrackingUrl('https://shop.test/item#one#two'),
    'https://shop.test/item?tag=deskholt-pending#one#two'
  );
});

// Break caught: accepting an unapproved merchant network lets public click tracking drift from its fixed supported set.
test('parseCreateAffiliateLinkInput rejects networks outside the approved set', () => {
  assert.throws(() => parseCreateAffiliateLinkInput(validCreateForm({ network: 'other' })), /invalid network/i);
});

// Break caught: allowing non-positive, non-finite, or fractional priority data stores offers outside the ranked-offer contract.
test('parseCreateAffiliateLinkInput rejects invalid price and priority values', () => {
  for (const price of ['0', '-1', 'Infinity', 'NaN']) {
    assert.throws(() => parseCreateAffiliateLinkInput(validCreateForm({ price })), /invalid price/i);
  }
  for (const priority_order of ['0', '-1', '1.5', 'NaN']) {
    assert.throws(() => parseCreateAffiliateLinkInput(validCreateForm({ priority_order })), /invalid priority/i);
  }
});

// Break caught: accepting malformed URLs stores a link that cannot safely redirect a customer.
test('parseCreateAffiliateLinkInput rejects malformed raw URLs', () => {
  assert.throws(() => parseCreateAffiliateLinkInput(validCreateForm({ raw_url: 'not-a-url' })), /invalid raw url/i);
});

// Break caught: a missing product identity permits orphan offer records.
test('parseCreateAffiliateLinkInput requires a product id', () => {
  const data = validCreateForm();
  data.delete('productId');
  assert.throws(() => parseCreateAffiliateLinkInput(data), /productId is required/i);
});

// Break caught: route delimiters or navigation segments in product IDs can escape the intended admin offers path.
test('parseCreateAffiliateLinkInput rejects unsafe route-segment product ids', () => {
  for (const productId of ['../x', 'x?foo=bar', 'x#fragment']) {
    assert.throws(() => parseCreateAffiliateLinkInput(validCreateForm({ productId })), /invalid productId/i);
  }
  assert.equal(parseCreateAffiliateLinkInput(validCreateForm()).productId, 'product-1');
});

// Break caught: form-supplied tracking URLs would allow a client to override server-side affiliate tagging.
test('parseCreateAffiliateLinkInput derives tracking data server-side and defaults priority', () => {
  const parsed = parseCreateAffiliateLinkInput(validCreateForm({
    raw_url: ' https://shop.test/product?sku=1 ',
    priority_order: ' ',
    tracking_url: 'https://attacker.test',
  }));

  assert.deepEqual(parsed, {
    productId: 'product-1',
    network: 'amazon',
    price: 199.99,
    rawUrl: 'https://shop.test/product?sku=1',
    isInStock: true,
    priorityOrder: 1,
  });
});

function inMemoryStore() {
  const links: StoredLink[] = [];
  const store: AffiliateLinkStore = {
    createAffiliateLink: async (data) => {
      const link = { id: `link-${links.length + 1}`, ...data };
      links.push(link);
      return { id: link.id };
    },
    findAffiliateLinkForProduct: async (linkId, productId) =>
      links.find((link) => link.id === linkId && link.product_id === productId) ?? null,
    updateAffiliateLink: async (linkId, data) => {
      const link = links.find((candidate) => candidate.id === linkId);
      if (!link) throw new Error('unexpected update');
      Object.assign(link, data);
      return { id: link.id };
    },
  };
  return { store, links };
}

function input(overrides: Partial<CreateAffiliateLinkInput> = {}): CreateAffiliateLinkInput {
  return {
    productId: 'product-1',
    network: 'amazon',
    price: 199.99,
    rawUrl: 'https://shop.test/product',
    isInStock: true,
    priorityOrder: 2,
    ...overrides,
  };
}

// Break caught: create must persist normalized offer data and never trust a client-supplied tracking URL.
test('executeCreateAffiliateLink persists the normalized offer and returns its id', async () => {
  const harness = inMemoryStore();

  assert.deepEqual(await executeCreateAffiliateLink(harness.store, 'product-1', input()), { ok: true, linkId: 'link-1' });
  assert.deepEqual(harness.links, [{
    id: 'link-1',
    product_id: 'product-1',
    network: 'amazon',
    price: 199.99,
    raw_url: 'https://shop.test/product',
    tracking_url: 'https://shop.test/product?tag=deskholt-pending',
    is_in_stock: true,
    priority_order: 2,
  }]);
});

// Break caught: direct callers can bypass form parsing and persist an offer under an unsafe route-segment product id.
test('executeCreateAffiliateLink rejects unsafe product ids before store work', async () => {
  const calls: string[] = [];
  const store: AffiliateLinkStore = {
    createAffiliateLink: async () => {
      calls.push('create');
      return { id: 'link-1' };
    },
    findAffiliateLinkForProduct: async () => {
      calls.push('find');
      return { id: 'link-1' };
    },
    updateAffiliateLink: async () => {
      calls.push('update');
      return { id: 'link-1' };
    },
  };

  for (const productId of ['../x', 'x?foo=bar', 'x#fragment']) {
    assert.deepEqual(await executeCreateAffiliateLink(store, productId, input()), {
      ok: false,
      reason: 'invalid-input',
    });
  }
  assert.deepEqual(calls, []);
});

// Break caught: a create for a non-existent product must surface as invalid input instead of leaking a database failure.
test('executeCreateAffiliateLink maps a Prisma foreign-key error to invalid input', async () => {
  const harness = inMemoryStore();
  harness.store.createAffiliateLink = async () => {
    throw Object.assign(new Error('foreign key constraint'), { code: 'P2003' });
  };

  assert.deepEqual(await executeCreateAffiliateLink(harness.store, 'product-1', input()), {
    ok: false,
    reason: 'invalid-input',
  });
});

// Break caught: an update form without either identity could mutate an offer outside its submitted product scope.
test('parseUpdateAffiliateLinkInput requires both product and link ids', () => {
  const missingProduct = validCreateForm({ linkId: 'link-1' });
  missingProduct.delete('productId');
  assert.throws(() => parseUpdateAffiliateLinkInput(missingProduct), /productId is required/i);

  assert.throws(() => parseUpdateAffiliateLinkInput(validCreateForm()), /linkId is required/i);
});

// Break caught: direct callers can bypass form parsing and probe or mutate an offer with an unsafe route-segment product id.
test('executeUpdateAffiliateLink rejects unsafe product ids before store work', async () => {
  const calls: string[] = [];
  const store: AffiliateLinkStore = {
    createAffiliateLink: async () => {
      calls.push('create');
      return { id: 'link-1' };
    },
    findAffiliateLinkForProduct: async () => {
      calls.push('find');
      return { id: 'link-1' };
    },
    updateAffiliateLink: async () => {
      calls.push('update');
      return { id: 'link-1' };
    },
  };

  for (const productId of ['../x', 'x?foo=bar', 'x#fragment']) {
    assert.deepEqual(await executeUpdateAffiliateLink(store, 'link-1', {
      ...input({ productId }),
      linkId: 'link-1',
    }), { ok: false, reason: 'invalid-input' });
  }
  assert.deepEqual(calls, []);
});

// Break caught: an update that skips product-bound lookup lets one product mutate another product's offer.
test('executeUpdateAffiliateLink returns not-found for missing or cross-product links without mutation', async () => {
  const harness = inMemoryStore();
  await executeCreateAffiliateLink(harness.store, 'product-1', input());

  assert.deepEqual(await executeUpdateAffiliateLink(harness.store, 'missing', {
    ...input(),
    linkId: 'missing',
  }), { ok: false, reason: 'not-found' });
  assert.deepEqual(await executeUpdateAffiliateLink(harness.store, 'link-1', {
    ...input({ productId: 'product-2', price: 1 }),
    linkId: 'link-1',
  }), { ok: false, reason: 'not-found' });
  assert.equal(harness.links[0]?.price, 199.99);
});

// Break caught: a successful update must retain its original link identity while saving all mutable offer fields.
test('executeUpdateAffiliateLink updates a product-bound offer and returns the same link id', async () => {
  const harness = inMemoryStore();
  await executeCreateAffiliateLink(harness.store, 'product-1', input());

  assert.deepEqual(await executeUpdateAffiliateLink(harness.store, 'link-1', {
    ...input({ price: 149.5, rawUrl: 'https://shop.test/product?sku=2', isInStock: false, priorityOrder: 3 }),
    linkId: 'link-1',
  }), { ok: true, linkId: 'link-1' });
  assert.deepEqual(harness.links[0], {
    id: 'link-1',
    product_id: 'product-1',
    network: 'amazon',
    price: 149.5,
    raw_url: 'https://shop.test/product?sku=2',
    tracking_url: 'https://shop.test/product?sku=2&tag=deskholt-pending',
    is_in_stock: false,
    priority_order: 3,
  });
});

// Break caught: a Prisma lookup filtered only by id defeats the product-bound authorization check.
test('createPrismaAffiliateLinkStore scopes the lookup to both link and product ids', async () => {
  let findFirstArgs: unknown;
  const store = createPrismaAffiliateLinkStore({
    affiliateLink: {
      findFirst: async (args: unknown) => {
        findFirstArgs = args;
        return { id: 'link-1' };
      },
    },
  } as never);

  assert.deepEqual(await store.findAffiliateLinkForProduct('link-1', 'product-1'), { id: 'link-1' });
  assert.deepEqual(findFirstArgs, {
    where: { id: 'link-1', product_id: 'product-1' },
    select: { id: true },
  });
});
