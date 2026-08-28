# DỰ ÁN DESKHOLT.COM — HƯỚNG DẪN KỸ THUẬT CHI TIẾT (VERSION 4.0 — FINAL)

**Ngày cập nhật:** Tháng 8/2026
**Công nghệ:** Next.js 15+ (App Router) + PostgreSQL + Prisma + Redis + Docker + Cloudflare
**Hosting:** VPS Mỹ (tự host, không dùng Vercel)

> Bản này hợp nhất toàn bộ các bản trước (v1 → v3) và sửa nốt lỗi cuối cùng phát hiện ở vòng review gần nhất: **cấu hình Nginx lấy sai IP thật khi có Cloudflare đứng trước**, khiến `ipHash` và rate-limit chống click fraud bị vô hiệu hóa. Đây là bản dùng để code chính thức.

---

## 1. TỔNG QUAN & NGUYÊN TẮC

- **Mô hình:** Affiliate Hub — tập trung SEO Google (organic traffic) thay vì chỉ dựa vào social/video, xây Web Affiliate Hub chuyên nghiệp (database, crawl giá, content) + Link Tracking Engine (Redis/SubID) trước khi redirect sang sàn.
- **Mục tiêu:** Xây tài sản số dài hạn (Owned Media), traffic thụ động từ SEO.
- **2 dự án (làm tuần tự):**
  1. **Deskholt.com** (làm trước) — niche Home-office/Desk setup (bàn, ghế, đèn, phụ kiện).
  2. **Steadylifeaids.com** (làm sau) — niche Accessibility & Independent Living (Mobility Aids, Caregiver Tools), tái sử dụng codebase, tách site riêng do khác đối tượng/intent.
- **Networks đã chốt:** Amazon Associates (qua W-8BEN), Awin, Impact, CJ Affiliate, Target Partners (qua Impact) — đều chấp nhận cá nhân nước ngoài, không cần pháp nhân Mỹ. Không mở US LLC, không dùng TikTok Shop Affiliate chính thức (chỉ dùng TikTok để kéo traffic dẫn về link Amazon Associates thường).

---

## 2. KIẾN TRÚC HỆ THỐNG

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Frontend + API | Next.js App Router | SSR/ISR, tự host qua PM2 |
| Database | PostgreSQL 16 (Docker) | Lưu sản phẩm, link, click, conversion |
| Cache + Queue | Redis 7 (Docker) | Cache tracking, hàng đợi click (`BLPOP`), rate-limit |
| ORM | Prisma | Type-safe, migration dễ dàng |
| Reverse Proxy | Nginx | **Phải khôi phục đúng IP thật qua `ngx_http_realip_module` vì có Cloudflare phía trước** |
| CDN & DNS | Cloudflare (Free) | SSL, cache tĩnh, DDoS protection |
| Crawler | Node.js script (cron riêng) | Không dùng serverless để tránh timeout; **không crawl Amazon HTML** |

### Luồng dữ liệu chính

1. Crawler lấy giá đa sàn (24h/lần, trừ Amazon) → lưu PostgreSQL.
2. Next.js (ISR) đọc DB → hiển thị bảng so sánh giá.
3. User click "Buy Now" → `GET /go/[slug]?network=X`.
4. Route Handler (Node.js runtime) lấy IP thật đã được Nginx khôi phục đúng, hash IP, kiểm tra rate-limit, tạo `clickId` (UUID) → `RPUSH` vào Redis queue → redirect 302 tới link affiliate.
5. Worker nền (`BLPOP`, chạy PM2) lấy dữ liệu từ Redis → ghi vào bảng `Click` (kèm `ipHash`).
6. Postback từ Network (Amazon/Impact/Awin/CJ) → match `clickId` → ghi vào `Conversion`.

---

## 3. CẤU TRÚC THƯ MỤC NEXT.JS

