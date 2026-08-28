# NỘI DUNG PHÁP LÝ CHO DESKHOLT.COM — ĐÃ RÀ SOÁT & CHỈNH SỬA

> **Ghi chú rà soát:** Bản gốc (deepseek) có cấu trúc tốt nhưng thiếu vài điểm bắt buộc. Các thay đổi chính so với bản gốc:
> 1. **[BẮT BUỘC]** Thêm đúng nguyên văn câu công bố của Amazon Associates vào Affiliate Disclosure (thiếu câu này có thể bị Amazon khóa tài khoản).
> 2. Mở rộng phần quyền riêng tư từ "chỉ California" sang khung chung cho các bang Mỹ có luật riêng tư toàn diện (2026: ~20 bang), và bổ sung cơ chế nhận Global Privacy Control (GPC) — cả trong chính sách lẫn trong code banner.
> 3. Sửa Cookie Banner: nút "Customize" giờ mở modal chọn từng loại cookie thật (Analytics / Functionality / Advertising), thay vì chỉ ẩn banner mà không hỏi gì; thêm logic đọc tín hiệu GPC.
> 4. Thêm điều khoản độ tuổi tối thiểu và DMCA vào Terms.
> 5. Bổ sung căn cứ pháp lý xử lý dữ liệu (legal basis) và quyền khiếu nại cho phần GDPR.
> 6. Đánh dấu rõ tất cả các placeholder (`[...]`) bạn **phải điền trước khi publish** — đây là các trường có ý nghĩa pháp lý, không phải chỗ để trống.

---

## 1. PRIVACY POLICY

```markdown
# Privacy Policy

**Last Updated:** August 8, 2026

At Deskholt.com ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.

## 1. Information We Collect

### 1.1 Information You Provide to Us
- Name and email address (when you subscribe to our newsletter or contact us)
- Comments and feedback you submit
- Any other information you voluntarily provide

### 1.2 Information Collected Automatically
- **IP Address:** We collect and hash your IP address for security, fraud prevention, and analytics purposes. We do not store raw IP addresses.
- **Browser and Device Information:** Browser type, operating system, device type, screen resolution
- **Usage Data:** Pages visited, time spent on pages, referral sources, click patterns
- **Cookies and Similar Technologies:** See our Cookie Policy for details

### 1.3 Information from Third Parties
- Affiliate networks (Amazon Associates, Awin, Impact, CJ Affiliate) may provide conversion data
- Analytics providers (e.g., Google Analytics, Cloudflare Analytics)

## 2. How We Use Your Information

We use your information to:
- Operate, maintain, and improve our website
- Process affiliate links and track clicks (via `/go/` redirects)
- Detect and prevent fraud and abuse (click fraud prevention via IP hashing and rate limiting)
- Understand how users interact with our content
- Send you newsletters and updates (if you opt-in)
- Comply with legal obligations

## 3. Data Retention

- **Hashed IP addresses:** Retained for up to 365 days for analytics and fraud prevention
- **Click data:** Retained for up to 3 years for affiliate reconciliation and tax purposes
- **Newsletter subscribers:** Retained until you unsubscribe
- **Conversion data:** Retained for up to 7 years for tax reporting

## 4. How We Share Your Information

### 4.1 Affiliate Networks
When you click an affiliate link (`/go/` redirect), we share click data (click ID, timestamp, product ID) with the respective affiliate network to track commissions.

### 4.2 Service Providers
We may share your information with third-party service providers who help us operate our website, including:
- Cloudflare (CDN and security)
- VPS hosting provider
- Email service provider
- Analytics providers

### 4.3 Legal Requirements
We may disclose your information if required by law or to protect our rights, property, or safety.

We do not sell your personal information for money, and we do not share it with third parties for their own independent marketing purposes.

## 5. Your Privacy Rights

Depending on where you live, state and international law may give you rights over your personal information.

### 5.1 U.S. State Privacy Rights (California, Colorado, Connecticut, Virginia, Utah, Texas, and other states with comprehensive privacy laws)

If you are a resident of a state with a comprehensive consumer privacy law, you generally have the right to:
- **Know / Access** what personal information we collect about you
- **Correct** inaccurate personal information
- **Delete** your personal information
- **Opt out** of the "sale" of your personal information and of "sharing" for cross-context (targeted) advertising
- **Non-discrimination** for exercising your rights
- **Appeal** a denied request (where applicable under your state's law)

To exercise your rights, visit our **[Do Not Sell / Opt-Out of Sharing My Personal Information](https://deskholt.com/do-not-sell)** page or contact us at **privacy@deskholt.com**.

**Global Privacy Control (GPC):** Our website is configured to detect and automatically honor the GPC opt-out signal from supported browsers and browser extensions as an opt-out of sale/sharing, consistent with the requirements of California, Colorado, Connecticut, and other states that recognize GPC as a valid universal opt-out mechanism.

### 5.2 European Residents (GDPR/UK GDPR)

Where GDPR applies, our legal bases for processing your information are: performance of a contract or steps toward one (e.g., newsletter delivery), our legitimate interests (e.g., fraud prevention, analytics, affiliate tracking), and your consent (e.g., non-essential cookies).

You have the right to:
- Access, rectify, or delete your data
- Restrict or object to processing
- Data portability
- Withdraw consent at any time (without affecting processing carried out before withdrawal)
- Lodge a complaint with your local data protection supervisory authority

Because our servers are located in the United States, personal information from EU/UK visitors may be transferred internationally. Where required, we rely on appropriate safeguards (such as Standard Contractual Clauses) for such transfers.

## 6. Do Not Sell / Do Not Share My Personal Information

We do not sell your personal information for money. However, our use of cookies and similar technologies for advertising and affiliate-attribution purposes may be considered a "sale" or "sharing" under some state privacy laws (e.g., CCPA/CPRA).

You can opt out by:
1. Clicking the "Do Not Sell or Share My Personal Information" link in our footer
2. Adjusting your cookie preferences via "Cookie Settings" (Customize)
3. Enabling Global Privacy Control in a supported browser — we will detect and honor it automatically
4. Emailing **privacy@deskholt.com**

## 7. Data Security

We implement appropriate technical and organizational measures to protect your information:
- **IP hashing:** We use SHA-256 hashing with a secret salt to anonymize IP addresses
- **Encryption:** API keys and sensitive data are encrypted using AES-256-GCM
- **Secure connections:** All data is transmitted via HTTPS
- **Access controls:** Limited personnel have access to sensitive data

No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.

## 8. Children's Privacy

Deskholt.com is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If we learn we have collected such information, we will delete it. Parents who believe we may have collected information from a child under 13 should contact us at **privacy@deskholt.com**.

## 9. Third-Party Links

Our website contains links to third-party websites (Amazon, Walmart, Target, etc.). We are not responsible for their privacy practices. We encourage you to review their privacy policies.

## 10. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. The updated version will be indicated by the "Last Updated" date at the top of this page. Material changes will be highlighted where required by law.

## 11. Contact Us

If you have questions about this Privacy Policy, contact us:

**Email:** privacy@deskholt.com
**Address:** [ĐIỀN ĐỊA CHỈ LIÊN HỆ THỰC TẾ — bắt buộc theo luật nhiều bang]

---

*Effective Date: August 8, 2026*
```

