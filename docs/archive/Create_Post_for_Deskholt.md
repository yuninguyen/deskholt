# TỔNG HỢP YÊU CẦU GIAO DIỆN QUẢN LÝ BLOG POST (v2 — Affiliate-ready)
## Dành cho team nhỏ 2-3 người (tự viết, tự đăng, không cần duyệt) — Deskholt.com

> **Thay đổi so với v1:** Bổ sung các block nội dung đặc thù affiliate (Product Card, Comparison Table, Disclosure), mở rộng phạm vi từ chỉ trang **Create** sang đủ 3 trang **Create / Danh sách (List) / Sửa (Edit)**, thống nhất quy tắc **Save → Redirect** cho toàn hệ thống, và đề xuất cập nhật Prisma schema tương ứng.

---

## 1. GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UX/UI)

### Trình soạn thảo (Editor)
- **Bố cục:** Responsive, ưu tiên chiều rộng tối đa 1400px, tỷ lệ chuẩn.
- **Chế độ Focus (Toàn màn hình):** Xóa mọi yếu tố gây xao nhãng để tập trung viết.
- **Xem trước (Live Preview):** Tùy chọn bố cục 2 cột, vừa viết vừa xem giao diện Desktop/Mobile.
- **Thanh công cụ (Toolbar):** Cố định trên cùng, bao gồm:
  - Định dạng văn bản: Tiêu đề (H1-H3), in đậm/nghiêng, gạch đầu dòng, số thứ tự.
  - Chèn link, blockquote, code block.
  - Chèn media (ảnh, video, audio) với kéo thả hoặc chọn từ thư viện.
  - **Chèn block Affiliate** (Product Card / Comparison Table / Disclosure) — xem mục 6.1.
- **Quản lý Media thông minh:**
  - Tích hợp kho ảnh miễn phí (Unsplash, Pexels) – chèn ảnh chỉ với 1 click.
  - Upload ảnh kéo thả, tự động nén dung lượng.
  - Tự động điền Alt Text bằng AI (chứa từ khóa chính).

### Lưu trữ và quản lý bài viết
- **Tự động lưu (Auto-save):** Lưu mỗi vài giây, không lo mất dữ liệu.
- **Lịch sử chỉnh sửa (Revisions):** Lưu tất cả phiên bản cũ, cho phép khôi phục hoặc **xem diff (so sánh) giữa 2 phiên bản** bất kỳ.
- **Trạng thái bài viết:** Hiển thị trực quan bằng màu sắc:
  - 🟡 **Nháp (Draft)** – đang viết.
  - ⏳ **Hẹn giờ (Scheduled)** – sẽ xuất bản trong tương lai.
  - 🟢 **Đã xuất bản (Published)** – đã live.
- **Khóa bài viết (Lock):** Khi một thành viên đang sửa, người khác chỉ xem được, không lưu được (tránh xung đột).

---

## 2. TÍCH HỢP SEO TOÀN DIỆN

### Bảng điều khiển SEO (Sidebar hoặc Tab)
- **Meta Tags:**
  - Tiêu đề SEO (≤ 60 ký tự)
  - Mô tả (≤ 160 ký tự)
  - URL Slug (tùy chỉnh thân thiện)
- **Xem trước SERP:** Hiển thị giao diện kết quả tìm kiếm Google ngay khi nhập Meta Title/Desc.
- **SEO Social (Open Graph):**
  - Ảnh đại diện, tiêu đề, mô tả riêng cho Facebook/LinkedIn.
  - Khác với Meta Tags thông thường.

### Phân tích nội dung theo thời gian thực
- **Gợi ý từ khóa:** Đề xuất từ khóa chính/phụ dựa trên nội dung.
- **Cảnh báo nhồi nhét từ khóa (Keyword stuffing).**
- **Điểm số SEO:** Chấm điểm bài viết và đưa ra gợi ý cải thiện cấu trúc, độ dài.