```
deskholt/
├── public/
│   ├── robots.txt
│   └── images/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                     # Trang chủ
│   │   │   ├── category/[slug]/page.tsx     # Danh mục (ISR)
│   │   │   ├── product/[slug]/page.tsx      # Sản phẩm (ISR)
│   │   │   ├── collections/sustainable/     # Lọc Eco-friendly
│   │   │   ├── blog/[slug]/page.tsx         # Bài viết blog (public, render qua blog parser)
│   │   │   └── [legal]/page.tsx             # About, Privacy, Terms, Affiliate Disclosure
│   │   ├── (admin)/admin/
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx                 # Danh sách bài viết (List) — filter/search/bulk actions
│   │   │   │   ├── new/page.tsx             # Trang Tạo bài (Create)
│   │   │   │   └── [id]/edit/page.tsx       # Trang Sửa bài (Edit) — revisions, lock, duplicate
│   │   │   └── tags/page.tsx                # Quản lý Tag — đổi tên/gộp/xóa, tránh tag trùng nghĩa
│   │   ├── api/v1/
│   │   │   ├── admin/                       # Quản trị link (tùy chọn)
│   │   │   └── public/                      # API public cho FE
│   │   ├── go/[slug]/route.ts               # ⚠️ Route Handler (Node.js) — KHÔNG dùng middleware
│   │   ├── sitemap.xml/route.ts             # Sitemap index
│   │   ├── sitemap-products.xml/route.ts
│   │   ├── sitemap-category.xml/route.ts
│   │   └── sitemap-blog.xml/route.ts
│   ├── components/
│   │   ├── product/ProductSchema.tsx        # JSON-LD Schema.org
│   │   ├── product/PriceTable.tsx
│   │   ├── blog/ProductCardBlock.tsx        # {{product:id}} — layout dọc/ngang
│   │   ├── blog/PriceTableBlock.tsx         # {{price-table:id}} — bọc lại product/PriceTable.tsx
│   │   ├── blog/ComparisonGridBlock.tsx     # {{compare:ids}} — layout grid/table
│   │   ├── blog/DisclosureBlock.tsx         # Affiliate Disclosure, override theo bài
│   │   └── ui/
│   ├── lib/
│   │   ├── prisma.ts                        # Prisma client (singleton)
│   │   ├── redis.ts                         # Redis client (ioredis)
│   │   ├── encryption.ts                    # AES-256-GCM cho API keys
│   │   ├── blog/
│   │   │   └── parser.ts                    # ⚠️ Parse shortcode {{product}}/{{price-table}}/{{compare}} trong content
│   │   └── affiliate/
│   │       ├── manager.ts                   # AffiliateManager
│   │       └── drivers/                     # amazon.ts, walmart.ts, target.ts...
│   ├── workers/
│   │   └── click-worker.ts                  # ⚠️ Dùng BLPOP, lưu ipHash
│   └── middleware.ts                        # KHÔNG xử lý /go
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   └── crawler.js                           # Cron lấy giá (không crawl Amazon)
├── docker-compose.yml
├── next.config.js
└── package.json
```

---

## 4. CƠ SỞ DỮ LIỆU (PRISMA SCHEMA — HOÀN CHỈNH)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  blogPosts   BlogPost[]           // ⬅️ v4.1 — tái dùng chung Category cho cả Product và Blog

  @@index([slug])
}

model Tag {
  id        Int        @id @default(autoincrement())
  slug      String     @unique
  name      String

  blogPosts BlogPost[] // implicit many-to-many

  @@index([slug])
}

model Product {
  id                Int      @id @default(autoincrement())
  name              String
  slug              String   @unique
  categoryId        Int
  description       String?
  imageUrl          String?
  specs             Json?                // Thông số kỹ thuật
  upcCode           String?              // Dùng để match đa sàn
  userSentiment     Json?                // { pros, cons, summary }
  isIndexed         Boolean  @default(false)
  isSustainable     Boolean  @default(false) // Eco-friendly tag
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  category          Category @relation(fields: [categoryId], references: [id])
  affiliateLinks    AffiliateLink[]
  clicks            Click[]
  conversions       Conversion[]
  blogMentions      BlogPostProduct[]    // ⬅️ v4.1 — bài blog nào đang nhắc tới sản phẩm này

  @@index([categoryId])
  @@index([slug])
  @@index([isIndexed])
  @@index([isSustainable])
}

