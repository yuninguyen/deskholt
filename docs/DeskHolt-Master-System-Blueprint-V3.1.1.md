# DESKHOLT — MASTER SYSTEM BLUEPRINT & EXECUTION ROADMAP V3.1.1
## Workspace Product Intelligence → Decision Commerce → Workspace Decision Platform

**Project:** DeskHolt.com  
**Version:** 3.1.1  
**Date:** August 2026  
**Status:** **ACTIVE — Canonical System / Technical / Execution Authority**  
**Companion business document:** `DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md`

## V3.1.1 reconciliation summary

V3.1.1 does **not** change the Product Intelligence architecture or canonical gates.

It applies one focused execution patch to P0-B:

```text
V3.1 architecture + gates
+
P0-B Click Persistence Clarification
+
Idempotency / Retry / Timeout Safety
+
Explicit Conversion-First Trade-off
```

Primary V3.1.1 corrections:

1. P0-B requirement is **guarantee-specific**, not Redis-specific.
2. V1 uses bounded synchronous PostgreSQL persistence for click recording.
3. Each request lifecycle gets a unique `clickId` generated **before** persistence.
4. Automatic retries reuse the same `clickId`; user-initiated new clicks get a new ID.
5. Retry is only for transient failures.
6. Only canonical unique-conflict errors (for example Prisma `P2002` / PostgreSQL `23505` equivalent) may be interpreted as “already persisted”.
7. Persistence has a bounded timeout/latency budget.
8. After exhausted persistence attempts, redirect still proceeds (conversion-first).
9. Attribution loss in that failure path is an explicitly accepted V1 trade-off.
10. Persistence failures must be observable through structured logs/metrics.
11. Failure metrics may overcount ambiguous-commit cases; this is documented.
12. Durable async queue infrastructure remains a future option when measured reliability/latency needs justify it.

---

# 0. MỤC ĐÍCH CỦA V3.1.1

V3.1.1 giữ nguyên Product Intelligence architecture và execution gates của V3.1, đồng thời sửa P0-B để tách rõ **durability** khỏi **conversion availability**, bổ sung idempotent click persistence, bounded retry/timeout và explicit V1 trade-off khi PostgreSQL persistence thất bại. V3.1.1 là execution authority mới nhất.

Các tài liệu được supersede bởi V3/V3.1:

```text
Deskholt-Master-System-Blueprint-V2-V1-to-V5.md
Deskholt-Master-Product-Database-v1-Technical-Spec.md
Deskholt-Master-Strategy-Product-Intelligence-Technical-Blueprint.md
DESKHOLT_FULL_SPECIFICATION.md
Create_Post_for_Deskholt.md
Admin_Panel_for_Deskholt.md
Email_system_for_Deskholt.md
```

Sau khi V3.1 được chấp nhận, các file trên và bản V3.0 nên chuyển vào:

```text
/docs/archive/
```

Không cần xóa vĩnh viễn; chỉ không còn dùng làm **active source of truth**.

---

# 1. HỆ THỐNG TÀI LIỆU TỪ V3.1

Từ đây DeskHolt chỉ nên có **2 master documents active**:

```text
DESKHOLT ACTIVE MASTER DOCUMENTS
│
├── BUSINESS / CONTENT / SEO / SOCIAL / AFFILIATE
│   └── DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md
│
└── SYSTEM / TECHNICAL / EXECUTION
    └── DeskHolt-Master-System-Blueprint-V3.1.1.md
```

Implementation truth nằm trong code:

```text
prisma/schema.prisma
prisma/seed.ts
prisma/migrations/
src/lib/products/productAttributeValidator.ts
Admin code
Affiliate redirect/tracking code
Docker / Nginx / deployment configuration
```

## Conflict rule

Nếu Markdown khác code thật:

> **Schema + migration + production code hiện hành thắng.**

Nếu Strategy và System Blueprint khác nhau:

- Strategy quyết định **WHY / WHAT**
- V3.1 quyết định **HOW / WHEN**

## 1.1. CANONICAL CURRENT STATUS

> **V1-alpha Specifications Vertical Slice — functional but not production-safe and not V1 complete.**

```text
V1-alpha Specifications Vertical Slice
Functional
NOT production-safe
NOT Lean V1 complete
NOT ontology-verified
```

## 1.2. CANONICAL EXECUTION GATES

```text
CURRENT — Specifications Vertical Slice
        ↓
P0 — Production Safety
        ↓
P1 — Lean Product Database Completion
        ↓
P2 — 10-Product Ontology Verification
        ↓
LOCK — Standing Desk Schema V1.0
        ↓
P3 — Scale to 30–50 Products
```

V3.1.1 supersedes các execution assumptions cũ sau:

```text
CURRENT PRIORITY = Real products
Merchant/Offer = next implementation task
Basic Index Gate = later
Click queue destructive-pop pattern
Seed without explicit safety policy
Default variant inferred from array/order
```

## 1.3. EXECUTION ELIGIBILITY RULE

Mọi implementation task tiếp theo phải đi qua gate:

```text
Does it close a P0 blocker?
  YES → eligible now
  NO
    ↓
Is P0 fully verified?
  NO  → defer
  YES → evaluate under P1
```

Cho đến khi toàn bộ P0 pass:

- defer Merchant/Offer expansion;
- defer ontology Product #1–#10;
- defer Evidence;
- defer Score;
- defer Best-For intelligence;
- defer Workspace Builder / V2+ layers.

## 1.4. DEFINITION OF DONE CHO P0

```text
Implementation
+
Automated verification / integration tests
+
Lint / typecheck / production build phù hợp
=
P0 item completed
```

“Code đã tồn tại” không đồng nghĩa “P0 đã hoàn thành”.

---

# 2. DESKHOLT ĐANG XÂY CÁI GÌ?

DeskHolt không phải:

- generic affiliate blog;
- hands-on review publication;
- storefront;
- copy của Amazon/Wayfair;
- catalog sao chép toàn bộ merchant variants;
- price comparison site đơn thuần;
- pSEO factory tạo hàng nghìn thin pages.

DeskHolt là:

> **WORKSPACE PRODUCT INTELLIGENCE + DECISION PLATFORM**

Public proposition:

> **Build a better workspace. Compare before you buy.**

Core:

```text
PRODUCT DATA
+
USER INTENT
+
DECISION LOGIC
+
CURRENT OFFERS
=
DESKHOLT
```

Business flow:

```text
SEARCH / SOCIAL / AI DISCOVERY
            ↓
         DESKHOLT
            ↓
 PRODUCT INTELLIGENCE
            +
 COMMERCIAL CONTENT
            +
 FIT / COMPATIBILITY
            ↓
         DECISION
            ↓
      MERCHANT OFFER
            ↓
QUALIFIED AFFILIATE CLICK
            ↓
        CONVERSION
```

North Star:

> **Qualified Merchant Clicks**

---

# 3. NON-HANDS-ON OPERATING MODEL

DeskHolt sẽ **không tự chụp sản phẩm** và không định vị dựa trên physical testing.

Không được dùng wording ngầm khẳng định DeskHolt đã trải nghiệm sản phẩm nếu điều đó không đúng:

```text
"We tested..."
"We used..."
"It feels..."
"During our testing..."
```