---

## 3. TÍNH NĂNG QUẢN LÝ NỘI DUNG NÂNG CAO

### Cấu trúc và bố cục
- **Tạo Outline trước:** Lập dàn ý H2/H3, sau đó điền nội dung vào từng phần.
- **Tự động tạo Mục lục (TOC):** Dựa trên các heading, có thể nhấp để di chuyển.
- **Shortcode/Layout có sẵn:** Chọn mẫu bố cục (2 cột, 3 cột, box nổi bật) mà không cần CSS.

### Tương tác và chuyển đổi
- **Chèn Call-to-Action (CTA):** Tạo các khối như "Đăng ký", "Tải tài liệu" hoặc "Mua sản phẩm" kéo thả vào bài.
- **Thời gian đọc (Read time):** Hiển thị số phút đọc trung bình.
- **Nhúng đa dạng:** Hỗ trợ Google Map, Form khảo sát, TikTok, Vimeo,...

### Quản lý tác giả và xuất bản
- **Hồ sơ tác giả (Author Box):** Tự động hiển thị avatar và tiểu sử ở cuối bài.
- **Phân loại:** Gán Category và Tags để tổ chức nội dung.
- **Lên lịch xuất bản:** Cho phép chọn xuất bản ngay hoặc hẹn giờ.
- **Pop-up "Soát lỗi cuối cùng" (Pre-publish Checklist):**
  - Hiện bảng kiểm tra các yếu tố còn thiếu (Meta, Alt text, CTA,...).
  - **Bổ sung kiểm tra riêng cho Affiliate:**
    - ❗ Bài có nhắc sản phẩm nhưng chưa chèn khối **Affiliate Disclosure**.
    - ⚠️ Bài đang tham chiếu sản phẩm **hết hàng** (`isInStock = false`) — gợi ý sản phẩm thay thế.
  - **Vẫn có nút "Xuất bản bỏ qua"** – không chặn, chỉ nhắc nhở.

---

## 4. PHÂN QUYỀN TỐI GIẢN CHO TEAM 2-3 NGƯỜI

- **Không có vai trò "Editor" hay "Reviewer"** – mọi người đều có quyền như nhau.
- **Mỗi thành viên đều là Admin hoặc Editor:** Ai cũng có thể xuất bản, sửa bài của người khác.
- **Không có trạng thái chờ duyệt (Pending) hay bị từ chối (Rejected).**
- **Cơ chế "Người phụ trách" (Assignee):** Gán tên cho từng bài viết để biết ai đang handle, tránh trùng lặp công việc.

---

## 5. TÍCH HỢP AI TRỢ LÝ THÔNG MINH (GIỮ NGUYÊN)

### AI hỗ trợ viết (In-line)
- **Autocomplete:** Gợi ý câu tiếp theo (giống Gmail Smart Compose).
- **Viết lại 3 cấp độ:** Chọn đoạn văn và chọn kiểu viết lại: *Chuyên nghiệp*, *Thân thiện*, *Ngắn gọn*.
- **Tóm tắt ý chính:** Tóm gọn một đoạn dài thành 1 câu bullet.

### AI cho SEO & chiến lược nội dung
- **Tạo Outline thông minh:** Nhập từ khóa → AI đề xuất cấu trúc H2/H3 dựa trên top bài viết của Google.
- **Gợi ý FAQ:** Tự động đề xuất 3-5 câu hỏi thường gặp kèm câu trả lời ngắn.
- **Gợi ý Internal Link:** Đề xuất các bài viết cũ trong site để chèn link nội bộ (kèm lý do).
- **Gợi ý sản phẩm để chèn Product Card:** Dựa trên nội dung đang viết, AI đề xuất sản phẩm phù hợp trong DB (`Product`) để chèn Card/Comparison, kèm lý do liên quan.
- **Tạo Social Post sau xuất bản:** Sinh 3 phiên bản giới thiệu bài để đăng Facebook/LinkedIn.
- **Tạo Meta Description đa phiên bản:** Sinh 5 phiên bản để lựa chọn hoặc A/B test.

