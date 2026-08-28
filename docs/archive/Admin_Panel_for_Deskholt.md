# Kế hoạch Admin Panel cho Deskholt.com (v6 — Bản tổng hợp đầy đủ)

**Dựa trên:**
- `Create_Post_for_Deskholt.md`, `DESKHOLT_FULL_SPECIFICATION.md`, `Legal_Content_for_Deskholt.md`, `Tong-hop-dinh-huong-Affiliate-Marketing.md`
- `Admin_Panel_for_Deskholt.md`, `Admin_Panel_Manage_Pages_for_Deskholt.md`, `Admin_Panel_for_Deskholt_bo_sung.md`, `Email_system_for_Deskholt.md` (deepseek)
- Điều chỉnh theo quyết định thực tế đã chốt qua trao đổi: team sẽ tăng người (giữ Users + Activity Log), giữ Media Library (tách rõ nén ảnh vs. gallery), giữ Redirects, giữ các fix đã có cho module Pages (isCore, revalidatePath, generateMetadata, reserved-slug, tái dùng TipTap)
- **Bổ sung ở v5:** Crawler Monitor, Sitemap admin, SEO Health, Cookie Consent, DMCA, giao diện Admin song ngữ Việt/Anh, 2 polish item (cảnh báo crawl trễ, tìm kiếm tổng)
- **Bổ sung/sửa ở v6:** Email Marketing + Support qua Brevo — **Subscriber chuyển hẳn sang Brevo làm nguồn dữ liệu chính** (bỏ model `Subscriber` riêng), thêm model `Ticket` cho support (vá bug Support Dashboard không đọc được dữ liệu), Support đưa vào đúng cấu trúc admin có xác thực, backup đổi sang pg_dump → Google Drive giữ 30 ngày tự xóa, bỏ mở port 3000, dùng Brevo Campaign thay vì tự viết gửi hàng loạt

---

## 1. Mục tiêu

Admin Panel đầy đủ cho team Deskholt (hiện 1-2 người, dự kiến tăng), không phân quyền phức tạp (mọi tài khoản quyền như nhau), tuân thủ **Save → Redirect** xuyên suốt. Gồm 5 nhóm:

**A. Content (Blog)** — Posts, Tags, Categories, Pages (trang tĩnh)
**B. Commerce / Affiliate Backend** — Products (+ Import CSV), Affiliate Links, Networks, Reports
**C. Hệ thống** — Users, Settings, Media Library, Redirects, Activity Log
**D. Vận hành & Tuân thủ nâng cao** — Crawler Monitor, Sitemap admin, SEO Health, Cookie Consent, DMCA
**E. Email Marketing + Support** *(mới ở v6)* — qua Brevo (subscriber, campaign, contact form → Ticket)
**F. Dashboard** — tổng quan toàn site, có cảnh báo crawl trễ

**Ngoài phạm vi MVP (backlog, không build ngay):**
- **View chi tiết từng Click/Conversion riêng lẻ** để đối chiếu tay với báo cáo thanh toán từng network — chỉ cần khi có bất đồng số liệu thật với network, còn dữ liệu tổng hợp đã đủ dùng qua Reports (mục 6.4).

> **Đã bỏ:** cơ chế Lock bài viết runtime (`lockedBy`/`lockedAt` giữ trong schema dự phòng, không build UI/hook) — vì mỗi người viết bài riêng, không có va chạm chỉnh sửa đồng thời trên cùng 1 bài.
> **Đã bỏ:** field `assignee` (text tự do) trên `BlogPost` — thay bằng `authorId` (quan hệ thật tới `User`), vừa chuẩn dữ liệu hơn vừa có lợi cho SEO/E-E-A-T (byline + bio tác giả).
> **Đã bỏ (v6):** model `Subscriber` riêng — Brevo đã là nguồn dữ liệu chính (Phương án A), tránh xây trùng CRM mà Brevo đã có sẵn.

---

## 2. Công nghệ & thư viện

| Thành phần | Lựa chọn | Ghi chú |
|---|---|---|
| Framework | Next.js 15+ (App Router) | Server Actions, ISR |
| ORM / DB | Prisma + PostgreSQL 16 (Docker) | Đã dùng cho toàn hệ thống |
| Editor | TipTap (headless) | Custom extension cho shortcode affiliate; tái dùng cho cả Post và Page |
| UI | shadcn/ui (Radix + Tailwind) | Khớp design system đã có |
| Form | React Hook Form + Zod | Validate, khớp Server Actions |
| State (editor) | Zustand | Nhẹ, đủ dùng |
| Xác thực | **NextAuth.js (Credentials provider)** | Hỗ trợ nhiều tài khoản, team có thể tăng người |
| Upload ảnh | Cloudflare R2 | Object storage riêng — dung lượng ảnh **không ảnh hưởng ổ đĩa VPS** dù site lớn tới đâu |
| Nén ảnh | Sharp (resize + convert WebP khi upload) | Đây mới là cơ chế thật sự kiểm soát chi phí lưu trữ, không phải giao diện Gallery |
| Mã hóa API key network | `lib/encryption.ts` (AES-256-GCM) | Bắt buộc dùng khi lưu `AffiliateNetwork.apiConfig` |
| Đa ngôn ngữ giao diện Admin | `next-intl` | **Chỉ áp dụng cho UI Admin** (nhãn nút, menu, thông báo) — Việt/Anh, đổi qua toggle ở header. Không áp dụng cho nội dung site public (blog/product vẫn viết tiếng Anh để tối ưu SEO cho traffic Mỹ) — 2 việc khác nhau, không nhầm lẫn |
| Email Marketing + Support | **Brevo** (`@sendinblue/client`) | Free tier 300 email/ngày, 2.500 contacts. **Là nguồn dữ liệu chính cho Subscriber** — Admin không tự lưu lại, chỉ gọi API Brevo |
| Backup Database | `pg_dump` (cron) + `rclone` → Google Drive | Free (15GB Google Drive), nén gzip trước khi upload, script tự xóa file >30 ngày cả trên Drive lẫn local |

