# DESKHOLT — MASTER STRATEGY BLUEPRINT
## Workspace Product Intelligence → Decision Commerce → Affiliate Revenue

**Status:** CHỐT định hướng chiến lược  
**Mục tiêu:** Xây DeskHolt thành nền tảng giúp người dùng hiểu sản phẩm workspace, so sánh lựa chọn, xác định mức độ phù hợp với setup của họ, sau đó chuyển traffic có ý định mua sang merchant thông qua affiliate.

---

# 1. TÓM TẮT ĐỊNH HƯỚNG

DeskHolt không nên trở thành một website review sản phẩm kiểu truyền thống.

DeskHolt nên được định vị là:

> **Workspace Product Intelligence & Decision Platform**

Public proposition:

> **Build a better workspace. Compare before you buy.**

Vai trò của DeskHolt:

1. **Discover** — giúp user khám phá sản phẩm.
2. **Understand** — giúp user hiểu spec, configuration, tradeoff.
3. **Compare** — giúp user so sánh các lựa chọn.
4. **Fit** — giúp user biết sản phẩm có phù hợp với nhu cầu/setup của mình hay không.
5. **Decide** — giúp user chọn sản phẩm phù hợp.
6. **Buy** — đưa user sang merchant phù hợp bằng affiliate link.

Affiliate là **monetization layer**, không phải identity của thương hiệu.

---

# 2. DESKHOLT THỰC SỰ BÁN CÁI GÌ?

DeskHolt không bán sản phẩm và cũng không bán “review”.

DeskHolt cung cấp:

> **Sự tự tin trước quyết định mua workspace product.**

```text
GOOGLE / AI SEARCH / SOCIAL
            ↓
     USER CÓ MỘT VẤN ĐỀ
            ↓
         DESKHOLT
            ↓
  Research + Structured Data
            ↓
 Compare / Fit / Alternatives
            ↓
 USER HIỂU MÌNH NÊN MUA GÌ
            ↓
    CURRENT MERCHANT OFFER
            ↓
     AFFILIATE CLICK
            ↓
          SALE
```

North Star:

> **Qualified Merchant Clicks**

Không lấy số lượng bài viết, số lượng SKU hay pageview thuần làm North Star.

---

# 3. DEBATE: DESKHOLT NÊN TRỞ THÀNH LOẠI WEBSITE NÀO?

| Phương án | Ưu điểm | Điểm yếu | Kết luận |
|---|---|---|---|
| Affiliate review blog | Dễ triển khai | Không có sản phẩm thật, trust yếu, cạnh tranh SEO cao | Không chọn |
| Price comparison site | Commercial intent mạnh | Dễ commoditized | Không chọn độc lập |
| Product database kiểu catalog | Scale tốt | Database không tự tạo giá trị | Không chọn độc lập |
| Workspace inspiration/media | Social/Pinterest dễ làm | Phụ thuộc photography | Không chọn |
| Product Intelligence + Decision Commerce | Data tạo moat, SEO + content + affiliate dùng chung | Khó hơn nhưng mạnh | **CHỌN** |
| Full Workspace Builder ngay | Vision mạnh | Quá sớm, dễ overbuild | Destination dài hạn |

## Recommendation

### NOW
```text
Product Intelligence
+
Commercial Content
+
Affiliate Offers
```

### NEXT
```text
Compatibility
+
Best For
+
Calculators
```

### LATER
```text
Workspace Builder
+
Personalized Decision Engine
```

---

# 4. POSITIONING CHỐT

Không định vị:

```text
DeskHolt — Product Reviews
```

Không định vị:

```text
Best Home Office Products
```

Nên định vị:

> **DeskHolt — Workspace Product Intelligence**

Mô tả mở rộng:

> Research, compare and choose workspace products based on specifications, configurations, compatibility and current buying options.

---

# 5. MEDIA STRATEGY — KHÔNG CÓ ẢNH DESKHOLT TỰ CHỤP