---

## 2. TERMS AND CONDITIONS (TERMS OF SERVICE)

```markdown
# Terms and Conditions

**Last Updated:** August 8, 2026

Welcome to Deskholt.com ("we," "our," or "us"). By accessing or using our website, you agree to comply with and be bound by these Terms and Conditions.

## 1. Acceptance of Terms

By using Deskholt.com, you agree to these Terms and Conditions. If you do not agree, please do not use our website.

## 2. Eligibility

You must be at least 18 years old, or the age of majority in your jurisdiction, to use this website or agree to these Terms. If you are under that age, you may only use the site with the involvement of a parent or legal guardian.

## 3. Affiliate Disclaimer

Deskholt.com participates in affiliate marketing programs, including the Amazon Associates Program. We may earn commissions from qualifying purchases made through links on our website. This does not affect the price you pay.

For more information, see our [Affiliate Disclosure](https://deskholt.com/affiliate-disclosure).

## 4. Use of Website

### 4.1 Permitted Use
You may use our website for personal, non-commercial purposes to:
- Research and compare products
- Read reviews and guides
- Click affiliate links to purchase products

### 4.2 Prohibited Use
You may not:
- Use automated tools (bots, crawlers) to scrape our content without permission
- Manipulate, spoof, or abuse our affiliate link tracking system
- Submit false or misleading information
- Attempt to bypass our rate-limiting or security measures
- Use our content for commercial purposes without authorization

## 5. Intellectual Property

All content on Deskholt.com, including text, images, graphics, logos, and code, is our property or licensed to us. You may not reproduce, distribute, or create derivative works without our prior written consent.

## 6. Copyright Complaints (DMCA)

If you believe content on Deskholt.com infringes your copyright, please send a written notice containing:
1. A description of the copyrighted work you believe is infringed
2. The URL(s) of the allegedly infringing material
3. Your contact information (name, address, phone, email)
4. A statement that you have a good-faith belief the use is not authorized
5. A statement, under penalty of perjury, that the notice is accurate and you are authorized to act on behalf of the copyright owner
6. Your physical or electronic signature

Send notices to our designated agent: **legal@deskholt.com** (or the address in Section 14). We will respond in accordance with the Digital Millennium Copyright Act (17 U.S.C. § 512).

## 7. Third-Party Links

Our website contains links to third-party websites (Amazon, Walmart, Target, Awin, Impact, etc.). We do not control these websites and are not responsible for their content, products, or privacy practices.

## 8. Product Information and Pricing

We strive to provide accurate product information, including pricing and availability. However:
- Prices are subject to change without notice
- We are not responsible for pricing errors or discrepancies
- Product availability is determined by third-party retailers

## 9. Disclaimer of Warranties

Deskholt.com is provided "as is" without warranties of any kind, either express or implied, including but not limited to:
- Fitness for a particular purpose
- Accuracy or reliability of information
- Uninterrupted or error-free access

## 10. Limitation of Liability

To the fullest extent permitted by law, Deskholt.com and its owners are not liable for:
- Any direct, indirect, incidental, or consequential damages
- Loss of profits or data
- Damages arising from your use or inability to use our website

## 11. Indemnification

You agree to indemnify and hold Deskholt.com harmless from any claims, damages, or expenses arising from your violation of these Terms.

## 12. Governing Law and Venue

These Terms are governed by the laws of the State of **[ĐIỀN TIỂU BANG — bắt buộc]**, United States, without regard to conflict-of-law principles. Any dispute not subject to arbitration or informal resolution shall be brought in the state or federal courts located in that state.

## 13. Severability and Entire Agreement

If any provision of these Terms is found unenforceable, the remaining provisions remain in full effect. These Terms, together with our Privacy Policy, Cookie Policy, Acceptable Use Policy, and Affiliate Disclosure, constitute the entire agreement between you and Deskholt.com regarding your use of the website.

## 14. Changes to Terms

We reserve the right to update these Terms at any time. Continued use of our website constitutes acceptance of the updated Terms.

## 15. Termination

We reserve the right to terminate or restrict your access to our website at our sole discretion, without notice or liability.

## 16. Contact Us

For questions about these Terms, contact us at **legal@deskholt.com**.

---

*Effective Date: August 8, 2026*
```