---

## 3. Prisma Schema tổng hợp

```prisma
// ==================== USER & AUTH ====================
model User {
  id            Int      @id @default(autoincrement())
  name          String
  email         String   @unique
  password      String   // bcrypt hash
  avatar        String?
  bio           String?              // Tiểu sử tác giả — hiển thị ở byline (E-E-A-T)
  website       String?
  twitterHandle String?
  linkedinUrl   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  posts         BlogPost[]
  activityLogs  ActivityLog[]
  redirects     Redirect[]

  @@index([email])
}

// ==================== CATEGORY ====================
model Category {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  name        String
  description String?
  imageUrl    String?
  metaTitle   String?
  metaDesc    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products    Product[]
  blogPosts   BlogPost[]

  @@index([slug])
}

// ==================== TAG ====================
model Tag {
  id        Int        @id @default(autoincrement())
  slug      String     @unique
  name      String

  blogPosts BlogPost[]

  @@index([slug])
}

// ==================== PRODUCT ====================
model Product {
  id                Int      @id @default(autoincrement())
  name              String
  slug              String   @unique
  categoryId        Int
  description       String?
  imageUrl          String?
  specs             Json?
  upcCode           String?
  userSentiment     Json?
  isIndexed         Boolean  @default(false)
  isSustainable     Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  category          Category @relation(fields: [categoryId], references: [id])
  affiliateLinks    AffiliateLink[]
  clicks            Click[]
  blogMentions      BlogPostProduct[]

  @@index([categoryId])
  @@index([slug])
  @@index([isIndexed])
}

// ==================== AFFILIATE NETWORK ====================
model AffiliateNetwork {
  id                Int      @id @default(autoincrement())
  name              String
  slug              String   @unique
  logo              String?
  isActive          Boolean  @default(true)
  apiConfig         Json?                // ⚠️ Mã hóa AES-256-GCM
  commissionRate    String?
  cookieDays        Int      @default(1)
  lastSyncedAt      DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  affiliateLinks    AffiliateLink[]
  reports           AffiliateReport[]
  conversions       Conversion[]
  crawlerLogs       CrawlerLog[]

  @@index([slug])
}

// ==================== AFFILIATE LINK ====================
model AffiliateLink {
  id                Int      @id @default(autoincrement())
  productId         Int
  networkId         Int
  rawUrl            String
  trackingUrl       String?
  price             Float?
  currency          String   @default("USD")
  isInStock         Boolean  @default(true)
  priorityOrder     Int      @default(0)
  lastCrawledAt     DateTime?

  product           Product            @relation(fields: [productId], references: [id])
  network           AffiliateNetwork   @relation(fields: [networkId], references: [id])
  clicks            Click[]
  priceHistory      PriceHistory[]

  @@index([productId])
  @@index([networkId])
  @@index([isInStock])
}

// ==================== CLICK & CONVERSION ====================
model Click {
  id                Int      @id @default(autoincrement())
  clickId           String   @unique
  productId         Int
  networkId         Int
  linkId            Int?
  sourcePage        String?
  ipHash            String?
  userAgent         String?
  usState           String?
  createdAt         DateTime @default(now())

  product           Product            @relation(fields: [productId], references: [id])
  network           AffiliateNetwork   @relation(fields: [networkId], references: [id])
  affiliateLink     AffiliateLink?     @relation(fields: [linkId], references: [id])
  conversion        Conversion?

  @@index([productId])
  @@index([networkId])
  @@index([createdAt])
  @@index([clickId])
}

model Conversion {
  id                Int      @id @default(autoincrement())
  clickId           String   @unique
  orderValue        Float?
  commission        Float?
  status            String   @default("pending")
  networkId         Int
  matchedAt         DateTime @default(now())

  click             Click            @relation(fields: [clickId], references: [clickId])
  network           AffiliateNetwork @relation(fields: [networkId], references: [id])

  @@index([clickId])
  @@index([networkId])
}

model AffiliateReport {
  id                Int      @id @default(autoincrement())
  networkId         Int
  date              DateTime @default(now())
  clicks            Int      @default(0)
  conversions       Int      @default(0)
  commission        Float    @default(0)
  orderValue        Float    @default(0)

  network           AffiliateNetwork @relation(fields: [networkId], references: [id])

  @@unique([networkId, date])
  @@index([date])
}

model PriceHistory {
  id                Int      @id @default(autoincrement())
  affiliateLinkId   Int
  price             Float
  recordedAt        DateTime @default(now())

  affiliateLink     AffiliateLink @relation(fields: [affiliateLinkId], references: [id])

  @@index([affiliateLinkId])
  @@index([recordedAt])
}

// ==================== BLOG POST ====================
model BlogPost {
  id                  Int       @id @default(autoincrement())
  slug                String    @unique
  title               String
  content             String              // Markdown, shortcode {{product:id}}/{{price-table:id}}/{{compare:ids}}
  excerpt             String?
  featuredImage       String?
  authorId            Int?                // Thay cho assignee text — quan hệ thật tới User
  categoryId          Int?
  publishedAt         DateTime?
  isPublished         Boolean   @default(false)
  views               Int       @default(0)

  metaTitle           String?
  metaDesc            String?
  ogTitle             String?
  ogDesc              String?
  ogImage             String?
  canonicalUrl        String?

  disclosureOverride  String?             // null = dùng Setting.default_disclosure

  lockedBy            String?             // Dự phòng, không dùng logic runtime
  lockedAt            DateTime?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  author              User?               @relation(fields: [authorId], references: [id])
  category            Category?           @relation(fields: [categoryId], references: [id])
  tags                Tag[]
  products            BlogPostProduct[]
  revisions           BlogPostRevision[]

  @@index([slug])
  @@index([publishedAt])
  @@index([isPublished])
  @@index([categoryId])
  @@index([authorId])
}

model BlogPostProduct {
  id          Int      @id @default(autoincrement())
  blogPostId  Int
  productId   Int
  blockType   String   // "product" | "price-table" | "compare"
  layout      String?
  position    Int      @default(0)

  blogPost    BlogPost @relation(fields: [blogPostId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])

  @@index([blogPostId])
  @@index([productId])
}

model BlogPostRevision {
  id          Int      @id @default(autoincrement())
  blogPostId  Int
  content     String
  editedBy    String?
  createdAt   DateTime @default(now())

  blogPost    BlogPost @relation(fields: [blogPostId], references: [id])

  @@index([blogPostId])
  @@index([createdAt])
}

// ==================== PAGE (trang tĩnh) — đã sửa so với đề xuất gốc ====================
model Page {
  id        Int      @id @default(autoincrement())
  slug      String   @unique
  title     String
  content   String
  metaTitle String?
  metaDesc  String?
  isActive  Boolean  @default(true)
  isCore    Boolean  @default(false)  // true = trang pháp lý bắt buộc, KHÔNG cho xóa
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug])
  @@index([isActive])
}

// ==================== REDIRECT ====================
model Redirect {
  id        Int      @id @default(autoincrement())
  from      String   @unique   // "/blog/best-standing-desk-2026"
  to        String             // "/blog/best-standing-desks-2026-review"
  type      Int      @default(301)
  createdBy Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User?    @relation(fields: [createdBy], references: [id])

  @@index([from])
}

// ==================== TICKET (Support — mới ở v6) ====================
// Contact form ghi vào đây, KHÔNG dùng Brevo Conversations (đó là tính năng live-chat, không liên quan form liên hệ)
model Ticket {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  subject   String
  message   String
  status    String   @default("new") // new | replied | resolved
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
  @@index([createdAt])
}

// ==================== ACTIVITY LOG ====================
model ActivityLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  action    String   // "create_post", "update_post", "publish_post", "delete_post", ...
  target    String?  // "post:123", "product:456"
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user      User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// ==================== SITE SETTINGS ====================
model Setting {
  id        Int      @id @default(autoincrement())
  key       String   @unique   // "site_name", "default_disclosure", "meta_title_default", "cookie_banner_text"
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([key])
}

// ==================== CRAWLER LOG (mới ở v5) ====================
// Ghi lại mỗi lần crawler.js (cron) chạy — để có nơi xem trạng thái/lỗi thay vì phải SSH đọc log file
model CrawlerLog {
  id              Int      @id @default(autoincrement())
  networkId       Int?                 // null nếu chạy toàn bộ network cùng lúc
  status          String   @default("running") // running | success | partial | failed
  productsChecked Int      @default(0)
  productsUpdated Int      @default(0)
  errors          Json?                // [{ productId, message }]
  triggeredBy     String   @default("cron") // "cron" | "manual" (bấm nút trong admin)
  startedAt       DateTime @default(now())
  finishedAt      DateTime?

  network         AffiliateNetwork? @relation(fields: [networkId], references: [id])

  @@index([status])
  @@index([startedAt])
}

// ==================== COOKIE CONSENT LOG (mới ở v5) ====================
// Lưu bằng chứng tuân thủ CCPA/GPC — khớp với Cookie Banner đã mô tả trong Legal_Content_for_Deskholt.md
model ConsentLog {
  id           Int      @id @default(autoincrement())
  ipHash       String?             // cùng cơ chế hash với Click.ipHash, không lưu IP thật
  choices      Json                // { analytics: true, functionality: true, advertising: false }
  gpcDetected  Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@index([createdAt])
}

// ==================== DMCA REQUEST (mới ở v5) ====================
// Theo dõi yêu cầu gỡ nội dung — Terms đã có điều khoản DMCA (Legal_Content_for_Deskholt.md)
model DMCARequest {
  id            Int      @id @default(autoincrement())
  claimantName  String
  claimantEmail String
  contentUrl    String              // URL bài viết/sản phẩm bị khiếu nại
  description   String
  status        String   @default("received") // received | reviewing | content_removed | rejected
  resolvedAt    DateTime?
  notes         String?             // Ghi chú xử lý nội bộ
  createdAt     DateTime @default(now())

  @@index([status])
}
```

