# P0-A2 — Structured-Data Truthfulness

## Trạng thái

**Implemented, independently reviewed, verified và committed.**

- Approval: revised spec đã được phê duyệt trước implementation
- Implementation commit: `bbe101c fix: make product offers truthful`
- Merge readiness: ready to merge; scoped commit đã hoàn tất

- Priority: P0
- Task type: bounded public-truthfulness fix
- Graph blast radius: **LOW** theo GitNexus
- SEO/trust risk: **HIGH**
- Blueprint alignment: Offer price, availability, freshness và visible-price consistency

## 1. Mục tiêu

Đảm bảo Product JSON-LD và public price surface chỉ gọi một offer là current/available khi offer đó đồng thời có:

```text
valid price
known currency
in-stock availability
valid observation timestamp
observation age within freshness policy
```

Structured data không được:

- lấy giá từ offer out of stock rồi khai báo `InStock`;
- phát hành stale offer như current offer;
- phát hành invalid/non-positive price;
- lấy visible “best” price và JSON-LD price từ hai selection policies khác nhau;
- bịa currency, availability, rating hoặc review count;
- fallback sang offer không đủ eligibility chỉ để giữ rich-result fields.

## 2. Blueprint requirements được áp dụng

P0-A2 thực hiện các rules tại Blueprint V3.1.1:

```text
Offer phải có freshness semantics.
Public price cần timestamp/freshness.
JSON-LD Offer chỉ emit khi price + availability + freshness đủ tin cậy.
Không mặc định InStock.
Visible price và JSON-LD price phải dùng cùng canonical selection logic.
Nếu nhiều current valid offers tồn tại, dùng lowest valid price.
Stale/unknown offer bị loại khỏi current structured output.
Tests cover availability/freshness/price consistency.
```

P0-A2 sau revision này là task hoàn chỉnh cho structured-data truthfulness trong P0 hiện tại, không phải partial remediation.

## 3. Audit snapshot

### Environment và thời điểm

```text
Reviewed environment: local database configured by workspace DATABASE_URL
Reviewed at: 2026-08-25T20:32:57.628Z
Method: read-only Prisma queries over Product and AffiliateLink
```

Đây là audit snapshot, không phải permanent system invariant.

### Current product/offer data

```text
Products:                    20
Indexed products:            20
Affiliate offers:            20
Offers per product:          1
Products without offers:     0
Offers marked in stock:      20
Out-of-stock offers:         0
Invalid/non-positive prices: 0
Amazon.com raw URLs:         20
```

### Current freshness state under proposed 24-hour policy

```text
Oldest last_crawled_at: 2026-08-15T19:07:22.884Z
Newest last_crawled_at: 2026-08-15T19:07:22.914Z
Fresh within 24 hours:  0
Stale beyond 24 hours:  20
```

Expected impact: ngay sau P0-A2, current database sẽ không phát hành JSON-LD `Offer` cho tới khi offer observations được refresh. Đây là intentional fail-closed behavior, không phải implementation defect.

## 4. Bug hiện tại

`ProductDetailPage` query affiliate links theo:

```text
is_in_stock descending
priority_order ascending
```

Sau đó chọn:

```ts
const lowestPrice =
  product.affiliate_links.find((link) => link.is_in_stock)?.price ||
  product.affiliate_links[0]?.price;
```

Tên `lowestPrice` không đúng với behavior: code lấy first in-stock theo query order, không lấy lowest numeric price.

`ProductSchema` nhận primitive `price` và hardcode:

```json
{
  "@type": "Offer",
  "availability": "https://schema.org/InStock"
}
```

### Confirmed false-InStock flow

```text
All affiliate links out of stock
→ no in-stock link found
→ fallback to affiliate_links[0].price
→ ProductSchema sees a truthy price
→ JSON-LD emits InStock
```

### Confirmed stale-offer flow

```text
is_in_stock = true
price = positive
last_crawled_at older than freshness cutoff
→ current code ignores timestamp
→ JSON-LD emits InStock with stale price
```

### Visible/structured selection drift

`PriceTable` independently computes lowest in-stock numeric price for highlighting. Current JSON-LD chooses first in-stock by priority. Với hai offers `$500 priority 1` và `$400 priority 2`, UI highlight `$400` nhưng JSON-LD có thể emit `$500`.

## 5. P0 freshness policy

### Fixed V1 policy

P0-A2 chốt:

```text
STRUCTURED_OFFER_MAX_AGE_MS = 24 * 60 * 60 * 1000
```

Một observation là fresh khi:

