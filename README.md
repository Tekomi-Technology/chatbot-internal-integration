# Chatbot Dashboard — quản trị chatbot đa tenant

Dashboard quản trị **kiêm backend proxy** cho hệ thống chatbot nội bộ triển khai
cho nhiều đơn vị. Phần xử lý hội thoại nằm ở Dify.ai; project này lo phần quản
lý tenant, phát API key, cấu hình widget và làm lớp trung gian có kiểm soát giữa
website của tenant và app Dify tương ứng.

Đặc tả gốc: [docs/prompt.md](docs/prompt.md).

## Kiến trúc

```
[Website tenant] --<script src=".../widget.js">--> [public/widget.js, Shadow DOM]
                                                        |
                        GET  /api/widget/config?key=…    |  POST /api/widget/chat
                                                        v
                            [Next.js Route Handlers — src/app/api/widget/*]
                              1. API key hợp lệ & đang active?
                              2. Origin/Referer nằm trong domain whitelist?
                              3. Rate limit theo (api key + IP)
                              4. Giải mã dify_api_key -> forward sang Dify
                                                        |
                                                        v
                                                  [Dify.ai /chat-messages]

[Admin] --NextAuth--> [Dashboard: src/app/(dashboard)/* + Server Actions]
```

## Tech stack

| Thành phần | Lựa chọn |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| Database | PostgreSQL 15 |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Auth | NextAuth v5 (Credentials) — JWT session, chặn route ở `src/proxy.ts` |
| UI | Tailwind CSS v4 + component tự viết theo phong cách shadcn/ui |
| Widget | Vanilla JS + Shadow DOM, serve tĩnh từ `public/widget.js` |

Màu primary Indigo `#4F46E5`, còn lại là thang xám trung tính. Dashboard cố định
light mode, ưu tiên desktop (theo mục 7 của đặc tả).

## Chạy lần đầu

Yêu cầu: Node 22+, PostgreSQL 15.

```bash
npm install
cp .env.example .env          # rồi điền các biến bên dưới
npm run db:deploy             # áp dụng migration
npm run db:seed               # tạo tài khoản admin
npm run dev
```

Sinh secret:

```bash
openssl rand -base64 32   # -> AUTH_SECRET
openssl rand -hex 32      # -> ENCRYPTION_KEY (bắt buộc 32 byte)
```

`npm run db:seed` in mật khẩu admin ra terminal **đúng một lần** nếu bạn không
đặt `SEED_ADMIN_PASSWORD`.

### Biến môi trường

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `DATABASE_URL` | ✔ | Chuỗi kết nối PostgreSQL 15 |
| `AUTH_SECRET` | ✔ | Khoá ký JWT session của NextAuth |
| `ENCRYPTION_KEY` | ✔ | AES-256-GCM cho `dify_api_key`. Đổi khoá = mất toàn bộ key đã lưu |
| `DIFY_API_BASE_URL` | ✔ | Base URL Dify self-hosted, gồm cả `/v1` |
| `APP_URL` | | Origin công khai của dashboard, dùng sinh mã nhúng (mặc định `http://localhost:3000`) |
| `AUTH_TRUST_HOST` | | Đặt `true` khi chạy sau reverse proxy |
| `WIDGET_RATE_LIMIT` | | Số request `/api/widget/chat` mỗi cửa sổ (mặc định 20) |
| `WIDGET_RATE_LIMIT_WINDOW_MS` | | Độ dài cửa sổ, ms (mặc định 60000) |
| `ENABLE_CONVERSATION_LOG` | | `true` để ghi bảng `conversation_logs` (mặc định tắt) |

`APP_URL` cố tình **không** dùng tiền tố `NEXT_PUBLIC_`: biến có tiền tố đó bị
Next.js thay bằng hằng số lúc build, đổi origin sẽ phải build lại.

## Deploy lên VPS