---

## 3. COOKIE POLICY

```markdown
# Cookie Policy

**Last Updated:** August 8, 2026

This Cookie Policy explains how Deskholt.com ("we," "our," or "us") uses cookies and similar technologies.

## 1. What Are Cookies?

Cookies are small text files stored on your device when you visit a website. They help us understand how you use our site and improve your experience.

## 2. Types of Cookies We Use

### 2.1 Essential Cookies (Strictly Necessary)
These cookies are necessary for the website to function properly and cannot be turned off.

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| `session` | Maintains your session while browsing | Session |
| `csrf_token` | Protects against cross-site request forgery | Session |
| `cookie_consent` | Stores your cookie preferences | 365 days |

### 2.2 Analytics Cookies
These help us understand how visitors interact with our site. Loaded only with your consent (or if Global Privacy Control is not detected and you accept via the banner).

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| `_ga` | Google Analytics - distinguishes users | 2 years |
| `_gid` | Google Analytics - distinguishes users | 24 hours |
| `_gat` | Google Analytics - throttles request rate | 1 minute |
| `cf_*` | Cloudflare - analytics and security | Session |

### 2.3 Functionality Cookies
These remember your preferences and improve your experience.

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| `preferred_currency` | Remembers your currency preference | 30 days |
| `preferred_network` | Remembers your preferred affiliate network | 30 days |

### 2.4 Advertising / Affiliate-Attribution Cookies
We use these to attribute purchases to affiliate links. Under some state laws, use of these cookies may be treated as a "sale" or "sharing" of personal information — see our [Do Not Sell / Do Not Share](https://deskholt.com/do-not-sell) page.

| Cookie Name | Purpose | Duration |
|-------------|---------|----------|
| `click_id` | Tracks affiliate clicks for conversion attribution | 30 days |
| `ref_*` | Tracks referral sources | Session |

## 3. Third-Party Cookies

Some cookies are placed by third-party services:

### 3.1 Cloudflare
- **Purpose:** CDN, security, analytics
- **Data:** IP address (hashed), browser information
- **Policy:** [Cloudflare Privacy Policy](https://www.cloudflare.com/privacypolicy/)

### 3.2 Google Analytics
- **Purpose:** Website analytics
- **Data:** Usage patterns, approximate location
- **Policy:** [Google Privacy Policy](https://policies.google.com/privacy)

### 3.3 Affiliate Networks
When you click an affiliate link, the destination network (Amazon, Walmart, etc.) may place cookies on your device. We do not control these cookies.
- [Amazon Cookie Policy](https://www.amazon.com/gp/help/customer/display.html?nodeId=GXV3NEZTGWEDXNEQ)
- [Awin Privacy Policy](https://www.awin.com/us/privacy-policy)

## 4. Your Cookie Preferences

You can manage your cookie preferences:
- **Cookie Banner:** Click "Customize" to choose which non-essential cookie categories to allow, or "Essential Only" to reject all non-essential cookies
- **Global Privacy Control:** If your browser sends a GPC signal, we automatically treat it as an opt-out of advertising/affiliate-attribution cookies
- **Browser Settings:** Most browsers allow you to block or delete cookies
- **Opt-Out Tools:** Use the Network Advertising Initiative opt-out tool

### How to Manage Cookies in Popular Browsers
- **Chrome:** Settings → Privacy and Security → Cookies
- **Firefox:** Options → Privacy & Security → Cookies
- **Safari:** Preferences → Privacy → Cookies
- **Edge:** Settings → Cookies and Site Permissions

## 5. Do Not Track and Global Privacy Control

Our website does not respond to the legacy browser "Do Not Track" header, as no common industry standard exists for it. We do, however, detect and honor the **Global Privacy Control (GPC)** signal as an opt-out of sale/sharing, and we honor your preferences set through our cookie banner.

## 6. Changes to This Policy

We may update this Cookie Policy periodically. The "Last Updated" date indicates when changes were made.

## 7. Contact Us

If you have questions about our use of cookies, contact us at **privacy@deskholt.com**.

---

*Effective Date: August 8, 2026*
```