```text
last_crawled_at là Date hợp lệ
last_crawled_at <= now
now - last_crawled_at <= STRUCTURED_OFFER_MAX_AGE_MS
```

Future timestamps bị coi là invalid, không fresh.

### Vì sao 24 giờ

- Product page hiện export `revalidate = 86400`, dù current production build table đang phân loại dynamic route do không có `generateStaticParams`.
- Price/availability claims có thể thay đổi nhanh; TTL 24 giờ là maximum observation age, không phải page-cache lifetime.
- Fixed constant tạo fail-closed behavior ổn định, không phụ thuộc env bị thiếu hoặc cấu hình sai.
- Current project chưa có crawler SLA/configuration service để làm TTL dynamic.

### Config source

TTL là exported application policy constant trong:

```text
src/lib/products/productStructuredData.ts
```

Không thêm env var trong P0-A2. Thay đổi TTL sau này là explicit product policy change cần test/review.

### Deterministic time input

Pure functions không tự gọi `Date.now()` bên trong selection loop. Caller truyền:

```ts
now: Date
```

Tests dùng fixed `now` để cover cutoff chính xác.

### Cache-aware freshness policy

P0-A2 chốt **request-time dynamic rendering** cho product detail route. Freshness không được đánh giá một lần rồi giữ trong full-page ISR cache.

Current build route table đã phân loại `/products/[slug]` là dynamic (`ƒ`) vì route không có `generateStaticParams`, nhưng spec không dựa vào incidental framework behavior này. Implementation phải opt in rõ ràng bằng API Next.js 16 được tài liệu trong repository khuyến nghị cho output phụ thuộc `new Date()`:

```ts
import { connection } from 'next/server';

export default async function ProductDetailPage(...) {
  await connection();
  const now = new Date();
  // query and render current offer state
}
```

Theo Next.js 16 docs, `connection()` dừng prerendering và phần code sau nó chạy khi có incoming request. `connection()` được ưu tiên hơn legacy `unstable_noStore`; project không bật Cache Components.

Implementation phải xóa:

```ts
export const revalidate = 86400;
```

khỏi product detail page để không tồn tại contract ISR 24 giờ gây nhầm lẫn với offer TTL 24 giờ.

Behavior được chốt:

```text
Every product-detail request
→ wait for request via connection()
→ determine now
→ load current database observations
→ evaluate freshness
→ build visible state and JSON-LD from the same request-time snapshot
```

Đây là intentional P0 correctness trade-off: product detail page mất full-page ISR caching và tăng database reads. Static product content caching hoặc dynamic offer boundary có thể được tối ưu sau, nhưng không được làm suy yếu request-time freshness trong P0-A2.

## 6. Currency contract

### P0 catalog invariant

P0 hiện là US/USD-only catalog:

- current public UI format dùng `$`;
- current Product JSON-LD hardcode `USD`;
- 20/20 current offers trỏ tới `amazon.com` US catalog;
- seed prices được nhập như USD snapshots;
- chưa có locale/currency switching cho product-price surface.

P0-A2 chốt application-level invariant:

```ts
export const CATALOG_CURRENCY = 'USD' as const;
```

`USD` không được suy luận từ từng affiliate-link record; nó là catalog policy của P0.

### Fail-closed boundary

Trước khi hỗ trợ merchant/catalog ngoài USD, hệ thống phải:

1. thêm canonical per-offer currency source;
2. migrate existing data;
3. update visible formatting và JSON-LD cùng lúc;
4. không emit offer nếu currency unknown/mismatched.

Không được mở rộng `CATALOG_CURRENCY` bằng heuristic hostname hoặc browser locale.

### Verification

Tests phải assert selected structured offer luôn dùng `USD`, và spec/implementation comment phải ghi rõ đây là US-only P0 invariant.

## 7. Canonical offer eligibility

Một candidate đủ điều kiện khi đồng thời:

```text
Number.isFinite(price) === true
price > 0
is_in_stock === true
last_crawled_at là valid Date
last_crawled_at không ở tương lai
age <= 24 hours
currency policy known: USD
```

Stale, future-dated, invalid-price hoặc out-of-stock candidate không thuộc current eligible set.

## 8. Canonical offer selection

### Selection order

Từ eligible set:

```text
1. Lowest numeric price
2. Lower priority_order khi price bằng nhau
3. Original input order nếu price và priority_order vẫn bằng nhau
```

`priority_order` chỉ là tie-breaker, không được override lower valid price.

### Shared source of truth

Một pure canonical selector phải được dùng để:

