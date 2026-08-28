# P0-A1 — Admin Auth Fail-Closed

## Trạng thái

**Hoàn thành và đã commit.**

- Auth commit: `e1fbb23 fix: fail closed admin authentication`
- Admin entry-route commit: `fed3383 fix: redirect admin root to products`
- Graph blast radius: **LOW**
- Security/execution risk: **CRITICAL** vì đây là luồng bảo vệ toàn bộ Admin surface
- Kết quả cuối: **Ready to merge**

## Mục tiêu

Đảm bảo Admin authentication luôn **fail closed** khi cấu hình thiếu hoặc không hợp lệ. Không cho phép đăng nhập, phát hành session hoặc xác thực session nếu một trong hai biến môi trường sau bị thiếu/rỗng:

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Production và development sử dụng cùng authentication behavior. Development không được bypass authentication.

## Lỗ hổng ban đầu

Implementation cũ có hai vấn đề chính.

### 1. Password thiếu có thể khớp với candidate rỗng

Code cũ dùng:

```ts
const expected = process.env.ADMIN_PASSWORD ?? '';
```

Khi `ADMIN_PASSWORD` chưa được cấu hình, expected password trở thành chuỗi rỗng. Candidate rỗng có thể được coi là đúng.

### 2. Session verification có thể throw khi secret thiếu

`isValidSessionToken()` gọi `createSessionToken()`. Khi `ADMIN_SESSION_SECRET` thiếu, hàm tạo token throw error thay vì trả về trạng thái unauthenticated.

Kết quả mong muốn là request bị từ chối an toàn, không phải fail-open hoặc tạo lỗi runtime không cần thiết.

## Invariants đã triển khai

```text
ADMIN_PASSWORD missing
→ login disabled

ADMIN_PASSWORD = ""
→ login disabled

ADMIN_SESSION_SECRET missing
→ login disabled

ADMIN_SESSION_SECRET = ""
→ login disabled

Invalid password
→ no session

Valid configuration + valid password
→ session issued

Missing/empty/invalid token
→ session verification returns false

Previously valid token + missing/empty current config
→ session verification returns false
```

Chỉ `undefined` và chuỗi rỗng `''` được coi là invalid config trong scope này. Không tự động `trim()` giá trị env.

## Thiết kế cuối cùng

### Config reader dùng chung

`src/lib/admin/auth.ts` có một private config reader duy nhất:

```ts
type AdminAuthConfig = {
  password: string;
  sessionSecret: string;
};

function readAdminAuthConfig(): AdminAuthConfig | null
```

Reader:

- đọc env tại thời điểm mỗi lần gọi;
- kiểm tra explicit `undefined` và `''`;
- trả `null` nếu password hoặc session secret không hợp lệ;
- không cache config tại module load;
- không log hoặc đưa secret values vào error.

Cả login authentication và session verification đều dùng cùng config reader để tránh semantics bị lệch.

### Authentication primitive

Public primitive mới:

```ts
export async function authenticateAdmin(
  candidate: string
): Promise<string | null>
```

Luồng xử lý:

1. Đọc một config snapshot hợp lệ.
2. Config thiếu/rỗng → trả `null`.
3. So sánh candidate với configured password bằng constant-work comparison.
4. Password sai → trả `null`.
5. Password đúng → phát hành HMAC-SHA256 session token.

Password verification và token generation dùng cùng config snapshot, tránh race giữa hai bước.

### Session token

Token tiếp tục sử dụng thiết kế stateless hiện tại:

```text
HMAC-SHA256(
  key = ADMIN_SESSION_SECRET,
  message = ADMIN_PASSWORD
)
```

Đặc điểm:

- cookie không chứa raw password;
- token có 64 ký tự lowercase hexadecimal;
- thay đổi password hoặc session secret làm token cũ mất hiệu lực;
- Web Crypto failure bất thường vẫn propagate;
- expected configuration failure được biểu diễn bằng `null` hoặc `false`, không throw.

### Session verification

```ts
export async function isValidSessionToken(
  token: string | undefined | null
): Promise<boolean>
```

Hàm trả `false` khi:

- token thiếu;
- token rỗng;
- token sai/malformed;
- password thiếu/rỗng;
- session secret thiếu/rỗng.

Chỉ token hợp lệ dưới current valid config mới trả `true`.

## Login Action

`src/app/(admin)/admin/login/actions.ts` hiện gọi một authentication primitive duy nhất:

```ts
const token = await authenticateAdmin(password);

if (token === null) {
  redirect(/* generic login failure */);
}

const cookieStore = await cookies();
```

Điều này đảm bảo:

- failure branch kết thúc trước cookie API;
- `cookies()` và `.set()` chỉ chạy khi token là string;
- sai password hoặc invalid config không cấp session;
- TypeScript typecheck xác nhận token đã được narrow trước cookie write.

Cookie attributes được giữ nguyên:

- `httpOnly: true`
- `sameSite: 'lax'`
- `secure: true` trong production
- `path: '/'`
- thời hạn 7 ngày

## Open Redirect Hardening

Trong quá trình review, phát hiện trường `from` có thể chứa URL bên ngoài:

```text
/admin/login?from=https://attacker.example
```

Sau khi admin đăng nhập thành công, implementation cũ có thể redirect trình duyệt tới website của attacker.

### Fix

Thêm:

```ts
sanitizeAdminRedirect(target: string): string
```

trong `src/lib/admin/redirect.ts`.

Chỉ các target thuộc Admin surface được chấp nhận:

```text
/admin
/admin/
/admin/...
/admin?...
/admin#...
```

Các target sau bị từ chối:

- absolute URL như `https://attacker.example`;
- protocol-relative URL như `//attacker.example`;
- path chứa backslash;
- path ngoài `/admin`;
- relative string như `admin/products`;
- malformed target.

Target không hợp lệ fallback về:

```text
/admin/products
```

`loginAction` sanitize `from` trước cả failure redirect và success redirect.

## Admin Root Entry Route

Sau khi auth fail-closed được triển khai, phát hiện `/admin` trả 404 đối với session hợp lệ vì repository chỉ có các route con:

```text
/admin/login
/admin/products
/admin/products/[id]/specifications
```

Middleware vẫn xử lý đúng authentication:

- chưa đăng nhập → redirect tới `/admin/login`;
- session hợp lệ → request được cho đi tiếp.

Tuy nhiên, trước fix không có `src/app/(admin)/admin/page.tsx`, nên request hợp lệ tới `/admin` không có page để render.

### Fix

Thêm route entry trung tính:

```tsx
import { redirect } from 'next/navigation';

export default function AdminPage() {
  redirect('/admin/products');
}
```

Behavior cuối:

```text
Unauthenticated /admin
→ middleware redirects to /admin/login

Authenticated /admin
→ AdminPage redirects to /admin/products
```

Đây là route entry/fallback, không phải Admin dashboard mới. Không sửa middleware, cookie hoặc auth flow.

## Files thay đổi

### `src/lib/admin/auth.ts`

- Thêm `AdminAuthConfig`.
- Thêm `readAdminAuthConfig()`.
- Thêm `authenticateAdmin()`.
- Chuyển `isValidSessionToken()` sang fail-closed behavior.
- Thu hẹp `createSessionToken()` thành private helper nhận config snapshot.
- Loại bỏ public primitives cũ có behavior không an toàn.

### `src/lib/admin/redirect.ts`

- Thêm `DEFAULT_ADMIN_REDIRECT`.
- Thêm `sanitizeAdminRedirect()`.

### `src/app/(admin)/admin/login/actions.ts`

- Dùng `authenticateAdmin()` thay cho password check và token generation tách rời.
- Sanitize `from` trước redirect.
- Chỉ ghi cookie ở success branch.

### `tests/adminAuth.test.ts`

- Thêm auth configuration matrix.
- Thêm token generation/verification tests.
- Thêm open-redirect regression tests.
- Restore env chính xác bằng `delete` khi giá trị ban đầu là `undefined`.

### `src/app/(admin)/admin/page.tsx`

- Thêm entry route cho `/admin`.
- Redirect session hợp lệ tới `/admin/products`.
- Không tạo dashboard hoặc client component mới.

## Test coverage

Nhóm Admin auth có 12 tests:

```text
✓ Cho phép internal /admin redirect
✓ Từ chối external và malformed redirect
✓ Missing password rejected
✓ Empty password rejected
✓ Missing session secret rejected
✓ Empty session secret rejected
✓ Wrong password rejected
✓ Correct password issues 64-character lowercase hex token
✓ Issued token verifies under unchanged valid config
✓ Missing/empty/incorrect token rejected
✓ Verification fails closed when password becomes missing/empty
✓ Verification fails closed when session secret becomes missing/empty
```

TDD regression tests đã được chạy ở trạng thái đỏ trước implementation, sau đó chuyển xanh.

## Verification cuối