Data/content phải tách rõ:

```text
FACT
→ manufacturer / manual / certification / documented retailer fact

DERIVED
→ deterministic DeskHolt calculation / rule

EDITORIAL
→ DeskHolt interpretation dựa trên facts

EXTERNAL USER EXPERIENCE
→ attributed owner / external reviewer evidence
```

Visual system:

```text
Official manufacturer assets
Merchant / affiliate-approved assets
DeskHolt technical diagrams
DeskHolt data visualizations
Generic editorial AI illustrations
```

AI image không được giả làm ảnh thật của named product.

---

# 4. BRAND / DESIGN LANGUAGE

Giữ hướng technical / blueprint:

- Blueprint Blue;
- neutral background;
- Walnut/Sage accents;
- engineering/grid language;
- dimension lines;
- mono typography cho spec/data;
- comparison-first UI.

Nguyên tắc:

> **A comparison desk, not a storefront.**

Photography hỗ trợ nhận diện; **data visualization mới là visual moat**.

---

# 5. ROADMAP GATED BY BOTTLENECK + PRODUCTION SAFETY

Không unlock version theo calendar.

Ở cấp platform dài hạn:

```text
V1
↓ bottleneck thật
V2
↓ bottleneck thật
V3
↓ bottleneck thật
V4
↓ bottleneck thật
V5
```

Nhưng **trong V1 hiện tại**, authority bắt buộc là:

```text
CURRENT — Specifications Vertical Slice
        ↓
P0 — Production Safety
        ↓
P1 — Lean Product Database Completion
        ↓
P2 — 10-Product Ontology Verification
        ↓
LOCK — Standing Desk Schema V1.0
        ↓
P3 — Scale to 30–50 Products
```

Operating discipline vẫn giữ:

```text
GẶP ISSUE THẬT
↓
BLOCKER?
├── YES → sửa ngay
└── NO  → ghi issue → tiếp tục
```

Nhưng với P0:

> **P0 blockers đã được code audit chứng minh nên luôn là BLOCKER.**

Không coi P0 là overengineering.

Không quay lại tối ưu schema trên giấy, nhưng cũng không tiếp tục nhập dữ liệu/commerce trên nền chưa production-safe.

---

# 6. ROADMAP V1 → V5

```text
V1 — LEAN PRODUCT DATABASE
"What is this product?"

V2 — PRODUCT INTELLIGENCE
"What do we know, how fresh is it, and can we trust it?"

V3 — DECISION ENGINE
"Which option fits the user's constraints?"

V4 — COMPATIBILITY / UTILITY PLATFORM
"What works with what?"

V5 — WORKSPACE PLATFORM / MOAT
"What complete workspace should I build, save and optimize?"
```

---

# 7. V1 — MỤC TIÊU

V1 phải chứng minh:

- editors có thể nhập product data có cấu trúc;
- ontology chịu được dữ liệu thật;
- Product pages đọc từ cùng database;
- merchant/offers có thể nối vào product identity;
- product data có thể dùng lại cho Compare/Best/Content;
- workflow đủ đơn giản để scale.

V1 chưa cần:

```text
Full Evidence Engine
DeskHolt overall Score
Workspace Builder
Accounts
Price Alerts
Autonomous AI recommendation
Complex compatibility graph
Generic visual rule builder
```

---

# 8. CURRENT CHECKPOINT — STANDING DESKS

Category hiện tại:

> **Standing Desks**

Sequence:

```text
10 real Standing Desks
↓
Ontology Audit
↓
Standing Desk Schema v1.0
↓
30–50 quality Standing Desks
```

Mốc đầu tiên không phải “schema đẹp”.

Mốc đầu tiên là:

> **10 product thật được nhập và các vấn đề ontology thật xuất hiện.**

---

# 9. CATEGORY EXPANSION DÀI HẠN

Recommended sequence:

```text
1. Standing Desks
2. Monitor Arms
3. Monitor / Desk Lighting
4. Cable Management
5. Docking / Workspace Connectivity
6. Ergonomic Chairs
```

Monitor Arms ưu tiên sớm vì mở ra compatibility:

```text
Desk
 ↕
Monitor Arm
 ↕
Monitor
```

Chair để sau vì phụ thuộc nhiều vào cảm nhận/comfort mà DeskHolt không tự test.

---

# 10. V1 CORE ENTITIES

```text
Brand
Category
Product
ProductVariant

AttributeDefinition
CategoryAttribute
ProductAttribute

Merchant
MerchantProduct
Offer
```

Các website domains hiện hữu vẫn giữ:

```text
BlogPost
AffiliateNetwork
AffiliateLink (legacy/transitional)
Click
Conversion
AffiliateReport
PriceHistory (legacy/transitional)
Users
ActivityLog
Media
Pages
Redirects
SEO
Brevo
Support
```

Master Product Database là **domain extension**, không phải rewrite toàn site.

---

# 11. PRODUCT = IDENTITY

Product chủ yếu giữ:

```text
id
brandId
categoryId
name
slug
series?
modelNumber?
modelYear?

UPC / EAN / GTIN / MPN as available

shortDescription?
primaryImage?
status
timestamps
```

Không nhét toàn bộ vào Product:

```text
all specs
all merchant options
current prices
every merchant
scores
best-for
evidence graph
pros/cons
```

---

# 12. PRODUCTVARIANT — BOUNDARY MỚI

Issue từ dữ liệu thật:

> **Variant explosion**

Merchant configurator có thể tạo:

```text
4 widths
× 3 depths
× 8 finishes
× 3 frame colors
= 288 combinations
```

DeskHolt **không** cần tạo 288 `ProductVariant`.

Rule mới:

> **Merchant Option ≠ DeskHolt ProductVariant**

Tạo `ProductVariant` khi variation làm thay đổi dữ liệu DeskHolt thực sự cần:

- query;
- compare;
- compatibility;
- distinct SKU cần track;
- meaningful distinct offer;
- product identity;
- decision logic.

Không model một variant chỉ vì merchant có một dropdown option.

---

# 13. AVAILABLE OPTIONS — TARGET CONCEPT

Target:

```text
Product
│
├── Product Specifications
│
├── Available Options
│   ├── Width
│   ├── Depth
│   ├── Desktop Material
│   ├── Desktop Finish
│   └── Frame Color
│
└── Tracked ProductVariants
    └── chỉ những biến thể decision-relevant
```

Trong current 10-product test:

- không tạo hàng trăm combinations;
- ghi nhận merchant options thật;
- track variant chỉ khi cần;
- ghi ontology issue nếu schema hiện tại không biểu diễn cleanly.

**Không build generic option engine lớn trước khi pattern được xác nhận qua nhiều product.**

---

# 14. ATTRIBUTE ENGINE

Typed attributes vẫn là core decision.

```text
AttributeDefinition
CategoryAttribute
ProductAttribute
```

Không lưu dữ liệu cần filter/compare/rank chỉ trong:

```text
Product.specs Json
```

Current scopes:

```text
PRODUCT
VARIANT
DERIVED
```

Rules:

```text
PRODUCT
→ variantId = null

VARIANT
→ variantId required

DERIVED
→ product-level hoặc variant-level
```

---