App chạy trong Docker, **Postgres dùng bản cài sẵn trên host** — `docker-compose.yml`
không có service `db`. File mẫu nginx và script deploy nằm trong `deploy/`.

### 1. Tạo database

```bash
sudo -u postgres psql -c "CREATE ROLE its LOGIN PASSWORD 'mat_khau';"
sudo -u postgres psql -c "CREATE DATABASE chatbot_internal OWNER its ENCODING 'UTF8' TEMPLATE template0;"
```

DB **phải** do chính role của app làm owner: từ PostgreSQL 15, schema `public` không
còn cấp `CREATE` cho `PUBLIC`, nên nếu owner là `postgres` thì `prisma migrate deploy`
sẽ fail với `permission denied for schema public`.

### 2. Cho container kết nối vào Postgres của host

Mặc định Postgres chỉ nghe `localhost` nên container không vào được. Mở thêm cho
subnet bridge của Docker:

```conf
# /etc/postgresql/15/main/postgresql.conf
listen_addresses = 'localhost,172.17.0.1'

# /etc/postgresql/15/main/pg_hba.conf
host  chatbot_internal  its  172.16.0.0/12  scram-sha-256
```

```bash
sudo systemctl reload postgresql
```

Không mở port 5432 ra ngoài internet — chỉ subnet nội bộ của Docker.

### 3. Cấu hình và khởi động

```bash
git clone <repo> ~/chatbot-internal-integration && cd ~/chatbot-internal-integration
cp .env.example .env
```

Trong container, `localhost` là chính container đó, nên `DATABASE_URL` phải trỏ tới
`host.docker.internal` (compose đã map sẵn sang gateway của host):

```
DATABASE_URL="postgresql://its:mat_khau@host.docker.internal:5432/chatbot_internal?schema=public"
APP_URL="https://ten-mien-that"
AUTH_TRUST_HOST="true"
```

Mật khẩu có ký tự đặc biệt (`@ : / ? # %`) phải URL-encode — `@` thành `%40`.

```bash
docker compose up -d --build                     # migrate chạy trước, xong mới start app
docker compose run --rm migrate npm run db:seed  # tạo admin, chạy tay một lần
docker compose logs -f app
```

App publish ra `5679` trên host, nginx proxy vào đó:

```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/chatbot
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ten-mien-that
```

`APP_URL` phải là origin thật vì mã nhúng widget sinh từ biến này.

### Các lần sau

```bash
./deploy/deploy.sh     # git pull -> build -> migrate -> restart
```

Service `migrate` chạy `prisma migrate deploy` rồi thoát; `app` có `depends_on:
service_completed_successfully` nên chỉ start khi migrate exit 0. Không dùng
`npm run db:migrate` (migrate dev) trên production — nó cần shadow database, đòi
role có quyền `CREATEDB`.

Image build theo `output: "standalone"` khai báo trong `next.config.ts`, phải giữ
config đó. App publish ra cổng `5679` của host; đổi cổng thì sửa vế trái của
`ports` trong `docker-compose.yml`, vế phải giữ nguyên `3000`.

## Quy trình onboard một tenant

1. **Tạo tenant** — nhập tên, `dify_app_id`, `dify_api_key`. Hệ thống tự sinh sẵn
   một public key và cấu hình widget mặc định.
2. **Thêm domain whitelist** — bắt buộc. Whitelist rỗng thì mọi request chat đều
   bị từ chối 403, dù key hợp lệ.
3. **Chỉnh cấu hình widget** — mode, màu, tên bot, tin nhắn chào.
4. **Gửi mã nhúng** ở tab "Mã nhúng" cho tenant dán vào website.

Domain được chuẩn hoá khi lưu: bỏ scheme, port, path, query và tiền tố `www.`.
Một entry `example.com` khớp cả `example.com` lẫn `www.example.com`; muốn phủ mọi
subdomain thì nhập `*.example.com`.

## Widget

