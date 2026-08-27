**TỔNG HỢP ĐỊNH HƯỚNG**

**AFFILIATE MARKETING**

**Deskholt.com & Steadylifeaids.com**

*Bản rà soát & chỉnh sửa — tháng 8/2026*

*Các đoạn có khung màu vàng là nội dung được cập nhật/sửa lại; khung màu đỏ là rủi ro cần chú ý.*

# **Mục lục**

1. Định hướng chiến lược tổng thể

2. Hai dự án đã chốt

3. Kiến trúc kỹ thuật đã thống nhất (đã sửa mục crawl Amazon + bổ sung backup/giám sát)

4. Cấu trúc trang & Database (Deskholt.com)

5. Chiến lược nội dung (Programmatic SEO)

6. Pháp lý & compliance

7. Affiliate networks nên dùng

8. Roadmap 6 giai đoạn (đã sửa mục Giai đoạn 3)

9. Cài đặt Review Schema trên Next.js

10. Quy trình xây dựng Topic Cluster cho SEO 2026

11. Quy trình xuất bản bài viết chuẩn SEO/AEO (6 bước)

12. Chiến lược SEO tổng thể (3 trụ cột)

13. Soft Launch — Quy trình vận hành thử

14. ISR trên Next.js

15. Sitemap Index — Tối ưu Crawl Budget

16. Affiliate Media Kit

17. Bổ sung: robots.txt cho AI Crawler

Bảng kiểm tra hoàn chỉnh

# **1. Định hướng chiến lược tổng thể**

Chuyển từ mô hình affiliate đơn giản (video AI → link trực tiếp) sang mô hình chuyên nghiệp full-stack:

**SEO Google (traffic) → Web Affiliate Hub (DB + crawl giá + content) → Link Tracking Engine (Redis/SubID) → Link sàn**

Mục tiêu: xây tài sản số dài hạn (Owned Media), traffic thụ động từ SEO thay vì phải sản xuất video liên tục. Kênh video AI (theo bài hướng dẫn ban đầu trên X) không bị bỏ — nó chạy song song như nguồn traffic ngắn hạn nuôi dòng tiền trong lúc chờ SEO lên (3-6 tháng đầu), đồng thời giúp "nuôi" đủ 3 đơn hàng Amazon Associates trong 180 ngày đầu (xem mục 6).

|  |
| --- |
| **✎ Nhận xét**  Định hướng tổng thể (SEO dài hạn + video AI ngắn hạn) là hợp lý và không cần sửa. Vấn đề nằm ở các mục kỹ thuật/pháp lý cụ thể phía sau — xem các khung màu vàng/đỏ trong các mục 3, 6 và 8. |

# **2. Hai dự án đã chốt**

## **Site 1 — Deskholt.com (niche chính, làm trước)**

* Niche: Home-office / desk setup — bàn, ghế, đèn, tổ chức cáp, phụ kiện màn hình
* Eco-friendly = tag/thuộc tính lọc trong cùng database, không tách site riêng (vì cùng đối tượng + cùng intent tìm kiếm)
* Cấu trúc trang: Category pages, Blog/Guides, Collections (eco filter), Legal pages
* Catalog tiềm năng: 1000+ SKU — đủ dày để nuôi cả hệ thống pSEO

## **Site 2 — Steadylifeaids.com (làm sau, khi Site 1 ổn định)**

* Niche: Accessibility & Independent Living — 2 category chính: Mobility Aids (walker, xe lăn, tay vịn) + Caregiver Tools (cảm biến té ngã, báo động y tế)
* Senior Wellness = audience segment/tag lọc cắt ngang cả 2 category, không phải category riêng
* Tách biệt hoàn toàn khỏi Site 1 (khác đối tượng/intent — nguyên tắc: khác đối tượng/intent thì phải tách site, dù nghe "liên quan" đến đâu)
* Sẽ tái sử dụng gần như nguyên bản hạ tầng đã xây cho Site 1

**Nguyên tắc chọn niche rút ra:** cái gì cùng đối tượng + cùng intent tìm kiếm với niche chính → làm tag/filter trong site đó (Eco-friendly). Cái gì khác đối tượng/intent → phải tách site riêng (Pet Tech, Senior Wellness), dù nghe liên quan đến niche chính đến đâu.

# **3. Kiến trúc kỹ thuật đã thống nhất**

| **Lớp** | **Công nghệ** | **Lý do** |
| --- | --- | --- |
| Frontend + Backend | Next.js (App Router), gộp full-stack | SSR/ISR tốt cho SEO |
| Database | PostgreSQL tự host trên VPS (Docker) | Quan hệ tốt cho sản phẩm, giá, click log |
| Cache/Queue | Redis tự host trên VPS (Docker) | Xử lý click log bất đồng bộ, redirect nhanh |
| Hosting | VPS tại Mỹ (US), Next.js chạy qua PM2 + Nginx reverse proxy | Gần khách hàng Mỹ, tự chủ hạ tầng, không phụ thuộc Vercel |
| CDN/Edge | Cloudflare (free tier) | Cache tĩnh tại edge cho traffic đa vùng, DDoS protection, có thể dùng Cloudflare Workers cho redirect nhanh nếu cần sau này |
| Crawler | Node.js script chạy cron riêng | Không còn giới hạn thời gian như serverless, đơn giản hoá do không cần server riêng |

**Link Tracking Engine:** route /go/:slug?network=X — hỗ trợ nhiều sàn cho cùng 1 sản phẩm (kiểu PCPartPicker so sánh giá đa sàn), ghi click vào Redis Queue trước (redirect nhanh <200ms), worker nền xử lý ghi Postgres sau, đối soát qua postback API của từng affiliate network.

## **Chuẩn hoá dữ liệu sản phẩm đa sàn (Entity Matching)**

Để bảng so sánh giá đa sàn hoạt động đúng (Bàn A trên Amazon = Bàn A trên Walmart/Target), cần cơ chế ghép sản phẩm dựa vào mã UPC/EAN (hoặc vector similarity search khi không có mã chung) để nhóm các SKU tương đồng từ nhiều sàn vào 1 product\_id duy nhất — nếu không có bước này, bảng so sánh giá sẽ hiển thị sai hoặc trùng lặp sản phẩm.

## **Chiến lược crawl Amazon: giai đoạn hoá theo điều kiện**

|  |
| --- |
| **⚠ CẬP NHẬT QUAN TRỌNG (đã lỗi thời trong bản gốc)**  Amazon đã chính thức ngừng hoạt động PA-API (Product Advertising API) từ 15/5/2026, thay bằng Creators API mới.  Creators API yêu cầu tài khoản duy trì tối thiểu 10 đơn hàng hợp lệ trong mọi khung 30 ngày liên tục (không phải một lần đủ điều kiện là xong) — khó hơn đáng kể so với mốc "3 đơn/180 ngày" của mục 6, và nếu tụt dưới mốc này 30 ngày liên tiếp, quyền truy cập bị tạm ngưng.  Vì vậy kế hoạch "crawl HTML thận trọng trong lúc chưa đủ điều kiện API" cần bỏ đối với Amazon cụ thể — crawl/scrape trực tiếp trang Amazon vi phạm Điều khoản sử dụng của Amazon và có thể khiến tài khoản Associates bị khoá, rủi ro lớn hơn lợi ích ở quy mô 100-200 sản phẩm ban đầu. |

Khuyến nghị điều chỉnh:

* Giai đoạn đầu (100-200 sản phẩm): nhập tay dữ liệu Amazon (giá, ảnh, thông số) — không crawl HTML trực tiếp trang Amazon.
* Khi đã ổn định traffic + có ngân sách nhỏ: có thể dùng API dữ liệu Amazon của bên thứ ba (VD Canopy API, Rainforest API...) cho việc lấy giá/tồn kho tự động mà không vi phạm ToS trực tiếp của Amazon, thay cho việc tự scrape.
* Chỉ đăng ký Amazon Creators API khi đã duy trì ổn định ≥10 đơn hàng hợp lệ/30 ngày — coi đây là mục tiêu của Giai đoạn 3-4 (sau khi traffic đã lớn), không phải mục tiêu ngắn hạn như bản gốc kỳ vọng.
* Với Walmart/Target: nên ưu tiên lấy dữ liệu qua feed/API chính thức của Impact network (nếu có) hơn là tự crawl HTML, để tránh rủi ro ToS tương tự.