Fresh command đã chạy trước commit:

```text
npm run check
```

Kết quả:

```text
ESLint                 PASS
TypeScript typecheck   PASS
Tests                  22/22 PASS
Production build       PASS
git diff --check       PASS
```

Production route table sau route-entry fix có:

```text
○ /admin
ƒ /admin/login
ƒ /admin/products
ƒ /admin/products/[id]/specifications
```

Build cần chạy mà không kế thừa `NODE_ENV=development` từ harness. Khi sử dụng production environment chuẩn, build hoàn tất bình thường.

## GitNexus impact

Pre-edit analysis cho các auth symbols cho thấy graph blast radius thấp:

- `createSessionToken`
  - direct callers: `loginAction`, `isValidSessionToken`
  - indirect flow: `middleware`
- `isCorrectPassword`
  - direct caller: `loginAction`
- `isValidSessionToken`
  - direct caller: `middleware`
- `loginAction`
  - framework entry point, không có upstream symbol caller trong graph

Functional surface giới hạn ở:

1. Admin login/session issuance.
2. Admin request/session verification.

Mặc dù graph risk là LOW, execution risk được coi là **CRITICAL** vì đây là authentication critical path.

Impact analysis cho route entry mới:

```text
AdminPage
Risk: LOW
Direct dependants: 0
Affected processes: 0
Affected modules: 0
```

Route vẫn được middleware `/admin/:path*` bảo vệ trước khi `AdminPage` được render.

## Acceptance evidence

```text
✓ Missing/empty password không thể đăng nhập
✓ Missing/empty session secret không thể đăng nhập
✓ Wrong password không tạo token
✓ Correct password dưới valid config tạo token
✓ Invalid config không làm session verification throw
✓ Cookie write chỉ nằm sau success branch
✓ Cookie security attributes được giữ nguyên
✓ Redirect target được giới hạn trong /admin
✓ Unauthenticated /admin vẫn đi qua middleware tới login
✓ Authenticated /admin redirect tới /admin/products
✓ Production route table có /admin
✓ Không có secret values trong logs/errors/redirect query
✓ Lint pass
✓ Typecheck pass
✓ Full tests pass
✓ Production build pass
```

## Khoảng trống coverage còn lại

Chưa có integration test trực tiếp cho Next.js Server Action để xác nhận runtime cookie calls:

- sai password không gọi `cookies().set()`;
- đúng password set chính xác cookie options;
- final Server Action redirect đúng target.

Node test infrastructure hiện tại không có stable ESM module mocking cho `next/headers` và `next/navigation`. Không thêm dependency hoặc test dựa trên undocumented Next internals chỉ cho task này.

Fallback evidence hiện có:

- unit tests xác nhận auth failure trả `null`;
- typecheck xác nhận token narrowing;
- static control-flow inspection xác nhận cookie API chỉ nằm sau success branch;
- full production build pass.

Khoảng trống này được phân loại **Minor**, không chặn merge.

## Cảnh báo ngoài scope

Các cảnh báo sau không thuộc P0-A1:

1. Next.js `middleware.ts` convention đã deprecated; nên migrate sang `proxy.ts` trong task riêng.
2. npm cảnh báo các config cũ:
   - `child-concurrency`
   - `package-import-method`
   - `side-effects-cache`
3. Server Action integration coverage có thể được bổ sung sau nếu dự án đưa vào test infrastructure phù hợp.

## Out of scope được giữ nguyên

- Merchant/MerchantProduct/Offer.
- Product identity expansion.
- Available Options.
- Ontology dataset.
- Evidence, Score, Best-For.
- Monitor Arm implementation.
- Redis Streams/worker/DLQ.
- Structured-data truthfulness.
- Basic Index Gate.
- PostgreSQL click persistence.
- Migration-managed indexes.
- Seed safety.

## Kết luận

P0-A1 đã đóng lỗ hổng fail-open của Admin auth và open redirect được phát hiện trong review. Cấu hình thiếu/rỗng giờ luôn dẫn tới unauthenticated state, session chỉ được cấp dưới valid config + valid password, và redirect sau đăng nhập bị giới hạn trong Admin surface.

Admin root cũng đã có entry route hợp lệ: request chưa xác thực tiếp tục bị middleware chuyển tới login, còn session hợp lệ được đưa tới màn hình Admin hiện có là `/admin/products` thay vì nhận 404.

Các commit triển khai:

```text
e1fbb23 fix: fail closed admin authentication
fed3383 fix: redirect admin root to products
```