---

## 4. ACCEPTABLE USE POLICY

```markdown
# Acceptable Use Policy

**Last Updated:** August 8, 2026

This Acceptable Use Policy ("Policy") outlines what is and is not acceptable when using Deskholt.com.

## 1. Prohibited Activities

You may not use Deskholt.com to:

### 1.1 Abuse Our Systems
- Bypass or attempt to bypass rate-limiting
- Use automated tools to generate fake clicks on affiliate links
- Manipulate our affiliate tracking system (click ID, IP hashing)
- Attempt to exploit vulnerabilities in our security systems

### 1.2 Scrape or Crawl
- Use bots, crawlers, or scraping tools to extract content without permission
- Exceed reasonable usage limits
- Bypass our robots.txt rules

### 1.3 Misrepresent Information
- Submit false or misleading information
- Impersonate another person or entity
- Create fake user accounts

### 1.4 Infringe Rights
- Violate intellectual property rights
- Republish our content without authorization
- Use our brand or logo without permission

### 1.5 Engage in Illegal Activities
- Violate any applicable laws or regulations
- Commit fraud or financial crimes
- Distribute malware or malicious code

## 2. Rate Limits

To prevent abuse and ensure fair usage, our systems apply automated rate limits to click and request traffic (see current limits enforced by our infrastructure). If you exceed these limits, you may be temporarily blocked. For legitimate use cases requiring higher limits, please contact us at **support@deskholt.com**.

> **Lưu ý kỹ thuật:** đừng công bố con số cứng (ví dụ "10 clicks/60s") trừ khi nó khớp chính xác với cấu hình rate-limiter thực tế (Redis) của bạn — nếu sau này bạn đổi threshold mà quên cập nhật trang này, bạn sẽ tự tạo ra một cam kết sai với người dùng.

## 3. Enforcement

We reserve the right to:

- Monitor usage patterns to detect violations
- Temporarily or permanently block IP addresses that violate this Policy
- Report violations to law enforcement if applicable
- Terminate access without notice

## 4. Reporting Violations

If you suspect someone is violating this Policy, please report it to **legal@deskholt.com**.

## 5. Consequences of Violation

Violation of this Policy may result in:

- Immediate termination of access
- Permanent IP ban
- Notification to affiliate networks (if fraud is suspected)
- Legal action

## 6. Updates

We may update this Policy from time to time. The "Last Updated" date indicates when changes were made.

---

*Effective Date: August 8, 2026*
```

---

## 5. AFFILIATE DISCLOSURE

```markdown
# Affiliate Disclosure

**Last Updated:** August 8, 2026

**As an Amazon Associate, Deskholt.com earns from qualifying purchases.**

## What Is an Affiliate Disclosure?

Deskholt.com participates in affiliate marketing programs. This means that when you click on a link to a product on our site and make a purchase, we may earn a commission at no additional cost to you.

## How It Works

1. You visit our website and read product reviews, comparisons, or guides.
2. You click a "Buy Now," "Check Price," or similar button/link.
3. You are redirected through our affiliate link tracking system (`/go/`).
4. If you make a purchase on the retailer's website, we may receive a commission.

## Our Affiliate Networks

We participate in the following affiliate networks:

| Network | Commission Structure | Cookie Duration |
|---------|---------------------|-----------------|
| **Amazon Associates** | 1-10% depending on category | 24 hours |
| **Awin** (including ShareASale) | Varies by brand | Varies |
| **Impact** | Varies by brand | Varies |
| **CJ Affiliate** | Varies by brand | Varies |
| **Walmart Affiliate** (via Impact) | Varies by category | Varies |
| **Target Partners** (via Impact) | Up to 8% | 7 days |

## Does This Affect the Price You Pay?

**No.** The price you pay for a product is exactly the same whether you use our affiliate link or go directly to the retailer's website. The commission is paid by the retailer, not by you.

## Why Do We Use Affiliate Links?

Affiliate commissions help us:

- Maintain and operate Deskholt.com
- Create high-quality, unbiased content
- Keep our website free for all users

## Our Commitment to Honest Reviews

- **Honest Opinions:** Our reviews are based on research, user sentiment, and personal testing when possible.
- **No Paid Reviews:** We do not accept payment to give positive reviews.
- **Pros and Cons:** We always include both advantages and disadvantages of products.
- **Transparency:** We clearly identify when a link is an affiliate link, including short in-content disclosures (e.g., "This post contains affiliate links; we may earn a commission") placed near product recommendations, not only on this page.

## Your Responsibilities

- **State Privacy Rights:** Depending on where you live, you may have the right to opt out of the "sale" or "sharing" of your personal information used for affiliate attribution. See our [Do Not Sell / Do Not Share My Personal Information](https://deskholt.com/do-not-sell) page.
- **Cookie Preferences:** You can manage your cookie preferences through our cookie banner or browser settings.

## Questions?

If you have questions about our affiliate relationships, contact us at **affiliate@deskholt.com**.

---

*Effective Date: August 8, 2026*
```