## **Xử lý sản phẩm hết hàng**

Trong bảng affiliate\_links, thêm field is\_in\_stock (boolean). Khi crawler phát hiện 1 sàn hết hàng, Next.js Middleware tự động ưu tiên chuyển /go/:slug sang sàn còn hàng khác (Walmart/Target) thay vì đẩy người dùng vào trang lỗi.

## **Schema database cập nhật**

* **products:** thêm upc\_code (ghép SKU đa sàn), user\_sentiment JSONB (insight review tổng hợp từ LLM), is\_indexed (theo dõi trạng thái index Google)
* **affiliate\_links:** thêm is\_in\_stock, priority\_order (ưu tiên sàn hoa hồng cao hơn)
* **clicks:** thêm us\_state (phân tích traffic theo bang Mỹ)

## **Backup & giám sát hạ tầng (bổ sung — bản gốc chưa có)**

|  |
| --- |
| **✎ Thiếu trong kế hoạch gốc**  Toàn bộ dữ liệu sản phẩm, click, conversion của cả 2 site đều nằm trên 1 VPS duy nhất — nếu VPS gặp sự cố (hỏng ổ đĩa, bị hack, xoá nhầm), toàn bộ dữ liệu doanh thu/đối soát có thể mất vĩnh viễn. Bản gốc chưa đề cập gì đến backup hoặc giám sát. |

* Backup Postgres tự động (pg\_dump) hàng ngày, đẩy ra nơi lưu trữ ngoài VPS (VD: Cloudflare R2 hoặc Backblaze B2) — không lưu backup trên chính VPS đó.
* Uptime monitoring miễn phí (UptimeRobot/BetterStack) để biết ngay khi site hoặc route /go/:slug bị down — vì route này ảnh hưởng trực tiếp doanh thu.
* Error tracking cơ bản (Sentry free tier) cho Next.js để phát hiện lỗi runtime trước khi ảnh hưởng nhiều user.
* Test khôi phục backup ít nhất 1 lần trước khi scale lên nhiều traffic, để chắc chắn quy trình restore thực sự chạy được.

# **4. Cấu trúc trang & Database (Deskholt.com)**

Steadylifeaids.com áp dụng cùng mẫu cấu trúc, chỉ đổi category (Mobility Aids / Caregiver Tools thay cho Category pages theo niche desk).

## **Sitemap tổng thể**

|  |
| --- |
| Trang chủ (/)  ├── /category/[category-slug] (VD: /category/standing-desks)  │ └── /products/[slug] (Trang review + so sánh giá đa sàn)  ├── /collections/sustainable-desk-setup (Eco-friendly, lọc theo tag)  ├── /best-home-office-setup-under-500 (Bài listicle)  ├── /blog  │ └── /blog/[slug]  ├── /about  ├── /affiliate-disclosure  ├── /privacy-policy  └── /terms-of-service |

## **Trang chủ (/)**

* Banner disclosure (dòng nhỏ, sticky trên đầu)
* Header: Logo | Nav (Categories, Collections, Blog, About)
* Hero: tiêu đề + mô tả ngắn về niche home-office
* Grid category cards (Standing Desks, Chairs, Lighting, Cable...)
* Section: link tới bài listicle "Complete Setup Under $500"
* Footer: Privacy | Terms | Disclosure

## **Trang danh mục (/category/[slug])**

* Breadcrumb: Home > Category > [Tên danh mục]
* Tiêu đề danh mục + mô tả ngắn
* Bộ lọc: Eco-friendly (tag), khoảng giá, rating
* Grid sản phẩm: [Ảnh] [Tên] [Giá thấp nhất đa sàn] [Rating]

## **Trang sản phẩm (/products/[slug]) — khác PetPosture: có bảng so sánh đa sàn**

* Breadcrumb: Home > Category > [Tên sản phẩm]
* Tên sản phẩm + ảnh lớn
* Bảng so sánh giá đa sàn: Amazon $XX / Walmart $XX / Target $XX, mỗi dòng có nút Buy Now → /go/:slug?network=...
* Mô tả ngắn (2-3 câu) + Ưu điểm / Nhược điểm (bullet)
* Review đầy đủ (~600 từ) + Sentiment thật (Reddit/Amazon, Giai đoạn 3)
* Interactive Calculator liên quan (nếu có, VD: Desk Height Calculator)
* Sản phẩm liên quan (3-4 card)

## **Trang listicle (/best-home-office-setup-under-500)**

* Tiêu đề bài + intro ngắn
* Mục lục (jump link tới từng sản phẩm)
* Sản phẩm #1, #2, #3... : ảnh + mô tả ngắn + nút mua
* Kết luận + CTA quay lại trang chủ

## **Luồng dữ liệu**

|  |
| --- |
| Crawler (giá đa sàn, theo lịch) --> PostgreSQL  PostgreSQL --> Next.js API routes --> Next.js frontend (SSR/ISR)    User click Buy Now --> /go/:slug?network=X  --> ghi click\_id vào Redis Queue (async) --> HTTP 302 redirect ngay  --> worker nền đọc Redis Queue --> ghi bảng clicks (Postgres)  --> postback từ network --> match click\_id --> ghi bảng conversions |

## **Database schema (đã hợp nhất từ mục 3)**

* **products:** id, name, slug, category, image\_url, specs (JSONB), upc\_code, user\_sentiment (JSONB), is\_indexed, is\_sustainable, created\_at
* **affiliate\_links:** id, product\_id, network, price, raw\_url, tracking\_url, is\_in\_stock, priority\_order, last\_crawled\_at — mỗi sản phẩm có nhiều dòng, 1 dòng/sàn, nên giá nằm ở đây chứ không phải ở products
* **clicks:** id, click\_id (UUID), product\_id, network, source\_page, ip\_hash, user\_agent, us\_state, created\_at
* **conversions:** id, click\_id, order\_value, commission, status, matched\_at

# **5. Chiến lược nội dung (Programmatic SEO)**

## **5.1. Programmatic SEO (pSEO) — Tạo quy mô**

Không viết tay từng bài. Quy trình:

* Crawler lấy dữ liệu sản phẩm (tên, giá, ảnh, thông số, review count) theo lịch (VD: mỗi 24h)
* Dùng LLM (Claude API) sinh nội dung theo template chuẩn hoá: intro, so sánh, pros/cons, FAQ — nhúng dữ liệu thật từ DB, tránh nội dung trùng lặp hàng loạt (Google phạt "thin/duplicate content" nếu chỉ đổi tên sản phẩm)
* Gắn Schema.org (Product, Review, FAQPage) để lên rich snippet
* Ưu tiên các trang dạng "best X for Y" và "X vs Y" — đây là intent mua hàng cao, dễ rank hơn brand keyword
* Tích hợp IndexNow API (Bing/Yahoo) và Sitemap Tầng (mỗi sitemap 200–500 URL) để tối ưu Crawl Budget khi số lượng trang scale lên hàng nghìn

## **5.2. Lớp dữ liệu độc bản — chống "Thin Affiliate Content"**

Rủi ro lớn nhất của pSEO là bị Google xếp vào nhóm nội dung rác/tự động hoá thiếu giá trị. Hai cách bổ sung giá trị thật:

* **Interactive Tools:** dựng widget động đơn giản như "Desk Height Calculator" hoặc "Setup Budget Calculator" — vừa thu hút backlink vừa tạo uy tín với Google. Triển khai ở Giai đoạn 2 của roadmap (mục 8), cùng lúc với việc scale trang.
* **Sentiment tổng hợp từ review thật:** thu thập review thật trên Reddit/Amazon, dùng LLM trích xuất insight kiểu "82% người mua phàn nàn về hướng dẫn lắp ráp khó" thay vì để AI tự chém Pros/Cons. Triển khai ở Giai đoạn 3, sau khi đã có đủ số lượng trang/sản phẩm.

Lưu ý quan trọng: pSEO cần traffic organic từ 3-6 tháng mới thấy kết quả rõ (Google cần index + trust site mới). Đừng kỳ vọng doanh thu ngay như video.

# **6. Pháp lý & compliance (bắt buộc nếu nhắm US)**

* Trang Affiliate Disclosure, Privacy Policy, Terms of Service — thiếu là rủi ro bị Amazon Associates từ chối/khoá tài khoản
* Câu disclosure ngắn ở đầu mỗi bài viết/landing page: "As an affiliate, I may earn a commission from qualifying purchases at no extra cost to you."
* Trên Social Media (TikTok/Reels/Shorts): caption bắt buộc chứa hashtag công khai như #ad, #affiliate, #commissionsearned — thiếu dễ bị khoá tài khoản
* Nếu nhận thanh toán quốc tế: chuẩn bị Payoneer/Wise + form W-8BEN để tránh bị giữ 30% thuế
* **CCPA (California):** ngoài Disclosure và Privacy Policy, cần thêm Cookie Consent Banner và link footer "Do Not Sell My Personal Information" cho người dùng ở California

## **Rủi ro quy tắc 180 ngày của Amazon Associates**

Amazon yêu cầu tài khoản mới đạt 3 đơn hàng hợp lệ (3 checkout riêng biệt, không tính nhiều sản phẩm trong 1 đơn) trong vòng 180 ngày kể từ khi đăng ký, nếu không tài khoản bị đóng vĩnh viễn và phải đăng ký lại từ đầu, không có ngoại lệ. Vì SEO cần 3-6 tháng mới có traffic organic, không thể chỉ trông chờ SEO để đạt mốc này — cần dùng kênh video AI (đăng nội dung, chia sẻ link Amazon Associates thường) để kéo traffic sớm ngay từ tháng đầu, đủ tạo 3 đơn hàng trước khi tài khoản bị đóng.

|  |
| --- |
| **Lưu ý phân biệt hai mốc khác nhau**  "3 đơn/180 ngày" ở trên là điều kiện để tài khoản Amazon Associates không bị đóng — vẫn đúng và không đổi.  "≥10 đơn/30 ngày liên tục" (mục 3) là điều kiện riêng, khó hơn, chỉ áp dụng khi muốn dùng Amazon Creators API để tự động lấy giá — hai mốc này độc lập với nhau, không nên nhầm lẫn khi lên kế hoạch. |

## **Quyết định: không mở US LLC, không dùng TikTok Shop Affiliate chính thức**

Lý do:

* Rào cản xác minh KYC mang tính cấu trúc: chủ sở hữu nước ngoài không có địa chỉ cư trú thật tại Mỹ bị vướng ở bước xác minh chủ sở hữu hưởng lợi (UBO) — địa chỉ ảo/virtual mailbox không được chấp nhận, và đây là vấn đề không thể sửa chỉ bằng cách điền form khác
* US LLC không đảm bảo giải quyết được vấn đề trên — nhiều chủ LLC hợp lệ (có EIN đầy đủ) vẫn bị từ chối vì thiếu địa chỉ cư trú Mỹ thật
* Chi phí/công sức không tương xứng lợi ích ở quy mô hiện tại: phí duy trì LLC (~300-500 USD/năm + registered agent) trong khi các network chính đã dùng (Amazon Associates qua W-8BEN, Awin, Impact, CJ Affiliate) đều chấp nhận cá nhân nước ngoài, không cần pháp nhân Mỹ
* Đã có phương án thay thế không tốn chi phí/rủi ro: vẫn dùng TikTok làm kênh nội dung, chia sẻ link Amazon Associates thường trong video/bio (không phải TikTok Shop Affiliate) — vẫn đạt mục tiêu kéo traffic sớm cho quy tắc 180 ngày ở trên
* TikTok Shop vốn không hợp với niche Steadylifeaids (đối tượng mua cần độ tin cậy, không phải mua bốc đồng), nên việc bỏ TikTok Shop Affiliate chỉ ảnh hưởng Deskholt, và Deskholt đã có phương án thay thế ở điểm trên

# **7. Affiliate networks nên dùng**

| **Network** | | **Deskholt** | **Steadylifeaids** | |
| --- | --- | --- | --- | --- |
| Amazon Associates | | ✓ (bắt buộc) | ✓ (bắt buộc) | |
| Awin (đã gồm ShareASale từ 2025) | | ✓ | ✓ | |
| Impact | | ✓ | ✓ | |
| CJ Affiliate | | ✓ (khi có traffic) | ✓ (khi có traffic) | |
| Walmart Affiliate | | ✓ | ✓ (ưu tiên cao) | |
| Target Partners (qua Impact) | | ✓ | ✓ | |
| TikTok Shop Affiliate | | Không dùng (mục 6) | Không dùng | |
| AliExpress | | Cân nhắc kỹ (rủi ro uy tín) | Không dùng (rủi ro an toàn) | |
| ClickBank | | Không liên quan (chỉ hàng số) | Không liên quan | |
| **Đã kiểm tra lại (8/2026)**  Target vừa ra mắt thêm "Club Target" và "Target Ambassadors" (chương trình creator, tính điểm/quà thay vì hoa hồng tiền, qua LTK) từ 5/2026 — đây là chương trình khác, KHÔNG thay thế Target Partners. Target Partners qua Impact vẫn hoạt động bình thường, thông tin trong bản gốc là đúng và vẫn hợp lệ tại thời điểm này.  Walmart Affiliate qua Impact vẫn hoạt động bình thường trong 2026, không có thay đổi cần lưu ý. | | |

## **Ghi chú từng network**

* **Amazon Associates:** hoa hồng 1-10% tuỳ danh mục, đồ gia dụng/hàng ngày ~3-4%. Cookie 24h — không nên coi là chiến lược dài hạn duy nhất, nhưng tốt để bắt impulse-buy từ traffic long-tail
* **Awin (gồm ShareASale):** network trung gian lớn nhất cho physical products, tiếp cận nhiều ngành cùng lúc
* **Impact:** dashboard hiện đại, nhiều brand DTC — hợp với Deskholt vì nhiều hãng bàn/ghế DTC (Fully, Uplift, Autonomous...) dùng Impact thay vì Amazon
* **CJ Affiliate:** hoa hồng cao khi hợp tác brand lớn, nhưng cần traffic ổn định mới dễ được duyệt — để dành giai đoạn sau
* **Walmart Affiliate:** qua network Impact (giống Target Partners, không cần đăng ký tài khoản riêng), catalog nội thất/mobility aids cơ bản tầm trung lớn, giá đôi khi rẻ hơn Amazon cho cùng sản phẩm — bổ sung tốt cho bảng so sánh giá đa sàn kiểu PCPartPicker, đặc biệt hữu ích cho Steadylifeaids vì đối tượng mua (con cái mua cho cha mẹ già) nhạy cảm về giá
* **Target Partners:** qua network Impact (cùng network đã dùng, không cần đăng ký thêm), hoa hồng lên đến 8%, cookie 7 ngày (dài hơn đáng kể so với 24h của Amazon — lợi thế cho traffic SEO vì người đọc bài so sánh giá thường không mua ngay). Lưu ý: cần đăng ký đúng chương trình "Target Partners" (link-based affiliate qua Impact), không phải "Club Target" (chương trình creator tính điểm thưởng, không phải hoa hồng tiền mặt)
* **TikTok Shop Affiliate:** không dùng — xem lý do đầy đủ ở mục 6. Vẫn dùng TikTok làm kênh đăng nội dung dẫn traffic tới link Amazon Associates thường
* **AliExpress:** hàng giá rẻ, thời gian giao lâu, độ tin cậy thương hiệu thấp hơn Amazon — cân nhắc kỹ với Deskholt (ảnh hưởng định vị "curated, thiết kế nghiêm túc"), không dùng cho Steadylifeaids (rủi ro an toàn sản phẩm y tế)
* **ClickBank:** chủ yếu sản phẩm số (ebook, khoá học), không có crawl giá đa sàn — không liên quan đến 2 dự án vật lý hiện tại. Chỉ đáng cân nhắc nếu sau này mở site nội dung số riêng biệt