---

## 4. Cấu trúc thư mục Admin

```
src/app/(admin)/admin/
├── layout.tsx                       # Sidebar + header (có toggle Việt/Anh + ô tìm kiếm tổng), middleware bảo vệ /admin/*
├── page.tsx                         # Redirect → /admin/dashboard
│
├── dashboard/
│   └── page.tsx                     # Tổng quan + cảnh báo crawl trễ >48h (widget mới)
│
├── posts/                           # ── CONTENT ──
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/edit/page.tsx           # Revisions, duplicate — KHÔNG lock
│
├── tags/
│   └── page.tsx
│
├── categories/                      # ── MỚI (lấp gap đã có sẵn trong schema nhưng chưa có UI) ──
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/edit/page.tsx
│
├── pages/                           # ── PAGES (trang tĩnh, giữ fix isCore/revalidate) ──
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [slug]/edit/page.tsx         # Dùng lại TipTap editor
│
├── products/                        # ── COMMERCE ──
│   ├── page.tsx
│   ├── new/page.tsx
│   ├── import/page.tsx              # Import CSV hàng loạt — ưu tiên cao (100-200 SP)
│   └── [id]/
│       ├── edit/page.tsx
│       └── links/page.tsx
│
├── networks/
│   ├── page.tsx
│   └── [id]/edit/page.tsx
│
├── users/                           # ── HỆ THỐNG (giữ theo quyết định: team sẽ tăng người) ──
│   ├── page.tsx                     # Danh sách + "+Thêm user"
│   ├── [id]/edit/page.tsx
│   └── profile/page.tsx             # Tự sửa bio/avatar/social (E-E-A-T)
│
├── settings/
│   └── page.tsx                     # default_disclosure, meta fallback, social links
│
├── media/                           # ── MEDIA LIBRARY (2 bước: nén trước, gallery sau) ──
│   └── page.tsx                     # Gallery + Unsplash search + copy link
│
├── redirects/
│   └── page.tsx                     # 301/302 — build khi thực sự cần đổi slug
│
├── activity/
│   └── page.tsx                     # Theo dõi thao tác từng thành viên
│
├── reports/
│   └── page.tsx                     # Giai đoạn 3
│
├── crawler/                         # ── VẬN HÀNH ──
│   └── page.tsx                     # Danh sách lần chạy crawler, trạng thái, lỗi, nút "Chạy lại thủ công"
│
├── seo/                             # ── SEO ──
│   ├── page.tsx                     # SEO Health: thiếu meta, thiếu ảnh, trùng slug/description
│   └── sitemap/page.tsx             # Số URL mỗi sitemap, nút "Ping Google/Bing"
│
├── cookie-consent/                  # ── TUÂN THỦ ──
│   └── page.tsx                     # Sửa nội dung banner (qua Setting), xem thống kê % chấp nhận/từ chối
│
├── dmca/                            # ── TUÂN THỦ ──
│   └── page.tsx                     # Danh sách yêu cầu DMCA, đổi trạng thái, ghi chú xử lý
│
├── subscribers/                     # ── MỚI v6: EMAIL MARKETING (đọc thẳng từ Brevo, không lưu local) ──
│   └── page.tsx                     # Gọi contactsApi.getContacts() mỗi lần vào trang — không có Server Action tạo mới (đã có ở NewsletterSignupForm)
│
├── campaigns/                       # ── MỚI v6: EMAIL MARKETING ──
│   ├── page.tsx                     # Danh sách campaign đã gửi/nháp (đọc từ Brevo Campaigns API)
│   └── new/page.tsx                 # Soạn nội dung → gọi Brevo Campaign API (không tự viết vòng lặp gửi)
│
└── support/                         # ── MỚI v6: SUPPORT ── (đã sửa: đúng trong (admin), có middleware bảo vệ)
    └── page.tsx                     # Đọc bảng Ticket (Prisma) — KHÔNG đọc Brevo Conversations (đó là live-chat, không liên quan)

src/app/(public)/
├── [legal]/page.tsx                 # Render Page — có generateMetadata
├── contact/page.tsx                 # Form liên hệ (ContactForm) → tạo Ticket + gửi email qua Brevo
└── (footer/blog component)
    └── NewsletterSignupForm.tsx     # Gọi thẳng Brevo contactsApi.createContact — không qua DB riêng
```