DeskHolt sẽ **không tự chụp ảnh sản phẩm**.

Đây là constraint cố định của business.

Không xây content model dựa trên:

- hands-on testing;
- studio photography;
- “we tested”;
- cảm giác sử dụng;
- trải nghiệm vật liệu;
- độ ổn định cảm nhận;
- comfort score do DeskHolt tự trải nghiệm.

## Visual system

1. **Official manufacturer assets**
2. **Merchant / affiliate-approved images**
3. **Original diagrams / technical visualizations do DeskHolt tạo**
4. **UI/data visualizations sinh từ database**

AI image chỉ dùng cho editorial illustration, workspace concept, generic setup và educational visual; không giả làm ảnh thật của product cụ thể.

---

# 6. BỎ “REVIEW” KHỎI CORE TAXONOMY

Không nên mặc định dùng:

```text
FlexiSpot E7 Review
```

Nên dùng:

```text
FlexiSpot E7
Specs, Configurations, Buying Analysis & Current Offers
```

Hoặc UI:

```text
OVERVIEW
SPECIFICATIONS
CONFIGURATIONS
FIT
COMPARE
OFFERS
SOURCES
```

## Content tiers

### Product Intelligence
Không cần sản phẩm thật.

### Research Review / Buying Analysis
Có thể làm từ dữ liệu và nguồn công khai.

### Hands-on Review
Không thuộc core model của DeskHolt.

---

# 7. ORIGINAL CONTENT = DATA + VISUALIZATION

Original value nên đến từ:

```text
Official product image
        +
dimension diagram
        +
configuration chart
        +
comparison table
        +
fit visualization
        +
price data
        +
compatibility diagram
```

DeskHolt nên có visual identity gần:

- technical manual;
- engineering catalog;
- blueprint;
- industrial design publication;
- data terminal.

---

# 8. PRODUCT DATABASE: NGUYÊN TẮC

Database không hỏi:

> Merchant có bao nhiêu variant?

Mà hỏi:

> **DeskHolt cần biết dữ liệu gì để giúp user quyết định?**

```text
PRODUCT
│
├── Identity
├── Specs
├── Available Options
├── Important Variants
├── Fit
├── Compatibility
├── Sources
│
└── Merchants
     ├── Offer A
     ├── Offer B
     └── Offer C
```

---

# 9. AVAILABLE OPTIONS ≠ PRODUCTVARIANT

Nếu merchant có:

```text
4 widths
× 3 depths
× 8 finishes
× 3 colors
= 288 combinations
```

DeskHolt không cần tạo 288 `ProductVariant`.

Nên lưu dạng available options:

```text
Widths:
48 / 55 / 60 / 72

Depth:
24 / 30

Finish:
Walnut / Maple / Bamboo

Frame:
Black / White
```

## Khi nào tạo ProductVariant?

Chỉ khi option đó làm thay đổi:

- spec;
- SKU cần track;
- price/offer cần track riêng;
- compatibility;
- decision logic;
- product identity quan trọng.

> **Không model variant chỉ vì merchant có option. Chỉ model variant khi option làm thay đổi dữ liệu DeskHolt cần query, compare hoặc track.**

---

# 10. CATEGORY STRATEGY

Expansion order recommend:

```text
1. Standing Desks
        ↓
2. Monitor Arms
        ↓
3. Monitor Lights / Desk Lighting
        ↓
4. Cable Management
        ↓
5. Docking / Workspace Connectivity
        ↓
6. Ergonomic Chairs
```

Không ưu tiên Chairs sớm vì dữ liệu quyết định phụ thuộc quá nhiều vào comfort và trải nghiệm thật.

Monitor Arms phù hợp hơn vì có thể structure bằng:

- monitor weight;
- VESA;
- screen size;
- clamp range;
- desk thickness;
- arm reach;
- monitor count.

---

# 11. TARGET AUDIENCE

Không chọn budget mass-market hoặc luxury-only.

Recommend:

> **Mid-premium workspace buyer**