- chọn JSON-LD `Offer`;
- xác định visible best/current offer;
- điều khiển PriceTable highlight.

Không duy trì hai independent reduce/find implementations.

### One Offer only

P0-A2 emit một schema.org `Offer`, không dùng `AggregateOffer` hoặc offers array. Current data chỉ có một offer mỗi product; multi-offer schema expansion không cần để đóng P0 invariant.

## 9. All-out-of-stock/stale behavior

Nếu không có canonical eligible offer:

```text
Product JSON-LD vẫn được phát hành
Product.offers bị omit hoàn toàn
Không emit InStock
Không emit fallback price
Không emit OutOfStock offer trong task này
Không có visible current/best-price highlight
```

Lý do không emit `OutOfStock`:

- out-of-stock price có thể stale;
- `/go` chưa dùng full freshness eligibility;
- task không mở rộng SEO contract cho non-purchasable offers;
- omit là fail-closed behavior an toàn.

## 10. Visible price/freshness semantics

### Header copy

Đổi:

```text
Live prices & stock status
```

thành:

```text
Retailer prices & stock status
```

### PriceTable rows

Visible rows vẫn có thể hiển thị last-observed retailer price, nhưng phải phân biệt current với stale.

Mỗi row nhận canonical state đã derive ở page/helper:

```ts
type PriceTableRow = {
  network: string;
  price?: number;
  availability: 'current-in-stock' | 'out-of-stock' | 'stale-or-unknown';
  observedAt?: Date;
  isBestCurrentOffer: boolean;
  goHref: string;
};
```

### State precedence

Row state phải được derive theo thứ tự sau; freshness/timestamp validity luôn thắng stored stock flag:

```text
1. Timestamp invalid, future hoặc stale
   → stale-or-unknown

2. Timestamp fresh nhưng price invalid/non-positive
   → stale-or-unknown
   → stored price không được render

3. Timestamp fresh + valid price + is_in_stock === false
   → out-of-stock

4. Timestamp fresh + valid price + is_in_stock === true
   → current-in-stock
```

Do đó `is_in_stock = false` từ một stale observation không được hiển thị là `Out of Stock`; state đúng là `Check retailer` vì current availability đã unknown.

Invalid price map vào `stale-or-unknown`, không tạo state thứ tư. `PriceTable` chỉ gọi `toFixed(2)` sau explicit finite/positive guard hoặc khi `price` đã được narrow thành valid number.

### Row behavior

#### Current in stock

```text
Status: In Stock
Show observed timestamp
CTA: Go
Can be highlighted only when isBestCurrentOffer = true
```

#### Out of stock

```text
Status: Out of Stock
Show observed timestamp
CTA disabled
Never highlighted
```

#### Stale or invalid timestamp

```text
Status: Check retailer
Show “Last checked” timestamp when valid
CTA label: Check price
Never highlighted as best/current
```

A stale row may retain a finite positive historical/last-observed price only when accompanied by stale/last-checked context. It must not be labeled current, live, best or in stock. Nếu stored price invalid, row không render price value và dùng neutral placeholder như `—`.

P0-A2 does not make direct `/go` requests freshness-aware. The stale-row CTA is explicitly a “Check price” action, not a claim that stored price/availability is current.

## 11. Component boundaries

### `src/lib/products/productStructuredData.ts`

Pure policy module:

```ts
export const CATALOG_CURRENCY = 'USD' as const;
export const STRUCTURED_OFFER_MAX_AGE_MS = 86_400_000;

export type OfferCandidate = {
  price: number;
  is_in_stock: boolean;
  priority_order: number;
  last_crawled_at: Date;
};

export type OfferSelectionPolicy = {
  now: Date;
  maxAgeMs: number;
  currency: typeof CATALOG_CURRENCY;
};

export type ProductStructuredOffer = {
  price: number;
  priceCurrency: typeof CATALOG_CURRENCY;
  availability: 'https://schema.org/InStock';
};

export function isCurrentOffer(
  candidate: OfferCandidate,
  policy: OfferSelectionPolicy
): boolean;

export function selectCanonicalOffer<T extends OfferCandidate>(
  candidates: T[],
  policy: OfferSelectionPolicy
): T | undefined;

export function toProductStructuredOffer(
  candidate: OfferCandidate | undefined,
  currency: typeof CATALOG_CURRENCY
): ProductStructuredOffer | undefined;
```

Selector preserves candidate identity so page có thể mark đúng PriceTable row bằng affiliate-link `id`.

### `src/components/ProductSchema.tsx`

Contract thay primitive price bằng explicit offer:

```ts
export interface ProductSchemaProps {
  name: string;
  image: string;
  description: string;
  brand?: string;
  sku?: string;
  offer?: ProductStructuredOffer;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}
```

Pure builder:

```ts
export function buildProductJsonLd(
  product: ProductSchemaProps
): WithContext<Product>;
```

Pure serializer:

```ts
export function serializeProductJsonLd(
  jsonLd: WithContext<Product>
): string {
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}
```

Component chỉ build, serialize và render script tag.

### `src/app/(public)/products/[slug]/page.tsx`

Page:

1. Gọi `await connection()` trước request-time clock và database query.
2. Xóa route-level `revalidate = 86400`.
3. Tạo một `now = new Date()` cho toàn bộ request render.
4. Load affiliate links.
5. Tạo policy với request `now`, fixed TTL và USD currency.
6. Chọn canonical offer bằng shared selector.
7. Convert canonical offer sang `ProductStructuredOffer`.
8. Truyền explicit offer vào `ProductSchema`.
9. Derive PriceTable row state và `isBestCurrentOffer` từ cùng policy/canonical candidate.
10. Không còn `affiliate_links[0]?.price` fallback.
11. Đổi header copy sang neutral wording.

### `src/components/ui/PriceTable.tsx`

- Không tự reduce để chọn lowest price.
- Render `isBestCurrentOffer` do canonical selector quyết định.
- Render tri-state availability/freshness.
- Hiển thị observation time/freshness context.
- Không gọi stale price là in stock/current/best.

## 12. Files dự kiến

### Create

- `src/lib/products/productStructuredData.ts`
- `tests/productStructuredData.test.ts`

### Modify

- `src/components/ProductSchema.tsx`
- `src/app/(public)/products/[slug]/page.tsx`
- `src/components/ui/PriceTable.tsx`

### Không sửa

- `prisma/schema.prisma`
- migrations
- `prisma/seed.ts`
- `src/lib/clickTracking.ts`
- `src/app/go/[slug]/route.ts`
- Admin flow

Nếu implementation cần sửa file ngoài danh sách này, phải dừng và báo scope expansion trước edit.

## 13. Functional requirements

### FR-1 — Preserve Product JSON-LD

Product entity vẫn emit khi không có eligible offer. Thiếu offer không được xóa name/image/description/SKU.

### FR-2 — Complete eligibility

Offer chỉ current khi price, availability, timestamp, age và currency policy đều pass.

### FR-3 — Freshness cutoff

Age đúng 24 giờ được chấp nhận. Age lớn hơn 24 giờ bị loại. Future timestamp bị loại.

### FR-4 — Canonical lowest price

Chọn lowest numeric price trong eligible set.

### FR-5 — Deterministic tie-breaking

Equal price → lower `priority_order`; equal price + priority → original input order.

### FR-6 — Same canonical source

JSON-LD price và visible best/current highlight derive từ cùng selected candidate identity.

### FR-7 — No fallback

Không fallback về first link, stale link, out-of-stock link hoặc invalid-price link.

### FR-8 — USD P0 invariant

Structured offer và visible `$` formatting dùng USD catalog policy. Không infer currency per hostname/user locale.

### FR-9 — No fabricated rating

Aggregate rating vẫn omitted khi thiếu real rating value và review count.

### FR-10 — Visible stale context

Stale finite positive prices chỉ được hiển thị với stale/check-retailer context và observation timestamp; không được highlight là current/best.

### FR-11 — Request-time evaluation

Product detail page phải dùng `connection()` và không dùng route-level ISR `revalidate`. `now`, database observations, visible state và JSON-LD phải được derive trong cùng request render.

### FR-12 — Freshness precedence

Stale/invalid/future timestamp map vào `stale-or-unknown` trước khi đọc stored availability. Stale `is_in_stock = false` không được gọi là current Out of Stock.

### FR-13 — Invalid-price rendering

Invalid/non-positive price map vào `stale-or-unknown`, không render numeric price và không được đưa tới `toFixed()`.

## 14. Truth table

