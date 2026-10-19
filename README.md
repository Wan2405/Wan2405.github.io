# Hệ thống Quản lý Thư viện Mượn – Trả Sách sử dụng REST API (ReadOwl Library)

Dự án giữa kỳ môn **Lập trình Web (503073)** — Xây dựng theo kiến trúc **Client–Server tách biệt**, giao tiếp hoàn toàn qua **RESTful Web Service (`/api/v1/*`)** trả về JSON, xác thực **Bearer JWT (HS256)** và lưu trữ trên **MySQL / MariaDB (InnoDB, `utf8mb4`)**.

---

## 1. Phân công & Tích hợp 2 thành viên

| Thành viên | Phụ trách | Các Module & Màn hình chính |
|---|---|---|
| **Người 1 (Duy An)** | Xác thực, Tài khoản, Quản lý Độc giả & Mượn – Trả Sách | `api/common/auth.php`, `api/modules/{auth,users,loans}`, `public/{login,register,profile,my-loans}.html`, `public/admin/{users,loans}.html`, `docs/openapi-auth-loans.yaml`, `tests/run-api-tests.php`, `tests/postman/member1-collection.json` |
| **Người 2** | CSDL chung, Danh mục, Kho sách, Tra cứu – Lọc – Phân trang & Thống kê | `database/{schema,seed}.sql`, `api/index.php`, `api/common/{db,request,response}.php`, `api/modules/{categories,books,statistics}`, `public/{index,book-detail}.html`, `public/admin/{dashboard,books,categories}.html`, `docs/{openapi,openapi-catalog}.yaml`, `tests/run-member2-tests.php`, `tests/postman/library-rest-full.postman_collection.json` |

---

## 2. Cấu trúc thư mục dự án

```text
LTW-GK/
├── api/
│   ├── index.php                       # Front Controller / Router cho toàn bộ /api/v1/*
│   ├── common/
│   │   ├── auth.php                    # Ký & xác thực JWT HS256, requireAuth(), requireAdmin()
│   │   ├── db.php                      # Kết nối PDO MySQL/MariaDB (InnoDB, utf8mb4)
│   │   ├── request.php                 # Đọc JSON body, Authorization header, getOptionalAuthUser()
│   │   └── response.php                # Chuẩn hóa JSON envelope (sendJson, sendError, jsonSuccess)
│   └── modules/
│       ├── auth/                       # POST /auth/register, POST /auth/login, GET /auth/me (/me)
│       ├── users/                      # GET /users, GET /users/{id}, PATCH /users/{id}, DELETE /users/{id}
│       ├── loans/                      # GET /loans, POST /loans, GET /loans/{id}, PATCH /loans/{id}
│       ├── categories/                 # GET/POST /categories, GET/PUT/DELETE /categories/{id}
│       ├── books/                      # GET/POST /books, GET/PUT/DELETE /books/{id}
│       └── statistics/                 # GET /statistics, /statistics/{top-books,overdue,categories}
├── config/
│   ├── app.php                         # Cấu hình JWT TTL (900s), giới hạn 3 cuốn, hạn mượn 14 ngày
│   ├── database.php                    # Cấu hình kết nối MySQL (host, port, dbname, username, password)
│   └── jwt-secret.php                  # Khóa bí mật JWT (sinh tự động qua scripts/init-auth.php)
├── database/
│   ├── schema.sql                      # DDL tạo 4 bảng: users, categories, books, loans (InnoDB)
│   └── seed.sql                        # Dữ liệu mẫu: 6 users, 6 categories, 20 books, 15 loans
├── docs/
│   ├── openapi.yaml                    # Đặc tả OpenAPI 3.0.3 tổng hợp toàn hệ thống
│   ├── openapi-auth-loans.yaml         # Đặc tả OpenAPI phần Auth, Users, Loans (Người 1)
│   └── openapi-catalog.yaml            # Đặc tả OpenAPI phần Categories, Books, Statistics (Người 2)
├── public/
│   ├── index.html                      # Trang chủ tra cứu, lọc, sắp xếp & phân trang sách (Guest/Member/Admin)
│   ├── book-detail.html                # Trang chi tiết đầu sách & gửi yêu cầu mượn sách
│   ├── login.html                      # Trang đăng nhập
│   ├── register.html                   # Trang đăng ký tài khoản độc giả
│   ├── profile.html                    # Trang hồ sơ cá nhân
│   ├── my-loans.html                   # Giao diện kệ sách 3D ReadOwl & quản lý phiếu mượn độc giả
│   ├── admin/
│   │   ├── dashboard.html              # Bảng điều khiển thống kê tổng quan hệ thống
│   │   ├── users.html                  # Quản lý độc giả (khóa/mở khóa, xem lịch sử, xóa tài khoản mới)
│   │   ├── loans.html                  # Quản lý mượn – trả (duyệt giao sách, từ chối, xác nhận trả)
│   │   ├── books.html                  # Quản lý kho sách (thêm, sửa, điều chỉnh số bản, xóa/ngừng)
│   │   └── categories.html             # Quản lý danh mục sách
│   └── assets/                         # CSS, JS (Fetch API), ảnh bìa SVG nội bộ & logo
├── scripts/
│   └── init-auth.php                   # Script khởi tạo khóa bí mật JWT cho máy cục bộ
├── tests/
│   ├── test-db.php                     # Kiểm tra kết nối MySQL và danh sách bảng
│   ├── run-api-tests.php               # Script kiểm thử tự động 32 kịch bản (Người 1)
│   ├── run-member2-tests.php           # Script kiểm thử tự động 31 kịch bản (Người 2)
│   └── postman/
│       ├── member1-collection.json     # Postman Collection phần Người 1
│       └── library-rest-full.postman_collection.json # Postman Collection toàn hệ thống
├── chay-web.bat                        # File chạy nhanh server tại http://localhost:8000
└── router.php                          # Router cho PHP built-in web server
```