> **Vì sao thêm câu "As an Amazon Associate..." lên đầu trang:** Amazon Associates Operating Agreement §5 yêu cầu câu này phải "clearly and prominently" xuất hiện trên site — không phải chỉ tồn tại đâu đó trong nội dung dài. Đặt ngay đầu trang Affiliate Disclosure là cách an toàn nhất. Ngoài ra, nên cân nhắc đặt một dòng ngắn (ví dụ "As an Amazon Associate I earn from qualifying purchases.") ở **footer toàn site** để chắc chắn nó "conspicuous" trên mọi trang có link Amazon, không chỉ trang disclosure.

---

## 6. DO NOT SELL / DO NOT SHARE MY PERSONAL INFORMATION

```markdown
# Do Not Sell or Share My Personal Information

**Last Updated:** August 8, 2026

## Your Privacy Rights

Residents of states with comprehensive privacy laws (including California's CCPA/CPRA, and other states such as Colorado, Connecticut, Virginia, Utah, and Texas) generally have the right to:

1. **Know** what personal information we collect about you
2. **Correct** inaccurate personal information
3. **Request deletion** of your personal information
4. **Opt out** of the "sale" or "sharing" of your personal information
5. **Non-discrimination** for exercising your rights

## Do We Sell Your Personal Information?

We do not sell your personal information for money. However, under some state laws, the use of certain cookies and tracking technologies for advertising and affiliate-attribution purposes may be considered a "sale" or "sharing" of personal information.

Specifically:
- We use cookies to track affiliate clicks and conversions
- This data is shared with affiliate networks for commission attribution
- Your IP address is hashed (anonymized) before storage

## How to Opt-Out

You have several ways to opt-out:

### Option 1: Cookie Settings
Click "Cookie Settings" / "Customize" at the bottom of our website and disable non-essential cookie categories.

### Option 2: Global Privacy Control
Enable Global Privacy Control (GPC) in your browser or a supported browser extension. We detect the GPC signal and automatically apply your opt-out preference across the site — you do not need to also submit a separate request.

### Option 3: Email Request
Send an email to **privacy@deskholt.com** with the subject line "Do Not Sell or Share My Information."

Please include:
- Your full name
- Your email address (to verify your identity)
- Your state of residence

We will process your request within the timeframe required by applicable law (generally 15 business days).

## Verification Process

To protect your privacy, we may need to verify your identity before processing your request. This may involve:
- Confirming your email address
- Asking for information that matches what we have on file

## Authorized Agents

You may use an authorized agent to submit a request on your behalf. The agent must provide:
- Written permission from you
- Verification of your identity
- Their own identity verification

## Your Other Rights

Even if you opt out of the "sale"/"sharing" of your information, you still have the right to:
- Access the personal information we hold about you
- Request correction of inaccurate information
- Request deletion of your information
- Appeal a denied request, where your state's law provides for it

## Updates to This Page

We may update this page periodically. The "Last Updated" date indicates when changes were made.

## Contact Us

If you have questions about your privacy rights, contact our Privacy Officer:

**Email:** privacy@deskholt.com
**Phone:** [ĐIỀN SỐ ĐIỆN THOẠI — không bắt buộc mọi bang, nhưng nên có]
**Address:** [ĐIỀN ĐỊA CHỈ LIÊN HỆ — bắt buộc]

---

*Effective Date: August 8, 2026*
```

---

## 7. COOKIE BANNER CONTENT (ĐÃ SỬA: Customize hoạt động thật + nhận GPC)

