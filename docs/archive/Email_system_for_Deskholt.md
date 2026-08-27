# 📁 DỰ ÁN: deskholt.com

## Trang Blog Affiliate - Email Marketing + Hỗ trợ Khách hàng
### Công nghệ: Next.js (App Router) - Frontend + Admin Panel
### Hosting: VPS Lanit

---

## 📌 1. Tổng quan dự án

| Tiêu chí | Thông tin |
| :--- | :--- |
| **Tên miền** | deskholt.com |
| **Loại hình** | Blog affiliate (tiếp thị liên kết) |
| **Công nghệ** | **Next.js** (App Router) cho cả Frontend và Admin Panel |
| **Mục tiêu** | Vừa làm Email Marketing, vừa quản lý Email Support từ khách hàng |
| **Hệ thống chính** | **Email Marketing + Email Support** |
| **Hosting** | **VPS Lanit** |
| **Email solution** | Brevo (Sendinblue) |
| **Chat solution** | ChatAds (tùy chọn, cho affiliate) |

---

## 📧 2. Hệ thống Email

### 2.1. Giải pháp: Brevo (trước đây là Sendinblue)

Brevo là nền tảng "all-in-one" lý tưởng:

| Tính năng | Lợi ích cho deskholt.com |
| :--- | :--- |
| **Email Marketing** | Gửi bản tin, chiến dịch quảng bá sản phẩm, tự động hóa email |
| **Quản lý danh sách (CRM)** | Lưu trữ và phân loại danh sách khách hàng, subscriber |
| **Hỗ trợ đa kênh** | Nhận và trả lời email hỗ trợ ngay trên nền tảng |
| **Gói miễn phí** | 300 email/ngày với 2.500 contacts |
| **Conversation API** | Cho phép tích hợp form contact vào Next.js |

### 2.2. Cấu hình Brevo