Nhóm chính:

- remote worker;
- developer;
- designer;
- creator;
- hybrid worker;
- small business owner;
- gaming + work user.

Họ quan tâm quality, ergonomics, fit, aesthetics, value và compatibility hơn là chỉ tìm mức giá thấp nhất.

---

# 12. CONTENT ARCHITECTURE

## 12.1 Product Intelligence

```text
/products/flexispot-e7
/products/uplift-v2
```

Nhiệm vụ:

> “Sản phẩm này thực sự là gì?”

Nội dung:

- identity;
- official images;
- specifications;
- configurations;
- fit;
- alternatives;
- current offers;
- sources.

## 12.2 Compare

```text
/compare/flexispot-e7-vs-uplift-v2
```

Trả lời:

> “Trong hai sản phẩm này, cái nào phù hợp hơn?”

## 12.3 Best For

```text
/best/standing-desks-for-tall-people
/best/standing-desks-under-500
/best/desks-for-dual-monitors
```

Trả lời:

> “Sản phẩm nào hợp với nhu cầu của tôi?”

## 12.4 Fit / Compatibility

Ví dụ:

```text
Can this monitor arm fit this desk?
What desk size for dual 27-inch monitors?
Can Ergotron LX clamp to FlexiSpot E7?
Desk size for ultrawide monitor
```

## 12.5 Learn

Ví dụ:

```text
How high should a standing desk be?
What desk depth do I need?
60 vs 72 inch desk
Single vs dual motor desk
```

## 12.6 Tools

Ví dụ:

```text
Desk Height Calculator
Desk Size Calculator
Monitor Distance Calculator
Monitor Arm Compatibility Checker
Workspace Budget Calculator
```

Flow:

```text
Informational intent
↓
personalized result
↓
recommended product
↓
affiliate
```

---

# 13. CONTENT MIX

## Hiện tại

```text
40% Product Intelligence
35% Commercial
20% Learn
 5% Tools
```

## Khi database mạnh hơn

```text
30% Product Intelligence
30% Commercial
20% Learn
20% Tools/Data
```

---

# 14. MỘT PRODUCT PHẢI SINH RA CẢ CONTENT GRAPH

```text
MASTER DATABASE
      │
      ├─ Product page
      ├─ Comparison
      ├─ Best For
      ├─ Guide
      ├─ Pinterest
      ├─ Reel / Short
      └─ Newsletter
```

Ví dụ một product có thể tạo:

- 1 Product Intelligence Page;
- 3 Comparisons;
- 3 Best-For inclusions;
- 3–5 social posts;
- 1–2 educational pieces;
- 1 newsletter mention.

Research một lần, khai thác nhiều lần.

---

# 15. AFFILIATE STRATEGY

Không chọn sản phẩm theo commission.

Thứ tự ưu tiên:

```text
1. Product fit
2. Product quality/data
3. Price
4. Availability
5. Merchant reliability
6. Affiliate availability
7. Commission
```

Commission chỉ nên là tie-breaker.

---

# 16. AFFILIATE NETWORK PRIORITY

## Tier 1 — Impact
Ưu tiên cao cho DTC brands và workspace products.

## Tier 2 — Awin
Phù hợp furniture, home, office, accessories.

## Tier 3 — Direct Brand Programs
Luôn kiểm tra brand program trước.

Track:

```text
Brand Affiliate Program?
Network
Commission
Cookie
Deep Links?
Product Feed?
Media Assets?
API?
```

## Tier 4 — Amazon Associates
Dùng cho breadth, buyer trust, availability và fallback.

> Amazon không phải core database provider; chỉ là một merchant option.

## Opportunistic

- CJ;
- FlexOffers;
- other brand-specific networks;
- sub-affiliate aggregators nếu cần.

Chỉ tích hợp network khi có merchant/product thật cần nó.

---

# 17. MERCHANT STRATEGY

```text
DTC BRAND
     ↓
PRIMARY

MAJOR RETAILER
     ↓
SECONDARY

AMAZON
     ↓
COVERAGE / FALLBACK
```