```html
<!-- Cookie Banner HTML/JS Content -->

<div id="cookie-banner" role="dialog" aria-label="Cookie Consent"
     style="position: fixed; bottom: 0; left: 0; right: 0; background: #1a1a2e; color: #fff;
            padding: 20px 24px; z-index: 9999; display: flex; flex-wrap: wrap;
            justify-content: space-between; align-items: center;
            box-shadow: 0 -4px 12px rgba(0,0,0,0.3); border-top: 3px solid #4a90d9;">

  <div style="flex: 1; min-width: 280px; margin-right: 20px;">
    <p style="margin: 0; font-size: 14px; line-height: 1.6;">
      <strong style="font-size: 16px;">🍪 We Value Your Privacy</strong><br>
      We use cookies and similar technologies to:
      <span style="display: inline-block; margin-top: 4px;">
        ✅ Provide essential functionality &nbsp;·&nbsp;
        📊 Analyze traffic &nbsp;·&nbsp;
        🔗 Track affiliate clicks &nbsp;·&nbsp;
        🛡️ Prevent fraud
      </span>
    </p>
    <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.7;">
      By clicking "Accept All," you consent to our use of cookies.
      <a href="/privacy-policy" style="color: #4a90d9; text-decoration: underline;">Learn more</a>
    </p>
  </div>

  <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-top: 8px;">
    <button onclick="setCookieConsent('essential')"
            style="background: transparent; color: #aaa; border: 1px solid #555;
                   padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">
      Essential Only
    </button>
    <button onclick="openCustomizeModal()"
            style="background: transparent; color: #fff; border: 1px solid #4a90d9;
                   padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px;">
      Customize
    </button>
    <button onclick="setCookieConsent('all')"
            style="background: #4a90d9; color: #fff; border: none;
                   padding: 8px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 600;">
      ✅ Accept All
    </button>
  </div>
</div>

<!-- Customize modal: bật/tắt riêng từng loại cookie, khớp với Cookie Policy §2 -->
<div id="cookie-customize-modal" style="display:none; position:fixed; inset:0; z-index:10000;
     background:rgba(0,0,0,0.5); align-items:center; justify-content:center;">
  <div style="background:#fff; color:#1a1a2e; max-width:420px; width:90%; border-radius:8px; padding:24px;">
    <h3 style="margin-top:0;">Cookie Preferences</h3>

    <label style="display:flex; justify-content:space-between; align-items:center; margin:12px 0;">
      Essential <input type="checkbox" checked disabled>
    </label>
    <label style="display:flex; justify-content:space-between; align-items:center; margin:12px 0;">
      Analytics <input type="checkbox" id="pref-analytics">
    </label>
    <label style="display:flex; justify-content:space-between; align-items:center; margin:12px 0;">
      Functionality <input type="checkbox" id="pref-functionality">
    </label>
    <label style="display:flex; justify-content:space-between; align-items:center; margin:12px 0;">
      Advertising / Affiliate Attribution <input type="checkbox" id="pref-advertising">
    </label>

    <div style="display:flex; gap:10px; margin-top:16px; justify-content:flex-end;">
      <button onclick="closeCustomizeModal()" style="padding:8px 16px;">Cancel</button>
      <button onclick="saveCustomPreferences()"
              style="padding:8px 16px; background:#4a90d9; color:#fff; border:none; border-radius:4px;">
        Save Preferences
      </button>
    </div>
  </div>
</div>

<script>
// Đọc tín hiệu Global Privacy Control (GPC) — bắt buộc ở nhiều bang khi đã claim "we honor GPC"
function hasGPCSignal() {
  return typeof navigator.globalPrivacyControl !== 'undefined' && navigator.globalPrivacyControl === true;
}

function applyConsentCookie(prefs) {
  // prefs: { essential: true, analytics: bool, functionality: bool, advertising: bool }
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  document.cookie = `cookie_consent=${encodeURIComponent(JSON.stringify(prefs))}; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`;
  document.getElementById('cookie-banner').style.display = 'none';

  if (prefs.analytics) loadAnalytics();
  // advertising/affiliate-attribution cookies (click_id, ref_*) chỉ set khi prefs.advertising === true
}

function setCookieConsent(level) {
  if (level === 'essential') {
    applyConsentCookie({ essential: true, analytics: false, functionality: false, advertising: false });
  } else if (level === 'all') {
    applyConsentCookie({ essential: true, analytics: true, functionality: true, advertising: true });
  }
}

function openCustomizeModal() {
  document.getElementById('cookie-customize-modal').style.display = 'flex';
}
function closeCustomizeModal() {
  document.getElementById('cookie-customize-modal').style.display = 'none';
}
function saveCustomPreferences() {
  const prefs = {
    essential: true,
    analytics: document.getElementById('pref-analytics').checked,
    functionality: document.getElementById('pref-functionality').checked,
    advertising: document.getElementById('pref-advertising').checked
  };
  applyConsentCookie(prefs);
  closeCustomizeModal();
}

function loadAnalytics() {
  // Example: Load Google Analytics
  // (GA loading code here)
  console.log('Analytics loaded with user consent');
}

// Nếu phát hiện tín hiệu GPC và người dùng chưa từng chọn gì, tự động opt-out advertising/sharing
document.addEventListener('DOMContentLoaded', function () {
  const alreadyConsented = document.cookie.includes('cookie_consent=');
  if (!alreadyConsented && hasGPCSignal()) {
    applyConsentCookie({ essential: true, analytics: false, functionality: false, advertising: false });
  }
});
</script>
```