**Đăng ký tài khoản**: [brevo.com](https://www.brevo.com) - Gói miễn phí

**Lấy API Keys**:
- SMTP Key: Dùng để gửi email từ Next.js
- API Key v3: Dùng để quản lý contact, gửi email qua API

**Xác thực tên miền**: Thêm `deskholt.com` vào Brevo để tăng tỉ lệ gửi email thành công.

---

## 🛠️ 3. Cấu hình dự án Next.js

### 3.1. Cài đặt thư viện

```bash
# Tạo dự án Next.js
npx create-next-app@latest deskholt --typescript --tailwind --app

# Cài đặt thư viện
npm install @sendinblue/client
```

### 3.2. Biến môi trường (`.env.local`)

```
# Brevo
BREVO_API_KEY=your_api_key_here
BREVO_SMTP_KEY=your_smtp_key_here
BREVO_SENDER_EMAIL=support@deskholt.com
BREVO_SENDER_NAME=Deskholt Support

# Admin Contact Email (nhận thông báo support)
ADMIN_EMAIL=admin@deskholt.com

# ChatAds (tùy chọn)
NEXT_PUBLIC_CHATADS_WIDGET_KEY=cwk_your_key_here

# Database (nếu dùng)
DATABASE_URL=your_database_url
```

### 3.3. Cấu trúc thư mục dự án

```
deskholt/
├── app/
│   ├── api/
│   │   ├── contact/
│   │   │   └── route.ts          # Gửi email support
│   │   ├── subscribe/
│   │   │   └── route.ts          # Đăng ký newsletter
│   │   ├── marketing/
│   │   │   └── send/
│   │   │       └── route.ts      # Gửi email marketing
│   │   └── admin/
│   │       └── emails/
│   │           └── route.ts      # Lấy danh sách email support
│   ├── admin/
│   │   └── support/
│   │       └── page.tsx          # Admin Support Dashboard
│   ├── components/
│   │   ├── ContactForm.tsx       # Form liên hệ
│   │   ├── SubscribeForm.tsx     # Form đăng ký newsletter
│   │   └── ChatAdsWidget.tsx     # Widget chat (tùy chọn)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Trang chủ
├── lib/
│   └── brevo.ts                  # Brevo client config
├── types/
│   └── index.ts                  # Type definitions
├── .env.local
├── package.json
└── next.config.js
```

---

## 📝 4. Contact Form (Frontend)

### 4.1. Brevo Client Config

**`lib/brevo.ts`**:

```typescript
import * as brevo from '@sendinblue/client';

export const transactionalApi = new brevo.TransactionalEmailsApi();
transactionalApi.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

export const contactsApi = new brevo.ContactsApi();
contactsApi.setApiKey(
  brevo.ContactsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);

export const conversationsApi = new brevo.ConversationsApi();
conversationsApi.setApiKey(
  brevo.ConversationsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY!
);
```

### 4.2. API Route - Gửi email support

**`app/api/contact/route.ts`**:

```typescript
import { NextResponse } from 'next/server';
import { transactionalApi } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Gửi email thông báo cho admin
    const sendSmtpEmail = {
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: process.env.ADMIN_EMAIL,
          name: 'Admin',
        },
      ],
      subject: `[Deskholt Support] ${subject}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #374151; }
            .value { margin-top: 5px; color: #1f2937; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Yêu cầu hỗ trợ mới</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">👤 Họ tên</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">📧 Email</div>
                <div class="value">${email}</div>
              </div>
              <div class="field">
                <div class="label">📌 Chủ đề</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">📝 Nội dung</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      replyTo: {
        email: email,
        name: name,
      },
    };

    await transactionalApi.sendTransacEmail(sendSmtpEmail);

    // (Tùy chọn) Gửi email xác nhận cho khách hàng
    const customerEmail = {
      sender: {
        name: process.env.BREVO_SENDER_NAME,
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email, name }],
      subject: 'Đã nhận được yêu cầu hỗ trợ',
      htmlContent: `
        <h2>Xin chào ${name},</h2>
        <p>Cảm ơn bạn đã liên hệ với Deskholt.</p>
        <p>Chúng tôi đã nhận được yêu cầu của bạn và sẽ phản hồi trong thời gian sớm nhất.</p>
        <p><strong>Nội dung yêu cầu:</strong></p>
        <p>${message}</p>
        <br>
        <p>Trân trọng,</p>
        <p><strong>Deskholt Support Team</strong></p>
      `,
    };

    await transactionalApi.sendTransacEmail(customerEmail);

    return NextResponse.json({ 
      success: true, 
      message: 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.' 
    });
  } catch (error) {
    console.error('Contact error:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
```

### 4.3. Client Component Contact Form

**`app/components/ContactForm.tsx`**:

```tsx
'use client';

import { useState } from 'react';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
        // Tự động reset sau 5 giây
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Có lỗi kết nối. Vui lòng thử lại.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-center text-gray-800">Liên hệ với chúng tôi</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Nguyễn Văn A"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề *</label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Vấn đề về đăng ký..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung *</label>
        <textarea
          name="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Mô tả chi tiết vấn đề của bạn..."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Đang gửi...
          </span>
        ) : 'Gửi liên hệ'}
      </button>

      {status === 'success' && (
        <div className="p-3 bg-green-100 text-green-700 rounded-lg text-center">
          ✅ Gửi thành công! Chúng tôi sẽ phản hồi sớm nhất.
        </div>
      )}
      
      {status === 'error' && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center">
          ❌ {errorMessage}
        </div>
      )}
    </form>
  );
}
```

---

## 📋 5. Admin Panel - Quản lý Support

### 5.1. API Route - Lấy danh sách email

**`app/api/admin/emails/route.ts`**:

```typescript
import { NextResponse } from 'next/server';
import { conversationsApi } from '@/lib/brevo';