# 15. STANDING DESK ATTRIBUTE SCHEMA V1-ALPHA

Current seed:

```text
35 attributes
```

Grouped into:

```text
Dimensions
Mechanism
Frame
Desktop
Warranty
Certifications
Assembly
Derived / Questionable
```

Current scope distribution:

```text
PRODUCT  24
VARIANT   5
DERIVED   6
```

Các desktop configuration attributes đang là VARIANT phải tiếp tục được stress-test vì discovery mới cho thấy một phần trong số đó có thể thuộc **Available Options**, không nhất thiết materialized variant records.

Không sửa documentation thành “đã giải quyết” trước khi schema thật được update.

---

# 16. DERIVED DATA

Examples:

```text
monitor_arm_compatible
dual_monitor_suitable
ultrawide_suitable
keyboard_tray_compatible
assembly_difficulty
stability_rating
```

V1:

- not required;
- UI tách riêng;
- không coi là raw manufacturer spec;
- dùng để stress-test ontology.

Later có thể chuyển thành:

```text
Derived Attribute
Finding
Fit Result
Compatibility Result
Editorial Verdict
```

---

# 17. UNIT NORMALIZATION

Canonical unit cho V1-alpha Standing Desk schema là **imperial** (in, lb, in/s), không phải metric — khớp với thực tế manufacturer spec sheet thị trường Mỹ vốn công bố bằng inch/lb. Đây là lựa chọn có chủ đích, không phải sai lệch so với nguyên tắc bên dưới.