## **Khuyến nghị thứ tự đăng ký**

**1.** Amazon Associates trước — dễ được duyệt nhất, có ngay để test hệ thống Link Tracking Engine.

**2.** Awin — mở rộng catalog, đặc biệt hợp với các brand thiết kế/nội thất.

**3.** Impact — khi site đã có vài trang/traffic ban đầu, dễ được các brand DTC duyệt hơn site trắng tay (Walmart Affiliate và Target Partners cũng đăng ký qua đây, không cần tài khoản riêng).

**4.** CJ Affiliate — để dành khi site đã chứng minh được traffic, vì CJ thường yêu cầu xét duyệt kỹ hơn.

Vì cả các network đều miễn phí tham gia, không có gì cản trở đăng ký song song ngay từ đầu — chỉ cần lưu ý code /go/:slug?network=X cần hỗ trợ đúng format link tracking riêng của từng network (mỗi network có cấu trúc SubID khác nhau).

# **8. Roadmap 6 giai đoạn (làm tuần tự, không song song)**

Sơ đồ cấu trúc trang cho Site 1 — Deskholt.com (Home-office), site ưu tiên làm trước:

![](data:image/png;base64...)

Site 2 — Accessibility & Independent Living (Steadylifeaids.com), cấu trúc song song nhưng đối tượng/danh mục khác hẳn, không lồng vào Site 1:

![](data:image/png;base64...)

Ghi chú sơ đồ Site 2: "Senior Wellness" không xuất hiện thành khối riêng — nó là tag lọc cắt ngang cả 2 khối Mobility Aids và Caregiver Tools, tương tự cách "Eco-friendly" đóng vai trò tag trong Site 1.

## **Giai đoạn 0 — Chuẩn hoá hạ tầng Site 1 (Tuần 1-2)**

* Convert Deskholt từ static HTML sang Next.js + PostgreSQL + Redis tự host trên VPS (US, Docker Compose), cấu hình Nginx reverse proxy + PM2, trỏ domain
* Dựng route /go/:slug cơ bản (chưa cần postback), đo latency redirect

## **Giai đoạn 1 — Database + Crawler Site 1 (Tháng 1)**

* Nhập tay 100-200 sản phẩm đầu (xem lưu ý mục 3 — không crawl HTML trực tiếp Amazon), thêm field is\_in\_stock, upc\_code
* Thêm field is\_sustainable cho collection Eco-friendly filter
* Viết 5-10 bài Blog/Guides mẫu (template so sánh, hướng dẫn setup)
* Bắt đầu chạy kênh video AI song song, chia sẻ link Amazon Associates thường (mục 6 — nuôi 3 đơn hàng trong 180 ngày)

### **Quy trình chi tiết Giai đoạn 1**

**Bước 1 — Hạ tầng VPS & Cloudflare (Ngày 1-2)**

**1.** Thuê VPS tại Mỹ (Hetzner / DigitalOcean / Vultr), tối thiểu 2 vCPU / 4GB RAM, Ubuntu 22.04 LTS

**2.** Cài Docker + Docker Compose, cấu hình firewall (ufw) chỉ mở port 22, 80, 443

**3.** Viết docker-compose.yml chạy PostgreSQL 16 + Redis 7 trên cùng VPS

**4.** Trỏ domain Deskholt.com qua Cloudflare: thêm DNS A record về IP VPS, bật proxy Cloudflare, cấu hình SSL/TLS ở chế độ Full (Strict)

**5.** Thiết lập cron backup PostgreSQL ra lưu trữ ngoài VPS ngay từ bước này (xem mục 3) — dễ bị bỏ quên nếu để lại làm sau

**Bước 2 — Khởi tạo Next.js & Database (Ngày 3-5)**

**1.** Khởi tạo project Next.js (App Router, TypeScript, Tailwind)

**2.** Cài Prisma làm ORM, kết nối tới PostgreSQL trên VPS

**3.** Định nghĩa schema products, affiliate\_links, clicks, conversions theo đúng mục 4

**4.** Chạy migration đầu tiên, kiểm tra kết nối DB từ Next.js API route

**Bước 3 — Nhập dữ liệu sản phẩm (Ngày 5-10)**

**1.** Nhập tay 100-200 sản phẩm qua script seed (chưa cần admin panel đầy đủ ở giai đoạn này)

**2.** Mỗi sản phẩm: lấy link Amazon Associates, ảnh, category, mô tả ngắn

**3.** Đánh dấu is\_sustainable = true cho sản phẩm thuộc collection Eco-friendly

**4.** Bổ sung upc\_code nếu nguồn dữ liệu có sẵn, để chuẩn bị cho Entity Matching sau này

**Bước 4 — Link Tracking Engine (Ngày 10-14)**

**1.** Viết Next.js Middleware xử lý /go/:slug?network=X

**2.** Middleware ghi click\_id (UUID) vào Redis trước, sau đó redirect 302 ngay tới link kèm SubID — không chờ ghi Postgres

**3.** Viết worker Node.js riêng (chạy nền qua PM2) đọc dữ liệu từ Redis theo chu kỳ, ghi vào bảng clicks

**4.** Test đo latency thực tế của toàn luồng, mục tiêu dưới 200ms

**Bước 5 — Nội dung & Đăng ký pháp lý (Ngày 14-25)**

**1.** Viết 5-10 bài Blog/Guides mẫu bằng Claude API theo template chuẩn hoá (mục 5)

**2.** Đăng ký Amazon Associates, điền form thuế W-8BEN ngay lúc đăng ký

**3.** Chuẩn bị 3 trang pháp lý bắt buộc: Affiliate Disclosure, Privacy Policy, Terms of Service

**4.** Bắt đầu đăng nội dung trên kênh video AI, chia sẻ link Amazon Associates thường để nuôi 3 đơn hàng trong 180 ngày (mục 6)

**Bước 6 — Deploy production (Ngày 25-30)**

**1.** Build Next.js bản production, chạy qua PM2 (cluster mode để tận dụng nhiều core)

**2.** Cấu hình Nginx làm reverse proxy trỏ về Next.js

**3.** Kiểm tra SSL hoạt động đúng qua Cloudflare, đo tốc độ tải trang từ vài vùng khác nhau ở Mỹ

**4.** Kiểm tra lại toàn bộ route /go/:slug trên môi trường production trước khi công bố site

**5.** Bật uptime monitoring (UptimeRobot/BetterStack) trước khi công bố site, không phải sau (mục 3)

## **Giai đoạn 2 — pSEO mở rộng Site 1 (Tháng 2)**

* Scale lên 500-1000+ trang sản phẩm/category, gắn Schema.org
* Submit sitemap qua IndexNow API + Sitemap Tầng, theo dõi index rate qua Google Search Console
* Dựng Interactive Calculator (Desk Height Calculator, Setup Budget Calculator) để chống thin-content

## **Giai đoạn 3 — Đối soát & tối ưu Site 1 (Tháng 3)**

|  |
| --- |
| **✎ Đã cập nhật theo mục 3**  Bản gốc: "Chuyển sang Amazon PA-API chính thức nếu đã đủ điều kiện doanh số" — PA-API đã ngừng hoạt động từ 15/5/2026.  Cập nhật: Chỉ nên đăng ký Amazon Creators API khi đã duy trì ổn định ≥10 đơn hàng hợp lệ/30 ngày liên tục — với quy mô mới bắt đầu ở Tháng 3, mục tiêu này thường khó đạt ngay; coi đây là mốc để hướng tới ở Giai đoạn 4 trở đi, không đặt kỳ vọng vào Tháng 3. |