export async function GET() {
  try {
    // Lấy danh sách conversation từ Brevo
    // Lưu ý: Cần có webhook để lưu email vào database
    // Hoặc gọi trực tiếp Brevo Conversation API
    
    // Cách 1: Gọi Brevo API
    const response = await conversationsApi.getConversations();
    
    // Cách 2: Lấy từ database của bạn (khuyến khích)
    // const tickets = await prisma.ticket.findMany({
    //   orderBy: { createdAt: 'desc' }
    // });

    return NextResponse.json({ 
      success: true, 
      emails: response.data.conversations || [] 
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể lấy danh sách email' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();
    
    // Cập nhật trạng thái ticket
    // await prisma.ticket.update({
    //   where: { id },
    //   data: { status }
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể cập nhật' },
      { status: 500 }
    );
  }
}
```

### 5.2. Admin UI - Support Dashboard

**`app/admin/support/page.tsx`**:

```tsx
'use client';

import { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  from: string;
  subject: string;
  message: string;
  status: 'new' | 'replied' | 'resolved';
  createdAt: string;
}

export default function SupportDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'replied' | 'resolved'>('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/admin/emails');
      const data = await res.json();
      setTickets(data.emails || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'replied' | 'resolved') => {
    try {
      await fetch('/api/admin/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      // Refresh danh sách
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const filteredTickets = tickets.filter(
    ticket => filter === 'all' || ticket.status === filter
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-red-100 text-red-800',
      replied: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
    };
    const labels = {
      new: 'Mới',
      replied: 'Đã trả lời',
      resolved: 'Đã xong',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">📧 Quản lý hỗ trợ</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Bộ lọc:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả ({tickets.length})</option>
            <option value="new">Mới ({tickets.filter(t => t.status === 'new').length})</option>
            <option value="replied">Đã trả lời ({tickets.filter(t => t.status === 'replied').length})</option>
            <option value="resolved">Đã xong ({tickets.filter(t => t.status === 'resolved').length})</option>
          </select>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chưa có yêu cầu hỗ trợ nào</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Từ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chủ đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {ticket.from}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {ticket.subject}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <button className="text-blue-600 hover:text-blue-800 hover:underline">
                        Xem
                      </button>
                      {ticket.status !== 'replied' && (
                        <button 
                          onClick={() => updateStatus(ticket.id, 'replied')}
                          className="text-yellow-600 hover:text-yellow-800 hover:underline"
                        >
                          Trả lời
                        </button>
                      )}
                      {ticket.status !== 'resolved' && (
                        <button 
                          onClick={() => updateStatus(ticket.id, 'resolved')}
                          className="text-green-600 hover:text-green-800 hover:underline"
                        >
                          Đã xong
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## 📨 6. Email Marketing

### 6.1. API Route - Gửi marketing email

**`app/api/marketing/send/route.ts`**:

```typescript
import { NextResponse } from 'next/server';
import { transactionalApi } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { recipientEmail, recipientName, subject, content, campaignId } = await request.json();

    // Validate
    if (!recipientEmail || !subject || !content) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    const sendSmtpEmail = {
      sender: {
        name: 'Deskholt Blog',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [
        {
          email: recipientEmail,
          name: recipientName || 'Độc giả',
        },
      ],
      subject: subject,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Deskholt Blog</h1>
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>Bạn nhận được email này vì đã đăng ký nhận tin từ Deskholt.</p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?email=${recipientEmail}" style="color: #2563eb;">
                  Hủy đăng ký
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Thêm tracking UTM parameters
      // Có thể thêm link affiliate với tracking
    };

    await transactionalApi.sendTransacEmail(sendSmtpEmail);

    // Log gửi email để theo dõi
    // await prisma.emailLog.create({
    //   data: {
    //     recipientEmail,
    //     subject,
    //     campaignId,
    //     sentAt: new Date(),
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Email đã được gửi thành công' 
    });
  } catch (error) {
    console.error('Marketing email error:', error);
    return NextResponse.json(
      { success: false, message: 'Gửi email thất bại' },
      { status: 500 }
    );
  }
}

// Gửi hàng loạt
export async function PUT(request: Request) {
  try {
    const { recipients, subject, content } = await request.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Danh sách người nhận không hợp lệ' },
        { status: 400 }
      );
    }

    const results = await Promise.allSettled(
      recipients.map(recipient => 
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/marketing/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            subject,
            content,
          }),
        })
      )
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      total: recipients.length,
      successCount,
      failedCount,
    });
  } catch (error) {
    console.error('Bulk marketing error:', error);
    return NextResponse.json(
      { success: false, message: 'Gửi hàng loạt thất bại' },
      { status: 500 }
    );
  }
}
```

### 6.2. Subscribe Form

**`app/components/SubscribeForm.tsx`**:

```tsx
'use client';

import { useState } from 'react';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage('✅ Đăng ký thành công! Cảm ơn bạn đã theo dõi Deskholt.');
        setEmail('');
        setName('');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setMessage('❌ ' + (data.message || 'Có lỗi xảy ra. Vui lòng thử lại.'));
      }
    } catch {
      setStatus('error');
      setMessage('❌ Có lỗi kết nối. Vui lòng thử lại.');
    }
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-2">📬 Đăng ký nhận tin</h3>
      <p className="text-gray-600 mb-4">Nhận các bài viết mới và ưu đãi hấp dẫn từ Deskholt.</p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="Họ tên (tùy chọn)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
        >
          {status === 'loading' ? 'Đang xử lý...' : 'Đăng ký ngay'}
        </button>
      </form>
      
      {status === 'success' && (
        <div className="mt-3 p-3 bg-green-100 text-green-700 rounded-lg">
          {message}
        </div>
      )}
      {status === 'error' && (
        <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-lg">
          {message}
        </div>
      )}
    </div>
  );
}
```

### 6.3. API Route - Subscribe

**`app/api/subscribe/route.ts`**:

```typescript
import { NextResponse } from 'next/server';
import { contactsApi } from '@/lib/brevo';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    // Thêm contact vào Brevo
    const contact = await contactsApi.createContact({
      email: email,
      attributes: {
        FIRSTNAME: name || '',
        // Có thể thêm custom attributes
      },
      listIds: [2], // ID của danh sách newsletter trong Brevo
      // updateEnabled: true // Nếu contact đã tồn tại, cập nhật thay vì tạo mới
    });

    return NextResponse.json({ 
      success: true, 
      contact,
      message: 'Đăng ký thành công' 
    });
  } catch (error: any) {
    console.error('Subscribe error:', error);
    
    // Xử lý lỗi duplicate
    if (error.response?.body?.code === 'duplicate_parameter') {
      return NextResponse.json(
        { success: false, message: 'Email này đã đăng ký rồi!' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
```

---

## 💬 7. ChatAds (Tùy chọn - cho Affiliate)

### 7.1. Widget Component

**`app/components/ChatAdsWidget.tsx`**:

```tsx
'use client';

import Script from 'next/script';

export default function ChatAdsWidget() {
  const widgetKey = process.env.NEXT_PUBLIC_CHATADS_WIDGET_KEY;

  if (!widgetKey) {
    console.warn('ChatAds: Missing widget key');
    return null;
  }

  return (
    <Script
      src="https://chataside.com/widget.js"
      data-key={widgetKey}
      strategy="afterInteractive"
      onLoad={() => console.log('ChatAds loaded successfully')}
      onError={(e) => console.error('ChatAds failed to load:', e)}
    />
  );
}
```

### 7.2. Tích hợp vào Layout

**`app/layout.tsx`**:

```tsx
import type { Metadata } from 'next';
import './globals.css';
import ChatAdsWidget from '@/components/ChatAdsWidget';
import SubscribeForm from '@/components/SubscribeForm';

export const metadata: Metadata = {
  title: 'Deskholt - Blog Công Nghệ & Affiliate',
  description: 'Chia sẻ kiến thức công nghệ và sản phẩm hữu ích',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <header>
          {/* Header content */}
        </header>
        
        <main>
          {children}
        </main>
        
        <footer>
          {/* Footer content */}
        </footer>

        {/* ChatAds Widget - chỉ hiển thị ở frontend */}
        <ChatAdsWidget />
      </body>
    </html>
  );
}
```

---

## 🚀 8. Deploy trên VPS Lanit

### 8.1. Cài đặt môi trường

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kiểm tra
node --version
npm --version

# Cài PM2 (quản lý process)
npm install -g pm2

# Cài Nginx
sudo apt-get install -y nginx

# Cài Git
sudo apt-get install -y git

# Cài Certbot (SSL)
sudo apt-get install -y certbot python3-certbot-nginx
```

### 8.2. Clone và Build dự án

```bash
# Clone source code
cd /var/www
sudo git clone https://github.com/yourusername/deskholt.git
cd deskholt

# Cài dependencies
npm install

# Tạo file .env
sudo cp .env.example .env.local
sudo nano .env.local
# Điền các biến môi trường

# Build
npm run build

# Chạy với PM2
pm2 start npm --name "deskholt" -- start
pm2 save
pm2 startup
# Chạy lệnh được hiển thị để enable startup
```

### 8.3. Cấu hình Nginx

**`/etc/nginx/sites-available/deskholt`**:

```nginx
server {
    listen 80;
    server_name deskholt.com www.deskholt.com;

    # Chuyển hướng HTTP -> HTTPS (sẽ cài sau)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name deskholt.com www.deskholt.com;

    # SSL certificates (sẽ được cài bởi Certbot)
    ssl_certificate /etc/letsencrypt/live/deskholt.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/deskholt.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Next.js frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /static {
        proxy_pass http://localhost:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 8.4. Enable site và cài SSL

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/deskholt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Cài SSL với Certbot
sudo certbot --nginx -d deskholt.com -d www.deskholt.com

# Kiểm tra tự động renewal
sudo certbot renew --dry-run

# Xem status PM2
pm2 status
pm2 logs
```

### 8.5. Cấu hình Firewall

```bash
# Cài UFW
sudo apt-get install -y ufw

# Cấu hình
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw allow 3000  # Next.js (nếu cần)
sudo ufw enable

# Kiểm tra
sudo ufw status
```

### 8.6. Backup tự động

**`/etc/cron.d/backup-deskholt`**:

```bash
# Backup mỗi ngày lúc 2:00 AM
0 2 * * * root /usr/bin/rsync -avz /var/www/deskholt/ /backup/deskholt/$(date +\%Y\%m\%d)/
0 3 * * * root /usr/bin/find /backup/deskholt/ -type d -mtime +30 -exec rm -rf {} \;
```

---

## 📊 9. Tổng kết

### 9.1. Chi phí

| Hạng mục | Giải pháp | Chi phí |
| :--- | :--- | :--- |
| Email Marketing + Support | **Brevo** | Miễn phí (300 email/ngày, 2.500 contacts) |
| Chat Affiliate (tùy chọn) | **ChatAds** | Miễn phí (100 tin/ngày) |
| Hosting | **VPS Lanit** | ~200.000-500.000đ/tháng |
| Tên miền | deskholt.com | ~100.000đ/năm |
| SSL | Let's Encrypt | Miễn phí |
| **Tổng** | | **~200.000-500.000đ/tháng** |

### 9.2. Kế hoạch triển khai

| Bước | Công việc | Thời gian |
| :--- | :--- | :--- |
| 1 | Đăng ký Brevo, xác thực domain, lấy API keys | 2 giờ |
| 2 | Tạo dự án Next.js, cài đặt dependencies | 1 giờ |
| 3 | Xây dựng Contact Form (API route + Client component) | 3 giờ |
| 4 | Xây dựng Subscribe Form | 2 giờ |
| 5 | Xây dựng Admin Panel Support Dashboard | 1-2 ngày |
| 6 | Cấu hình Email Marketing Automation trên Brevo | 1-2 ngày |
| 7 | Tích hợp ChatAds (tùy chọn) | 1 giờ |
| 8 | Cấu hình VPS Lanit (Node.js, PM2, Nginx) | 1-2 giờ |
| 9 | Deploy lên VPS, cài SSL, cấu hình firewall | 1-2 giờ |
| 10 | Kiểm thử toàn hệ thống | 1 ngày |
| 11 | Điều chỉnh và tối ưu | 2-3 ngày |

### 9.3. Các endpoint API

| Endpoint | Method | Mô tả |
| :--- | :--- | :--- |
| `/api/contact` | POST | Gửi email hỗ trợ |
| `/api/subscribe` | POST | Đăng ký newsletter |
| `/api/marketing/send` | POST | Gửi email marketing (1 người) |
| `/api/marketing/send` | PUT | Gửi email marketing (hàng loạt) |
| `/api/admin/emails` | GET | Lấy danh sách tickets |
| `/api/admin/emails` | PUT | Cập nhật trạng thái ticket |

### 9.4. Lưu ý quan trọng

1. **Không dùng Hostinger Webmail để gửi marketing** - Chỉ dùng cho email nội bộ.
2. **Brevo Conversation API**: Có thể dùng webhook để lưu email vào database.
3. **UTM Parameters**: Luôn thêm UTM vào link affiliate trong email marketing.
4. **Backup danh sách email**: Thường xuyên export danh sách subscriber.
5. **Bảo mật**: Luật CORS, rate limiting, validation input.
6. **Monitoring**: Sử dụng PM2 và logs để theo dõi.

### 9.5. Tài liệu tham khảo

- Brevo API: [developers.brevo.com](https://developers.brevo.com)
- Next.js: [nextjs.org](https://nextjs.org)
- PM2: [pm2.keymetrics.io](https://pm2.keymetrics.io)
- Nginx: [nginx.org](https://nginx.org)
- ChatAds: [docs.getchatads.com](https://docs.getchatads.com)

---