---

## 5. Nhóm Content

### 5.1. Dashboard (`/admin/dashboard`)
Grid 4 cột: 📄 Bài viết (tổng/published/nháp/hẹn giờ) · 💰 Affiliate hôm nay (click/conversion/hoa hồng) · ⚠️ Cảnh báo SP hết hàng trong bài published · 📦 Sản phẩm (tổng/hết hàng/chưa có link) · **🕓 Cảnh báo crawl trễ** (số sản phẩm có `lastCrawledAt` > 48h trước, click vào → `/admin/crawler`) · 📈 biểu đồ click vs conversion 7 ngày · 📅 bài sắp xuất bản · ⚡ hành động nhanh. Server Action: `getDashboardStats()`.

**Ô tìm kiếm tổng** đặt ở header layout (`/admin/layout.tsx`), không phải trang riêng — gõ 1 từ khóa, trả kết quả gộp từ Posts/Products/Pages (query song song 3 bảng, giới hạn 5 kết quả/loại), bấm vào điều hướng thẳng tới trang sửa tương ứng.

### 5.2. Bài viết (`/admin/posts`)
- List: Tiêu đề, Trạng thái, Category, **Tác giả** (join `authorId`, không còn text tự do), Views, Cập nhật, Hành động. Cảnh báo 🔴 SP hết hàng. Filter + search + bulk actions.
- Tạo/Sửa: Editor TipTap 75% + Sidebar 3 tab (Cài đặt/SEO/AI) 25%. Affiliate Block menu (Product Card, Price Table, Comparison, Disclosure). Auto-save 10s. Pre-publish Checklist. Revision history + diff/restore. Save → Redirect chuẩn.

### 5.3. Tag (`/admin/tags`)
List + `_count.blogPosts`, merge (transaction), đổi tên, unused tags tô màu riêng.

### 5.4. Categories (`/admin/categories`) — mới bổ sung, lấp gap thật
`Category` đã có sẵn trong Prisma từ đầu (dùng chung Product + BlogPost, có route `/category/[slug]`) nhưng chưa từng có UI quản lý ở các bản trước — đây là thiếu sót cần vá.
- List: Tên, Slug, isActive, số sản phẩm, số bài viết, Hành động.
- Create/Edit: Name, Slug (auto-gen), Description, Image, Meta Title/Desc, isActive.

