import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateProductAccess } from '../src/lib/products/productAccessPolicy.ts';
import { buildProductMetadata } from '../src/lib/products/productMetadata.ts';
import { mapProductSitemapRows } from '../src/lib/products/productSitemap.ts';

const crossSurfaceCases = [
  ['DRAFT', false, false, false, false, false],
  ['DRAFT', true, false, false, false, false],
  ['BLOCKED', false, false, false, false, false],
  ['BLOCKED', true, false, false, false, false],
  ['ARCHIVED', false, false, false, false, false],
  ['ARCHIVED', true, false, false, false, false],
  ['ACTIVE', false, true, false, false, true],
  ['ACTIVE', true, true, true, true, true],
] as const;

for (const [status, is_indexed, detail, listing, sitemap, commerce] of crossSurfaceCases) {
  test(`cross-surface access is consistent for ${status} + indexed=${is_indexed}`, () => {
    const decision = evaluateProductAccess({ status, is_indexed });

    assert.deepEqual(
      {
        detail: decision.isPublic,
        listing: decision.isListable,
        sitemap: decision.isInSitemap,
        commerce: decision.isCommerceEligible,
      },
      { detail, listing, sitemap, commerce }
    );

    assert.equal(decision.isIndexable, listing);
    assert.equal(decision.isListable, sitemap);
    assert.equal(decision.robots === null, !detail);
    if (decision.robots !== null) {
      assert.equal(decision.robots.index, decision.isIndexable);
      assert.equal(decision.robots.follow, true);
    }
  });
}

for (const [status, is_indexed, detail, , sitemap] of crossSurfaceCases) {
  test(`metadata and sitemap remain policy-consistent for ${status} + indexed=${is_indexed}`, () => {
    const decision = evaluateProductAccess({ status, is_indexed });
    const siteUrl = new URL('https://deskholt.com/');
    const product = {
      name: `${status} desk`,
      slug: `${status}-${is_indexed}`,
      description: '  Cross-surface description  ',
    };

    if (detail) {
      const metadata = buildProductMetadata({ product, decision, siteUrl });
      assert.deepEqual(metadata.robots, decision.robots);
      assert.equal(metadata.description, 'Cross-surface description');
    } else {
      assert.equal(decision.robots, null);
    }

    const entries = decision.isInSitemap
      ? mapProductSitemapRows([{ slug: product.slug, updated_at: new Date(0) }], siteUrl)
      : [];
    assert.equal(entries.length === 1, sitemap);
  });
}