---

## 3. Hướng dẫn cài đặt & chạy nhanh

### Bước 1: Khởi tạo Cơ sở dữ liệu MySQL
1. Bật **MySQL** trong **XAMPP Control Panel**.
2. Nạp cấu trúc bảng và dữ liệu mẫu bằng lệnh (hoặc qua phpMyAdmin):
   ```powershell
   & "C:\xampp\mysql\bin\mysql.exe" --default-character-set=utf8mb4 -u root -e "SOURCE C:/Users/ASUS/Desktop/LTW-GK/database/schema.sql"
   & "C:\xampp\mysql\bin\mysql.exe" --default-character-set=utf8mb4 -u root library_rest -e "SOURCE C:/Users/ASUS/Desktop/LTW-GK/database/seed.sql"
   ```

### Bước 2: Khởi tạo khóa JWT & Chạy Web Server
Mở Terminal tại thư mục gốc `C:\Users\ASUS\Desktop\LTW-GK` (hoặc nhấp đúp `chay-web.bat`):
```powershell
& "C:\xampp\php\php.exe" scripts/init-auth.php
& "C:\xampp\php\php.exe" -S localhost:8000 -t public router.php
```
- **Trang tra cứu sách công khai**: `http://localhost:8000/index.html`
- **Trang đăng nhập**: `http://localhost:8000/login.html`
- **Kệ sách độc giả (ReadOwl)**: `http://localhost:8000/my-loans.html`
- **Quản trị hệ thống (Admin Dashboard)**: `http://localhost:8000/admin/dashboard.html`

*(Ngoài ra, dự án cũng tương thích khi chạy dưới Apache XAMPP tại `http://localhost/LTW-GK/public/index.html`)*.

---

## 4. Tài khoản mẫu (Seed Data)

| Vai trò | Họ tên | Email | Mật khẩu | Trạng thái |
|---|---|---|---|---|
| **Admin** | Quản trị Thư viện | `admin@example.com` | `Admin12345` | Hoạt động (`is_active = 1`) |
| **Member** | Nguyễn Văn An | `an@example.com` | `ThuVien123` | Hoạt động (`is_active = 1`) |
| **Member** | Lê Minh Châu | `chau.le@example.com` | `ThuVien123` | Hoạt động (`is_active = 1`) |
| **Member** | Hoàng Mai Anh | `anh.hoang@example.com` | `ThuVien123` | Đang mượn đủ 3 cuốn (`BORROW_LIMIT_REACHED`) |
| **Member** | Võ Đăng Khôi | `khoi.vo@example.com` | `ThuVien123` | Chưa có lịch sử mượn (dùng để test xóa Member) |
| **Member** | Phạm Quốc Bảo | `bao.pham@example.com` | `ThuVien123` | Đang bị khóa (`is_active = 0` -> `403 ACCOUNT_DISABLED`) |

---

## 5. Kiểm thử tự động (CLI & Postman)

Khi MySQL và server `localhost:8000` đang chạy, mở Terminal mới và chạy:
```powershell
# 1. Kiểm thử 32 kịch bản Auth, Users, Loans & Tồn kho (Người 1)
& "C:\xampp\php\php.exe" tests/run-api-tests.php

# 2. Kiểm thử 31 kịch bản Categories, Books, Search/Filter/Pagination & Statistics (Người 2)
& "C:\xampp\php\php.exe" tests/run-member2-tests.php
```
Hoặc import file `tests/postman/library-rest-full.postman_collection.json` (và `tests/postman/member1-collection.json`) vào **Postman Collection Runner** để chạy toàn bộ kịch bản kiểm thử tự động.