### 5.5. Pages — trang tĩnh (`/admin/pages`)
*(Giữ nguyên toàn bộ 6 điểm đã sửa từ đề xuất gốc — không để bị hồi quy)*
- Model có field **`isCore`**: trang pháp lý bắt buộc (Privacy, Terms, Affiliate Disclosure, Do Not Sell, Cookie Policy, Acceptable Use) **ẩn nút Xóa**, chỉ sửa nội dung/ẩn-hiện.
- Editor: tái dùng **TipTap** (bỏ Affiliate Block), không dùng textarea/HTML thô.
- Server Actions **bắt buộc gọi `revalidatePath`** sau create/update/delete — nếu không, nội dung sửa xong phải chờ tới 24h (ISR) mới hiển thị công khai.
- Validate **reserved slugs** (`product`, `category`, `blog`, `collections`, `go`, `api`, `admin`, `sitemap`) khi tạo trang mới.
- Trang public thêm `generateMetadata` (đọc `metaTitle`/`metaDesc` từ DB) — bản gốc thiếu, mất SEO cho chính các trang này.
- Seed 8 trang pháp lý (`isCore: true`) từ `Legal_Content_for_Deskholt.md`. Thêm `sitemap-pages.xml`.

---

## 6. Nhóm Commerce / Affiliate Backend

### 6.1. Sản phẩm (`/admin/products`)
- List: filter Category/tồn kho/có-chưa-có-link, search.
- Create/Edit: name, slug, category, description, imageUrl, specs, upcCode, isSustainable.
- **Import CSV** (`/admin/products/import`): upload → map cột (name, category, description, imageUrl, upcCode, amazon_url/walmart_url/target_url, price, isInStock) → preview 5 dòng → xác nhận, rollback nếu lỗi. Ưu tiên cao vì cần nhập 100-200 SP.

### 6.2. Affiliate Link (`/admin/products/[id]/links`)
List theo Network, rawUrl, trackingUrl, price, isInStock (toggle — nguồn cảnh báo hết hàng toàn hệ thống), priorityOrder. Nút "Check stock" (gọi API network) — có thể để sau.

### 6.3. Affiliate Network (`/admin/networks`)
List trạng thái isActive/commissionRate/cookieDays/lastSyncedAt. Edit apiConfig → mã hóa AES-256-GCM trước khi lưu. Seed cứng 5 network đã chốt (Amazon, Awin, Impact, CJ, Target Partners qua Impact).

### 6.4. Báo cáo (`/admin/reports`) — Giai đoạn 3
Tổng quan click/conversion/commission theo network, biểu đồ theo ngày, bảng chi tiết, export CSV.

---

## 7. Nhóm Hệ thống

### 7.1. Users (`/admin/users`) — giữ đầy đủ vì team sẽ tăng người
- List: Name, Email, ngày tạo, số bài đã viết, Hành động (Sửa, Đổi mật khẩu, Xóa).
- Create/Edit: Name, Email, Password, Avatar, Bio, Website, Twitter, LinkedIn.
- `/admin/users/profile`: mỗi người tự sửa thông tin cá nhân của mình.
- Không phân role — thêm người mới vẫn full quyền như nhau, đúng nguyên tắc đã chốt.

### 7.2. Settings (`/admin/settings`)
Site Name, Default Affiliate Disclosure (fallback cho bài không có `disclosureOverride`), Default Meta Title/Desc, Footer Amazon Associate Statement, Social Links.

### 7.3. Media Library (`/admin/media`) — chia 2 bước rõ ràng
- **Bước 1 (bắt buộc, làm sớm):** hàm `uploadMedia` nén/resize ảnh (Sharp → WebP) trước khi đẩy lên Cloudflare R2, gắn trực tiếp vào form Product/Post. Đây là cơ chế thật sự kiểm soát dung lượng lưu trữ — ảnh nằm ở R2 (object storage), không đụng ổ đĩa VPS dù số lượng bài viết tăng nhiều.
- **Bước 2 (làm sau):** trang Gallery duyệt lại ảnh đã upload (thumbnail, alt text, copy link, xóa) + tích hợp search Unsplash.

### 7.4. Redirects (`/admin/redirects`)
Dùng khi một URL đã publish (bài viết/sản phẩm) bị đổi slug hoặc xóa — tạo rule 301 (vĩnh viễn, chuyển thứ hạng SEO sang URL mới) hoặc 302 (tạm thời) để tránh mất traffic/backlink về lỗi 404. List: From, To, Type, Người tạo, Ngày tạo. Middleware đọc bảng `Redirect` trước khi render trang. Vì site chưa có URL nào cần đổi ngay, module này build sớm nhưng **dùng khi phát sinh nhu cầu thật** (đổi slug 1 bài/SP đã publish).

### 7.5. Activity Log (`/admin/activity`)
Bảng: Thời gian, Người dùng, Hành động, Target (link tới bài viết/sản phẩm), IP, User Agent. Filter theo user/hành động/thời gian. Tự động ghi log trong Server Actions (không cần UI tạo) — dùng để theo dõi từng thành viên trong team làm gì, đúng nhu cầu khi team tăng người.

---

## 8. Nhóm Vận hành & Tuân thủ nâng cao (mới ở v5)