| Candidate state | Eligible | JSON-LD Offer | Visible state | Best highlight |
|---|---:|---|---|---:|
| Valid, in stock, age <24h | Yes | `InStock` + price | In Stock | Có thể |
| Valid, in stock, age =24h | Yes | `InStock` + price | In Stock | Có thể |
| Valid, in stock, age >24h | No | Omit nếu không có candidate khác | Check retailer | No |
| Valid, in stock, future timestamp | No | Omit nếu không có candidate khác | Check retailer | No |
| Valid, out of stock, fresh | No | Omit nếu không có candidate khác | Out of Stock | No |
| Stale, stored out of stock | No | Omit nếu không có candidate khác | Check retailer | No |
| Invalid/future timestamp, stored out of stock | No | Omit nếu không có candidate khác | Check retailer | No |
| Fresh timestamp, price = 0 | No | Omit nếu không có candidate khác | Check retailer; hide price | No |
| Fresh timestamp, price < 0 | No | Omit nếu không có candidate khác | Check retailer; hide price | No |
| Fresh timestamp, price = NaN/Infinity | No | Omit nếu không có candidate khác | Check retailer; hide price | No |
| No links | No | Product only | Empty table state hiện có/follow existing render | No |
| All stale | No | Product only | All rows stale/check retailer | No |
| All fresh out of stock | No | Product only | All rows out of stock | No |
| Fresh $500 priority 1 + fresh $400 priority 2 | $400 wins | Price $400 | $400 highlighted | $400 only |
| Equal $400, priorities 2 and 1 | Priority 1 wins | Price $400 | Priority 1 row highlighted | One row |

## 15. Automated test requirements

### Freshness tests

```text
✓ Valid timestamp within 24h is current
✓ Timestamp exactly at 24h cutoff is current
✓ Timestamp older than 24h is stale
✓ Future timestamp is invalid/stale
✓ Invalid Date is stale
✓ Stale stored out-of-stock state maps to stale-or-unknown, not Out of Stock
✓ Invalid/future timestamp wins over stored stock flag
✓ Selection uses injected now deterministically
```

### Eligibility tests

```text
✓ Out-of-stock candidate is excluded
✓ Zero price is excluded
✓ Negative price is excluded
✓ NaN is excluded
✓ PositiveInfinity is excluded
✓ Stale candidate is excluded
✓ Valid fresh in-stock candidate is eligible
```

Candidate `price` is typed `number`; malformed runtime coverage only needs valid JavaScript numeric edge values (`NaN`, infinity, zero, negative). `null`, string và `undefined` không cần test trừ khi test cố ý cast from `unknown`.

### Canonical selection tests

```text
✓ No candidates returns undefined
✓ All stale returns undefined
✓ All out of stock returns undefined
✓ Lowest eligible price wins
✓ Stale lower price loses to fresh higher price
✓ Out-of-stock lower price loses to in-stock higher price
✓ Equal price uses lower priority_order
✓ Equal price and priority preserves original input order
```

### JSON-LD tests

```text
✓ Product fields emit without an offer
✓ Eligible offer emits selected price, USD, and InStock
✓ Missing offer omits Product.offers entirely
✓ Builder does not fabricate aggregateRating
✓ Serializer escapes '<' through production serialization helper
```

### Visible consistency tests

```text
✓ Canonical selected candidate identity marks exactly one best row
✓ Stale rows are never marked best/current
✓ Out-of-stock rows are never marked best/current
✓ JSON-LD selected price equals highlighted visible row price
✓ No eligible candidate means no highlighted row and no JSON-LD offer
✓ Invalid-price row maps to stale-or-unknown and renders no numeric price
✓ PriceTable never calls numeric formatting for missing/invalid price
```

### Composition regression

```ts
const selected = selectCanonicalOffer(allOutOfStockOrStaleLinks, policy);
const offer = toProductStructuredOffer(selected, CATALOG_CURRENCY);
const jsonLd = buildProductJsonLd({ ...product, offer });
const serialized = serializeProductJsonLd(jsonLd);

assert.equal('offers' in jsonLd, false);
assert.doesNotMatch(serialized, /InStock/);
```

Một composition test khác phải cover two-offer `$500/$400` case và assert JSON-LD + visible best identity cùng chọn `$400`.

### Cache-policy verification

Dynamic rendering là framework-level contract, không giả lập bằng unit test brittle. Acceptance evidence bắt buộc:

```text
✓ ProductDetailPage imports and awaits connection() before now/query
✓ Product detail page no longer exports revalidate = 86400
✓ Production build route table reports ƒ /products/[slug]
✓ Source inspection confirms visible state and JSON-LD use the request-scoped now
```

## 16. TDD sequence