---

## 8. IMPLEMENTATION GUIDE

Để tích hợp các trang pháp lý vào Next.js:

### 8.1. Tạo thư mục và file

```
src/app/
├── (public)/
│   ├── privacy-policy/
│   │   └── page.tsx        # Privacy Policy
│   ├── terms/
│   │   └── page.tsx        # Terms and Conditions
│   ├── cookie-policy/
│   │   └── page.tsx        # Cookie Policy
│   ├── acceptable-use/
│   │   └── page.tsx        # Acceptable Use Policy
│   ├── affiliate-disclosure/
│   │   └── page.tsx        # Affiliate Disclosure
│   └── do-not-sell/
│       └── page.tsx        # Do Not Sell / Do Not Share My Personal Information
```

### 8.2. Component cho các trang pháp lý

```tsx
// src/app/(public)/[legal]/page.tsx
import { notFound } from 'next/navigation';
import { LegalContent } from '@/components/LegalContent';

const legalPages = {
  'privacy-policy': {
    title: 'Privacy Policy',
    content: `...` // Nội dung từ mục 1
  },
  'terms': {
    title: 'Terms and Conditions',
    content: `...` // Nội dung từ mục 2
  },
  // ... các trang khác
};

export default async function LegalPage({
  params
}: {
  params: Promise<{ legal: string }>
}) {
  const { legal } = await params;
  const page = legalPages[legal as keyof typeof legalPages];

  if (!page) {
    notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 prose prose-lg">
      <h1>{page.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </main>
  );
}
```

### 8.3. Thêm Cookie Banner vào Root Layout

```tsx
// src/app/layout.tsx
import { CookieBanner } from '@/components/CookieBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
```

### 8.4. Component Cookie Banner

> **Lưu ý:** khi chuyển sang React, hãy giữ lại đúng 3 phần đã sửa ở mục 7 (nút Customize mở modal thật, lưu preferences theo object 4 trường, và kiểm tra `navigator.globalPrivacyControl` trước khi hiện banner) — đừng chỉ port lại bản gốc chỉ có essential/all.

```tsx
// src/components/CookieBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ConsentPrefs = {
  essential: true;
  analytics: boolean;
  functionality: boolean;
  advertising: boolean;
};

function hasGPCSignal(): boolean {
  return typeof navigator !== 'undefined' &&
    (navigator as any).globalPrivacyControl === true;
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    const consent = document.cookie.includes('cookie_consent=');
    if (!consent && hasGPCSignal()) {
      // GPC signal detected before any interaction — auto opt-out of non-essential
      applyConsent({ essential: true, analytics: false, functionality: false, advertising: false });
      return;
    }
    setIsVisible(!consent);
  }, []);

  const applyConsent = (prefs: ConsentPrefs) => {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    document.cookie = `cookie_consent=${encodeURIComponent(JSON.stringify(prefs))}; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`;
    setIsVisible(false);
    setShowCustomize(false);
    if (prefs.analytics) {
      // Load analytics
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-white p-4 md:p-6 shadow-lg border-t border-blue-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm md:text-base">
            <p className="font-semibold">🍪 We Value Your Privacy</p>
            <p className="text-gray-300 text-xs md:text-sm">
              We use cookies to improve your experience. By clicking "Accept All," you consent to our use of cookies.
              <Link href="/cookie-policy" className="text-blue-400 hover:underline ml-1">
                Learn more
              </Link>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => applyConsent({ essential: true, analytics: false, functionality: false, advertising: false })}
              className="px-3 py-1.5 text-xs md:text-sm bg-transparent border border-gray-600 rounded hover:border-gray-400 transition"
            >
              Essential Only
            </button>
            <button
              onClick={() => setShowCustomize(true)}
              className="px-3 py-1.5 text-xs md:text-sm bg-transparent border border-blue-500 rounded hover:border-blue-300 transition"
            >
              Customize
            </button>
            <button
              onClick={() => applyConsent({ essential: true, analytics: true, functionality: true, advertising: true })}
              className="px-4 py-1.5 text-xs md:text-sm bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
            >
              ✅ Accept All
            </button>
          </div>
        </div>
      </div>

      {showCustomize && (
        <CustomizeModal onSave={applyConsent} onCancel={() => setShowCustomize(false)} />
      )}
    </>
  );
}

function CustomizeModal({
  onSave,
  onCancel,
}: {
  onSave: (prefs: ConsentPrefs) => void;
  onCancel: () => void;
}) {
  const [analytics, setAnalytics] = useState(false);
  const [functionality, setFunctionality] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
      <div className="bg-white text-gray-900 rounded-lg p-6 max-w-sm w-11/12">
        <h3 className="text-lg font-semibold mb-4">Cookie Preferences</h3>
        <label className="flex justify-between items-center mb-3">
          Essential <input type="checkbox" checked disabled />
        </label>
        <label className="flex justify-between items-center mb-3">
          Analytics
          <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
        </label>
        <label className="flex justify-between items-center mb-3">
          Functionality
          <input type="checkbox" checked={functionality} onChange={(e) => setFunctionality(e.target.checked)} />
        </label>
        <label className="flex justify-between items-center mb-3">
          Advertising / Affiliate Attribution
          <input type="checkbox" checked={advertising} onChange={(e) => setAdvertising(e.target.checked)} />
        </label>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm border rounded">
            Cancel
          </button>
          <button
            onClick={() => onSave({ essential: true, analytics, functionality, advertising })}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 9. FOOTER LINKS

Thêm các link pháp lý vào footer — bao gồm cả câu công bố Amazon Associates bắt buộc:

```tsx
// src/components/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Legal</h4>
            <ul className="space-y-1">
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms & Conditions</Link></li>
              <li><Link href="/cookie-policy">Cookie Policy</Link></li>
              <li><Link href="/acceptable-use">Acceptable Use</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Affiliate</h4>
            <ul className="space-y-1">
              <li><Link href="/affiliate-disclosure">Affiliate Disclosure</Link></li>
              <li><Link href="/do-not-sell">Do Not Sell / Share My Info</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t text-xs text-gray-500 text-center">
          <p>As an Amazon Associate, Deskholt.com earns from qualifying purchases.</p>
          <p className="mt-1">© {new Date().getFullYear()} Deskholt.com. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