### 8.1. Crawler Monitor (`/admin/crawler`)
**Vì sao cần:** `crawler.js` (cron, mục 3 full spec) chạy nền độc lập crawl giá đa sàn 24h/lần — nếu nó lỗi âm thầm (network đổi cấu trúc HTML, rate-limit, timeout...), hiện tại **không có cách nào biết được ngoài SSH vào VPS đọc log file**. Với 100-200 sản phẩm chạy tự động, đây là rủi ro thật (giá sai/hết hàng không cập nhật mà không ai hay).
- List các lần chạy: thời gian bắt đầu/kết thúc, network, trạng thái (🟢 success / 🟡 partial / 🔴 failed), số SP đã check/đã update, chi tiết lỗi (mở rộng xem `errors` JSON).
- Nút **"Chạy lại thủ công"** — set cờ trong Redis (`crawler:trigger:manual`) để `crawler.js` (đang chạy PM2) đọc và chạy ngay, không cần đợi cron tiếp theo.
- `crawler.js` cần sửa nhỏ: ghi 1 bản ghi `CrawlerLog` khi bắt đầu, cập nhật khi xong (thành `success`/`partial`/`failed`) — thay đổi tối thiểu vào script đã có sẵn.
- Server Actions: `getCrawlerLogs`, `getCrawlerLogById`, `triggerManualCrawl`.

### 8.2. SEO (`/admin/seo`)
- **SEO Health** (`/admin/seo`): các báo cáo tổng hợp từ dữ liệu đã có sẵn (không cần model mới) — bài viết/trang thiếu Meta Title/Desc, thiếu Featured/OG Image, sản phẩm thiếu ảnh, slug hoặc meta description trùng nhau. Mỗi dòng bấm vào → tới thẳng trang sửa.
- **Sitemap** (`/admin/seo/sitemap`): các route `sitemap*.xml` (đã có sẵn trong full spec, tự sinh từ DB qua ISR) — trang này chỉ hiển thị số URL mỗi loại sitemap + nút "Ping Google/Bing" (gọi endpoint ping có sẵn của 2 công cụ này) sau khi publish hàng loạt. Không cần CRUD vì sitemap luôn tự sinh từ dữ liệu thật.

### 8.3. Cookie Consent (`/admin/cookie-consent`)
**Vì sao cần:** `Legal_Content_for_Deskholt.md` đã mô tả Cookie Banner với modal "Customize" chọn từng loại cookie (Analytics/Functionality/Advertising) + đọc tín hiệu GPC — đây là nghĩa vụ pháp lý (CCPA và các bang có luật riêng tư). Cần 2 việc:
- Sửa nội dung banner (text, tên từng category) qua `Setting` — không phải sửa code mỗi khi đổi câu chữ.
- Ghi `ConsentLog` mỗi lần người dùng chọn (ẩn danh qua `ipHash`, giống cơ chế đã dùng cho `Click`) làm **bằng chứng tuân thủ** khi cần — trang admin chỉ cần hiển thị thống kê % chấp nhận từng loại theo thời gian, không cần xem từng dòng.

### 8.4. DMCA (`/admin/dmca`)
**Vì sao cần:** Theo ghi chú rà soát trong `Legal_Content_for_Deskholt.md` (mục 4), Terms đã bổ sung điều khoản DMCA — nghĩa là site cam kết có quy trình xử lý khiếu nại bản quyền, nhưng hiện chưa có nơi nào để tiếp nhận/theo dõi các yêu cầu đó.
- List yêu cầu: người khiếu nại, URL bị khiếu nại, mô tả, trạng thái (Đã nhận/Đang xem xét/Đã gỡ nội dung/Từ chối), ngày xử lý.
- Đổi trạng thái + ghi chú nội bộ. Nhận yêu cầu qua email DMCA riêng (đã có trong Terms) rồi nhập tay vào đây — không cần form public tự động ở bản đầu.

---

## 9. Nhóm Email Marketing + Support (mới ở v6, đã sửa từ đề xuất gốc)

Dựa trên `Email_system_for_Deskholt.md`, dùng **Brevo** (free tier: 300 email/ngày, 2.500 contacts) — nhưng sửa 6 điểm để khớp kiến trúc và vá bug/lỗ hổng bảo mật của bản gốc.

### 9.1. Subscriber — Brevo là nguồn dữ liệu chính (Phương án A đã chọn)
- `NewsletterSignupForm` (public, Footer/cuối bài blog) gọi thẳng API Route `/api/subscribe` → `contactsApi.createContact()` — **không lưu vào Postgres riêng**, tránh xây trùng CRM mà Brevo đã có sẵn.
- `/admin/subscribers`: không phải trang CRUD, chỉ là **màn hình đọc** — gọi `contactsApi.getContacts()` mỗi lần vào trang, hiển thị danh sách + nút "Mở Brevo Dashboard" (link thẳng sang Brevo cho các thao tác nâng cao như xóa, phân segment).
- Server Action: `getSubscribersFromBrevo()` — chỉ đọc, không có `createSubscriber`/`deleteSubscriber` ở phía mình.

### 9.2. Campaign — dùng Brevo Campaign API, không tự viết vòng lặp gửi
**Vấn đề đã sửa:** bản gốc tự gọi lại chính API của mình trong vòng lặp `Promise.allSettled` để gửi hàng loạt — dễ vượt quota 300 email/ngày, không delay, không queue. Brevo đã có sẵn tính năng **Campaign** tự throttle + thống kê mở/click.
- `/admin/campaigns/new`: soạn subject + nội dung (tái dùng TipTap ở chế độ đơn giản) → gọi `emailCampaignsApi.createEmailCampaign()` rồi `sendEmailCampaignNow()` (hoặc lên lịch `scheduledAt`).
- `/admin/campaigns`: danh sách campaign đã gửi/nháp, đọc từ `emailCampaignsApi.getEmailCampaigns()`.
- Nhắc lại nguyên tắc đã có: link affiliate trong nội dung email phải qua `/go/[slug]` (Link Tracking Engine đã có) để vẫn tính được click/conversion, không link thẳng ra sàn.