### Chatbot "Ask AI"
- Thanh chat nhỏ bên phải, cho phép hỏi:
  - *"Đoạn này có mâu thuẫn với phần trên không?"*
  - *"Bài đã đủ chuyên sâu chưa? Thiếu ý gì?"*

---

## 6. GIAO DIỆN UI TINH GỌN — CREATE / DANH SÁCH (LIST) / SỬA (EDIT)

### 6.1. Content Block đặc thù Affiliate

Đây là nhóm block quan trọng nhất còn thiếu ở v1, vì Deskholt là **Affiliate Hub** chứ không phải blog thuần túy — nội dung cần gắn trực tiếp với dữ liệu `Product` / `AffiliateLink` trong DB thay vì chỉ là văn bản/ảnh tĩnh.

Ba block bên dưới ánh xạ trực tiếp vào 2 component đã có sẵn trong `deskholt-design-system.html`: **Product Card** (`.product-card`, mục 07 — hiển thị **dọc**) và **Price Comparison Table** (`.price-table`, mục 08 — hiển thị **ngang**). Không tạo component mới, chỉ thêm tham số layout để tái sử dụng đúng 2 component đã thiết kế.

#### a) Product Card Block — 1 sản phẩm, dọc hoặc ngang
- Chèn qua nút trên toolbar hoặc gõ `/product` → mở modal tìm kiếm sản phẩm theo tên trong bảng `Product`.
- Modal có toggle **"Hiển thị: Dọc ▾ / Ngang"** — chọn xong tự sinh đúng shortcode, người viết không cần gõ tay:
  ```
  {{product:482}}                     // Dọc (mặc định) — dùng component .product-card nguyên bản
  {{product:482:layout=horizontal}}   // Ngang — ảnh trái, nội dung phải, cùng token màu/badge
  ```
- Block lưu dưới dạng tham chiếu ID (không copy cứng dữ liệu), khi render lấy trực tiếp ảnh/tên/giá/tồn kho mới nhất từ DB — tránh nội dung bị "lỗi thời" khi giá đổi.
- Tùy chọn nội dung: Compact (ảnh + tên + giá + nút mua) hoặc Full (kèm pros/cons từ `userSentiment`).
- Nút mua luôn dùng màu `--blueprint` (đúng quy tắc "CTA chính duy nhất" của design system), trỏ thẳng tới `/go/[slug]?network=...`.
- **Cảnh báo ngay trong Editor:** nếu sản phẩm được chọn có `isInStock = false`, hiện `.badge-outstock` (chấm + text, không chỉ dựa màu) ngay tại vị trí block, nút mua tự chuyển `.btn-disabled`.

#### b) Price Table Block — 1 sản phẩm, so nhiều sàn (luôn ngang)
- Dùng khi bài chỉ tập trung review **1 sản phẩm** và muốn cho người đọc thấy sàn nào rẻ nhất.
- Shortcode: `{{price-table:482}}` — map thẳng vào component `PriceTable.tsx` đã có sẵn ở trang Product (mục 5.1 spec kỹ thuật), không phải build lại.
- Hàng giá tốt nhất tự tô `--sage-soft` kèm `.badge-best`, hàng hết hàng tự vô hiệu hóa nút Go — không cần cấu hình gì thêm trong Editor.

#### c) Comparison Grid Block — nhiều sản phẩm khác nhau, dọc hoặc ngang
- Chọn 2-5 sản phẩm khác nhau từ modal tìm kiếm (có thể lọc theo Category) — dùng cho dạng listicle "Top N".
- Shortcode:
  ```
  {{compare:482,510,533}}              // Mặc định: card-grid — mỗi SP vẫn là 1 Product Card dọc, xếp ngang hàng
  {{compare:482,510,533:layout=table}} // Ép thành 1 bảng ngang duy nhất, mỗi hàng là 1 sản phẩm
  ```