1. Refresh GitNexus và chạy impact analysis cho mọi existing symbol sẽ sửa.
2. Viết failing freshness-boundary tests.
3. Implement policy constant và `isCurrentOffer()` tối thiểu.
4. Viết failing canonical lowest-price/tie-break tests.
5. Implement `selectCanonicalOffer()`.
6. Viết failing JSON-LD builder/serializer tests.
7. Chuyển `ProductSchema` sang explicit offer contract.
8. Viết failing composition tests cho all-OOS/all-stale và `$500/$400` consistency.
9. Viết failing row-state tests cho stale-vs-out-of-stock precedence và invalid-price hiding.
10. Wire ProductDetailPage và PriceTable vào canonical result.
11. Thêm `await connection()`, xóa `revalidate = 86400`, và dùng một request-scoped `now`.
12. Đổi public copy, render timestamp/stale state.
13. Chạy isolated tests, full tests, lint, typecheck và production build.

## 17. Verification requirements

```text
npx tsx --test tests/productStructuredData.test.ts
npm test
npm run lint
npm run typecheck
npm run build
```

Additional verification:

- production route table báo `ƒ /products/[slug]`;
- page source dùng `await connection()` và không còn export `revalidate`;
- current stale database render không emit Product `Offer`;
- current stale rows không được gọi `In Stock`/best/current;
- stale stored out-of-stock rows hiển thị `Check retailer`, không hiển thị current `Out of Stock`;
- invalid prices không được numeric-format hoặc render như price;
- không còn `affiliate_links[0]?.price` fallback;
- `PriceTable` không còn independent lowest-price reduce;
- JSON-LD serializer vẫn escape `<`;
- no fabricated aggregate rating;
- scoped diff chỉ chạm approved files;
- `gitnexus_detect_changes()` chạy trước commit.

## 18. Definition of Done

```text
✓ All-out-of-stock never emits InStock or fallback price
✓ All-stale never emits InStock or stale offer price
✓ Freshness cutoff and future timestamps fail closed correctly
✓ Product detail freshness is evaluated per request via connection(), not 24h ISR
✓ Stale/invalid timestamp takes precedence over stored stock flag
✓ Invalid price maps to non-current state and is never numeric-formatted
✓ Lowest eligible fresh in-stock price is canonical
✓ priority_order is deterministic tie-breaker only
✓ Visible best/current row and JSON-LD use same candidate identity
✓ Stale visible price has timestamp/check-retailer context
✓ No eligible offer preserves Product JSON-LD but omits Product.offers
✓ USD is explicit catalog-level P0 invariant
✓ Aggregate rating remains omitted without real source
✓ Current imported products render without claiming stale offers are current
✓ Structured-data tests pass
✓ Full tests pass
✓ Lint passes
✓ Typecheck passes
✓ Production build passes
✓ GitNexus confirms expected scope
```

## 19. Non-goals

- Merchant/MerchantProduct/Offer schema.
- Per-offer currency migration.
- Multi-currency/locale price display.
- AggregateOffer or multiple JSON-LD offers.
- Price crawler implementation or scheduling.
- Dynamic TTL configuration service.
- Partial Prerendering hoặc tách static product shell/dynamic offer boundary.
- `/go` direct-request freshness eligibility.
- Click persistence/Redis worker/DLQ.
- Basic Index Gate.
- Seed safety.
- Rating/review ingestion.
- Google Rich Results API integration.

## 20. Follow-up risks

### `/go` eligibility

`selectAffiliateLink()` vẫn có out-of-stock fallback và không dùng freshness. P0-A2 chỉ đảm bảo public claims/structured output truthful; direct `/go` policy cần task riêng đã được ghi trong P0 sequence.

### Current data operational impact

20/20 offers hiện stale theo 24-hour policy. Sau implementation, rich-result offer fields sẽ biến mất cho tới khi observations được refresh. Đây là evidence rằng offer-refresh operation/crawler phải được triển khai hoặc data phải được refresh có kiểm soát trước production launch.

### Currency evolution

USD là P0 catalog invariant. Trước khi thêm non-US merchant hoặc non-USD price, per-offer currency trở thành schema prerequisite.

### Indexability/content quality

20/20 products hiện indexed trong khi seed comment cảnh báo content/photo/sentiment chưa hoàn thiện. Basic Index Gate vẫn là blocker kế tiếp độc lập.

## 21. Approval gate

Không implementation trước khi spec được phê duyệt.

Các quyết định được chốt khi duyệt:

1. Freshness max age cố định 24 giờ.
2. Product detail page dùng request-time dynamic rendering qua `connection()` và xóa ISR `revalidate`.
3. Timestamp tương lai, invalid hoặc stale thắng stored stock flag và map sang stale/unknown.
4. Invalid price map sang stale/unknown, không render numeric price.
5. Canonical offer là lowest eligible price; `priority_order` chỉ tie-break.
6. JSON-LD và visible best/current row dùng cùng candidate identity.
7. All-stale/all-out-of-stock → omit `Product.offers`.
8. USD là US-only catalog invariant cho P0.
9. PriceTable có tri-state current/out-of-stock/stale và hiển thị observation context.
10. `/go` freshness eligibility, crawler operation và per-offer currency migration được defer thành follow-up riêng.