model AffiliateNetwork {
  id                Int      @id @default(autoincrement())
  name              String
  slug              String   @unique
  logo              String?
  isActive          Boolean  @default(true)
  apiConfig         Json?                // ⚠️ PHẢI MÃ HÓA TRƯỚC KHI LƯU (xem mục 8)
  commissionRate    String?
  cookieDays        Int      @default(1)
  lastSyncedAt      DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  affiliateLinks    AffiliateLink[]
  reports           AffiliateReport[]
  conversions       Conversion[]
}

model AffiliateLink {
  id                Int      @id @default(autoincrement())
  productId         Int
  networkId         Int
  rawUrl            String              // URL gốc trên sàn
  trackingUrl       String?             // URL đã gắn tag affiliate (nên tạo sẵn để redirect nhanh)
  price             Float?
  currency          String   @default("USD")
  isInStock         Boolean  @default(true)
  priorityOrder     Int      @default(0) // Cao hơn = ưu tiên hơn khi redirect
  lastCrawledAt     DateTime?

  product           Product            @relation(fields: [productId], references: [id])
  network           AffiliateNetwork   @relation(fields: [networkId], references: [id])
  clicks            Click[]
  priceHistory      PriceHistory[]

  @@index([productId])
  @@index([networkId])
  @@index([isInStock])
  @@index([lastCrawledAt])
}