* Tích hợp postback từ Amazon Associates/mạng affiliate khác, ghi nhận conversions
* Thu thập sentiment từ review thật (Reddit/Amazon) qua LLM, bổ sung vào trang sản phẩm
* Theo dõi EPC theo category, cắt/nhân bản dựa trên số liệu thật

## **Giai đoạn 4 — Ổn định Site 1, bắt đầu Site 2 (Tháng 4)**

* Khi Site 1 có traffic + doanh thu ổn định, tái sử dụng gần như nguyên bản hạ tầng (DB schema, /go/:slug, crawler pattern, Entity Matching) cho Steadylifeaids
* Vì code/kiến trúc đã có sẵn, giai đoạn dựng Site 2 sẽ nhanh hơn Site 1 đáng kể — tập trung chủ yếu vào crawl catalog mới (Mobility Aids, Caregiver Tools) và viết content template riêng

## **Giai đoạn 5 — pSEO Site 2 (Tháng 5-6)**

* Lặp lại Giai đoạn 1-3 cho Site 2: seed sản phẩm, scale pSEO, đối soát
* Site 1 lúc này chuyển sang chế độ duy trì (maintenance) — chỉ cập nhật giá định kỳ, không cần đầu tư thời gian lớn

## **Giai đoạn 6 — Song song 2 site (Tháng 7+)**

* Cả 2 site chạy ổn định, traffic thụ động từ SEO
* Tiếp tục kênh video AI (đăng nội dung, chia sẻ link Amazon Associates thường) cho từng site để tăng traffic ngắn hạn, gắn link qua /go/:slug để đo chung EPC

|  |
| --- |
| **Nguyên tắc xuyên suốt**  Không mở Site 2 trước khi Site 1 có dấu hiệu SEO hoạt động (traffic organic bắt đầu tăng, thường sau tháng 3-4) — làm song song từ đầu sẽ khiến cả 2 site đều mỏng nội dung và không site nào đủ "trust" để Google xếp hạng tốt. |

# **9. Cài đặt Review Schema trên Next.js**

Schema Markup giúp công cụ tìm kiếm và AI hiểu rõ hơn về nội dung, giúp bài viết xuất hiện với rich snippet hấp dẫn hơn, tăng CTR.

## **9.1. Triển khai thủ công với Next.js và schema-dts**

**Bước 1:** Cài đặt thư viện hỗ trợ TypeScript

|  |
| --- |
| npm install schema-dts |

**Bước 2:** Tạo component cho Schema Script — file components/ProductSchema.tsx

|  |
| --- |
| // components/ProductSchema.tsx  import { Product, WithContext } from 'schema-dts'    interface ProductSchemaProps {  name: string  image: string  description: string  brand?: string  sku?: string  price?: number  priceCurrency?: string  aggregateRating?: {  ratingValue: number  reviewCount: number  }  }    export default function ProductSchema({ product }: { product: ProductSchemaProps }) {  const jsonLd: WithContext<Product> = {  '@context': 'https://schema.org',  '@type': 'Product',  name: product.name,  image: product.image,  description: product.description,  brand: product.brand ? {  '@type': 'Brand',  name: product.brand  } : undefined,  sku: product.sku,  offers: product.price ? {  '@type': 'Offer',  price: product.price,  priceCurrency: product.priceCurrency || 'USD',  availability: 'https://schema.org/InStock'  } : undefined,  aggregateRating: product.aggregateRating ? {  '@type': 'AggregateRating',  ratingValue: product.aggregateRating.ratingValue,  reviewCount: product.aggregateRating.reviewCount  } : undefined  }    return (  <script  type="application/ld+json"  dangerouslySetInnerHTML={{  \_\_html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') // Bảo vệ khỏi XSS  }}  />  )  } |

**Bước 3:** Sử dụng trong trang sản phẩm