- Dữ liệu giá/tồn kho luôn lấy real-time tại thời điểm trang được ISR-render, không đóng băng theo lúc viết bài.
- Có thể kéo-thả đổi thứ tự sản phẩm ngay trong Editor.

#### d) Affiliate Disclosure Block
- **Mặc định tự động chèn** ở đầu mỗi bài mới (lấy từ nội dung công bố affiliate chuẩn cấu hình ở cấp site, tuân thủ yêu cầu FTC).
- Cho phép chỉnh sửa nội dung riêng cho từng bài nếu cần (override), nhưng **không cho xóa hẳn** nếu bài có chứa ít nhất 1 Product Card/Price Table/Comparison Grid — hệ thống tự kiểm tra và chặn ở Pre-publish Checklist (mục 3) nếu thiếu.

#### e) Chọn layout theo loại bài viết

| Loại bài | Layout khuyến nghị | Shortcode | Lý do |
|---|---|---|---|
| **Article** (blog thường, "cách chọn bàn đứng...") | Product Card **dọc**, xen giữa đoạn văn | `{{product:id}}` | Không phá nhịp đọc 1 cột dài (Body font Inter). Nếu cần chỉ ra sàn rẻ nhất cho sản phẩm đang nhắc → thêm `{{price-table:id}}` ngay dưới. |
| **Guide** (hướng dẫn từng bước) | Product Card **ngang**, sau mỗi bước | `{{product:id:layout=horizontal}}` | Chiếm ít chiều cao hơn, giữ nhịp hướng dẫn tuần tự, không bắt cuộn qua khối ảnh to giữa các bước. |
| **Comparison** — nhiều sản phẩm khác nhau (VD "Top 5 bàn đứng dưới $400") | Comparison Grid | `{{compare:id1,id2,id3}}` | Người đọc lướt ngang, so nhanh nhiều lựa chọn cùng lúc, mỗi SP vẫn giữ badge/giá tốt nhất riêng. |
| **Comparison** — 1 sản phẩm, nhiều sàn (VD review chuyên sâu 1 món) | Price Table | `{{price-table:id}}` | Đúng use-case gốc của `.price-table` — so giá 1 SP trên Amazon/Walmart/Target. |

---

### 6.2. Trang Tạo bài viết (Create Post) — `/admin/posts/new`

- **Cột trái (75% màn hình):** Toolbar (đã gồm nút chèn block Affiliate ở 6.1) + Editor.
- **Cột phải (Sidebar) gộp thành 3 Tab:**
  1. **"Cài đặt"**:
     - **Category** (chọn 1, không bắt buộc): Dropdown, cho phép "+ Tạo Category mới" ngay trong dropdown, không cần rời trang.
     - **Tags** (chọn nhiều, khuyến nghị 3-5 tag): Ô nhập dạng **Chip** — gõ từ khóa, bấm Enter để thêm thành chip.
       - **Auto-suggest** khi gõ từ 2-3 ký tự: hiện các Tag đã có sẵn kèm **số bài viết đang dùng** ngay trong dropdown gợi ý, để ưu tiên chọn tag cũ thay vì tạo tag gần giống (VD gõ "react" thấy gợi ý "React (12 bài)" thay vì tự tạo "reactjs" mới).
       - Bấm Enter khi không khớp gợi ý nào → tạo Tag mới ngay tại chỗ.
       - Dòng nhắc mềm dưới ô nhập: *"Nên dùng 3-5 thẻ để tối ưu SEO"* — chỉ nhắc, không chặn xuất bản nếu ít/nhiều hơn.
       - Tag dưới 2 ký tự: chỉ **cảnh báo nhẹ** ("Tag hơi ngắn, kiểm tra lại?"), không tự ẩn hay chặn cứng — vì niche desk-setup vẫn có tag hợp lệ ngắn như "4K", "TV", "3D".
       - **Lưu ý:** auto-suggest theo ký tự chỉ giảm thiểu trùng lặp gần giống, không tự phát hiện được từ đồng nghĩa hoàn toàn khác chữ (VD "React" vs "reactjs" đúng là bắt được vì chung tiền tố, nhưng "bàn đứng" vs "standing desk" thì không) — lưới an toàn cuối vẫn là tính năng Merge Tag ở `/admin/tags` (xem 6.2 bên dưới).
     - Ảnh đại diện, Người phụ trách (Assignee), Lịch hẹn giờ.
  2. **"SEO"** – Meta Title, Meta Desc, SERP preview, OG tags.
  3. **"Hỗ trợ AI"** – Gợi ý Outline, viết lại, sửa lỗi, FAQ, gợi ý Product/Comparison để chèn.