CTA nên linh hoạt:

```text
View current price
Check configurations
View available sizes
See current offer
Compare merchants
```

---

# 18. SEO STRATEGY

Không làm:

```text
AI
↓
50,000 pages
↓
Google
```

Chỉ publish khi có:

```text
Distinct intent
+
sufficient products/data
+
real structured comparison
+
editorial value
```

Core rule:

```text
DATABASE ≠ INDEX
```

Flow:

```text
DATABASE
↓
INDEX GATE
↓
QUALITY PAGE
↓
SEARCH
```

---

# 19. PROGRAMMATIC SEO

Không tạo hàng loạt biến thể query gần như giống nhau.

Chỉ programmatic khi:

- intent khác biệt;
- content có logic riêng;
- đủ data;
- đủ products;
- output thực sự hữu ích.

---

# 20. STANDING DESK SEO CLUSTER

```text
                    STANDING DESKS
                          │
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
       PRODUCTS          BEST          COMPARE
          │               │               │
          └───────────────┼───────────────┘
                          ↓
                        LEARN
                          ↓
                         TOOL
```

Ví dụ:

```text
Standing Desk Guide

Best Standing Desks
Best Standing Desks Under $500
Best Standing Desks for Tall Users
Best Standing Desks for Dual Monitors

FlexiSpot E7
UPLIFT V2
Branch Duo

E7 vs V2
E7 vs Branch Duo

Desk Height Guide
Desk Depth Guide
60 vs 72 Desk

Desk Height Calculator
```

---

# 21. PRODUCT SEO

Product page nên xuất structured data từ Master Database khi đủ dữ liệu:

```text
Product
Brand
Offer / AggregateOffer
MPN
GTIN
Availability
Price
```

Không fabricate review rating, availability, price hay product claims.

---

# 22. SEO CHO AI SEARCH

Không tạo một “GEO” operation riêng.

Content format:

```text
Question
↓
Direct answer
↓
Structured evidence
↓
Comparison
↓
Sources
```

---

# 23. SOCIAL STRATEGY

Social không phải một research operation riêng.

```text
WEBSITE DATABASE
      ↓
CONTENT ENGINE
      ↓
SOCIAL
```

Không research lại riêng cho TikTok, Pinterest, Instagram và Website.

---

# 24. PINTEREST — ƯU TIÊN CAO

Pin assets:

```text
60 vs 72 Inch Desk
Standing Desk Height Chart
Desk Size for Dual Monitors
Monitor Arm Compatibility Chart
5 Desks Under $500
Standing Desk Buying Checklist
```

Flow:

```text
Pin
↓
Guide / Best / Tool
↓
Product
↓
Affiliate
```

---

# 25. TIKTOK / REELS / SHORTS

Không cần người cầm sản phẩm.

Format:

> **Data Video**

Ví dụ:

```text
DON'T BUY A STANDING DESK
BEFORE CHECKING THESE 3 NUMBERS

1. Minimum height
2. Maximum height
3. Desktop depth
```

Visual:

- official approved images;
- diagrams;
- animated numbers;
- screen recordings;
- comparison UI.

---

# 26. YOUTUBE

## Shorts
Repurpose từ TikTok/Reels.

## Long-form

Ví dụ:

```text
5 Standing Desks Compared by Height Range
What Desk Size Do You Actually Need?
FlexiSpot E7 vs UPLIFT V2 — Specs & Tradeoffs
Building a $1,500 Workspace From Data
```

Không giả dạng hands-on review.

---

# 27. NEWSLETTER

Nên build trước Workspace Builder.

Tên gợi ý:

> **DeskHolt Workspace Brief**

1 email/tuần:

```text
1 useful workspace insight
1 comparison
3 interesting products
current notable offers
1 new guide/tool
```

---

# 28. SETUP RECIPES

Ví dụ:

> **Best Developer Workspace Under $1,500**

