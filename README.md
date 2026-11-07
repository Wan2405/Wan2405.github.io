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
│   ├── database.php                    # Cấu hình kết nối MySQL (host, port, name/user/password; hỗ trợ dbname/username/pass)
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
│   ├── run-api-tests.php               # Script kiểm thử tự động 34 phép kiểm tra (Người 1)
│   ├── run-member2-tests.php           # Script kiểm thử tự động 31 kịch bản (Người 2)
│   └── postman/
│       ├── member1-collection.json     # Postman Collection phần Người 1
│       └── library-rest-full.postman_collection.json # Postman Collection toàn hệ thống
├── chay-web.bat                        # File chạy nhanh server tại http://localhost:8000
└── router.php                          # Router cho PHP built-in web server
```

---

## 3. Hướng dẫn cài đặt & chạy nhanh

### Chuẩn bị môi trường

- PHP >= 8.1; bật ctype, mbstring, PDO và PDO MySQL. Các script kiểm thử PHP cần curl.
- Chạy `composer install` từ thư mục gốc. Manifest/lock hiện thống nhất firebase/php-jwt 7.2.1.
- Cấu hình DB trong `config/database.php` với `host`, `port`, `name`, `user`, `password`; giữ thông tin của máy bạn.
- Các lệnh dưới đây dùng đường dẫn máy ví dụ; thay bằng đường dẫn XAMPP và dự án thực tế của bạn.
- Nếu cập nhật một dự án đang có dữ liệu, chỉ chép code/config phù hợp; không import lại schema/seed. Các file SQL có thao tác xóa/tạo lại dữ liệu và chỉ dùng khi chủ động khởi tạo DB thử mới.

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
# 1. Kiểm thử 34 phép kiểm tra Auth, Users, Loans & Tồn kho (Người 1)
& "C:\xampp\php\php.exe" tests/run-api-tests.php

# 2. Kiểm thử 31 kịch bản Categories, Books, Search/Filter/Pagination & Statistics (Người 2)
& "C:\xampp\php\php.exe" tests/run-member2-tests.php
```
Hoặc import file `tests/postman/library-rest-full.postman_collection.json` (và `tests/postman/member1-collection.json`) vào **Postman Collection Runner** để chạy toàn bộ kịch bản kiểm thử tự động.


## 6. Hợp đồng API sau hai đợt sửa lỗi

- Dùng `docs/openapi.yaml` làm đặc tả tổng hợp. Hai file `openapi-auth-loans.yaml` và `openapi-catalog.yaml` là các phần của cùng hợp đồng. Có đủ Health, Auth, Users, Loans, Categories, Books và Statistics, kể cả các route thống kê con và alias `/me`.
- Server mặc định: `http://localhost:8000/api/v1`; đổi server URL nếu chạy trong thư mục con Apache. Có thể import YAML vào công cụ hỗ trợ OpenAPI 3.0.3.
- Mọi request ghi JSON dùng `Content-Type: application/json` và body object. JSON hỏng/rỗng/mảng trả 400; sai content type trả 415; sai kiểu hoặc giá trị trường/query trả 422; method sai trả 405 kèm Allow.
- Query phải là giá trị đơn, không dùng dạng mảng như `page[]=1`. ID nằm trong miền INT UNSIGNED. Chuỗi số nguyên hợp lệ từ client cũ vẫn được hỗ trợ.
- `books.publish_year` là tên trường thật. `is_active` trong response là số nguyên 0/1. POST sách cần title, author, category_id, total_copies; PUT/PATCH giữ nguyên những trường không gửi.
- Guest/Member không xem được chi tiết sách inactive (404); Admin xem được khi gửi Bearer token. Loans API vẫn trả lịch sử cho đúng chủ sở hữu/Admin.
- Giới hạn API books vẫn là 50 đầu sách mỗi trang. Màn quản trị và thư viện Member tự gọi tiếp các trang theo bộ lọc rồi hiển thị đầy đủ. Trang tra cứu công khai vẫn dùng các nút phân trang hiện có.
- Bìa sách chỉ nhận null/chuỗi rỗng hoặc đường dẫn chính xác tới SVG trong `public/assets/images/covers`. Các URL, đường dẫn hệ thống và `../` bị từ chối. Bộ ảnh đang dùng trong seed được giữ hợp lệ.
- PHP và từng kết nối DB dùng giờ Việt Nam (+07:00). DATETIME/DATE không chứa offset; health.timestamp có `+07:00`. Bản cập nhật không tự diễn giải/chuyển đổi các bản ghi thời gian cũ.
- Pending chưa giữ chỗ, chưa trừ tồn; sửa sách không bị chặn bởi số lượng pending. Không được giảm tổng xuống dưới số bản đã borrowed. Xóa sách có pending/borrowed vẫn bị chặn; chỉ có lịch sử đã kết thúc thì chuyển inactive để giữ lịch sử.
- Phiên bản này chưa triển khai ETag/If-None-Match/304; đặc tả không quảng cáo tính năng cache đó.
- Router dùng các file `routes.php` trong Books/Categories/Statistics và các file nghiệp vụ Auth/Users/Loans. Những module cũ không được router gọi được giữ nguyên để tránh xóa công việc đã có; chúng không phải entry point để mô tả API hiện tại.