## 22. Implementation record

### 22.1 Commit và scoped files

P0-A2 được triển khai và commit tại:

```text
bbe101c fix: make product offers truthful
```

Commit chỉ gồm đúng năm implementation/test files đã duyệt:

```text
src/lib/products/productStructuredData.ts
src/app/(public)/products/[slug]/page.tsx
src/components/ProductSchema.tsx
src/components/ui/PriceTable.tsx
tests/productStructuredData.test.ts
```

Commit summary:

```text
5 files changed, 574 insertions(+), 49 deletions(-)
```

Không stage hoặc commit Prisma schema, migrations, seed, `/go`, click tracking, Admin flow hay các unrelated documentation/worktree changes.

Thay đổi hero copy có sẵn từ trước:

```text
Verified Product Review
→ Specifications & Buying Analysis
```

được giữ trong working tree nhưng chủ động loại khỏi P0-A2 commit.

### 22.2 Behavior đã triển khai

`src/lib/products/productStructuredData.ts` hiện là canonical policy boundary cho offer state:

- `CATALOG_CURRENCY = 'USD'` là explicit P0 US/USD-only catalog policy;
- không infer currency từ merchant URL, hostname hoặc locale;
- non-USD support yêu cầu per-offer currency data trước;
- freshness max age cố định 24 giờ;
- exact 24-hour cutoff được chấp nhận;
- invalid, future hoặc stale timestamp fail closed;
- finite positive price là điều kiện bắt buộc;
- timestamp/freshness và price validity được xét trước stored stock flag;
- canonical offer là lowest eligible current price;
- equal-price tie-break dùng lower `priority_order` rồi stable input order;
- `buildOfferPresentation()` tạo canonical identity và visible row state từ cùng policy;
- `toProductStructuredOffer()` chỉ nhận candidate đã qua canonical selection dưới active request policy.

`ProductDetailPage` hiện:

```text
incoming request
→ await connection()
→ create one request-scoped now
→ query database
→ evaluate freshness and availability
→ create canonical presentation
→ derive PriceTable rows and JSON-LD from the same identity
```

Các implementation details quan trọng:

- đã xóa `export const revalidate = 86400`;
- `await connection()` nằm trước `new Date()` và Prisma query;
- chỉ có một `now` cho toàn request render;
- Prisma query thêm `{ id: 'asc' }` làm deterministic final ordering;
- không còn `affiliate_links[0]?.price` hoặc stale fallback;
- JSON-LD và visible best row dùng cùng canonical affiliate-link identity;
- PriceTable không tự tìm lowest price lần nữa.

### 22.3 JSON-LD behavior

`ProductSchema` hiện sử dụng pure builder và serializer:

```text
buildProductJsonLd()
serializeProductJsonLd()
```

Behavior đã xác nhận:

- Product JSON-LD vẫn tồn tại khi không có eligible offer;
- `Product.offers` bị omit hoàn toàn cho empty/all-stale/all-OOS/invalid inputs;
- không emit false `InStock`;
- không emit stale fallback price;
- không fabricate aggregate rating;
- eligible offer emit explicit `USD` và `https://schema.org/InStock`;
- production serialization tiếp tục escape `<` thành `\u003c`.

### 22.4 Visible PriceTable behavior

PriceTable sử dụng tri-state contract:

```text
current-in-stock
out-of-stock
stale-or-unknown
```

Rendered behavior:

| State | Status | Price | CTA | Highlight |
|---|---|---|---|---|
| Fresh, valid, in stock | `In Stock` | Current observed price | Active `Go` | Chỉ canonical row |
| Fresh, valid, out of stock | `Out of Stock` | Last observed price | Disabled | Không |
| Stale/unknown, valid historical price | `Check retailer` | Price + `Last checked` | Active `Check price` | Không |
| Invalid/non-positive price | `Check retailer` | `—` | Active `Check price` | Không |

Price chỉ được gọi `toFixed()` sau finite/positive guard. React row key dùng affiliate-link `id`, không dùng network hoặc price.

Timestamp UTC được chuẩn hóa cho cả zero và nonzero milliseconds:

```ts
observedAt
  .toISOString()
  .replace('T', ' ')
  .replace(/\.\d{3}Z$/, ' UTC');
```

