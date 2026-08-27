<!-- Vietnamese:start -->

<!-- Bước 1: start -->
Dựa theo lộ trình đã được thống nhất trong tài liệu định hướng, việc **đầu tiên** cần làm nằm ở 
**Giai đoạn 0 / Bước 1: Hạ tầng VPS & Cloudflare**

Dưới đây là các đầu mục hành động cụ thể để thiết lập nền móng hệ thống:

### 1. Cài đặt Máy chủ (VPS)
* Thuê một VPS đặt tại Mỹ (khuyến nghị Hetzner, DigitalOcean, hoặc Vultr) với cấu hình tối thiểu là 2 vCPU và 4GB RAM, sử dụng hệ điều hành Ubuntu 22.04 LTS.
* Cài đặt Docker và Docker Compose lên VPS.
* Cấu hình tường lửa (ufw) để thắt chặt bảo mật, chỉ cho phép mở các cổng: 22 (SSH), 80 (HTTP) và 443 (HTTPS).

### 2. Khởi tạo Cơ sở dữ liệu và Cache
* Viết file `docker-compose.yml` để chạy PostgreSQL 16 và Redis 7 trên cùng VPS này. (PostgreSQL sẽ dùng để lưu dữ liệu sản phẩm/link, còn Redis dùng để xử lý hàng đợi click log nhằm đảm bảo tốc độ chuyển hướng redirect nhanh).

### 3. Cấu hình Tên miền & Mạng
* Trỏ domain **Deskholt.com** qua Cloudflare.
* Thêm bản ghi DNS A trỏ về IP của VPS, bật chế độ proxy của Cloudflare.
* Cấu hình SSL/TLS trên Cloudflare ở chế độ Full (Strict) để mã hóa toàn bộ dữ liệu.

### 4. Thiết lập An toàn Dữ liệu (Bắt buộc)
* Thiết lập cron backup tự động cho PostgreSQL (sử dụng lệnh `pg_dump`) ngay từ bước này.
* Lưu ý đẩy các bản backup này ra một dịch vụ lưu trữ bên ngoài VPS (ví dụ: Cloudflare R2 hoặc Backblaze B2) để tránh mất toàn bộ dữ liệu nếu VPS gặp sự cố.

Sau khi hạ tầng máy chủ cứng này hoàn tất và tên miền đã nhận diện chính xác, bạn mới có thể bước sang việc khởi tạo project Next.js và kết nối mã nguồn với Database.

<!-- Bước 1: end -->

<!-- Bước 2: start -->

Khi hạ tầng phần cứng và mạng đã được thiết lập xong, việc tiếp theo cần thực hiện là chuyển sang 
**Bước 2 — Khởi tạo Next.js & Database**

Dưới đây là các đầu việc chi tiết cho bước này:
* Khởi tạo project Next.js sử dụng App Router, TypeScript và Tailwind CSS.
* Cài đặt Prisma làm ORM và cấu hình kết nối tới cơ sở dữ liệu PostgreSQL đang chạy trên VPS của bạn.
* Định nghĩa schema cho các bảng: `products`, `affiliate_links`, `clicks`, và `conversions` theo đúng cấu trúc đã thống nhất.
* Chạy migration đầu tiên để khởi tạo các bảng trong database, sau đó kiểm tra kết nối từ Next.js API route để đảm bảo luồng giao tiếp hoạt động.

<!-- Bước 2: end -->


<!-- Bước 3: start -->

Sau khi hệ thống Next.js và Database đã được khởi tạo thành công, bước tiếp theo 
**Bước 3 — Nhập dữ liệu sản phẩm**