- **Thanh trạng thái đáy màn hình:**
  - Trạng thái Auto-save (VD: Đã lưu lúc 14:30).
  - Đếm từ, thời gian đọc.
  - **Nút bấm chính:** [Lưu nháp] – [Xem trước] – [Xuất bản ngay] (nổi bật màu xanh).
- **Hành vi Save:** xem quy tắc chung ở mục 6.5.
- **Quản lý Tag tập trung — `/admin/tags`:** mở cho **mọi thành viên** (không giới hạn theo vai trò Admin — team này không phân role, xem mục 4), gồm:
  - Danh sách toàn bộ Tag kèm số bài viết đang dùng.
  - **Gộp Tag (Merge):** chọn tag nguồn + tag đích → toàn bộ bài viết cũ tự chuyển sang tag đích, xóa tag nguồn.
  - Đổi tên 1 tag (áp dụng cho mọi bài đang gắn).
  - **Chủ động liệt kê Unused Tags** (0 bài viết) ở đầu trang để dọn nhanh, thay vì phải tự lọc thủ công.
  - Xem chi tiết Prisma schema ở mục 7 và spec kỹ thuật mục 13.5.

---

### 6.3. Trang Danh sách bài viết (List) — `/admin/posts`

Trang này **chưa có trong v1** — cần thiết vì team nhiều người viết song song, cần nơi quản lý tổng thể thay vì chỉ có trang tạo bài đơn lẻ.

- **Bảng danh sách** gồm cột: Tiêu đề, Trạng thái (badge màu theo mục 1), Category, Người phụ trách, Lượt xem, Cập nhật lần cuối, Hành động.
- **Cảnh báo trực quan trên từng dòng:** badge 🔴 nếu bài published đang chứa Product/Comparison có sản phẩm hết hàng (dựa vào bảng quan hệ `BlogPostProduct`, xem mục 7).
- **Bộ lọc:** theo Trạng thái, Category, Người phụ trách, khoảng thời gian.
- **Tìm kiếm:** theo tiêu đề hoặc slug.
- **Bulk actions:** chọn nhiều bài để xóa hàng loạt hoặc đổi Category hàng loạt.
- **Hành động trên từng dòng:** Sửa, Xem trước, Nhân bản (Duplicate — tạo bản Nháp mới copy toàn bộ nội dung + block), Xóa.
- **Nút "+ Tạo bài mới"** góc trên phải → điều hướng sang trang Create (6.2).
- Click vào tiêu đề bài → điều hướng sang trang Edit (6.4).

---

### 6.4. Trang Sửa bài viết (Edit Post) — `/admin/posts/[id]/edit`