Ví dụ:

```text
2026-08-20T12:00:00.000Z → 2026-08-20 12:00:00 UTC
2026-08-15T19:07:22.884Z → 2026-08-15 19:07:22 UTC
```

### 22.5 Independent review findings đã xử lý

Independent review ban đầu phát hiện và implementation đã xử lý:

1. Production input order chưa deterministic khi price và `priority_order` cùng bằng nhau.
   - Fix: thêm Prisma final order `{ id: 'asc' }`.
2. Thiếu composition coverage khóa JSON-LD offer identity với visible best-row identity.
   - Fix: thêm pure `buildOfferPresentation()` và corresponding tests.
3. PriceTable React key chưa dùng affiliate-link identity.
   - Fix: truyền và dùng row `id`.
4. Thiếu rendered coverage cho invalid và stale valid prices.
   - Fix: thêm server-rendered PriceTable tests.
5. Thiếu acceptance coverage cho empty, all-OOS, explicit within-cutoff, invalid Date + OOS, negative/Infinity, fresh OOS/current CTA và no-eligible composition.
   - Fix: bổ sung đầy đủ focused acceptance cases.
6. Timestamp formatter không nhất quán với nonzero milliseconds.
   - Fix: strip mọi ba chữ số milliseconds và render UTC label thống nhất.
7. USD invariant và structured-offer conversion precondition chưa được ghi rõ trong source.
   - Fix: thêm policy/precondition comments tại canonical module.

Follow-up review không còn Critical issue, Important implementation defect hoặc known Important test-coverage gap.

### 22.6 Verification evidence

Focused P0-A2 suite:

```text
npx tsx --test tests/productStructuredData.test.ts
21 tests
21 pass
0 fail
```

Full repository suite trước commit:

```text
npm test
43 tests
43 pass
0 fail
```

Quality gates:

```text
npm run lint
→ pass, zero ESLint warnings/errors

npx tsc --noEmit --incremental false
→ pass

npm run build
→ pass
```

`npm run typecheck` có một lần bị environment/file-lock chặn ghi `tsconfig.tsbuildinfo` với `TS5033: EPERM`; non-incremental full typecheck pass và Next.js production build cũng hoàn thành TypeScript stage thành công. Đây không phải TypeScript diagnostic của implementation.

Production route table:

```text
ƒ /products/[slug]
```

Điều này xác nhận product detail page được server-rendered on demand đúng request-time freshness contract.

Build vẫn có warning pre-existing ngoài P0-A2:

```text
The "middleware" file convention is deprecated.
Please use "proxy" instead.
```

### 22.7 Runtime database evidence

Fresh read-only Prisma check sau implementation:

```json
{
  "productCount": 20,
  "productsWithCurrentStructuredOffer": 0,
  "checkedAt": "2026-08-25T21:06:19.690Z"
}
```

Kết quả đúng với fail-closed policy:

- 20 products vẫn tồn tại;
- toàn bộ current offer observations đã stale;
- không product nào có eligible structured offer;
- Product JSON-LD vẫn tồn tại;
- `Product.offers` bị omit cho tới khi observations được refresh.

### 22.8 GitNexus và commit hygiene

Pre-edit GitNexus impact analysis:

```text
ProductDetailPage: LOW, direct dependants 0, affected processes 0
ProductSchema:     LOW, direct dependants 0, affected processes 0
PriceTable:        LOW, direct dependants 0, affected processes 0
formatObservedAt:  LOW, direct caller PriceTable, affected modules 1 (Ui)
```

Next.js component/path-alias edges không được graph resolve đầy đủ, nên source inspection được dùng bổ sung để xác nhận product-detail rendering flow.

Trước commit:

- `gitnexus_detect_changes()` được xác nhận đạt và affected scope đúng P0-A2;
- chỉ năm approved files được stage;
- không dùng `git add .`;
- `git diff --cached --check` pass;
- staged stat và full staged diff được kiểm tra;
- unrelated hunk trong shared page file được loại khỏi index trước commit.

### 22.9 Deferred work giữ nguyên

P0-A2 không mở rộng sang:

- `/go` freshness eligibility;
- crawler scheduling hoặc refresh operation;
- per-offer currency schema/migration;
- Prisma schema, migration hoặc seed changes;
- click persistence/tracking changes;
- AggregateOffer;
- rating/review ingestion;
- Basic Index Gate;
- middleware-to-proxy migration.

Các mục này tiếp tục là follow-up độc lập trong P0 sequence.