### 9.3. Support — vá bug quan trọng: thêm bảng `Ticket`
**Vấn đề đã sửa:** bản gốc để Support Dashboard đọc từ `conversationsApi.getConversations()` (Brevo Conversations = tính năng **live-chat**, không liên quan gì đến form liên hệ) trong khi form liên hệ chỉ gửi 1 email thường — kết quả Dashboard **luôn trống**, tính năng không hoạt động.
- `(public)/contact/page.tsx` (`ContactForm`) → gọi `/api/contact`: **ghi vào bảng `Ticket`** (Prisma) **và** gửi email thông báo qua `transactionalApi.sendTransacEmail()` tới `ADMIN_EMAIL` + email xác nhận cho khách — giữ nguyên phần gửi email của bản gốc, chỉ thêm bước ghi DB.
- `(admin)/admin/support/page.tsx`: đọc `Ticket` từ Prisma qua Server Action (không phải Client Component tự `fetch`), đặt **đúng trong nhóm `(admin)/admin/` để middleware NextAuth bảo vệ** — bản gốc để route trần `app/admin/support` không có xác thực, ai cũng xem được ticket khách hàng.
- Server Actions: `getTickets`, `getTicketById`, `updateTicketStatus`, `createTicket` *(gọi từ `/api/contact`)*.

### 9.4. Chat widget (tùy chọn)
Nếu dùng ChatAds hay công cụ tương tự: load bằng `strategy="lazyOnload"` thay vì `afterInteractive` — tránh ảnh hưởng Core Web Vitals, vì chiến lược chính của site là SEO organic.

---

## 10. Xác thực

- **NextAuth.js (Credentials provider)** — hỗ trợ nhiều tài khoản, không giới hạn 1-2 người.
- Không phân role — mọi tài khoản quyền như nhau.
- Middleware bảo vệ toàn bộ `/admin/*`.

---

## 11. Server Actions tổng hợp

| Module | Actions |
|---|---|
| Dashboard | `getDashboardStats` |
| Posts | `getPostList`, `getPostById`, `createPost`, `updatePost`, `deletePost`, `duplicatePost`, `publishPost`, `getRevisions`, `restoreRevision` |
| Tags | `getAllTags`, `renameTag`, `mergeTags`, `deleteTag` |
| Categories | `getAllCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory` |
| Pages | `getAllPages`, `getPageBySlug`, `createPage`, `updatePage`, `deletePage` *(đều kèm `revalidatePath`)* |
| Products | `getProductList`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct`, `importProductsCSV` |
| Affiliate Links | `getLinksByProduct`, `createLink`, `updateLink`, `deleteLink`, `reorderPriority`, `checkStock` |
| Networks | `getNetworkList`, `getNetworkById`, `updateNetworkConfig`, `toggleNetworkActive` |
| Users | `getAllUsers`, `getUserById`, `createUser`, `updateUser`, `deleteUser`, `changePassword`, `updateProfile` |
| Settings | `getAllSettings`, `updateSettings` |
| Media | `getAllMedia`, `uploadMedia` *(nén ảnh)*, `deleteMedia`, `updateAltText`, `searchUnsplash` |
| Redirects | `getAllRedirects`, `createRedirect`, `updateRedirect`, `deleteRedirect` |
| Activity | `getActivityLogs`, `filterLogs` |
| Reports | `getReportSummary`, `getReportChart`, `exportReportCSV` |
| Crawler | `getCrawlerLogs`, `getCrawlerLogById`, `triggerManualCrawl` |
| SEO | `getSeoHealthReport`, `getSitemapStats`, `pingSearchEngines` |
| Cookie Consent | `getConsentStats`, `updateCookieBannerText`, `logConsent` *(gọi từ banner public)* |
| DMCA | `getAllDmcaRequests`, `createDmcaRequest`, `updateDmcaStatus` |
| Subscribers (Brevo) | `getSubscribersFromBrevo` *(chỉ đọc — tạo/xóa qua Brevo trực tiếp)* |
| Campaigns (Brevo) | `getCampaignsFromBrevo`, `createAndSendCampaign` |
| Support | `getTickets`, `getTicketById`, `updateTicketStatus`, `createTicket` *(gọi từ `/api/contact`)* |
| Global Search | `globalSearch(query)` *(query song song Posts/Products/Pages)* |

---

## 12. Thứ tự triển khai theo giai đoạn

| Giai đoạn | Module | Vì sao |
|---|---|---|
| 1 | Auth (Users, hỗ trợ nhiều tài khoản) + Layout admin | Nền tảng, và team dự kiến tăng người nên làm đúng từ đầu |
| 2 | Categories + Networks | Dữ liệu nền cho Product và Post |
| 3 | Products + Import CSV + Links | Cần trước khi viết bài — nhập 100-200 SP ở Giai đoạn 1 roadmap |
| 4 | Upload ảnh (nén/resize, gắn vào form Product/Post) + Pages (isCore/revalidate) + Settings | Ảnh nén là bắt buộc kỹ thuật; Pages pháp lý bắt buộc trước khi launch |
| 5 | Posts + Tags + Affiliate Blocks (Product Card, Price Table, Comparison, Disclosure) | Core content, cần dữ liệu SP thật để search |
| 6 | Activity Log + Dashboard (kèm widget cảnh báo crawl trễ) + Global Search (header) | Theo dõi thao tác khi có nhiều người, tổng hợp dữ liệu các module trên |
| 7 | **Crawler Monitor** (sửa `crawler.js` ghi `CrawlerLog` + trang xem log/lỗi + nút chạy thủ công) | Nên làm ngay sau khi Networks/Products/Links đã có dữ liệu thật để crawler chạy — tránh vận hành "mù" ngay từ đầu |
| 8 | **Cookie Consent** (banner text qua Settings, ghi `ConsentLog`) | Cùng nhóm compliance với Pages pháp lý — nên làm sớm, trước/song song launch |
| 9 | Media Library Gallery đầy đủ (Unsplash, duyệt ảnh cũ) | Tiện ích, không chặn launch |
| 10 | **SEO Health + Sitemap admin** | Hữu ích nhất khi đã có kha khá bài viết/sản phẩm để có gì mà kiểm tra |
| 11 | **DMCA** | Xác suất phát sinh thấp giai đoạn đầu, nhưng effort thấp nên làm cùng đợt Redirects |
| 12 | **Email Marketing + Support** (đăng ký Brevo, `NewsletterSignupForm`, `ContactForm` + bảng `Ticket`, `/admin/support`, `/admin/subscribers` đọc từ Brevo) | Cần trước khi launch (trang Contact/FAQ đã seed sẵn, Privacy Policy đã cam kết newsletter) — làm sau content/commerce vì phụ thuộc đã có Pages/Settings |
| 13 | Campaigns (Brevo Campaign API) | Chỉ cần khi đã có subscriber + nội dung để gửi — sau khi có vài bài blog |
| 14 (Giai đoạn 3 roadmap) | Redirects (khi thực sự đổi slug) + Reports (khi có traffic/conversion) | Chỉ có giá trị khi đã có nội dung/traffic thật |
| Backlog (ngoài MVP) | View chi tiết từng Click/Conversion để đối chiếu tay với network | Chỉ cần khi có bất đồng số liệu thật, dữ liệu tổng hợp qua Reports đã đủ dùng cho vận hành thường ngày |

---

## 13. Backup Database (đã sửa — trái với đề xuất gốc dùng rsync trên cùng VPS)

**Vấn đề của bản gốc:** dùng `rsync` copy toàn bộ source code sang thư mục khác **trên cùng VPS** — không backup được database (dữ liệu quan trọng nhất: sản phẩm, click, conversion), và nếu VPS hỏng thì mất cả bản chính lẫn bản backup cùng lúc. Trái với nguyên tắc đã chốt trong `Tong-hop-dinh-huong-Affiliate-Marketing.md`.

**Cách làm đúng — pg_dump → Google Drive, giữ 30 ngày:**

```bash
# /etc/cron.d/backup-deskholt-db — chạy 2:00 AM hàng ngày
0 2 * * * root /usr/local/bin/backup-postgres.sh
```

```bash
#!/bin/bash
# /usr/local/bin/backup-postgres.sh
DATE=$(date +\%Y\%m\%d)
BACKUP_DIR="/tmp/pg-backup"
FILENAME="deskholt-db-$DATE.sql.gz"
mkdir -p $BACKUP_DIR