Admin hiện có unit conversion **hẹp**: chỉ cho cặp đơn vị đã có bằng chứng thật cần (in↔cm cho length, thêm khi phát hiện thêm — xem §70 Ontology Issue Log, Product #1 ErGear EGESD5B). Không build một unit-conversion engine tổng quát cho mọi cặp đơn vị có thể có — chỉ build cặp đã xác nhận cần qua dữ liệu thật.

Principle:

> **Editor nhập đúng unit của source; database lưu canonical unit.**

Ví dụ:

```text
48.4 in → mm
355 lb  → kg
15 years → months
1.5 in/s → mm/s
```

Unit normalization dùng cho:

- filter;
- compare;
- calculations;
- compatibility;
- consistent output.

Không bắt editor tự quy đổi tay.

---

# 18. SHARED VALIDATOR

ProductAttribute writes từ:

```text
Admin
CSV Import
Future ingestion
```

phải dùng cùng shared validator.

Validator chịu trách nhiệm:

- AttributeDefinition tồn tại;
- Product tồn tại;
- Attribute thuộc Category qua CategoryAttribute;
- PRODUCT/VARIANT/DERIVED scope consistency;
- Variant thuộc đúng Product;
- type validation;
- ENUM validation;
- finite DECIMAL/INTEGER.

`isRequired` không chặn per-record save.

Required là:

> **Completeness concern**

để Draft product có thể incomplete.

---

# 19. PRODUCTATTRIBUTE UNIQUENESS

PostgreSQL partial unique indexes là DB invariants:

```sql
CREATE UNIQUE INDEX "ProductAttribute_product_attribute_unique"
ON "ProductAttribute" ("productId", "attributeDefinitionId")
WHERE "variantId" IS NULL;

CREATE UNIQUE INDEX "ProductAttribute_variant_attribute_unique"
ON "ProductAttribute" ("variantId", "attributeDefinitionId")
WHERE "variantId" IS NOT NULL;
```

Prisma migrations touching các bảng liên quan phải được review.

Migration workflow:

```text
prisma migrate dev --create-only
↓
review migration.sql
↓
verify / insert partial indexes
↓
prisma migrate dev
```

Không chạy migration thẳng khi cần hand-edit SQL trước apply.

**Deployment invariant V3.1:**

> Manual SQL được phép nằm **bên trong `prisma/migrations/.../migration.sql` đã version-control**.  
> Standalone `partial-indexes.sql` hoặc checklist “nhớ chạy SQL thủ công sau migration” **không được coi là deployment truth**.

Clean-database migration test phải xác minh hai partial indexes thực sự tồn tại sau migration.

---

# 20. POSTGRESQL FOR DEV AND PROD

Chốt:

> **PostgreSQL cho cả development và production.**

Không dùng SQLite cho V1-alpha vì:

- Decimal semantics;
- partial unique indexes;
- parity với production;
- tránh dev/prod behavior divergence.

Docker Compose trong repo là dev database entrypoint.

---

# 21. V1 ADMIN SPECIFICATIONS

Admin Specifications tối thiểu phải phục vụ editor nhập dữ liệu thật.

Current conceptual UI:

```text
/admin/products/{id}/specifications
│
├── Product-level
├── Variant-level
└── Derived / Questionable
```

Row:

```text
Value
Source URL
Source Type
Confidence
```

Save:

```text
Form
↓
shared validator
↓
transaction
↓
ProductAttribute
```

Không overbuild trước 10-product checkpoint:

```text
No autosave requirement
No giant dashboard requirement
No full Evidence UI
No complex queue automation
No AI data ingestion requirement
```

---

# 22. SOURCE V1

Source metadata hiện có thể nằm trực tiếp trên ProductAttribute.

Concept:

```text
sourceUrl
sourceType
confidence
verifiedAt
```

Source types:

```text
MANUFACTURER
MANUAL
RETAILER
CERTIFICATION
OTHER
```

Confidence:

```text
UNVERIFIED
LIKELY
VERIFIED
```

Source V1 chỉ cần đủ để provenance không bị mất.

---

# 23. V2 — EVIDENCE / PRODUCT INTELLIGENCE

Chỉ unlock khi V1 thật sự gặp:

- multiple sources cho một fact;
- source conflicts;
- claim vs fact;
- audit requirement;
- evidence reuse;
- source freshness problems.

V2 target concepts:

```text
EvidenceSource
ProductEvidence
ProductClaim
Conflict
Finding
Intelligence Health
```

Không implement full Evidence chỉ vì blueprint có nó.

---

# 24. MARKET INTELLIGENCE

Phân biệt:

```text
AffiliateNetwork
Merchant
MerchantProduct
Offer
PriceHistory
```

Không đồng nhất affiliate network với merchant.

Ví dụ:

```text
Impact = network
FlexiSpot = merchant / brand store
```

`MerchantProduct`:

> listing của một DeskHolt Product / meaningful ProductVariant tại merchant.

`Offer`:

> trạng thái commercial quan sát được tại một thời điểm.

---

# 25. OFFER

Target offer data:

```text
price
currency
shipping?
finalPrice?
availability
condition?
coupon?
dataSource
observedAt
expiresAt?
```

Rules:

- mọi offer có freshness semantics;
- affiliate link không đồng nghĩa với offer;
- public price cần timestamp/freshness;
- không claim “Best Total Price” nếu shipping/final cost chưa biết;
- JSON-LD `Offer` chỉ emit khi **price + availability + freshness** đủ tin cậy;
- không mặc định `InStock`;
- giá JSON-LD và giá visible phải cùng nguồn logic;
- nếu nhiều current valid offers tồn tại, price surface/JSON-LD dùng **giá thấp nhất thực sự hợp lệ theo rule**, không lấy “first priority merchant” một cách ngẫu nhiên;
- stale/unknown offer phải bị loại khỏi “live/current” structured output.

Safer labels:

> **Lowest listed price**  
> **Current offer** chỉ khi freshness policy pass.

---

# 26. MERCHANT RANKING

Ranking ưu tiên user value:

```text
Price
Availability
Freshness
Shipping
Merchant reliability
Return policy
```

Affiliate commission:

> **tie-break only**

Không rank merchant cao hơn chỉ vì commission cao hơn.

---

# 27. AFFILIATE NETWORK ARCHITECTURE

Priority concept:

```text
DTC / DIRECT BRAND PROGRAM
↓
Impact / Awin / other network merchant
↓
Major retailer
↓
Amazon as coverage / fallback
```

Core networks/business candidates:

```text
Impact
Awin
Amazon Associates
Direct brand programs
CJ / FlexOffers / others when required
```

Không build integration chỉ vì network tồn tại.

Build khi có merchant/product thật cần nó.

---

# 28. AFFILIATE REDIRECT / CLICK TRACKING — P0 SAFETY

Legacy redirect concept vẫn giữ, nhưng V3.1.1 định nghĩa rõ **conversion-first behavior**.

Target V1 flow:

```text
User CTA
↓
/go/[slug] or current equivalent
↓
resolve destination + product/index eligibility
↓
generate clickId for THIS request lifecycle
↓
capture clickedAt = REQUEST TIME
↓
bounded idempotent persistence attempt
↓
success?
├── YES → redirect merchant
└── NO
     ↓
structured failure log + metric
     ↓
redirect merchant anyway
```

Public redirect safety:

- không redirect Product bị archived/blocked theo canonical status rules;
- không dùng Product không đủ public eligibility để tạo public commerce behavior nếu policy cấm;
- `clickedAt` phản ánh **request time**, không phải persistence completion time;
- merchant redirect vẫn tiếp tục sau exhausted persistence attempts.

## Explicit V1 trade-off

DeskHolt chọn:

> **Conversion continuity over perfect click attribution during persistence outages.**

Điều này có nghĩa:

- click persistence failure **có thể làm mất attribution**;
- failure đó không được che giấu;
- hệ thống không được tuyên bố “never lose a click”.

Exact route/model implementation phải theo repo hiện tại.

---

# 29. CLICK PERSISTENCE SAFETY — P0-B V1 INVARIANT

V3.1.1 không bắt buộc Redis Streams/async queue ở P0.

P0-B requirement là:

> **Click persistence must be idempotent, bounded, observable, and resilient to transient database failures. Merchant redirect remains available after persistence failure; attribution loss in that failure path is an explicitly accepted V1 trade-off.**

## 29.1. Request-scoped click identity

Ngay khi `/go` nhận một click request mới:

```text
clickId = new unique ID
clickedAt = request time
```

`clickId` phải sinh **một lần cho một request lifecycle**.

Quan trọng:

```text
application retry of same request
→ reuse SAME clickId

user clicks again / reloads / starts another redirect request
→ generate NEW clickId
```

Không dùng user/session-level idempotency để dedupe những click thật sự riêng biệt.

## 29.2. Idempotent persistence

Persistence target phải có unique identity:

```text
Click.id = clickId
```

hoặc một unique `eventId` tương đương.

Retry luôn dùng cùng ID:

```text
INSERT clickId=A
↓
response ambiguous / transient failure
↓
retry INSERT clickId=A
↓
unique conflict
↓
treat as already persisted
```

Chỉ canonical unique-conflict mới được interpret là success-via-idempotency.

Examples:

```text
Prisma P2002
PostgreSQL SQLSTATE 23505
```

hoặc equivalent rõ ràng trong stack hiện tại.

Không được:

```text
catch generic error
→ assume persisted
```

vì điều đó che giấu constraint/schema/data errors thật.

## 29.3. Retry policy

Retry chỉ dành cho **transient** failures, ví dụ:

```text
temporary connection failure
connection reset
short-lived pool/connectivity issue
retryable serialization/deadlock condition if applicable
ambiguous response where idempotent retry is safe
```

Không retry mù:

```text
validation error
invalid foreign key
schema mismatch
non-idempotency constraint problem
malformed data
```

Retry phải:

- bounded;
- có small backoff;
- configurable;
- reuse cùng `clickId`.

Số attempt cụ thể không được hardcode trong blueprint nếu chưa audit implementation; code/config hiện hành quyết định giá trị cuối cùng.

## 29.4. Bounded latency / timeout

Click persistence không được block merchant redirect vô hạn.

Required:

```text
DB/query timeout
+
overall persistence latency budget
```

Cần hiểu rõ:

> Application-level timeout/abandon (ví dụ `Promise.race`) không mặc định đồng nghĩa query phía PostgreSQL đã bị cancel.

Vì vậy ambiguous completion vẫn có thể xảy ra.

Đây là lý do idempotent unique `clickId` là mandatory.

## 29.5. Failure behavior

Sau khi exhausted persistence attempts:

```text
structured log
+
failure metric
+
clickId
+
clickedAt
+
product/merchant/destination context
+
error classification
↓
merchant redirect continues
```

Đây là accepted V1 policy:

```text
conversion-first
```

Không được mô tả nó như zero-loss durability.

## 29.6. “Never silently discard” — definition chính xác

Trong V3.1.1:

```text
Never silently discard
≠
Never lose data
```

Nó có nghĩa:

> **Mọi persistence failure phải observable.**

Nếu DB không thể persist sau bounded attempts, attribution có thể mất nhưng system phải ghi nhận failure bằng telemetry/logging phù hợp.

## 29.7. Ambiguous commit / false-negative metric caveat

Có thể xảy ra:

```text
INSERT commit thành công
↓
app không nhận ACK / timeout
↓
retry cũng không resolve rõ trạng thái
↓
app ghi persistence failure
↓
record thực tế vẫn tồn tại trong DB
```

Do đó persistence-failure metric có thể **overcount** một số ambiguous-commit cases.

Đây là false-negative về observability, không phải duplicate-data corruption.

Documentation/dashboard sau này phải tránh diễn giải raw failure metric như “exact number of lost clicks”.

## 29.8. Khi nào async durable queue trở lại?

Async queue không chỉ giải quyết scale; nó có thể giải quyết cả failure decoupling.

Upgrade được justified khi ANY of:

```text
1. DB write materially increases /go p95/p99 latency
2. burst traffic causes connection-pool contention
3. persistence failure rate becomes operationally meaningful
4. attribution loss during DB incidents becomes commercially unacceptable
5. redirect path cần survive DB outage nhưng vẫn giữ click attribution
```

Khi đó target async semantics:

```text
durable enqueue
↓
claim
↓
persist
↓
ACK
↓
retry / retry limit / dead-letter
```

Redis Streams, durable broker hoặc equivalent có thể được dùng khi bottleneck/requirement thật xuất hiện.

P0 hiện tại không ép một queue technology cụ thể.

## 29.9. P0-B automated verification

Tests tối thiểu:

```text
normal insert
transient failure → retry → success
ambiguous commit → retry same clickId
duplicate/idempotent retry
canonical unique-conflict handling
non-unique error is NOT treated as success
permanent failure
timeout path
structured failure logging/metric
redirect continues after exhausted attempts
new user click gets new clickId
same-request retry reuses clickId
```

---

# 30. CLOUDFLARE / NGINX REAL IP INVARIANT

Một invariant quan trọng từ legacy full specification phải được giữ:

```text
Cloudflare
↓
Nginx real_ip module
↓
Next.js
```

Nginx phải restore client IP từ trusted Cloudflare source.

Không tin client-supplied forwarding headers nếu origin có thể bị truy cập trực tiếp.

Production origin nên:

- restrict direct access;
- allow Cloudflare origin traffic;
- hoặc dùng equivalent authenticated origin protection.

Mục tiêu:

- rate limit không bị bypass;
- IP hash không biến thành Cloudflare edge IP;
- click fraud controls có ý nghĩa.

Exact Cloudflare IP list phải lấy từ configuration/current source khi deploy, không copy mãi một static list từ tài liệu lịch sử.

---

# 31. API KEY SECURITY

Affiliate/API credentials:

- không hardcode;
- không commit;
- lưu trong environment;
- nếu lưu dynamic network credentials trong DB thì encrypt at rest;
- secrets không gửi ra client.

Legacy AES-256-GCM pattern có thể giữ nếu repo đang dùng nó, nhưng implementation truth nằm trong code/security configuration hiện hành.

---

# 32. BACKUP INVARIANT

Không backup database duy nhất trên cùng VPS.

Recommended conceptual flow:

```text
pg_dump
↓
gzip
↓
off-server storage
↓
retention
↓
restore test
```

Giữ:

- periodic restore testing;
- snapshot trước major migrations;
- checksum/verification nếu phù hợp;
- rollback notes cho migrations lớn.

Destination có thể thay đổi; invariant là **off-server recoverable backup**.

---

# 33. CONTENT SYSTEM — ROLE

Blog/content không phải source of truth cho product facts.

Rule:

> **Database is source of truth; content references Product.**

Một Product research pass phải có thể feed:

```text
Product page
Comparison
Best For
Guide
Social
Newsletter
```

Không duplicate price/spec snapshots trong article nếu có thể render từ structured DB.

---

# 34. CONTENT TYPES

Core content architecture:

```text
Product Intelligence
Compare
Best For
Fit / Compatibility
Learn
Tools
```

Không coi `Review` là core taxonomy.

`Research Review / Buying Analysis` có thể tồn tại như editorial format, nhưng không ngụ ý physical testing.

---

# 35. BLOG / POST EDITOR — GIỮ GÌ TỪ CREATE_POST SPEC

Giữ các invariants có giá trị:

```text
Create
List
Edit
Preview
Draft
Publish
Schedule
SEO fields
Open Graph
Author
Category / Tags
Affiliate disclosure
Product references
Comparison references
Revision history if operationally useful
```

Affiliate/product content block nên lưu:

> **reference đến Product / merchant data**, không copy price/url chết vào content.

Conceptual blocks:

```text
Product Card
Merchant / Offer Table
Comparison
Disclosure
```

Exact implementation có thể là shortcode, structured node hoặc DB relation; không bắt buộc giữ shortcode mãi nếu repo đổi editor architecture.

---

# 36. CREATE_POST SPEC — RETIRE / MODIFY

Các idea cũ không còn là requirement mặc định:

```text
auto-save every few seconds
runtime post locking
large AI assistant inside editor
AI SEO score
AI autocomplete
generic embeddable block system
hardcoded "review" workflow
userSentiment as pros/cons source
```

Chỉ build khi workflow thật đòi hỏi.

Important retained rule:

> **Product data referenced from DB, not copied into posts.**

---

# 37. SAVE → REDIRECT

Giữ convention nếu repo đang áp dụng:

```text
Create → Save → Edit page
Edit → Save → same Edit page
Publish → Post list
Delete → Post list
```

Lý do:

- server truth rõ;
- tránh stale client state;
- phù hợp small-team Admin.

Không cần ép convention này cho UI nào thực sự cần inline editing/autosave sau này.

---

# 38. ADMIN — MODULE MAP

Admin target modules có thể gồm:

```text
CONTENT
Posts
Tags
Categories
Pages

PRODUCT / COMMERCE
Products
Specifications
Available Options
Meaningful Variants
Merchants
Offers
Affiliate Networks

SYSTEM
Users
Settings
Media
Redirects
Activity Log

OPERATIONS
Crawler / Offer freshness
Sitemap
SEO Health
Index Gate
Legal / compliance support

COMMUNICATION
Subscribers
Campaigns
Support

ANALYTICS
Affiliate reports
Qualified merchant clicks
Revenue metrics
```

Đây là **target module map**, không phải V1 backlog phải build tất cả.

---

# 39. ADMIN BUILD PRIORITY — SUPERSEDED BY P0 GATE

Current priority **không còn** là Product #1–#10.

Current priority:

```text
P0 — Production Safety
```

Until P0 fully verified, chỉ eligible các Admin/system tasks đóng trực tiếp một P0 blocker:

```text
Auth fail-closed
Basic Index Gate
Structured data truthfulness
Click durability
Migration/index safety
Seed safety
Verification/tests/build
```

Defer:

```text
Merchant/Offer expansion
Product #1–#10 ontology dataset
Available Options implementation nếu không phải P0
new Admin commerce modules
advanced editorial workflow
Evidence
Score
Best For
Workspace Builder
```

Sau khi P0 pass, Admin execution chuyển sang P1.

---

# 40. USERS / AUTH / ACTIVITY LOG

Keep conceptually:

- authenticated Admin;
- multiple users supported;
- simple permissions initially;
- ActivityLog for important changes.

## P0 auth invariant — FAIL CLOSED

Nếu Admin auth hiện dùng environment secrets:

```text
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
```

thì:

- thiếu bất kỳ secret bắt buộc nào → login/auth không được hoạt động;
- empty string → invalid configuration;
- không có fallback “allow” branch;
- production startup/config verification phải phát hiện cấu hình thiếu;
- integration tests phải chứng minh missing/empty secrets không thể authenticate.

No need for enterprise RBAC until actual need appears.

---

# 41. MEDIA

Keep:

- media library if already useful;
- external object storage such as R2;
- resize/compression;
- alt metadata;
- source/provenance where appropriate.

Important media rule for new strategy:

> Product images should identify permitted source/usage provenance when possible.

DeskHolt does not depend on self-shot photography.

---

# 42. PAGES / LEGAL

Keep Pages/Legal system.

Important public pages include:

```text
About
Affiliate Disclosure
Editorial / Research Methodology
Privacy
Terms
Cookie / privacy controls as applicable
Contact
```

Research Methodology becomes especially important because DeskHolt is non-hands-on.

---

# 43. EMAIL — FINAL ARCHITECTURE

The old `Email_system_for_Deskholt.md` is **superseded**.

Keep Brevo as external email platform conceptually, but use the corrected architecture from later Admin decisions.

## Subscribers

Preferred model:

```text
Public signup
↓
Brevo Contacts
```

Brevo is source of truth for newsletter subscribers.

Do not maintain a duplicate PostgreSQL `Subscriber` table unless a real product requirement appears.

Admin subscriber screen may be read-only/proxy to Brevo.

---

# 44. EMAIL CAMPAIGNS

Do not send a campaign by manually looping over subscribers and firing transactional emails from DeskHolt.

Use:

```text
Brevo Campaign functionality / API
```

Benefits:

- unsubscribe handling;
- quotas;
- campaign statistics;
- deliverability;
- less duplicate infrastructure.

DeskHolt Admin may:

- list campaigns;
- create campaign inputs;
- trigger Brevo campaign operations;

but Brevo remains campaign delivery system.

---

# 45. SUPPORT

Do not confuse marketing contacts with support tickets.

Correct concept:

```text
Public Contact Form
↓
DeskHolt Ticket record
↓
Admin Support queue
↓
optional Brevo transactional email notification
```

Minimal Ticket:

```text
id
name
email
subject
message
status
createdAt
updatedAt
```

Statuses:

```text
new
replied
resolved
```

Brevo Conversations should not be assumed to be DeskHolt's support database unless deliberately integrated and verified.

---

# 46. EMAIL_SYSTEM LEGACY ITEMS TO RETIRE

Do not carry forward as requirements:

```text
"DeskHolt = Blog affiliate" positioning
ChatAds as architectural dependency
open port 3000 in firewall
rsync backup on same VPS
bulk transactional-email loop for newsletter campaign
Brevo Conversations as automatic Ticket database
Vietnamese public site metadata from old prototype
```

These came from an older project state.

---

# 47. SEO / INDEX ARCHITECTURE — BASIC INDEX SAFETY IS P0

Core rule:

```text
DATABASE ≠ INDEX
```

Product mới mặc định:

```text
DRAFT
+
NOINDEX
```

Không được coi “record tồn tại” là “public/indexable”.

Basic P0 flow:

```text
Product/Data record
↓
default draft/noindex
↓
Basic Index Gate
↓
public detail behavior
↓
robots/meta/index state
↓
sitemap eligibility
```

Public behavior phải xác định rõ cho:

```text
draft
archived
blocked
indexable
```

và trả `noindex` / 404 / unavailable behavior phù hợp với canonical product status.

Do not publish/index thousands of thin permutations.

---

# 48. INDEX GATE

## P0 — Basic Index Gate

Tối thiểu kiểm tra:

```text
Product status
isIndexed / equivalent explicit flag
public eligibility
blocked / archived state
```

P0 phải có tests cho:

- new Product default noindex;
- blocked/archived Product;
- public detail behavior;
- sitemap exclusion;
- redirect/commerce eligibility nơi áp dụng.

## Later — Advanced Index Gate

Sau P0/P1 mới mở rộng sang:

```text
Identity completeness
Required specs
Source coverage
Image
Merchant/offer availability
Content quality
Duplicate/thin risk
```

Database có thể track nhiều Products hơn số Products được index.

Đó là intentional.

---

# 49. STRUCTURED DATA

When sufficient truthful data exists, Product pages may expose:

```text
Product
Brand
Offer / AggregateOffer
MPN / GTIN
Availability
Price
```

Do not fabricate:

```text
Review
Rating
Availability
Price
Pros/Cons claims
```

P0 rules:

- không emit `Offer` khi current offer không đủ freshness;
- không emit `InStock` khi availability unknown;
- price structured data phải dùng cùng canonical offer-selection logic với visible price;
- stale offer phải bị excluded;
- tests phải cover availability/freshness/price consistency.

Structured data must reflect visible/current page content.

---

# 50. CONTENT → DATA GRAPH

Target:

```text
Product
↑ ↓
Comparison
Best For
Guide
Compatibility page
Setup Recipe
```

Do not copy Product data into each page.

Pages should reference Product IDs/entities so product corrections propagate.

---

# 51. V3 — DECISION ENGINE DIRECTION

Do not start with generic overall rating.

Prefer:

```text
Fit for Tall Users
Dual Monitor Fit
Small Space Fit
Budget Fit
Compatibility Result
Data Confidence
```

These are easier to explain and defend than:

```text
DeskHolt Score 8.7/10
```

Principle:

> **Fit Score > Review Score**

until evidence/methodology justify broader scoring.

---

# 52. COMPATIBILITY — LONG-TERM MOAT

Example:

```text
Desk
├── desktop thickness
├── rear clearance
└── dimensions

Monitor Arm
├── clamp range
├── weight capacity
├── VESA
└── monitor count

Monitor
├── weight
├── VESA
└── size
```

Engine:

```text
Desk + Arm + Monitor
↓
compatibility rules
↓
PASS / WARNING / FAIL
↓
reason
```

This creates differentiated high-intent content and tools.

---

# 53. WORKSPACE RECIPES

Later structured bundle:

```text
Developer Setup under $1,500
Small Apartment Setup
Dual Monitor Productivity Setup
Walnut + Black Setup
Mac Mini Setup
```

Recipe:

```text
Product selections
Why chosen
Compatibility
Alternatives
Current merchant offers
Total budget
```

One recipe can create multiple qualified affiliate opportunities.

---

# 54. WORKSPACE BUILDER — NOT NOW

Destination:

```text
User height
Room
Available desk space
Budget
Monitors
Computer
Style
Priorities
↓
DeskHolt
↓
Complete workspace recommendation
```

Do not build until:

- product DB has depth;
- compatibility rules exist;
- merchant offer layer is reliable;
- simpler decision tools demonstrate demand.

---

# 55. AI LAYER — LATER

AI must sit on top of structured truth:

```text
User request
↓
Product Database
↓
Compatibility / Fit rules
↓
Current Offers
↓
Decision output
↓
AI explanation
```

AI should not invent specs/products/offers.

---

# 56. V1 CURRENT IMPLEMENTATION TRUTH

Canonical current status:

> **V1-alpha Specifications Vertical Slice — functional but not production-safe and not V1 complete.**

Existing implementation may include:

```text
current schema.prisma
current Standing Desk seed
shared ProductAttribute validator
Admin Specifications
unit conversion
PostgreSQL dev via Docker
existing redirect/click code
existing auth/index/structured-data code
```

Nhưng:

> **Code exists ≠ feature verified ≠ P0 complete.**

Historical sample Prisma schemas in archived Markdown are **not** implementation instructions.

## 56.1. P0-A — ACCESS + PUBLIC SAFETY

Definition of Done:

- Admin auth fail-closed khi thiếu/rỗng required secrets;
- Product mới default draft/noindex;
- Basic Index Gate enforced;
- public detail/index/sitemap behavior tested;
- JSON-LD `Offer` chỉ emit khi price + availability + freshness đủ;
- visible price và structured price không mâu thuẫn.

## 56.2. P0-B — CLICK + DATA DURABILITY

Definition of Done:

### Click persistence

- `clickId` sinh trước persistence;
- `clickedAt` sinh tại request time;
- retry cùng request reuse cùng `clickId`;
- click request mới của user sinh `clickId` mới;
- unique/idempotent persistence;
- transient-only bounded retry;
- canonical unique-conflict được phân biệt với lỗi khác;
- bounded persistence timeout/latency budget;
- structured failure logging;
- persistence failure metric;
- merchant redirect tiếp tục sau exhausted attempts;
- attribution loss trong failure path được documented như accepted V1 trade-off;
- ambiguous-commit false-negative metric caveat được documented.

### Database deployment / seed safety

- partial indexes nằm trong version-controlled Prisma migration;
- migration test trên clean DB;
- demo/destructive seed fail-closed;
- duplicate/unguarded seed scripts removed or locked.

## 56.3. P0-C — VERIFICATION

Required automated verification:

```text
auth configuration tests
Index/noindex tests
structured Offer/freshness/availability tests
click persistence success/transient-retry/idempotency tests
click timeout/permanent-failure/redirect behavior tests
clean-DB migration/index verification
seed safety tests
```

Final P0 gate also requires:

```text
lint
typecheck
test suite
production build
```

phù hợp với repo.

## 56.4. SEED SAFETY — FAIL CLOSED

Demo/destructive seed không được dựa duy nhất vào:

```text
NODE_ENV
```

Required concept:

```text
explicit seed opt-in
+
database allowlist
+
environment checks
```

Ví dụ policy:

```text
SEED_ALLOW_DEMO_DATA=true
AND
target database host/name ∈ explicit dev/test allowlist
```

Nếu không pass:

```text
FAIL
```

Additional requirements:

- duplicate `prisma/seed.js` hoặc legacy seed script phải xóa/khóa;
- placeholder affiliate tags/URLs không được đi production;
- seed safety có automated tests/checks.

---

# 57. MIGRATION DISCIPLINE

For schema changes requiring hand-edited SQL:

```text
npx prisma format
npx prisma validate
npx prisma generate

npx prisma migrate dev --name <name> --create-only

REVIEW migration.sql

npx prisma migrate dev
```

Check especially:

```text
DROP INDEX
DROP TABLE
ALTER COLUMN
index recreation
partial index removal
```

Do not apply a migration first and review later.

P0 deployment rule:

> **Version-controlled Prisma migration là deployment truth.**

Không phụ thuộc standalone SQL chạy tay sau migration.

P0 verification phải chạy migration trên clean PostgreSQL database và assert các partial unique indexes tồn tại.

---

# 58. P2 — 10-PRODUCT ONTOLOGY DISCIPLINE

**Không bắt đầu section này khi P0 hoặc P1 chưa pass.**

P2 entry condition: một Product record phải vận hành end-to-end được với:

```text
Identity
Options / meaningful variants
Structured attributes
Sources
Merchant listing
Current offer
Basic editorial
Index state
```

Sau đó mới nhập Product #1–#10.

For each product:

```text
1. Create Product Identity
2. Add Available Options / meaningful tracked Variants
3. Use explicit default-variant semantics where applicable
4. Enter structured specs
5. Do NOT explode merchant option combinations
6. Let Admin normalize units
7. Add source/confidence
8. Add Merchant listing + Current Offer
9. Add Basic editorial
10. Verify Index state
11. Log ontology issue
12. Continue unless BLOCKER
```

Ontology Issue classification:

```text
BLOCKER
→ cannot correctly operate next complete product record
→ fix now

NON-BLOCKER
→ imperfection / awkwardness / future improvement
→ log and continue
```

---

# 59. V1 EXIT CRITERIA

V1 can be considered stable enough to lock Standing Desk schema when:

- ~10 real products completed;
- recurring ontology problems understood;
- product/options/variant boundary is workable;
- required attributes are realistic;
- unit workflow works;
- source workflow works;
- editor can enter data without developer intervention for normal cases.

Then:

```text
LOCK Standing Desk Schema v1.0
↓
Scale to 30–50 quality products
```

---

# 60. V2 UNLOCK CONDITIONS

V2 remains **closed** until:

```text
P0 verified
+
P1 complete
+
P2 10-product ontology verification complete
+
Standing Desk Schema V1.0 locked
```

Only then may real bottlenecks justify V2.

Examples:

```text
multiple conflicting sources become common
editors cannot explain why a fact is trusted
source freshness becomes operational problem
same evidence reused across many facts
merchant offers require better history
editorial findings need provenance
```

Then build only the needed Evidence/Product Intelligence layers.

---

# 61. ADMIN TARGET STATE — LATER

Long-term Product workspace may evolve toward:

```text
/admin/products/[id]
├── Overview
├── Identity
├── Specifications
├── Options
├── Variants
├── Sources / Evidence
├── Merchants / Offers
├── Fit
├── Compatibility
├── Editorial
├── Content
└── SEO
```

Do not build all tabs before data requires them.

---

# 62. PRODUCT PAGE TARGET

A strong DeskHolt Product page can work with only a few official images because data is primary.

Target structure:

```text
Product Identity
Official image
DeskHolt Research Summary

Key Specifications
Configurations / Available Options
Technical Diagram
Fit Analysis
Compatibility
Comparisons
Alternatives
Current Merchant Offers
Sources
Methodology / disclosure
```

Not:

```text
15-image lifestyle gallery
hands-on testing narrative
generic star review
```

---

# 63. AFFILIATE CTA MODEL

Prefer context-specific CTAs:

```text
View current price
Check configurations
View available sizes
See current offer
Compare merchants
```

Avoid aggressive CTA before user has enough decision context.

Affiliate monetizes the **decision moment**.

---

# 64. ANALYTICS

Track 4 layers.

## Acquisition

```text
Organic clicks
Social referrals
Email subscribers
```

## Engagement

```text
Product views
Comparison usage
Tool usage
```

## Commercial

```text
Qualified Merchant Clicks
Merchant CTR
EPC
Conversion
Revenue / 1,000 sessions
```

## Data

```text
Completeness
Source coverage
Offer freshness
Index Gate pass rate
```

---

# 65. WHAT NOT TO BUILD YET

```text
Full Workspace Builder
User accounts / saved builds
Price alerts
Generic review score
AI autonomous scoring
AI autonomous Best-For
Vector product matching
Realtime crawling architecture
Data warehouse
Microservices
Large generic options/configurator engine
Enterprise permissions
Full email marketing system duplicated from Brevo
```

---

# 66. CANONICAL V1 EXECUTION AUTHORITY — V3.1.1

```text
CURRENT
V1-alpha Specifications Vertical Slice

STATUS
Functional
NOT production-safe
NOT Lean V1 complete
NOT ontology-verified

ACTIVE GATE
P0 — Production Safety
```

Canonical gates:

```text
CURRENT — Specifications Vertical Slice
        ↓
P0 — Production Safety
        ↓
P1 — Lean Product Database Completion
        ↓
P2 — 10-Product Ontology Verification
        ↓
LOCK — Standing Desk Schema V1.0
        ↓
P3 — Scale to 30–50 Products
```

## P0 Definition of Done

### P0-A — Access + Public Safety

- fail-closed Admin auth;
- Product default draft/noindex;
- Basic Index Gate;
- truthful Offer/availability/freshness JSON-LD;
- visible and structured prices consistent.

### P0-B — Click + Data Durability

- request-scoped unique `clickId`;
- `clickedAt` at request time;
- idempotent unique persistence;
- same-request retry reuses `clickId`;
- new user click gets a new `clickId`;
- transient-only bounded retry;
- canonical unique-conflict handling only;
- bounded timeout/latency budget;
- structured failure logging + metric;
- redirect continues after exhausted persistence attempts;
- attribution loss in that path explicitly accepted/documented;
- ambiguous-commit metric caveat documented;
- partial indexes inside version-controlled Prisma migration;
- seed explicit opt-in + DB allowlist;
- legacy/duplicate unsafe seeds removed or locked.

### P0-C — Verification

- auth tests;
- index/noindex tests;
- structured-data tests;
- click persistence retry/idempotency/failure-path tests;
- migration/index clean-DB verification;
- seed safety tests;
- lint/typecheck/tests/build pass.

## P1 — ONLY AFTER P0

P1 scope:

```text
canonical metric units
Available Options
meaningful tracked Variants
explicit default variant
Brand / Category relations
identifiers / statuses
AffiliateNetwork
Merchant
MerchantProduct
current Offer
legacy dual-read / dual-write
Admin Identity / Sources / Offers / queues
cache invalidation
form correctness / editor UX
```

P1 form correctness includes:

- preserve unsaved values on validation fail;
- warn when only inactive variants exist;
- never silently delete legacy enum values;
- VERIFIED requires valid source according to canonical rule;
- save triggers appropriate `revalidatePath` / `revalidateTag`.

## P2 — ONLY AFTER P1

10 Product records must be end-to-end:

```text
Identity
Options / meaningful variants
Structured attributes
Sources
Merchant listing
Current offer
Basic editorial
Index state
```

Then:

```text
10 real Standing Desks
↓
Ontology Audit
↓
LOCK Standing Desk Schema V1.0
↓
P3 — 30–50 quality products
```

---

# 67. ARCHIVE DECISION MATRIX

| Old document | Sau V3.1.1 | Lý do |
|---|---|---|
| `DeskHolt-Master-System-Blueprint-V3.1.md` | ARCHIVE | V3.1.1 supersede P0-B click persistence semantics |
| `DeskHolt-Master-System-Blueprint-V3.md` | ARCHIVE | V3.1 supersede execution order và Production Safety authority |
| `Deskholt-Master-System-Blueprint-V2-V1-to-V5.md` | ARCHIVE | V3/V3.1 thay thế trực tiếp |
| `Deskholt-Master-Product-Database-v1-Technical-Spec.md` | ARCHIVE | target architecture cũ, nhiều phần đã được V3 gate lại |
| `Deskholt-Master-Strategy-Product-Intelligence-Technical-Blueprint.md` | ARCHIVE | đã merge strategy/technical core |
| `Tong-hop-dinh-huong-Affiliate-Marketing.md` | ARCHIVE | nhiều assumptions hands-on cũ |
| `DESKHOLT_FULL_SPECIFICATION.md` | ARCHIVE | giữ được infra invariants nhưng schema/roadmap cũ không còn authoritative |
| `Create_Post_for_Deskholt.md` | ARCHIVE | feature wishlist lớn; các content invariants cần thiết đã merge |
| `Admin_Panel_for_Deskholt.md` | ARCHIVE | target admin quá rộng cho current V1; invariant quan trọng đã merge |
| `Email_system_for_Deskholt.md` | ARCHIVE | bị Admin v6 sửa nhiều điểm; old support/bulk-email/deploy assumptions lỗi thời |

---

# 68. ACTIVE FILE SET SAU KHI MERGE

Recommended:

```text
/docs/
│
├── DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md
├── DeskHolt-Master-System-Blueprint-V3.1.1.md
│
└── archive/
    ├── DeskHolt-Master-System-Blueprint-V3.1.md
    ├── DeskHolt-Master-System-Blueprint-V3.md
    ├── Deskholt-Master-System-Blueprint-V2-V1-to-V5.md
    ├── Deskholt-Master-Product-Database-v1-Technical-Spec.md
    ├── Deskholt-Master-Strategy-Product-Intelligence-Technical-Blueprint.md
    ├── Tong-hop-dinh-huong-Affiliate-Marketing.md
    ├── DESKHOLT_FULL_SPECIFICATION.md
    ├── Create_Post_for_Deskholt.md
    ├── Admin_Panel_for_Deskholt.md
    └── Email_system_for_Deskholt.md
```

Plus implementation artifacts in repo:

```text
prisma/schema.prisma
prisma/seed.ts
prisma/migrations/*
src/lib/products/productAttributeValidator.ts
Admin implementation
deployment configuration
```

---

# 69. FINAL PRINCIPLE

> **DeskHolt should not try to know everything about every merchant configuration. It should know the facts necessary to help a user make a better workspace buying decision.**

System evolution:

```text
NORMALIZED PRODUCT DATA
↓
TRUSTED PRODUCT INTELLIGENCE
↓
FIT + COMPATIBILITY
↓
DECISION
↓
MERCHANT OFFER
↓
AFFILIATE REVENUE
```

The database is the foundation.

The decision is the product.

Affiliate is the monetization layer.

Production safety is the gate that must pass before expanding the product system.

---

# 70. P2 ONTOLOGY ISSUE LOG (LIVE)

Per §58 process (step 11: "Log ontology issue"). Entries appended as real products are attempted — not edited retroactively to look "resolved" before the schema actually changes (§15).

## Product #1 attempt — ErGear EGESD5B (ASIN B0B41YH9B6), 2026-08-29

Source: Amazon "Product information" / "Technical Details" table (real listing, not seed placeholder).

**BLOCKER — fixed:**

- **Mixed units on one source page.** `Minimum Height` given as `28.35 inches`, `Maximum Height` given as `118 centimeters` — same product, same source table, two different unit systems for the same physical quantity class (length). This is the first real occurrence of the case anticipated in the 2026-08-29 Unit Normalization deferral decision (`docs/superpowers/plans/2026-08-29-unit-normalization-deferral.md`) as the trigger to stop deferring. **Decision: build a narrow in↔cm conversion utility** (not a general unit-conversion engine) — scoped to exactly the unit pair with real evidence. See §17.
- **`desktop_material` ENUM gap.** Real listing states `Top Material Type: Engineered Wood`, which does not match any of the schema's allowed values (`MDF | BAMBOO | SOLID_WOOD | LAMINATE`, §15). Guessing a specific member (e.g. MDF) would fabricate precision the source doesn't provide. **Decision: add `ENGINEERED_WOOD` to the allowed values** for this attribute (additive data change, no destructive migration).

**NON-BLOCKER — logged, not fixed (no schema change forced):**

- **`motor_count` (required) absent from Amazon's standard spec table.** Per §18, `isRequired` does not block save — it's a completeness concern only. Real listings commonly omit this in the structured spec table; it may require a secondary source (product images, bullet description) before a product record can be marked complete. Revisit whether this is a realistic default source expectation after a few more products (§59: "required attributes are realistic").
- **`warranty_months` (required) given only as qualitative "Limited Warranty" on Amazon, no duration number.** Same non-blocking completeness gap as above. Manufacturer's own site may carry the specific term length; Amazon's listing alone does not. Revisit `isRequired: true` for this field after a few more products if this pattern recurs.
- **Marketing size vs. measured size discrepancy.** Listing headline says `Size: 48 X 24 Inches`; the actual `Item Dimensions D x W x H` measurement is `23.6"D x 47.2"W`. Rule: use the measured technical dimension as the source of truth for `desktop_width_in`/`desktop_depth_in`, not the rounded marketing figure.