```

---

## ✅ TÓM TẮT CHECKLIST PHÁP LÝ

| Mục | Trạng thái | File | Ghi chú |
|-----|------------|------|---------|
| Privacy Policy | ✅ đã sửa | `privacy-policy/page.tsx` | Mở rộng ngoài CCPA, thêm GPC, legal basis GDPR |
| Terms & Conditions | ✅ đã sửa | `terms/page.tsx` | Thêm tuổi tối thiểu, DMCA, severability |
| Cookie Policy | ✅ đã sửa | `cookie-policy/page.tsx` | Khớp với banner Customize + GPC |
| Acceptable Use Policy | ✅ | `acceptable-use/page.tsx` | Bỏ số rate-limit cứng — cần khớp hệ thống thật |
| Affiliate Disclosure | ✅ đã sửa | `affiliate-disclosure/page.tsx` | **Thêm câu bắt buộc của Amazon** |
| Do Not Sell / Share | ✅ đã sửa | `do-not-sell/page.tsx` | Mở rộng đa bang, GPC tự động |
| Cookie Banner | ✅ đã sửa | `components/CookieBanner.tsx` | Customize giờ có modal thật, đọc GPC |
| Footer Legal Links | ✅ đã sửa | `components/Footer.tsx` | Thêm dòng công bố Amazon Associates |

---

## ⚠️ VIỆC BẠN BẮT BUỘC PHẢI LÀM TRƯỚC KHI PUBLISH

1. **Điền tất cả placeholder** `[ĐIỀN ...]` — địa chỉ liên hệ, tiểu bang áp dụng luật, số điện thoại (nếu có). Nhiều luật riêng tư bang yêu cầu công khai địa chỉ liên hệ thật, để trống hoặc để `[Your Address]` là vi phạm.
2. **Đặt câu "As an Amazon Associate I earn from qualifying purchases."** ở: (a) đầu trang Affiliate Disclosure, (b) footer toàn site. Đây là điều kiện giữ tài khoản Amazon Associates.
3. **Khớp số liệu rate-limit** trong Acceptable Use Policy với cấu hình Redis rate-limiter thực tế — đừng để chính sách nói một đằng, hệ thống làm một nẻo.
4. **Test thực tế nút Customize** và logic GPC trong Cookie Banner sau khi implement — đảm bảo cookie `click_id`/`ref_*` (advertising) **không** được set trước khi có consent hoặc khi phát hiện tín hiệu GPC.
5. Vì bạn đăng ký Amazon Associates/Awin/Impact/CJ với tư cách cá nhân nước ngoài (không có US LLC) — cân nhắc bổ sung một dòng ngắn trong Terms hoặc trang About nêu rõ chủ thể vận hành site là cá nhân, để tránh mập mờ về pháp nhân khi có tranh chấp.
6. Đây là bản nháp tham khảo, không phải tư vấn pháp lý chính thức — nếu ngân sách cho phép, nên có luật sư xem qua bản cuối trước khi publish, đặc biệt là phần Terms (governing law/venue) và DMCA agent.