```text
Standing Desk       $399
Monitor Arm         $169
Lighting             $89
Dock                 $249
Cable system          $59
Keyboard             $139
Mouse                 $99
Desk mat              $49
─────────────────────────
TOTAL               $1,252
```

Mỗi item cần:

- why chosen;
- compatibility;
- alternative;
- merchant offer;
- affiliate CTA.

Một page có thể tạo nhiều affiliate purchase opportunities.

---

# 29. COMPATIBILITY ENGINE — LONG-TERM MOAT

Khi có:

```text
Standing Desk
+
Monitor Arm
+
Monitor
```

DeskHolt có thể trả lời:

```text
Will this monitor arm fit this desk?

✓ Clamp thickness
✓ Weight
✓ VESA
✓ Monitor size
✓ Desktop clearance
```

Đây là giá trị mạnh hơn generic “Best monitor arm”.

---

# 30. WORKSPACE BUILDER — DESTINATION DÀI HẠN

Không build ngay.

Sau này user nhập:

```text
Height
Room size
Budget
Monitors
Computer
Style
Priorities
```

DeskHolt trả:

```text
Desk
Chair
Monitor Arm
Lighting
Dock
Cable Management
Accessories

Budget fit
Compatibility
Space fit
Ergonomic fit
Current offers
```

---

# 31. PERSONAL WORKSPACE PROFILE — LATER

Ví dụ:

```text
My DeskHolt Profile

Height: 188 cm
Desk space: 180 × 80 cm
Budget: $2,500
Computers: MacBook Pro + PC
Monitors: 2 × 27"
Style: Walnut / Black
```

Product page sau này có thể trả:

```text
FOR YOU
✓ Height range suitable
✓ Enough room for dual monitors
✓ Within budget

WATCH OUT
⚠ 30" depth recommended
```

---

# 32. AI LAYER — CHỈ KHI DATA ĐỦ

```text
User constraints
       ↓
Product DB
       ↓
Compatibility
       ↓
Current Offers
       ↓
Available Configurations
       ↓
Decision Rules
       ↓
AI Explanation
```

AI là lớp explanation/orchestration; database vẫn là source of truth.

---

# 33. KHÔNG RUSH DESKHOLT SCORE

Không nên vội đưa rating kiểu:

```text
Stability 9/10
```

nếu không có evidence đủ mạnh.

Ưu tiên:

```text
DATA CONFIDENCE
95%

FIT FOR TALL USERS
Excellent

DUAL MONITOR FIT
Good

SMALL SPACE FIT
Poor

VALUE POSITION
Competitive
```

> **Fit Score có giá trị hơn Review Score.**

---

# 34. DATA TRUST MODEL

Tách rõ:

```text
FACT
Manufacturer / documented source

DERIVED
DeskHolt calculation / rule

EDITORIAL
DeskHolt interpretation

USER EXPERIENCE
External owner / reviewer evidence
```

Không viết trải nghiệm trực tiếp nếu DeskHolt không có trải nghiệm đó.

---

# 35. REVENUE MODEL

```text
Revenue
=
Traffic
× Commercial Intent %
× Merchant CTR
× Merchant Conversion
× AOV
× Commission
```

Traffic không phải biến số duy nhất.

---

# 36. KPI

## Acquisition
- Organic clicks
- Social referrals
- Email subscribers

## Engagement
- Product page views
- Comparison usage
- Tool usage

## Commercial
- Qualified merchant clicks
- Merchant CTR
- EPC
- Conversion
- Revenue / 1,000 sessions

## Data
- Completeness
- Source coverage
- Offer freshness
- Index Gate pass rate

Không dùng number of articles làm KPI chính.

---

# 37. ROADMAP

## PHASE 1 — PROVE STANDING DESK COMMERCE

```text
10 products
↓
ontology audit
↓
30–50 Standing Desks
```

Xây:

- Product Intelligence Pages;
- 5–10 Comparisons;
- 10–20 Commercial pages;
- 3 Core Guides;
- affiliate tracking;
- Impact;
- Awin;
- Amazon;
- direct brand programs.