# 1. Dump + nén
pg_dump -U deskholt_user deskholt_db | gzip > "$BACKUP_DIR/$FILENAME"

# 2. Đẩy lên Google Drive qua rclone (đã cấu hình sẵn remote tên "gdrive")
rclone copy "$BACKUP_DIR/$FILENAME" gdrive:deskholt-backups/

# 3. Xóa file local ngay sau khi upload xong — không giữ trên VPS
rm -f "$BACKUP_DIR/$FILENAME"

# 4. Tự xóa file trên Google Drive cũ hơn 30 ngày
rclone delete --min-age 30d gdrive:deskholt-backups/
```

**Setup 1 lần:** `rclone config` → chọn Google Drive, đăng nhập OAuth → đặt tên remote là `gdrive`. Google Drive free 15GB — với dump Postgres đã nén gzip của 1 site affiliate cỡ này, đủ dùng nhiều tháng dù giữ rolling 30 ngày.

**Khuyến nghị thêm:** test khôi phục (`gunzip -c file.sql.gz | psql ...`) ít nhất 1 lần trước khi site có traffic thật, đúng như đã lưu ý trong `Tong-hop-dinh-huong-Affiliate-Marketing.md`.

---

## 14. Kết luận

Bản v6 hoàn thiện thêm nhóm **Email Marketing + Support** qua Brevo, đồng thời vá các vấn đề phát hiện được: (1) chọn Brevo làm nguồn dữ liệu Subscriber duy nhất thay vì xây trùng CRM, (2) thêm bảng `Ticket` để Support Dashboard thực sự hoạt động (bản gốc đọc nhầm Brevo Conversations nên luôn trống), (3) đưa Support vào đúng vùng có xác thực NextAuth thay vì route không bảo vệ, (4) dùng Brevo Campaign API thay vì tự viết vòng lặp gửi hàng loạt dễ vượt quota, (5) bỏ mở port 3000 ra ngoài (Nginx đã proxy nội bộ), (6) thay backup rsync-trên-cùng-VPS bằng pg_dump → Google Drive giữ rolling 30 ngày, đúng nguyên tắc "không lưu backup trên chính VPS" đã chốt từ đầu dự án. Tổng cộng đến v6: 5 nhóm, ~20 module, đầy đủ Content, Commerce, Hệ thống, Vận hành/Tuân thủ, và Email Marketing/Support — sẵn sàng để bắt đầu code theo đúng thứ tự phụ thuộc ở mục 12.