- Tái sử dụng layout giống hệt trang Create (6.2), chỉ khác là load sẵn dữ liệu bài viết theo `id`.
- **Khác biệt so với Create:**
  - Tab "Cài đặt" có thêm mục **"Lịch sử chỉnh sửa"**: danh sách các revision, cho phép xem diff và khôi phục.
  - Có nút **"Nhân bản bài viết"** (Duplicate) ngay trong trang, không chỉ ở List.
  - Áp dụng cơ chế **Khóa bài viết (Lock)**: nếu người khác đang mở trang Edit của cùng bài, hiển thị banner "Đang được [Tên thành viên] chỉnh sửa" và chuyển giao diện sang chế độ chỉ xem.
- **Hành vi Save:** xem quy tắc chung ở mục 6.5.

---

### 6.5. Nguyên tắc Save → Redirect (áp dụng cho toàn hệ thống)

Thay vì lưu tại chỗ bằng AJAX + toast, mọi thao tác Save trong khu vực quản trị (Create, Edit, và các trang quản lý Category/Tag sau này) đều **redirect full-page** sau khi lưu thành công, đảm bảo dữ liệu hiển thị luôn là bản mới nhất từ server (phù hợp với Next.js App Router Server Actions + `redirect()`).

| Trang | Hành động | Redirect đến |
|---|---|---|
| Create | Lưu nháp (lần đầu, bài chưa có ID) | Trang Edit của bài vừa tạo (`/admin/posts/[id]/edit`) — để các lần lưu sau là cập nhật (PATCH), tránh tạo trùng bản ghi |
| Edit | Lưu nháp (các lần tiếp theo) | Tự redirect lại chính trang Edit đó (kèm banner "Đã lưu lúc HH:mm") |
| Edit | Cập nhật & Xuất bản | Trang Danh sách (`/admin/posts`), kèm banner thành công "Đã xuất bản: [tiêu đề]" |
| Edit | Hẹn giờ xuất bản | Trang Danh sách, banner "Đã lên lịch: [tiêu đề] — [ngày giờ]" |
| Edit | Xóa bài | Trang Danh sách, banner "Đã xóa: [tiêu đề]" |
| List | Nhân bản (Duplicate) | Trang Edit của bản sao mới tạo |
| Tags (`/admin/tags`) | Đổi tên / Gộp / Xóa tag | Tự redirect lại trang `/admin/tags`, kèm banner kết quả |
| Create / Edit | Hủy (Cancel), không lưu | Trang Danh sách |

---

## 7. ĐỀ XUẤT CẬP NHẬT PRISMA SCHEMA

Model `BlogPost` hiện tại trong `DESKHOLT_FULL_SPECIFICATION.md` chỉ có các trường cơ bản (`slug, title, content, excerpt, featuredImage, author, publishedAt, isPublished, views`) — **chưa đủ chỗ lưu** cho Category/Tags/SEO/Assignee/Lock mà UI ở trên yêu cầu, và chưa có bảng quan hệ nào để hệ thống biết một bài blog đang tham chiếu tới sản phẩm nào (phục vụ cảnh báo hết hàng ở mục 6.1/6.3).

Đề xuất bổ sung như sau (giữ nguyên các model đã có trong spec kỹ thuật, chỉ thêm/sửa phần liên quan blog):