Goal:

> Traffic → DeskHolt → Qualified Merchant Click.

## PHASE 2 — OWN STANDING DESK SEARCH INTENT

Thêm:

- Best For;
- filtering;
- Sources / Evidence;
- Available Options;
- merchant offers;
- price freshness;
- 1 calculator;
- newsletter;
- social content engine.

Goal:

> User dùng DeskHolt để ra quyết định.

## PHASE 3 — MONITOR ARMS

```text
Desk
     ↕
Monitor Arm
     ↕
Monitor
```

Bắt đầu Compatibility Network.

## PHASE 4 — DECISION LAYER

Thêm:

```text
Fit
Compatibility
Best For
Price history
Alternatives
Workspace Recipes
```

## PHASE 5 — WORKSPACE BUILDER

```text
User
↓
Budget
Room
Height
Monitors
Style
↓
DeskHolt
↓
Complete workspace build
↓
Multiple affiliate purchases
```

---

# 38. CONTENT OPERATING MODEL

Đội content không bắt đầu từ “viết bài”.

Nên vận hành:

```text
Research Product
↓
Update Master Database
↓
Generate Product Intelligence
↓
Map Compare opportunities
↓
Map Best-For opportunities
↓
Map Learn questions
↓
Map Social assets
↓
Map Newsletter
```

Source of truth:

> **Master Product Database**

Không phải article.

---

# 39. FLYWHEEL CHỐT

```text
              PRODUCT RESEARCH
                     ↓
               MASTER DATABASE
                     ↓
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
    PRODUCTS       CONTENT        TOOLS
       ↓             ↓             ↓
       └─────────────┼─────────────┘
                     ↓
               SEARCH / SOCIAL
                     ↓
                    USER
                     ↓
          COMPARE / FIT / DECIDE
                     ↓
              MERCHANT OFFERS
                     ↓
          QUALIFIED AFFILIATE CLICK
                     ↓
               COMMISSION
                     ↓
             PERFORMANCE DATA
                     ↓
           BETTER PRODUCT CHOICE
                     ↓
               MASTER DATABASE
```

---

# 40. NHỮNG THỨ KHÔNG NÊN LÀM

Không:

- biến DeskHolt thành generic affiliate blog;
- giả hands-on review;
- claim đã test sản phẩm;
- phụ thuộc ảnh tự sản xuất;
- import toàn bộ merchant variant combinations;
- chọn sản phẩm theo commission cao nhất;
- mở quá nhiều category sớm;
- build full Workspace Builder khi Product DB chưa đủ;
- generate hàng nghìn SEO pages trước khi có data;
- build DeskHolt Score thiếu evidence;
- tạo social research riêng khỏi website research;
- phụ thuộc Amazon làm core commerce architecture.

---

# 41. DESKHOLT 3-LAYER MODEL

## 1. DISCOVER

```text
Products
Guides
Social
SEO
```

## 2. DECIDE

```text
Specs
Configurations
Compare
Fit
Compatibility
Best For
Tools
```

## 3. BUY

```text
Merchant comparison
Current offers
Affiliate links
```

---

# 42. FINAL RECOMMENDATION

> **Đừng xây một website “review home-office products”. Hãy xây một hệ thống nghiên cứu workspace giúp người dùng hiểu sản phẩm, so sánh lựa chọn và xác định cái gì phù hợp với setup của họ — rồi kiếm tiền ở thời điểm họ đã sẵn sàng mua.**

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

Hai thay đổi chiến lược quan trọng:

1. **Available Options ≠ ProductVariant**
2. **Research / Decision model thay cho Hands-on Review model**

Product Intelligence database hiện tại vẫn là foundation đúng.

Không cần phá roadmap kỹ thuật.

---

# 43. NORTH STAR

> **Help the user make a better workspace buying decision — then monetize the moment of purchase without compromising the decision itself.**