model Click {
  id                Int      @id @default(autoincrement())
  clickId           String   @unique   // UUID, dùng để match Conversion
  productId         Int
  networkId         Int
  linkId            Int?
  sourcePage        String?
  ipHash            String?             // SHA-256(IP thật + salt) — bảo vệ CCPA
  userAgent         String?
  usState           String?             // Từ IP geolocation (optional)
  createdAt         DateTime @default(now())

  product           Product            @relation(fields: [productId], references: [id])
  network           AffiliateNetwork   @relation(fields: [networkId], references: [id])
  affiliateLink     AffiliateLink?     @relation(fields: [linkId], references: [id])
  conversion        Conversion?        // 1-1

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
  status            String   @default("pending") // pending, approved, paid
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

  @@unique([networkId, date])   // Chống trùng báo cáo cùng ngày + cùng network
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

model BlogPost {
  id                  Int       @id @default(autoincrement())
  slug                String    @unique
  title               String
  content             String              // Markdown, chứa shortcode {{product:id}} / {{price-table:id}} / {{compare:ids}}
  excerpt             String?
  featuredImage       String?
  author              String?
  assignee            String?             // "Người phụ trách" — chỉ cần tên, không có bảng User riêng
  categoryId          Int?
  publishedAt         DateTime?
  isPublished         Boolean   @default(false)
  views               Int       @default(0)

  // SEO & Open Graph — v4.1
  metaTitle           String?
  metaDesc            String?
  ogTitle             String?
  ogDesc              String?
  ogImage             String?
  canonicalUrl        String?

  // Affiliate compliance — v4.1
  disclosureOverride  String?             // null = dùng disclosure mặc định của site

  // Khóa bài viết khi đang chỉnh sửa — v4.1
  lockedBy            String?
  lockedAt            DateTime?

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  category            Category?           @relation(fields: [categoryId], references: [id])
  tags                Tag[]
  products            BlogPostProduct[]   // sản phẩm được nhắc tới qua block affiliate trong bài
  revisions           BlogPostRevision[]

  @@index([slug])
  @@index([publishedAt])
  @@index([isPublished])
  @@index([categoryId])
}

// ⬅️ v4.1 — đồng bộ mỗi lần save content (sau khi parser quét shortcode), phục vụ
// cảnh báo "sản phẩm hết hàng trong bài đã publish" ở trang Danh sách/Checklist
model BlogPostProduct {
  id          Int      @id @default(autoincrement())
  blogPostId  Int
  productId   Int
  blockType   String   // "product" | "price-table" | "compare"
  layout      String?  // "vertical" | "horizontal" | "table" — null nếu blockType không cần layout
  position    Int      @default(0) // thứ tự xuất hiện trong bài

  blogPost    BlogPost @relation(fields: [blogPostId], references: [id])
  product     Product  @relation(fields: [productId], references: [id])

  @@index([blogPostId])
  @@index([productId])
}

// ⬅️ v4.1 — snapshot nội dung để xem diff/khôi phục, dọn định kỳ (VD giữ 20 bản gần nhất/bài)
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
```

---

## 5. ROUTE HANDLER CHO `/go` (KHÔNG DÙNG MIDDLEWARE)

**Lý do:** Next.js Middleware mặc định chạy Edge Runtime, không hỗ trợ các API Node.js mà `ioredis`/Prisma cần. Route Handler chạy Node.js runtime theo mặc định nên an toàn hơn.

### 5.1. File `src/app/go/[slug]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import redis from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

// ⚠️ Bắt buộc set biến này ở môi trường production — không dùng giá trị mặc định
if (!process.env.IP_SALT) {
  throw new Error('Missing IP_SALT environment variable');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // ⚠️ params là Promise trong Next.js 15+
) {
  const { slug } = await params;
  const networkSlug = request.nextUrl.searchParams.get('network') || 'amazon';

  // Lấy IP thật — Nginx đã dùng ngx_http_realip_module để khôi phục đúng IP
  // gốc của khách (xem mục 7), nên $remote_addr ở tầng Nginx đã chính xác
  // và X-Forwarded-For/X-Real-IP nhận được ở đây là tin cậy được.
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined;

  const ipHash = realIp
    ? createHash('sha256').update(realIp + process.env.IP_SALT).digest('hex')
    : undefined;

  // Rate limit chống click fraud: tối đa 10 click / IP / phút
  if (ipHash) {
    const rateKey = `rate:go:${ipHash}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 60);
    if (count > 10) {
      return new NextResponse('Too many requests', { status: 429 });
    }
  }

  // 1. Lấy sản phẩm và link đúng network
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      affiliateLinks: {
        include: { network: true },
        where: { network: { slug: networkSlug } },
        take: 1,
      },
    },
  });

  if (!product || product.affiliateLinks.length === 0) {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  const link = product.affiliateLinks[0];
  const redirectUrl = link.trackingUrl || link.rawUrl;

  // 2. Tạo click_id và đẩy vào Redis Queue
  const clickId = uuidv4();
  const clickData = {
    clickId,
    productId: product.id,
    networkId: link.networkId,
    linkId: link.id,
    sourcePage: request.headers.get('referer') || '',
    userAgent: request.headers.get('user-agent') || '',
    ipHash,
    timestamp: Date.now(),
  };

  await redis.rpush('click_queue', JSON.stringify(clickData));

  // 3. Redirect 302
  return NextResponse.redirect(redirectUrl, 302);
}
```

---

## 6. WORKER XỬ LÝ CLICK (BACKGROUND)

Dùng `BLPOP` (blocking pop) thay vì polling `lpop` + `setTimeout` để giảm tải CPU và xử lý gần như tức thời.

### 6.1. File `src/workers/click-worker.ts`

```ts
import redis from '@/lib/redis';
import { prisma } from '@/lib/prisma';

async function processQueue() {
  console.log('📦 Click worker started, waiting for jobs...');

  while (true) {
    try {
      const result = await redis.blpop('click_queue', 0);
      if (!result) continue;

      const [, item] = result; // [queueName, value]
      const data = JSON.parse(item);

      await prisma.click.create({
        data: {
          clickId: data.clickId,
          productId: data.productId,
          networkId: data.networkId,
          linkId: data.linkId,
          sourcePage: data.sourcePage,
          userAgent: data.userAgent,
          ipHash: data.ipHash,          // đã hash sẵn từ route handler
          // usState: có thể bổ sung sau bằng IP geolocation API
          createdAt: new Date(data.timestamp),
        },
      });

      console.log(`✅ Saved click ${data.clickId}`);
    } catch (error) {
      console.error('❌ Error processing click:', error);
      // TODO: cơ chế retry/dead-letter với số lần giới hạn
    }
  }
}

processQueue();
```

**Chạy worker:**
```bash
pm2 start src/workers/click-worker.ts --name click-worker --interpreter node -- --require ts-node/register
```

---

## 7. CẤU HÌNH NGINX — LẤY ĐÚNG IP THẬT KHI CÓ CLOUDFLARE

**⚠️ Đây là điểm sửa quan trọng nhất so với các bản trước.** Vì kiến trúc là **Cloudflare → Nginx → Next.js**, nếu chỉ set `X-Forwarded-For: $remote_addr` như bản cũ, Nginx sẽ lấy **IP của Cloudflare edge server** (vì đó là ai đang thực sự mở kết nối TCP tới Nginx), **không phải IP khách hàng thật**. Điều này làm `ipHash` và rate-limit ở mục 5 vô nghĩa.

Cách sửa đúng: dùng `ngx_http_realip_module` (có sẵn trong Nginx bản build chuẩn của Ubuntu) để Nginx tự khôi phục đúng `$remote_addr` từ header `CF-Connecting-IP` mà Cloudflare gửi kèm.

### 7.1. File include riêng cho dải IP Cloudflare (`/etc/nginx/conf.d/cloudflare-realip.conf`)

```nginx
# Cập nhật định kỳ theo https://www.cloudflare.com/ips/
# IPv4
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
# IPv6
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

real_ip_header CF-Connecting-IP;
```

### 7.2. Site config (`/etc/nginx/sites-available/deskholt`)

```nginx
server {
    listen 80;
    server_name deskholt.com www.deskholt.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name deskholt.com www.deskholt.com;

    ssl_certificate /etc/letsencrypt/live/deskholt/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/deskholt/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # $remote_addr giờ đã ĐÚNG là IP khách thật nhờ realip_module ở trên
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

### 7.3. Bắt buộc: chặn truy cập thẳng vào VPS, chỉ cho phép Cloudflare

Nếu không chặn, ai đó có thể gọi thẳng IP VPS (bỏ qua Cloudflare) và tự gắn header giả để né rate-limit. Dùng `ufw` hoặc firewall của nhà cung cấp VPS để chỉ mở port 80/443 cho dải IP Cloudflare ở mục 7.1, hoặc bật **Cloudflare Authenticated Origin Pulls**.

Reload sau khi cấu hình xong: `sudo nginx -t && sudo nginx -s reload`

---

## 8. MÃ HÓA API KEYS (`src/lib/encryption.ts`)

Trường `apiConfig` trong `AffiliateNetwork` lưu thông tin nhạy cảm (API Key, Secret) — **bắt buộc** mã hóa trước khi lưu DB.

```ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

**`.env.local` cần có:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/deskholt"

# Redis
REDIS_URL="redis://localhost:6379"

# Next.js
NEXT_PUBLIC_APP_URL="https://deskholt.com"

# Bảo mật — tạo bằng: openssl rand -hex 32
ENCRYPTION_KEY="your_32_bytes_hex_key_here"
IP_SALT="chuoi_ngau_nhien_bat_ky_khong_de_trong"

# Affiliate keys thô (sẽ được encrypt() trước khi lưu DB, không lưu thẳng)
AMAZON_API_KEY="..."
AMAZON_SECRET="..."
WALMART_CONSUMER_ID="..."
WALMART_SECRET="..."
```

---

## 9. CÁC FILE CẤU HÌNH KHÁC

### 9.1. `docker-compose.yml`

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    container_name: deskholt-db
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: deskholt
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: always

  redis:
    image: redis:7
    container_name: deskholt-redis
    ports:
      - "6379:6379"
    restart: always

volumes:
  postgres_data:
```

### 9.2. `next.config.js`

```js
/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    // remotePatterns thay cho domains (kiểm soát chặt hơn theo protocol/path)
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'i5.walmartimages.com' },
    ],
  },
  output: 'standalone', // deploy với PM2
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },
};
```

### 9.3. `public/robots.txt`

```
User-agent: *
Allow: /
Sitemap: https://deskholt.com/sitemap.xml

# Allow AI search bots
User-agent: OAI-SearchBot
Allow: /

# Disallow AI training bots
User-agent: GPTBot
Disallow: /
User-agent: CCBot
Disallow: /

# Disallow useless crawlers
User-agent: AhrefsBot
Disallow: /
User-agent: SemrushBot
Disallow: /

Crawl-delay: 2
```

### 9.4. Trang sản phẩm với ISR (`src/app/(public)/product/[slug]/page.tsx`)

```tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductSchema from '@/components/product/ProductSchema';
import PriceTable from '@/components/product/PriceTable';

export const revalidate = 86400; // 24 giờ

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      affiliateLinks: {
        include: { network: true },
        orderBy: { priorityOrder: 'desc' },
      },
    },
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <section>
      <ProductSchema product={product} />
      <h1 className="text-3xl font-bold">{product.name}</h1>
      {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="my-4" />}
      <PriceTable links={product.affiliateLinks} productId={product.id} />
    </section>
  );
}
```

### 9.5. Sitemap Index (`src/app/sitemap.xml/route.ts`)

```ts
import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = 'https://deskholt.com';
  const sitemaps = [
    `${baseUrl}/sitemap-products.xml`,
    `${baseUrl}/sitemap-category.xml`,
    `${baseUrl}/sitemap-blog.xml`,
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps.map(url => `<sitemap><loc>${url}</loc></sitemap>`).join('')}
</sitemapindex>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
```

---

## 10. LƯU Ý VỀ AFFILIATE & PHÁP LÝ

1. **Không crawl Amazon HTML** — vi phạm ToS, rủi ro khóa tài khoản. Nhập tay 100-200 sản phẩm đầu; về sau dùng API bên thứ 3 (Rainforest API, Canopy) hoặc Amazon Creators API (yêu cầu ≥10 đơn/30 ngày).
2. **Amazon Associates — 180 ngày đầu:** cần đạt 3 đơn hàng để giữ tài khoản. Dùng video AI + mạng xã hội để kéo traffic 3-6 tháng đầu, không chỉ trông chờ SEO.
3. **CCPA:** cần Cookie Consent Banner và link "Do Not Sell My Personal Information" ở footer. `ipHash` (mục 7-8) là một phần của việc tuân thủ này — không lưu IP thô.
4. **W-8BEN:** nộp ngay khi đăng ký Amazon Associates để tránh bị khấu trừ thuế 30%.

---

## 11. DEPLOYMENT (VPS)

1. Clone code lên VPS.
2. Cài Docker, chạy `docker-compose up -d`.
3. Tạo `.env.local` với đầy đủ biến (mục 8) — **không được thiếu `ENCRYPTION_KEY`/`IP_SALT`**.
4. Chạy migration: `npx prisma migrate deploy`.
5. Seed dữ liệu mẫu: `npx prisma db seed` (category + vài sản phẩm).
6. Build: `npm run build`.
7. Chạy Next.js: `pm2 start npm --name deskholt -- start`.
8. Chạy worker: `pm2 start src/workers/click-worker.ts --name click-worker --interpreter node -- --require ts-node/register`.
9. Cấu hình Nginx theo mục 7 (bao gồm `realip_module` + chặn IP ngoài Cloudflare) và reload.
10. Thiết lập backup (`pg_dump` hàng ngày → Cloudflare R2/Backblaze B2) và monitoring (UptimeRobot cho `/` và `/go/...`).

---

## 12. ROADMAP TRIỂN KHAI

| Giai đoạn | Thời gian | Nội dung chính |
|---|---|---|
| 0 | Tuần 1-2 | Setup VPS, Docker, Cloudflare (kèm realip config), deploy skeleton Next.js |
| 1 | Tháng 1 | Nhập tay 100-200 sản phẩm, viết 5-10 bài blog, đăng ký Amazon Associates, chạy video AI kéo traffic sớm |
| 2 | Tháng 2 | Scale pSEO lên 500-1000 trang, xây Interactive Calculator, submit sitemap qua IndexNow |
| 3 | Tháng 3 | Tích hợp postback conversions, thu thập sentiment (review thật), tối ưu EPC |
| 4 | Tháng 4 | Bắt đầu xây Steadylifeaids.com (tái sử dụng codebase) |
| 5-6 | Tháng 5-7+ | pSEO Steadylifeaids, vận hành song song, traffic thụ động |

### Soft Launch (7 ngày trước ra mắt)

1. **Luồng click:** Click "Buy Now" → redirect nhanh (<200ms) → `clickId` xuất hiện đúng trong DB.
2. **Luồng conversion:** mua hàng thật (sản phẩm giá rẻ) → postback match đúng `clickId`.
3. **Rate limit:** thử spam click từ cùng IP → xác nhận bị chặn ở lần thứ 11.
4. **Real IP:** kiểm tra `ipHash` trong DB có thay đổi đúng theo từng thiết bị/mạng test khác nhau (xác nhận Nginx realip hoạt động đúng, không phải toàn bộ traffic ra cùng 1 hash).
5. **Fallback:** sản phẩm hết hàng → chuyển sang sàn khác (Walmart/Target).
6. **Backup:** test khôi phục backup Postgres.

---

## 13. NỘI DUNG BLOG — SHORTCODE AFFILIATE & PARSER

Blog không phải nội dung tĩnh: mỗi bài có thể tham chiếu tới `Product` để hiển thị Card/Bảng giá, và dữ liệu đó phải luôn khớp với DB tại thời điểm trang được render (ISR), không đóng băng theo lúc viết. Vì vậy `BlogPost.content` **không lưu URL affiliate hay dữ liệu sản phẩm cứng**, chỉ lưu shortcode tham chiếu ID.

### 13.1. Cú pháp shortcode

| Shortcode | Component render | Hướng hiển thị |
|---|---|---|
| `{{product:482}}` | `ProductCardBlock.tsx` | Dọc (mặc định) |
| `{{product:482:layout=horizontal}}` | `ProductCardBlock.tsx` | Ngang |
| `{{price-table:482}}` | `PriceTableBlock.tsx` (bọc `product/PriceTable.tsx` có sẵn) | Ngang — so 1 sản phẩm trên nhiều sàn |
| `{{compare:482,510,533}}` | `ComparisonGridBlock.tsx` | Grid — nhiều sản phẩm khác nhau, xếp ngang hàng |
| `{{compare:482,510,533:layout=table}}` | `ComparisonGridBlock.tsx` | Bảng ngang, mỗi hàng 1 sản phẩm |

### 13.2. `src/lib/blog/parser.ts` (khi render trang public)

```ts
import { prisma } from '@/lib/prisma';

const SHORTCODE_RE = /\{\{(product|price-table|compare):([\d,]+)(?::layout=(\w+))?\}\}/g;

export async function renderBlogContent(content: string) {
  const matches = [...content.matchAll(SHORTCODE_RE)];
  const ids = [...new Set(matches.flatMap(m => m[2].split(',').map(Number)))];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { affiliateLinks: { include: { network: true }, orderBy: { priorityOrder: 'desc' } } },
  });
  const byId = new Map(products.map(p => [p.id, p]));

  // Thay từng shortcode bằng placeholder <div data-block="..."> để FE hydrate component tương ứng
  // (ProductCardBlock / PriceTableBlock / ComparisonGridBlock), dữ liệu lấy từ `byId`.
  return content.replace(SHORTCODE_RE, (_, type, idList, layout) => {
    const blockIds = idList.split(',').map(Number);
    return `<div data-block="${type}" data-ids="${blockIds.join(',')}" data-layout="${layout || ''}"></div>`;
  });
}
```

### 13.3. Đồng bộ `BlogPostProduct` khi Save (Server Action)

Mỗi lần Create/Edit bấm Lưu, quét lại `content` bằng `SHORTCODE_RE`, rồi `deleteMany` + `createMany` vào bảng `BlogPostProduct` để phản ánh đúng danh sách sản phẩm hiện tại trong bài — bảng này là nguồn cho cảnh báo "sản phẩm hết hàng trong bài đã publish" ở trang Danh sách và Pre-publish Checklist.

### 13.4. Affiliate Disclosure

`DisclosureBlock.tsx` tự chèn ở đầu bài (lấy `disclosureOverride` nếu bài có set, ngược lại dùng text mặc định cấp site). Server Action chặn publish nếu `BlogPostProduct` của bài có ít nhất 1 dòng mà `disclosureOverride` rỗng **và** cấu hình site chưa có disclosure mặc định.

### 13.5. Quản lý Category & Tag

- **Category** (chọn 1, optional — khớp `categoryId Int?`): Dropdown trong tab "Cài đặt", cho phép "+ Tạo Category mới" ngay trong dropdown, không cần rời trang.
- **Tags** (chọn nhiều): Ô nhập dạng **Chip Input** — gõ + Enter để thêm.
  - **Auto-suggest** khi gõ 2-3 ký tự: query `Tag` theo `name` (contains, case-insensitive) kèm `_count.blogPosts`, hiển thị ngay trong dropdown gợi ý — ưu tiên chọn tag cũ thay vì tạo tag gần giống.
  - Không khớp gợi ý nào + Enter → tạo `Tag` mới ngay lúc đó (không cần rời trang, giống Category).
  - Giới hạn mềm 3-5 tag: chỉ hiện dòng nhắc SEO, **không chặn** submit — nhất quán với triết lý "Pre-publish Checklist nhắc chứ không chặn" (mục 3).
  - Tag < 2 ký tự: chỉ cảnh báo nhẹ, không tự ẩn/chặn cứng (tránh chặn oan các tag hợp lệ ngắn như "4K", "TV", "3D").
  - **Giới hạn của auto-suggest:** chỉ bắt được trùng lặp theo ký tự gần giống (VD "React"/"reactjs"), không tự phát hiện đồng nghĩa hoàn toàn khác chữ (VD "bàn đứng"/"standing desk") — vẫn cần Merge Tag làm lưới an toàn cuối.
- **`/admin/tags`** — mở cho **mọi thành viên**, không giới hạn theo vai trò (team không phân role Admin/Editor riêng, xem mục 1):
  - Danh sách Tag kèm `_count.blogPosts`.
  - **Merge:** gộp tag nguồn vào tag đích — `updateMany` toàn bộ quan hệ `BlogPost.tags` sang tag đích rồi xóa tag nguồn (transaction).
  - Đổi tên tag (áp dụng ngay cho mọi bài đang gắn, vì `tags` là relation chứ không copy tên).
  - Chủ động liệt kê Unused Tags (`_count.blogPosts = 0`) ở đầu trang để dọn nhanh.

---

## KẾT LUẬN

Bản này đã tổng hợp và sửa toàn bộ lỗi phát hiện qua các vòng review:
- ✅ Route Handler thay Middleware (tương thích Edge Runtime).
- ✅ `params` là Promise, `request.ip` đã bị loại bỏ khỏi Next.js 15 → dùng header.
- ✅ Model `Category`, `BlogPost`, index đầy đủ, `@@unique` cho `AffiliateReport`.
- ✅ **v4.1:** `BlogPost` mở rộng SEO/OG/assignee/lock, thêm `Tag`, `BlogPostProduct` (đồng bộ shortcode ↔ sản phẩm để cảnh báo hết hàng), `BlogPostRevision` (lịch sử/diff), và shortcode parser cho Product Card/Price Table/Comparison Grid (mục 13).
- ✅ Mã hóa AES-256-GCM cho API keys.
- ✅ Worker dùng `BLPOP`, lưu đúng `ipHash`.
- ✅ Rate-limit chống click fraud.
- ✅ **Nginx khôi phục đúng IP thật qua `realip_module` khi có Cloudflare phía trước** (điểm sửa cuối cùng).

Có thể dùng làm tài liệu tham khảo duy nhất để bắt đầu code.