|  |
| --- |
| import ProductSchema from '@/components/ProductSchema'    export default async function ProductPage({ params }: { params: { slug: string } }) {  const product = await getProduct(params.slug) // Hàm lấy dữ liệu của bạn    return (  <section>  {/\* Thêm Schema vào trang \*/}  <ProductSchema product={product} />    {/\* Nội dung giao diện người dùng \*/}  <h1>{product.name}</h1>  {/\* ... \*/}  </section>  )  } |

## **9.2. Các loại Schema cần cài đặt cho mỗi trang**

| **Loại trang** | **Schema cần dùng** |
| --- | --- |
| Trang sản phẩm (Product) | Product, Offer, AggregateRating, Review |
| Trang đánh giá (Review) | Review, Product, Rating |
| Trang so sánh (Comparison) | Product, Offer, FAQPage (cho phần so sánh) |
| Trang hướng dẫn (Guide) | Article, HowTo (nếu có hướng dẫn từng bước) |
| Trang danh mục (Category) | CollectionPage, ItemList |

## **9.3. Mẹo tối ưu cho AI Search (GEO)**

* Đảm bảo dữ liệu Schema chính xác và chi tiết — AI Overviews thường dùng dữ liệu có cấu trúc để trích xuất thông tin trả lời trực tiếp
* Thêm dateModified vào mỗi Schema để Google biết nội dung được cập nhật thường xuyên
* Sử dụng reviewBody chi tiết với các từ khóa chính — AI có thể đọc và trích dẫn trực tiếp

# **10. Quy trình xây dựng Topic Cluster cho SEO 2026**

## **10.1. Khái niệm**

**Topic Cluster** = 1 bài trụ cột (Pillar Page) + nhiều bài nhánh (Cluster Content) liên kết chặt chẽ với nhau, tạo thành mạng lưới kiến thức chuyên sâu về một chủ đề. Đây là cách để Google hiểu website của bạn là chuyên gia thực thụ trong niche, không phải trang tổng hợp thông tin rời rạc.

## **10.2. Cách xây dựng Topic Cluster cho Deskholt.com**

**Bước 1: Chọn Pillar Topic (Chủ đề trụ cột)**

Thay vì chọn quá rộng ("Bàn làm việc"), hãy chọn cụ thể vừa đủ để tạo 5-10 bài nhánh. Ví dụ: "Thiết lập bàn đứng công thái học cho người làm việc tại nhà"

**Bước 2: Lên danh sách Cluster Content (Bài nhánh)**

Mỗi bài nhánh trả lời một câu hỏi cụ thể, đáp ứng intent tìm kiếm ở giai đoạn cân nhắc hoặc quyết định:

| **Bài nhánh** | **Intent** |
| --- | --- |
| Đánh giá bàn đứng Uplift V2 | Mua hàng (Decision) |
| Đánh giá ghế công thái học Steelcase | Mua hàng (Decision) |
| So sánh bàn đứng Fully Jarvis vs Uplift V2 | So sánh (Consideration) |
| Hướng dẫn chọn chiều cao bàn đứng phù hợp | Nghiên cứu (Consideration) |
| Phụ kiện không thể thiếu cho bàn đứng | Nghiên cứu/Decision |

**Bước 3: Tạo nội dung "Không thể bỏ qua" cho mỗi bài**

Để tránh bị Google đánh giá là nội dung mỏng hoặc AI-generated rác, mỗi bài cần có ít nhất 1 yếu tố độc bản:

* **Bằng chứng trải nghiệm thực tế (Sweat Equity):** Dùng thử sản phẩm ít nhất 1 tuần, chụp ảnh thực tế. Viết: "Sau 30 ngày sử dụng bàn đứng này, tôi nhận thấy cơn đau lưng giảm rõ rệt..."
* **Đánh giá trung thực:** Liệt kê cả ưu và nhược điểm thực tế. Nói xấu sản phẩm nếu cần — điều này xây dựng lòng tin.
* **Góc nhìn cá nhân:** Tránh viết kiểu "Theo thông số nhà sản xuất..." mà hãy viết "Theo trải nghiệm của tôi..."

**Bước 4: Xây dựng cấu trúc liên kết nội bộ (Internal Linking)**

Đây là bước quan trọng nhất để Google hiểu cấu trúc chủ đề:

* **Từ bài nhánh → bài trụ cột:** Thêm link với anchor text: "Đọc thêm: Hướng dẫn toàn diện về thiết lập bàn đứng công thái học"
* **Từ bài trụ cột → bài nhánh:** Tạo danh sách các bài viết chuyên sâu, link đến từng bài
* **Giữa các bài nhánh với nhau:** Link từ bài so sánh đến bài đánh giá chi tiết từng sản phẩm và ngược lại

|  |
| --- |
| **Lưu ý về URL**  Không nhất thiết phải đặt URL theo cấu trúc thư mục phân cấp (VD: /standing-desk/uplift-v2-review hay /blog/standing-desk-guide đều được). Điều quan trọng là liên kết nội bộ tạo ra mối quan hệ giữa các trang, không phải cấu trúc URL. |

# **11. Quy trình xuất bản bài viết chuẩn SEO/AEO (6 bước)**

Áp dụng cho mọi bài viết mới (review, so sánh, listicle, hướng dẫn).

### **Bước 1: Nghiên cứu từ khóa và Intent (Tuần 1 - Hàng tuần)**

* **Mục tiêu:** Tìm cụm từ khóa có intent mua hàng cao nhưng ít cạnh tranh
* **Chiến thuật:** Tập trung vào long-tail và câu hỏi thay vì từ khóa ngắn

**Ví dụ cho Deskholt.com:** Thay vì "standing desk", nhắm đến: "standing desk for tall person review", "best budget standing desk under 300", "Uplift V2 vs Fully Jarvis"

* **Công cụ:** Google Keyword Planner, Ubersuggest, phân tích đối thủ

### **Bước 2: Xây dựng cấu trúc bài viết "Intent-First"**

Mục tiêu: Đáp ứng ngay lập tức câu hỏi của người dùng, giúp AI dễ hiểu.

**Cấu trúc vàng cho bài Review/So sánh:**

**1.** Kết luận ngắn gọn (The Verdict): 2-3 câu tóm tắt ngay đầu trang, đưa ra khuyến nghị rõ ràng

**2.** Bảng so sánh (Comparison Table): Đặt ngay sau verdict, đưa các lựa chọn hàng đầu cùng giá, điểm số

**3.** Ưu/Nhược điểm (Pros/Cons): Dạng bullet, dễ đọc

**4.** Ai nên mua (Who it's for)

**5.** Đánh giá chuyên sâu (xem Bước 4)

**6.** Kết luận và CTA

### **Bước 3: Tạo nội dung "Không thể bỏ qua" (Unignorable Content)**

* **Dữ liệu và Bằng chứng Gốc:** Chụp màn hình quy trình đặt hàng, hóa đơn, hoặc ảnh sản phẩm thực tế.
* **Bằng chứng "Đã dùng thử":** Ghi rõ bạn đã dùng sản phẩm trong bao lâu.
* **Chia sẻ cả trải nghiệm tiêu cực:** "Điểm tôi không hài lòng là..." — sự trung thực xây dựng lòng tin.

### **Bước 4: Đánh giá chuyên sâu (The Expert Take)**

**Mục tiêu:** Thể hiện kiến thức chuyên môn, không chỉ đọc lại thông số

**Thực hiện:** Giải thích tại sao bạn dùng sản phẩm đó, so sánh với lựa chọn khác dựa trên trải nghiệm thực tế

### **Bước 5: Tối ưu cho AI Search (GEO)**

* **Trả lời câu hỏi trực tiếp:** Dành riêng phần FAQ để trả lời rõ ràng các câu hỏi phụ (giá, chính sách, đối tượng...) — cấu trúc hỏi/đáp giúp AI dễ trích xuất
* **Sử dụng Schema Markup:** Bổ sung Product, Review, FAQPage (xem mục 9)

### **Bước 6: Xuất bản và Tối ưu Liên kết nội bộ**

* **Liên kết nội bộ:** Tạo cụm chủ đề (Topic Cluster) — liên kết bài nhánh → bài trụ cột và ngược lại
* **Liên kết ngoài:** Trích dẫn nguồn thông tin uy tín để tăng E-E-A-T
* **Cập nhật:** Sau vài tháng, quay lại cập nhật bài viết với thông tin mới — gửi tín hiệu tích cực cho Google

# **12. Chiến lược SEO tổng thể cho mô hình (Tóm tắt 3 trụ cột)**

## **Trụ cột 1: pSEO tiến hóa (Technical Scale)**

* Không chạy theo số lượng tối đa, tập trung vào chất lượng
* Mỗi trang có ít nhất 1 yếu tố độc bản (calculator, sentiment, ảnh thực tế)
* Tích hợp IndexNow và Sitemap Tầng để tối ưu crawl budget

## **Trụ cột 2: Entity-Based SEO (Authority & Trust)**

* Xây dựng Topic Clusters (mục 10)
* Liên kết nội bộ chặt chẽ giữa Pillar và Cluster
* Xây dựng thương hiệu cá nhân/chuyên gia qua About page, tác giả rõ ràng

## **Trụ cột 3: AEO/GEO (AI Readiness)**

* Review Schema đầy đủ (mục 9)
* Trả lời câu hỏi trực tiếp trong nội dung (FAQ)
* Dữ liệu tải sẵn trên server (SSR), không phụ thuộc JavaScript để AI bot đọc được
* Cấu hình robots.txt: cho phép bot AI search (OAI-SearchBot) thu thập, chặn bot huấn luyện (GPTBot) nếu cần bảo vệ bí quyết

# **13. Soft Launch - Quy trình vận hành thử**

Mục tiêu: Kiểm tra toàn bộ hệ thống từ đầu đến cuối với 3-5 người dùng thử trước khi công khai, đảm bảo link tracking, redirect, và conversions hoạt động chính xác.

## **Lịch trình Soft Launch (7 ngày)**

| **Ngày** | **Công việc** | **Mô tả chi tiết** | **Người phụ trách** |
| --- | --- | --- | --- |
| 1 | Chuẩn bị môi trường | Tạo 3-5 tài khoản thử. Cấp link truy cập riêng. Đảm bảo production code đã deploy. | Dev |
| 2 | Tạo kịch bản test | Xây dựng checklist kiểm tra từng luồng (click → redirect → purchase → postback) | PM |
| 3 | Test luồng click & redirect | User click link, kiểm tra redirect đúng sàn, latency <200ms | QA |
| 4 | Test luồng mua hàng thực tế | User mua hàng thật (chọn sản phẩm giá rẻ), theo dõi postback từ network | Dev/QA |
| 5 | Đối soát dữ liệu | So sánh clicks trong Redis/Postgres với conversions từ affiliate network. Kiểm tra click\_id khớp. | Dev/PM |
| 6 | Sửa lỗi phát sinh | Fix tất cả bugs được phát hiện. Kiểm tra lại các luồng đã fix. | Dev |
| 7 | Chốt & Chuẩn bị launch | Xác nhận 100% luồng hoạt động. Chuẩn bị thông báo launch. | PM |

## **Kịch bản test chi tiết**

**Kịch bản #1 — User mua hàng đúng flow**

|  |
| --- |
| 1. User A truy cập trang deskholt.com/product/standing-desk-uplift  2. Click "Buy on Amazon"  3. Hệ thống redirect -> /go/standing-desk-uplift?network=amazon  4. Kiểm tra: click\_id được ghi vào Redis ngay (latency < 200ms)  5. Redirect đến Amazon thành công  6. User A mua hàng thành công  7. Postback từ Amazon ghi nhận  8. Hệ thống match click\_id -> ghi vào bảng conversions  9. Kết luận: PASS |

**Kịch bản #2 — User không mua hàng**

|  |
| --- |
| 1. User B click link  2. Hệ thống ghi click vào bảng clicks  3. User B không mua hàng  4. Kiểm tra: không có conversion tương ứng  5. Kết luận: PASS |

**Kịch bản #3 — Sản phẩm hết hàng**

|  |
| --- |
| 1. User C click sản phẩm hết hàng trên Amazon (is\_in\_stock = false)  2. Hệ thống tự động chuyển hướng sang Walmart/Target (ưu tiên sàn còn hàng)  3. Kiểm tra: redirect đúng sang sàn thay thế  4. Kết luận: PASS |

**Kịch bản #4 — Network fallback**

|  |
| --- |
| 1. User D click link với network không tồn tại  2. Hệ thống chuyển về network default (Amazon)  3. Kết luận: PASS |
| **Rủi ro nếu bỏ qua Soft Launch**  Mất dữ liệu conversions → không biết network nào đang chạy tốt  Link tracking sai → không nhận được hoa hồng (mất tiền)  User gặp lỗi redirect → mất khách hàng tiềm năng  Phải rollback sau khi launch → ảnh hưởng uy tín |

# **14. ISR (Incremental Static Regeneration) trên Next.js**

**Mục tiêu:** Cân bằng giữa tốc độ tải trang (SEO) và cập nhật dữ liệu giá theo thời gian thực (crawl 24h/lần).

**Cách hoạt động:**

* SSG (Static Site Generation): Tạo HTML khi build → nhanh nhưng dữ liệu cũ
* SSR (Server Side Rendering): Render mỗi request → chậm, ảnh hưởng SEO
* ISR (Incremental Static Regeneration): Tạo HTML khi build, tự động revalidate sau khoảng thời gian cài đặt

## **Cài đặt kỹ thuật**

**Bước 1: Cấu hình ISR cho trang sản phẩm**

|  |
| --- |
| // app/product/[slug]/page.tsx  import { prisma } from '@/lib/prisma'  import { notFound } from 'next/navigation'    // ISR: Revalidate dữ liệu sau 24h (86400 giây)  export const revalidate = 86400    async function getProduct(slug: string) {  const product = await prisma.product.findUnique({  where: { slug },  include: { affiliate\_links: true }  })  return product  }    export default async function ProductPage({ params }: { params: { slug: string } }) {  const product = await getProduct(params.slug)  if (!product) {  return notFound()  }  return (  <div>  <h1>{product.name}</h1>  <ProductPriceTable links={product.affiliate\_links} />  <ProductReview product={product} />  </div>  )  } |

**Bước 2: Cấu hình cho trang danh mục**

|  |
| --- |
| // app/category/[slug]/page.tsx  export const revalidate = 86400 // 24h    async function getCategoryProducts(slug: string) {  const products = await prisma.product.findMany({  where: { category: slug, is\_indexed: true },  include: { affiliate\_links: true },  take: 20  })  return products  } |

**Bước 3: Tạo webhook để revalidate theo sự kiện (khi giá thay đổi)**

|  |
| --- |
| // app/api/revalidate/route.ts  import { NextRequest, NextResponse } from 'next/server'  import { revalidateTag } from 'next/cache'    export async function POST(request: NextRequest) {  const { slug, type } = await request.json()  try {  if (type === 'product') {  revalidateTag(`product-${slug}`)  } else if (type === 'category') {  revalidateTag(`category-${slug}`)  }  return NextResponse.json({ revalidated: true, now: Date.now() })  } catch (error) {  return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 })  }  } |

**Bước 4: Gọi webhook từ crawler sau khi cập nhật giá**

|  |
| --- |
| # Trong script crawler sau khi update giá  curl -X POST https://deskholt.com/api/revalidate \  -H "Content-Type: application/json" \  -d '{"slug":"standing-desk-uplift","type":"product"}' |

## **So sánh các phương án**

| **Phương án** | | **Tốc độ** | | **Cập nhật dữ liệu** | **SEO** | **Chi phí server** |
| --- | --- | --- | --- | --- | --- | --- |
| SSG | | Rất nhanh | | Không | Rất tốt | Thấp |
| SSR | | Chậm | | Luôn mới | Kém | Cao |
| ISR | | Rất nhanh | | Có (định kỳ) | Rất tốt | Trung bình |
| **Rủi ro nếu bỏ qua**  User thấy giá cũ → mất trust → tỷ lệ chuyển đổi thấp  Google crawl sai giá → rich snippet không chính xác → click-through rate giảm  Bị phàn nàn từ user vì giá không khớp | |

# **15. Sitemap Index - Tối ưu Crawl Budget**

**Mục tiêu:** Đảm bảo Google crawl được toàn bộ các trang khi website scale lên 1000+ URL, tránh lãng phí crawl budget.

**Giới hạn của Sitemap đơn lẻ:**

* Google chỉ chấp nhận sitemap tối đa 50MB hoặc 50,000 URLs
* Nếu vượt quá, phải chia nhỏ thành nhiều sitemap

## **Cài đặt kỹ thuật**

**Bước 1: Cài đặt next-sitemap**

|  |
| --- |
| npm install next-sitemap |

**Bước 2: Cấu hình next-sitemap.config.js**

|  |
| --- |
| // next-sitemap.config.js  module.exports = {  siteUrl: 'https://deskholt.com',  generateRobotsTxt: true,  robotsTxtOptions: {  policies: [  { userAgent: '\*', allow: '/' },  { userAgent: 'GPTBot', disallow: '/' }  ],  additionalSitemaps: [  'https://deskholt.com/sitemap-products.xml',  'https://deskholt.com/sitemap-category.xml',  'https://deskholt.com/sitemap-blog.xml',  ],  },  changefreq: 'daily',  priority: 0.7,  sitemapSize: 5000, // Mỗi sitemap tối đa 5000 URL  } |

**Bước 3: Tạo sitemap động cho sản phẩm**

|  |
| --- |
| // app/sitemap-products.xml/route.ts  import { NextRequest } from 'next/server'  import { prisma } from '@/lib/prisma'    export async function GET(req: NextRequest) {  const baseUrl = 'https://deskholt.com'  const products = await prisma.product.findMany({  where: { is\_indexed: true },  select: { slug: true, updated\_at: true }  })  const urls = products.map(product => ({  loc: `${baseUrl}/product/${product.slug}`,  lastmod: product.updated\_at.toISOString(),  changefreq: 'daily',  priority: 0.8,  }))  const xml = generateSitemapXML(urls)  return new Response(xml, {  headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }  })  } |

**Bước 4: Tạo sitemap index tổng hợp**

|  |
| --- |
| // app/sitemap.xml/route.ts  export async function GET(req: NextRequest) {  const baseUrl = 'https://deskholt.com'  const sitemaps = [  `${baseUrl}/sitemap-products.xml`,  `${baseUrl}/sitemap-category.xml`,  `${baseUrl}/sitemap-blog.xml`,  ]  const xml = generateSitemapIndexXML(sitemaps)  return new Response(xml, {  headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }  })  } |

**Bước 5: Submit lên Google Search Console**

* Đăng nhập Google Search Console
* Chọn property Deskholt.com
* Đi đến "Sitemaps"
* Submit https://deskholt.com/sitemap.xml

## **So sánh trước / sau khi có Sitemap Index**

| **Chỉ số** | | **Không có Sitemap Index** | | **Có Sitemap Index** |
| --- | --- | --- | --- | --- |
| Số lượng URL được Google biết | | < 1000 | | 1000+ (toàn bộ) |
| Thời gian Google phát hiện trang mới | | Vài tuần | | Vài ngày |
| Crawl budget lãng phí | | Cao (Google tự tìm) | | Thấp (định hướng đúng) |
| **Rủi ro nếu bỏ qua**  Google không crawl hết các trang mới → traffic thấp hơn tiềm năng  Các trang quan trọng bị bỏ qua  Mất cơ hội xếp hạng từ khóa long-tail | |

# **16. Affiliate Media Kit**

**Mục tiêu:** Tăng khả năng được duyệt bởi các affiliate network (Awin, Impact, CJ) và thu hút các brand DTC hợp tác trực tiếp.

## **Bộ tài liệu cần chuẩn bị**

**1. Affiliate Brief (1 trang)**

|  |
| --- |
| [Logo Deskholt.com]    GIỚI THIỆU  Deskholt.com là website chuyên review và so sánh các sản phẩm  home-office / desk setup, hướng đến đối tượng người làm việc  tại nhà tại Mỹ.    THỐNG KÊ TRAFFIC  - Lượt truy cập: [số liệu] / tháng  - Độ tuổi: 25-55  - Thu nhập: $50,000 - $150,000  - Tỷ lệ conversion: [số liệu]%    CHỦ ĐỀ CHÍNH  - Bàn đứng (standing desks)  - Ghế công thái học (ergonomic chairs)  - Phụ kiện văn phòng (cable management, monitor arms)    ĐỐI TÁC HIỆN TẠI  - Amazon Associates / Awin / Impact (Walmart, Target)    LIÊN HỆ: [email] |

**2. Media Kit (2-3 trang)**

* Logo (các định dạng: PNG, SVG, màu/trắng)
* Banner: 728x90, 300x250, 160x600
* Screenshots của website
* Ảnh sản phẩm đang review
* Thông tin tác giả/chuyên gia

**3. Email Swipes (Mẫu email)**

|  |
| --- |
| Subject: Đánh giá: Bàn đứng Uplift V2 có thực sự xứng đáng?    Chào bạn,    Nếu bạn đang tìm kiếm một chiếc bàn đứng chất lượng cho văn  phòng tại nhà, hãy đọc bài review chi tiết của tôi về Uplift V2.    Sau 30 ngày sử dụng, đây là những gì tôi nhận thấy:  ✅ [Ưu điểm 1]  ✅ [Ưu điểm 2]  ❌ [Nhược điểm 1]    Xem đánh giá đầy đủ tại: [link]  [CTA: Mua ngay trên Amazon] |

**4. Terms & Conditions**

|  |
| --- |
| ĐIỀU KHOẢN HỢP TÁC AFFILIATE  1. Hoa hồng: [X]% trên mỗi đơn hàng thành công  2. Cookie window: [X] ngày  3. Hình thức thanh toán: Payoneer / Wise / Wire Transfer  4. Kỳ hạn thanh toán: Hàng tháng  5. Hành vi bị cấm:  - Spam email  - Bid trên thương hiệu  - Trả giá thầu tên thương hiệu trong quảng cáo  [Chữ ký] |

**Upload lên website:**

|  |
| --- |
| https://deskholt.com/affiliate-resources/  ├── affiliate-brief.pdf  ├── media-kit.pdf  ├── banners/  │ ├── 728x90.png  │ ├── 300x250.png  │ └── 160x600.png  ├── email-swipes.txt  └── terms-conditions.pdf |
| **Rủi ro nếu bỏ qua**  Bị từ chối bởi network (Awin, Impact, CJ)  Hoa hồng thấp hơn do bị xếp vào nhóm publisher chất lượng thấp  Các brand DTC không chủ động tiếp cận hợp tác |

# **17. BỔ SUNG: robots.txt cho AI Crawler**

**Mục tiêu:** Kiểm soát quyền truy cập của các bot AI, bảo vệ nội dung, đồng thời cho phép hiển thị trong kết quả tìm kiếm AI.

**File robots.txt hoàn chỉnh:** Đặt file robots.txt trong thư mục public/ của Next.js:

|  |
| --- |
| # robots.txt  # Cấu hình cho tất cả bot  User-agent: \*  Allow: /  Sitemap: https://deskholt.com/sitemap.xml    # =============== BOT TÌM KIẾM AI ===============  # Cho phép bot của OpenAI dùng cho tìm kiếm (không huấn luyện)  User-agent: OAI-SearchBot  Allow: /    # Cho phép Googlebot (bao gồm cả AI Overviews)  User-agent: Googlebot  Allow: /    # =============== BOT HUẤN LUYỆN AI ===============  # Chặn bot huấn luyện mô hình GPT  User-agent: GPTBot  Disallow: /    # Chặn CommonCrawl (dùng để huấn luyện nhiều mô hình)  User-agent: CCBot  Disallow: /    # =============== CRAWLER KHÁC ===============  User-agent: AhrefsBot  Disallow: /  User-agent: SemrushBot  Disallow: /  User-agent: MJ12bot  Disallow: /  User-agent: DotBot  Disallow: /    # =============== CRAWL RATE ===============  User-agent: \*  Crawl-delay: 2 |

## **Giải thích từng bot**

| **Bot** | **Mục đích** | **Quyết định** | **Lý do** |
| --- | --- | --- | --- |
| OAI-SearchBot | Tìm kiếm của ChatGPT | Cho phép | Muốn xuất hiện trong AI Search |
| Googlebot | Tìm kiếm Google | Cho phép | SEO là nguồn traffic chính |
| GPTBot | Huấn luyện GPT | Chặn | Bảo vệ nội dung, bí quyết pSEO |
| CCBot | Huấn luyện AI | Chặn | Có thể bị trích xuất trái phép |
| AhrefsBot | Backlink check | Chặn | Không cần thiết, tốn bandwidth |

## **Cách kiểm tra**

* Truy cập https://deskholt.com/robots.txt để kiểm tra hiển thị đúng nội dung
* Dùng Google Search Console → "Coverage" → kiểm tra có lỗi robots.txt không

**Kiểm tra bot có bị chặn không:**

|  |
| --- |
| # Test với curl  curl -A "GPTBot" https://deskholt.com/  # Kết quả: 403 Forbidden (nếu cấu hình đúng) |
| **Rủi ro nếu bỏ qua**  Nội dung bị bot AI crawl để huấn luyện mô hình mà không được phép  Bandwidth bị tốn không cần thiết (traffic từ các bot không cần thiết)  Không kiểm soát được dữ liệu nào được AI sử dụng |

# **Bảng kiểm tra hoàn chỉnh**

## **✅ Hạ tầng kỹ thuật**

* Next.js + PostgreSQL + Redis trên VPS Mỹ
* Link Tracking Engine (/go/:slug)
* ISR với revalidate 24h
* Sitemap Index cho 1000+ URL
* robots.txt phân quyền AI bot
* Review Schema (Product, Offer, Review, FAQ)
* **Backup Postgres tự động ra ngoài VPS + uptime monitoring** (mới bổ sung)

## **✅ Nội dung & SEO**

* Programmatic SEO với LLM
* Unignorable Content (Sweat Equity, Sentiment thật)
* Topic Cluster (Pillar + Cluster Content)
* Quy trình xuất bản 6 bước
* 3 trụ cột SEO (pSEO, Entity-Based, GEO)

## **✅ Affiliate & Pháp lý**

* Amazon Associates + Awin + Impact + CJ
* Affiliate Disclosure, Privacy Policy, Terms
* CCPA Cookie Banner
* W-8BEN thuế
* Affiliate Media Kit (Brief, Media Kit, Email Swipes)
* **Nhập tay dữ liệu Amazon — không crawl HTML trực tiếp trang Amazon** (đã sửa)
* **Amazon Creators API (thay PA-API) chỉ đăng ký khi duy trì ≥10 đơn/30 ngày** (đã sửa)

## **✅ Vận hành**

* Soft Launch 7 ngày với 3-5 người dùng thử
* Roadmap 6 giai đoạn
* Crawler định kỳ 24h (không áp dụng cho Amazon, xem mục 3)
* Xử lý sản phẩm hết hàng
* Entity Matching (UPC/EAN)
* **Test khôi phục backup trước khi scale traffic** (mới bổ sung)