```html
<!-- bubble: bong bóng nổi ở góc màn hình -->
<script src="https://dashboard.example.com/widget.js"
        data-api-key="pk_…" data-mode="bubble" defer></script>

<!-- inline: nhúng cố định vào một div -->
<div id="chatbot-container" style="height: 600px"></div>
<script src="https://dashboard.example.com/widget.js"
        data-api-key="pk_…" data-mode="inline"
        data-target="#chatbot-container" defer></script>
```

Vài quyết định đáng lưu ý:

- **Dashboard là nguồn sự thật cho `mode`**, `data-mode` chỉ là giá trị dự phòng.
  Nhờ vậy admin đổi mode mà tenant không phải dán lại script. Nếu dashboard đặt
  `inline` nhưng trang không có phần tử đích, widget **hạ cấp xuống bubble** thay
  vì biến mất im lặng.
- Base URL suy ra từ chính `src` của thẻ script, tenant không phải cấu hình thêm.
- Nội dung trả về từ Dify luôn render bằng `textContent`, không bao giờ dựng HTML.
- `/api/widget/config` cache 60 giây phía browser, nên cấu hình mới có hiệu lực
  chậm nhất sau 1 phút.

## Bảo mật

- Mật khẩu admin hash bằng bcrypt (cost 12). Đăng nhập với email không tồn tại
  vẫn so sánh với một hash mồi để không lộ danh sách email qua timing.
- `dify_api_key` mã hoá AES-256-GCM (`src/lib/crypto.ts`), plaintext không bao giờ
  rời khỏi server — UI chỉ hiển thị dạng che `app-••••••••-KEY`.
- Public key 40 ký tự random từ CSPRNG, có rejection sampling để không lệch phân
  phối (~231 bit entropy).
- Domain whitelist kiểm tra ở **mọi** request `/api/widget/chat`; không có
  `Origin` lẫn `Referer` thì từ chối.
- CORS chỉ mở cho `/api/widget/*` và echo đúng origin của người gọi, không dùng
  `*`. Route `/api/admin/*` và Server Actions giữ same-origin.
- Lỗi từ Dify được log đầy đủ ở server nhưng trả về widget dưới dạng thông báo
  chung, tránh lộ cấu trúc hệ thống nội bộ.

### Giới hạn đã biết

Rate limiter lưu trong bộ nhớ tiến trình (`src/lib/rate-limit.ts`) nên **chỉ đúng
khi chạy một instance**. Khi scale ngang hoặc deploy serverless, thay bằng store
dùng chung (Redis / `@upstash/ratelimit`) — giữ nguyên chữ ký `checkRateLimit` là đủ.

## Cấu trúc thư mục

```
prisma/            schema, migration, seed
public/widget.js   widget nhúng (không qua bundler)
src/app/(dashboard)/  UI quản trị — Server Components
src/app/api/widget/   endpoint công khai cho widget
src/app/api/admin/    endpoint admin trả JSON
src/components/    UI kit + component theo màn hình
src/lib/           crypto, prisma, dify, domain, rate-limit, auth
src/server/        Server Actions + schema validate (zod)
src/proxy.ts       chặn route (Next 16 đổi tên từ middleware.ts)
```

## Lệnh thường dùng

```bash
npm run dev         # dev server
npm run build       # build production
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run db:migrate  # tạo migration mới khi đổi schema
npm run db:deploy   # áp migration lên môi trường đã có
npm run db:seed     # tạo admin
npm run db:studio   # Prisma Studio
```

## Chưa làm (Phase 2)

Theo mục 7 của đặc tả: NPM package cho widget, iframe/QR export, UI đọc
`conversation_logs`, phân quyền nhiều loại admin, responsive mobile cho dashboard.
Bảng `conversation_logs` đã có sẵn trong schema và ghi được qua
`ENABLE_CONVERSATION_LOG`, nhưng chưa có màn hình nào đọc nó.