```prisma
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
  blogPosts   BlogPost[]   // ⬅️ MỚI — tái dùng chung Category cho cả Product và Blog

  @@index([slug])
}

model Tag {
  id        Int        @id @default(autoincrement())
  slug      String     @unique
  name      String

  blogPosts BlogPost[] // implicit many-to-many

  @@index([slug])
}

model BlogPost {
  id                Int       @id @default(autoincrement())
  slug              String    @unique
  title             String
  content           String              // Markdown, có thể chứa shortcode {{product:id}} / {{compare:ids}}
  excerpt           String?
  featuredImage     String?
  author            String?
  assignee          String?             // ⬅️ MỚI — "Người phụ trách", chỉ cần tên vì không có bảng User riêng
  categoryId        Int?                // ⬅️ MỚI
  publishedAt       DateTime?
  isPublished       Boolean   @default(false)
  views             Int       @default(0)

  // ⬅️ MỚI — SEO & Open Graph
  metaTitle         String?
  metaDesc          String?
  ogTitle           String?
  ogDesc            String?
  ogImage           String?
  canonicalUrl      String?

  // ⬅️ MỚI — Affiliate compliance
  disclosureOverride String?           // null = dùng disclosure mặc định của site

  // ⬅️ MỚI — Khóa bài viết khi đang chỉnh sửa
  lockedBy          String?
  lockedAt          DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  category          Category?           @relation(fields: [categoryId], references: [id])
  tags              Tag[]
  products          BlogPostProduct[]   // ⬅️ MỚI — sản phẩm được nhắc tới trong bài (Product Card/Comparison)
  revisions         BlogPostRevision[]  // ⬅️ MỚI

  @@index([slug])
  @@index([publishedAt])
  @@index([isPublished])
  @@index([categoryId])
}

// ⬅️ MỚI — bảng quan hệ để biết bài nào đang nhắc sản phẩm nào,
// phục vụ cảnh báo hết hàng ở trang List (6.3) và Pre-publish Checklist (mục 3)
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

// ⬅️ MỚI — lưu snapshot nội dung để xem diff/khôi phục (mục 1 & 6.4)
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

**Lưu ý khi migrate:**
- `Product` model (đã có sẵn) cần thêm quan hệ ngược `blogMentions BlogPostProduct[]` để Prisma tạo được relation hai chiều.
- `categoryId` trên `BlogPost` để `Int?` (optional) vì bài blog không bắt buộc phải gắn Category ngay từ đầu.
- Bảng `BlogPostRevision` nên có cơ chế dọn dẹp định kỳ (giữ ví dụ 20 bản gần nhất/bài) để tránh phình DB, vì auto-save chạy mỗi vài giây.

---

## 8. LUỒNG LÀM VIỆC TINH GỌN

1. **Tạo mới** (từ trang List hoặc trực tiếp `/admin/posts/new`) → Mặc định là **Nháp**, lưu nháp lần đầu sẽ redirect sang trang Edit (mục 6.5).
2. **Viết và chỉnh sửa** với sự trợ giúp của AI, chèn Product Card/Comparison Table khi cần, và checklist tự động (mục 3).
3. **Xem trước** để kiểm tra giao diện thật (header/footer/sidebar) trước khi xuất bản.
4. **Xuất bản ngay hoặc lên lịch** – không qua bước duyệt → redirect về trang Danh sách.
5. **Theo dõi tại trang Danh sách:** nắm tình trạng tất cả bài viết của team, bao gồm cảnh báo sản phẩm hết hàng trong bài đã published.
6. **Sau xuất bản** – AI gợi ý nội dung đăng mạng xã hội.

---

## 9. KẾT LUẬN

Với team 2-3 người tự viết tự đăng cho một **Affiliate Hub**, mục tiêu là:
- **Tối giản quy trình** – xóa bỏ mọi bước duyệt không cần thiết, quản lý Save/Redirect nhất quán trên toàn hệ thống.
- **Tối đa hỗ trợ** – dùng AI và checklist để tự động kiểm tra chất lượng nội dung lẫn tuân thủ affiliate (disclosure, hàng hết hàng).
- **Gắn chặt với dữ liệu sản phẩm** – nội dung blog không tách rời khỏi DB `Product`/`AffiliateLink`, tránh tình trạng bài viết "chết" vì giá/tồn kho lỗi thời.
- **Linh hoạt & cộng tác** – khóa bài viết khi đang sửa, phân công người phụ trách rõ ràng, có trang Danh sách để quản lý tổng thể thay vì chỉ có trang tạo bài đơn lẻ.

Bản v2 này có thể dùng làm tài liệu tham khảo để xây dựng giao diện hoặc viết PRD chi tiết hơn cho dự án, đi kèm migration Prisma ở mục 7.
