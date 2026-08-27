# DESKHOLT — MASTER SYSTEM BLUEPRINT & EXECUTION ROADMAP V3
## Workspace Product Intelligence → Decision Commerce → Workspace Decision Platform

**Project:** DeskHolt.com  
**Version:** 3.0  
**Date:** August 2026  
**Status:** **ACTIVE — System / Technical Source of Truth**  
**Companion business document:** `DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md`

---

# 0. MỤC ĐÍCH CỦA V3

V3 hợp nhất những phần còn giá trị từ các tài liệu technical/admin cũ và cập nhật theo các quyết định mới nhất của DeskHolt.

Các tài liệu được supersede bởi V3:

```text
Deskholt-Master-System-Blueprint-V2-V1-to-V5.md
Deskholt-Master-Product-Database-v1-Technical-Spec.md
Deskholt-Master-Strategy-Product-Intelligence-Technical-Blueprint.md
DESKHOLT_FULL_SPECIFICATION.md
Create_Post_for_Deskholt.md
Admin_Panel_for_Deskholt.md
Email_system_for_Deskholt.md
```

Sau khi V3 được chấp nhận, các file trên nên chuyển vào:

```text
/docs/archive/
```

Không cần xóa vĩnh viễn; chỉ không còn dùng làm **active source of truth**.

---

# 1. HỆ THỐNG TÀI LIỆU TỪ V3

Từ đây DeskHolt chỉ nên có **2 master documents active**:

```text
DESKHOLT ACTIVE MASTER DOCUMENTS
│
├── BUSINESS / CONTENT / SEO / SOCIAL / AFFILIATE
│   └── DeskHolt-Master-Strategy-Affiliate-Content-SEO-Social.md
│
└── SYSTEM / TECHNICAL / EXECUTION
    └── DeskHolt-Master-System-Blueprint-V3.md
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
- V3 quyết định **HOW / WHEN**

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

# 5. ROADMAP GATED BY BOTTLENECK

Không unlock version theo calendar.

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

Operating discipline:

```text
NHẬP DỮ LIỆU THẬT
↓
GẶP ISSUE
↓
BLOCKER?
├── YES → sửa ngay
└── NO  → ghi issue → tiếp tục
```

Không quay lại vòng lặp tối ưu schema trên giấy.

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

Admin hiện tại đã có unit conversion.

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
- không claim “Best Total Price” nếu shipping/final cost chưa biết.

Safer label:

> **Lowest listed price**

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

# 28. AFFILIATE REDIRECT / CLICK TRACKING — KEEP

Legacy infra còn giá trị và được giữ conceptually:

```text
User CTA
↓
/go/[slug] or current equivalent
↓
resolve merchant / affiliate destination
↓
create click ID
↓
redirect
↓
persist click
↓
conversion attribution when available
```

Exact route/model implementation phải theo repo hiện tại.

Không để old Markdown override current code.

---

# 29. REDIS / CLICK QUEUE

Nếu repo vẫn dùng Redis click queue:

```text
Route Handler
↓ RPUSH
Redis
↓ BLPOP
Worker
↓
PostgreSQL Click
```

Đây là infrastructure concern độc lập với Product Intelligence.

Không rewrite chỉ vì Master DB được mở rộng.

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

# 39. ADMIN BUILD PRIORITY

Current priority remains:

```text
Product data workflow
↓
10-product ontology test
↓
Merchant/Offer workflow
↓
Product content integration
↓
only then operational polish
```

Do not interrupt Product #1–#10 to build:

```text
global search
fancy dashboard
crawler visualization
advanced SEO health
complex permission model
AI editor assistant
full campaign builder
```

unless they become real blockers.

---

# 40. USERS / AUTH / ACTIVITY LOG

Keep conceptually:

- authenticated Admin;
- multiple users supported;
- simple permissions initially;
- ActivityLog for important changes.

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

# 47. SEO / INDEX ARCHITECTURE

Core rule:

```text
DATABASE ≠ INDEX
```

Flow:

```text
Product/Data record
↓
quality/completeness checks
↓
Index Gate
↓
public page
↓
sitemap/index
```

Do not publish/index thousands of thin permutations.

---

# 48. INDEX GATE

Later Index Gate may evaluate:

```text
Identity completeness
Required specs
Source coverage
Image
Merchant/offer availability
Content quality
Duplicate/thin risk
```

Database may track more Products than Google indexes.

That is intentional.

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

At the current V1-alpha stage, use current repo implementations as truth, including the latest:

```text
schema r3/current schema.prisma
Standing Desk seed r2/current seed.ts
shared ProductAttribute validator r2/current implementation
Admin Specifications current implementation
unit conversion current implementation
PostgreSQL dev via Docker
partial unique index migrations
```

Historical sample Prisma schemas in archived Markdown are **not** implementation instructions.

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

---

# 58. CURRENT 10-PRODUCT DISCIPLINE

For each product:

```text
1. Create Product Identity
2. Add necessary merchant/source links
3. Enter Product-level specs
4. Enter only meaningful tracked variants
5. Do NOT explode merchant option combinations
6. Let Admin normalize units
7. Add source/confidence
8. Save through shared validator
9. Log ontology issue if encountered
10. Continue unless BLOCKER
```

Ontology Issue classification:

```text
BLOCKER
→ cannot correctly represent / save next product
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

Examples of real bottlenecks justifying V2:

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

# 66. FINAL V1 EXECUTION PRIORITY

```text
CURRENT CATEGORY
Standing Desks

CURRENT PRIORITY
Real products

CURRENT PRODUCT MODEL
Identity
Typed attributes
Available options concept
Meaningful variants only
Sources
Merchants / Offers

CURRENT ADMIN
Minimal operational Product Intelligence input

NOT NOW
Full Evidence
Generic Scores
Builder
Accounts
Alerts

FIRST MAJOR CHECKPOINT
10 real Standing Desks

SECOND CHECKPOINT
Standing Desk Schema v1.0

V1 SCALE TARGET
30–50 quality products
```

---

# 67. ARCHIVE DECISION MATRIX

| Old document | Sau V3 | Lý do |
|---|---|---|
| `Deskholt-Master-System-Blueprint-V2-V1-to-V5.md` | ARCHIVE | V3 thay thế trực tiếp |
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
├── DeskHolt-Master-System-Blueprint-V3.md
│
└── archive/
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