Ở giai đoạn này, mục tiêu là có dữ liệu mồi (seed data) để thiết kế giao diện và test luồng, chưa cần phải xây dựng Admin Panel hoàn chỉnh. Dưới đây là 4 tác vụ cụ thể của Bước 3:
* **Nhập dữ liệu thủ công qua script:** Tạo một file script seed để nhập tay 100-200 sản phẩm đầu tiên vào cơ sở dữ liệu. (Lưu ý: Tuân thủ quy định mới của Amazon, bạn sẽ nhập tay dữ liệu thay vì tự động cào/scrape HTML trực tiếp để tránh rủi ro bị khóa tài khoản).
* **Điền thông tin cơ bản:** Với mỗi sản phẩm, bạn cần thu thập và nhập các trường: link Amazon Associates, ảnh sản phẩm, danh mục (category) và đoạn mô tả ngắn.
* **Phân loại bộ lọc:** Đánh dấu giá trị `is_sustainable = true` cho các sản phẩm thuộc bộ sưu tập Eco-friendly.
* **Chuẩn bị cho việc mở rộng (Scale):** Bổ sung trường `upc_code` (Mã vạch sản phẩm) nếu nguồn dữ liệu có sẵn. Việc này cực kỳ quan trọng để làm nền tảng cho tính năng Entity Matching (so sánh giá đa sàn) ở các giai đoạn sau.

<!-- Bước 3: end -->

<!-- Vietnamese:end -->


<!-- English:start -->

<!-- Step 1: start -->
Based on the roadmap outlined in the strategy document, your **first** task falls under 
**Phase 0 / Step 1: VPS & Cloudflare Infrastructure**

Below are the specific action items to establish the system foundation:

### 1. Server (VPS) Setup
*   Rent a VPS located in the US (Hetzner, DigitalOcean, or Vultr are recommended) with a minimum configuration of 2 vCPUs and 4GB of RAM, running Ubuntu 22.04 LTS.
*   Install Docker and Docker Compose on the VPS.
*   Configure the firewall (ufw) to enhance security, allowing only the following ports: 22 (SSH), 80 (HTTP), and 443 (HTTPS).

### 2. Database and Cache Initialization
*   Create a `docker-compose.yml` file to run PostgreSQL 16 and Redis 7 on the same VPS. (PostgreSQL will store product/link data, while Redis will handle click-log queues to ensure fast redirection speeds).

### 3. Domain & Network Configuration
*   Point the domain **Deskholt.com** to Cloudflare.
*   Add a DNS A record pointing to the VPS IP address and enable Cloudflare's proxy mode.
*   Configure Cloudflare SSL/TLS to "Full (Strict)" mode to ensure end-to-end data encryption.

### 4. Data Security Setup (Mandatory)
*   Set up an automated backup cron job for PostgreSQL (using the `pg_dump` command) at this stage.
*   Ensure backups are offloaded to an external storage service (e.g., Cloudflare R2 or Backblaze B2) to prevent total data loss in the event of a VPS failure. 

Once the server infrastructure is set up and the domain is correctly recognized, you can proceed to initialize the Next.js project and connect the source code to the database.

<!-- Step 1: end -->

<!-- Step 2: start -->
Once the hardware and network infrastructure are set up, the next step is to proceed to:
**Step 2 — Initializing Next.js & the Database**

Here are the detailed tasks for this step:
* Initialize a Next.js project using App Router, TypeScript, and Tailwind CSS.
* Install Prisma as the ORM and configure the connection to the PostgreSQL database running on your VPS.
* Define the schema for the `products`, `affiliate_links`, `clicks`, and `conversions` tables according to the agreed-upon structure.
* Run the initial migration to create the database tables, then verify the connection via a Next.js API route to ensure the communication flow is working correctly.

<!-- Step 2: end -->

<!-- Step 3: start -->
Once the Next.js system and database have been successfully initialized, the next step is:
**Step 3 — Importing product data**

At this stage, the goal is to obtain seed data for interface design and workflow testing; building a full Admin Panel is not yet required. Below are four specific tasks for Step 3:
* **Manual data import via script:** Create a seeding script to manually import the first 100–200 products into the database. (Note: To comply with Amazon's policies and avoid the risk of account suspension, you should import data manually rather than automatically scraping HTML directly).
* **Populate basic information:** For each product, collect and input the following fields: Amazon Associates link, product image, category, and a short description.
* **Filter classification:** Mark the `is_sustainable` attribute as `true` for products belonging to the Eco-friendly collection.
* **Prepare for scaling:** Add the `upc_code` (Universal Product Code) field if the data source provides it. This is crucial for laying the groundwork for the Entity Matching feature (cross-platform price comparison) in later stages.
<!-- Step 3: end -->

<!-- English:end -->