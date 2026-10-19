-- =============================================================================
-- DỮ LIỆU MẪU HỢP NHẤT (SEED DATA) — HỆ THỐNG QUẢN LÝ THƯ VIỆN MƯỢN - TRẢ SÁCH
-- Tương thích 100% cả Người 1 (Duy An) và Người 2 (Danh mục, Sách, Tra cứu, Thống kê)
-- =============================================================================
-- Tài khoản mẫu:
--   + Admin  : admin@example.com    | Mật khẩu: Admin12345
--   + Member : an@example.com       | Mật khẩu: ThuVien123
--   + Member : chau.le@example.com  | Mật khẩu: ThuVien123
--   + Member : bao.pham@example.com | Mật khẩu: ThuVien123 (Tài khoản bị khóa is_active = 0)
--   + Member : anh.hoang@example.com| Mật khẩu: ThuVien123
--   + Member : khoi.vo@example.com  | Mật khẩu: ThuVien123 (Độc giả mới chưa có phiếu mượn)
-- =============================================================================

USE library_rest;
SET NAMES utf8mb4;
SET time_zone = '+07:00';

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE loans;
TRUNCATE TABLE books;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. BẢNG USERS (1 Admin + 5 Member)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, full_name, email, password_hash, role, is_active, created_at) VALUES
(1, 'Quản trị Thư viện', 'admin@example.com',    '$2y$10$7CCwARfXIoietbE1ivGFUuUPbvRi6dkHGUKqzSLdAmHjh.7PruzbO', 'admin',  1, '2026-01-05 08:00:00'),
(2, 'Nguyễn Văn An',     'an@example.com',       '$2y$10$jcPls5eHDQ7iEHai1pAp4Oj1v0ZmoJG6TagUgqw/BdIaW5WTlWn..', 'member', 1, '2026-01-10 09:15:00'),
(3, 'Lê Minh Châu',      'chau.le@example.com',  '$2y$10$jcPls5eHDQ7iEHai1pAp4Oj1v0ZmoJG6TagUgqw/BdIaW5WTlWn..', 'member', 1, '2026-01-12 10:30:00'),
(4, 'Phạm Quốc Bảo',     'bao.pham@example.com', '$2y$10$jcPls5eHDQ7iEHai1pAp4Oj1v0ZmoJG6TagUgqw/BdIaW5WTlWn..', 'member', 0, '2026-01-15 14:20:00'),
(5, 'Hoàng Mai Anh',     'anh.hoang@example.com','$2y$10$jcPls5eHDQ7iEHai1pAp4Oj1v0ZmoJG6TagUgqw/BdIaW5WTlWn..', 'member', 1, '2026-01-18 16:00:00'),
(6, 'Võ Đăng Khôi',      'khoi.vo@example.com',  '$2y$10$jcPls5eHDQ7iEHai1pAp4Oj1v0ZmoJG6TagUgqw/BdIaW5WTlWn..', 'member', 1, '2026-01-20 11:10:00');

-- -----------------------------------------------------------------------------
-- 2. BẢNG CATEGORIES (6 danh mục: 5 danh mục có sách + 1 danh mục trống để test xóa)
-- -----------------------------------------------------------------------------
INSERT INTO categories (id, name, description, created_at) VALUES
(1, 'Công nghệ & Lập trình',        'Sách về kỹ thuật phần mềm, kiến trúc hệ thống, cơ sở dữ liệu và phát triển ứng dụng web.', '2026-01-05 08:10:00'),
(2, 'Khoa học & Tư duy',            'Sách khám phá khoa học tự nhiên, vũ trụ, tâm lý học nhận thức và tư duy phản biện.',       '2026-01-05 08:11:00'),
(3, 'Văn học & Tiểu thuyết',        'Tác phẩm văn học kinh điển và tiểu thuyết hiện đại trong nước và quốc tế.',                '2026-01-05 08:12:00'),
(4, 'Kinh tế & Quản trị',           'Sách về quản trị doanh nghiệp, tài chính cá nhân, khởi nghiệp và chiến lược kinh doanh.',  '2026-01-05 08:13:00'),
(5, 'Kỹ năng & Phát triển bản thân','Sách rèn luyện thói quen, phương pháp học tập, giao tiếp và quản lý thời gian hiệu quả.',  '2026-01-05 08:14:00'),
(6, 'Lịch sử & Triết học',          'Danh mục chuyên khảo lịch sử và triết học (chưa có đầu sách — dùng để kiểm thử xóa danh mục rỗng).', '2026-01-05 08:15:00');

-- -----------------------------------------------------------------------------
-- 3. BẢNG BOOKS (20 đầu sách: 19 đầu sách active + 1 đầu sách ngừng hoạt động is_active=0)
-- -----------------------------------------------------------------------------
INSERT INTO books (
    id, category_id, isbn, title, author, publisher, publish_year,
    description, cover_path, total_copies, available_copies, is_active, created_at
) VALUES
(1,  1, '978-604-001-001', 'Clean Code — Mã Nguồn Sạch',
    'Robert C. Martin', 'NXB Bách Khoa', 2022,
    'Nguyên tắc viết mã rõ ràng, dễ bảo trì, đặt tên có ý nghĩa và tái cấu trúc hệ thống phần mềm chuyên nghiệp.',
    'assets/images/covers/clean-code.svg', 5, 4, 1, '2026-01-06 08:00:00'),

(2,  1, '978-604-001-002', 'Thiết Kế Hệ Thống RESTful Web APIs',
    'Leonard Richardson', 'NXB Khoa Học & Kỹ Thuật', 2023,
    'Hướng dẫn thiết kế kiến trúc REST chuẩn mực, định danh tài nguyên bằng URI, HTTP status code và bảo mật bằng JWT.',
    'assets/images/covers/web-php-mysql.svg', 4, 3, 1, '2026-01-06 08:05:00'),

(3,  1, '978-604-001-003', 'Lập Trình PHP & MySQL Thực Chiến',
    'Nguyễn Minh Đức', 'NXB Thông Tin & Truyền Thông', 2024,
    'Xây dựng ứng dụng web hiện đại với PHP 8.2, PDO Prepared Statements, quản lý giao dịch InnoDB và kiến trúc MVC/API.',
    'assets/images/covers/web-php-mysql.svg', 6, 6, 1, '2026-01-06 08:10:00'),

(4,  1, '978-604-001-004', 'Cấu Trúc Dữ Liệu và Giải Thuật Hiện Đại',
    'Lê Hoàng Vũ', 'NXB Đại Học Quốc Gia', 2021,
    'Trình bày trực quan về danh sách liên kết, cây tìm kiếm, bảng băm, đồ thị và phân tích độ phức tạp thuật toán.',
    'assets/images/covers/algorithms.svg', 5, 4, 1, '2026-01-06 08:15:00'),

(5,  2, '978-604-002-001', 'Tư Duy Nhanh và Chậm',
    'Daniel Kahneman', 'NXB Thế Giới', 2022,
    'Khám phá hai hệ thống tư duy chi phối cách con người đưa ra phán đoán, quyết định và những thiên kiến nhận thức thường gặp.',
    'assets/images/covers/thinking-fast-slow.svg', 4, 3, 1, '2026-01-06 08:20:00'),

(6,  2, '978-604-002-002', 'Lược Sử Thời Gian',
    'Stephen Hawking', 'NXB Trẻ', 2021,
    'Hành trình khám phá nguồn gốc vũ trụ, lỗ đen, bức xạ Hawking và các định luật vật lý nền tảng của không-thời gian.',
    'assets/images/covers/default-book.svg', 4, 4, 1, '2026-01-06 08:25:00'),

(7,  2, '978-604-002-003', 'Sapiens — Lược Sử Loài Người',
    'Yuval Noah Harari', 'NXB Tri Thức', 2023,
    'Bức tranh toàn cảnh về sự tiến hóa của loài người qua cách mạng nhận thức, cách mạng nông nghiệp và cách mạng khoa học.',
    'assets/images/covers/sapiens.svg', 5, 4, 1, '2026-01-06 08:30:00'),

(8,  3, '978-604-003-001', 'Dế Mèn Phiêu Lưu Ký',
    'Tô Hoài', 'NXB Kim Đồng', 2020,
    'Tác phẩm văn học thiếu nhi kinh điển Việt Nam về hành trình trưởng thành, tình bạn và khát vọng hòa bình của Dế Mèn.',
    'assets/images/covers/de-men.svg', 6, 6, 1, '2026-01-06 08:35:00'),

(9,  3, '978-604-003-002', 'Nhà Giả Kim',
    'Paulo Coelho', 'NXB Hội Nhà Văn', 2021,
    'Câu chuyện giàu chất thơ về chàng chăn cừu Santiago trên hành trình theo đuổi giấc mơ và lắng nghe tiếng nói trái tim.',
    'assets/images/covers/nha-gia-kim.svg', 5, 5, 1, '2026-01-06 08:40:00'),

(10, 3, '978-604-003-003', 'Mắt Biếc',
    'Nguyễn Nhật Ánh', 'NXB Trẻ', 2022,
    'Tiểu thuyết giàu cảm xúc về tuổi học trò, làng Đo Đo và mối tình đơn phương trong trẻo qua năm tháng.',
    'assets/images/covers/mat-biec.svg', 4, 4, 1, '2026-01-06 08:45:00'),

(11, 4, '978-604-004-001', 'Khởi Nghiệp Tinh Gọn — The Lean Startup',
    'Eric Ries', 'NXB Lao Động', 2022,
    'Phương pháp xây dựng sản phẩm thử nghiệm tối thiểu (MVP), đo lường phản hồi khách hàng và đổi mới liên tục.',
    'assets/images/covers/default-book.svg', 4, 4, 1, '2026-01-06 08:50:00'),

(12, 4, '978-604-004-002', 'Tâm Lý Học Về Tiền',
    'Morgan Housel', 'NXB Dân Trí', 2023,
    'Những bài học sâu sắc về hành vi tài chính, sự kiên nhẫn, lãi kép và cách xây dựng sự tự do bền vững.',
    'assets/images/covers/default-book.svg', 5, 5, 1, '2026-01-06 08:55:00'),

(13, 5, '978-604-005-001', 'Atomic Habits — Thay Đổi Tí Hon, Hiệu Quả Bất Ngờ',
    'James Clear', 'NXB Phương Đông', 2023,
    'Hệ thống 4 quy luật thiết lập thói quen tốt và loại bỏ thói quen xấu thông qua những cải tiến 1% mỗi ngày.',
    'assets/images/covers/default-book.svg', 6, 5, 1, '2026-01-06 09:00:00'),

(14, 5, '978-604-005-002', 'Deep Work — Làm Ra Làm, Chơi Ra Chơi',
    'Cal Newport', 'NXB Thế Giới', 2022,
    'Chiến lược rèn luyện khả năng tập trung sâu trong kỷ nguyên số đầy xao nhãng để tạo ra giá trị vượt trội.',
    'assets/images/covers/default-book.svg', 4, 4, 1, '2026-01-06 09:05:00'),

(15, 1, '978-604-001-005', 'Bảo Mật Ứng Dụng Web & Cơ Sở Dữ Liệu',
    'Trần Quốc Tuấn', 'NXB Bách Khoa', 2024,
    'Phân tích các lỗ hổng phổ biến (SQL Injection, XSS, CSRF, Broken Access Control) và giải pháp phòng vệ thực tế.',
    'assets/images/covers/web-php-mysql.svg', 3, 3, 1, '2026-01-06 09:10:00'),

(16, 1, '978-604-001-006', 'Designing Data-Intensive Applications',
    'Martin Kleppmann', 'NXB Khoa Học & Kỹ Thuật', 2021,
    'Kiến trúc hệ thống phân tán, cơ sở dữ liệu quan hệ & NoSQL, xử lý đồng thời (Concurrency) và đảm bảo toàn vẹn dữ liệu.',
    'assets/images/covers/algorithms.svg', 3, 3, 1, '2026-01-06 09:15:00'),

(17, 4, '978-604-004-003', 'Quản Trị Học Hiện Đại',
    'Stephen P. Robbins', 'NXB Kinh Tế TP.HCM', 2020,
    'Giáo trình nền tảng về hoạch định, tổ chức, lãnh đạo và kiểm soát trong các tổ chức doanh nghiệp hiện đại.',
    'assets/images/covers/default-book.svg', 4, 4, 1, '2026-01-06 09:20:00'),

(18, 5, '978-604-005-003', 'Đắc Nhân Tâm',
    'Dale Carnegie', 'NXB Tổng Hợp TP.HCM', 2019,
    'Nghệ thuật ứng xử, lắng nghe và thuyết phục con người trong công việc cũng như cuộc sống hằng ngày.',
    'assets/images/covers/default-book.svg', 5, 5, 1, '2026-01-06 09:25:00'),

(19, 1, '978-604-001-007', 'Thực Hành Docker & Kubernetes Căn Bản',
    'Phạm Minh Hoàng', 'NXB Thông Tin & Truyền Thông', 2023,
    'Hướng dẫn đóng gói ứng dụng với Docker Container (Đầu sách đang hết bản khả dụng available_copies = 0 để kiểm thử).',
    'assets/images/covers/web-php-mysql.svg', 1, 0, 1, '2026-01-06 09:30:00'),

(20, 1, '978-604-001-008', 'Giáo Trình Pascal & FoxPro Cổ Điển (Ngừng lưu hành)',
    'Nhiều Tác Giả', 'NXB Giáo Dục', 2002,
    'Tài liệu lưu trữ nội bộ đã ngừng cho mượn mới (is_active = 0) để kiểm thử phân quyền tra cứu và chi tiết sách.',
    'assets/images/covers/default-book.svg', 2, 2, 0, '2026-01-06 09:35:00');

-- -----------------------------------------------------------------------------
-- 4. BẢNG LOANS (Đủ các trạng thái: pending, borrowed, overdue, returned, rejected, cancelled)
-- -----------------------------------------------------------------------------
INSERT INTO loans (
    id, user_id, book_id, status,
    requested_at, borrowed_at, due_date, returned_at,
    approved_by, returned_by, rejection_reason
) VALUES
-- Độc giả Nguyễn Văn An (user_id = 2)
(1, 2, 1, 'borrowed',
    DATE_SUB(NOW(), INTERVAL 6 DAY),
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_ADD(CURDATE(), INTERVAL 9 DAY),
    NULL, 1, NULL, NULL),

(2, 2, 5, 'borrowed',
    DATE_SUB(NOW(), INTERVAL 18 DAY),
    DATE_SUB(NOW(), INTERVAL 17 DAY),
    DATE_SUB(CURDATE(), INTERVAL 3 DAY),
    NULL, 1, NULL, NULL),

(3, 2, 3, 'pending',
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    NULL, NULL, NULL, NULL, NULL, NULL),

(4, 2, 8, 'returned',
    DATE_SUB(NOW(), INTERVAL 25 DAY),
    DATE_SUB(NOW(), INTERVAL 24 DAY),
    DATE_SUB(CURDATE(), INTERVAL 10 DAY),
    DATE_SUB(NOW(), INTERVAL 12 DAY),
    1, 1, NULL),

(5, 2, 9, 'returned',
    DATE_SUB(NOW(), INTERVAL 35 DAY),
    DATE_SUB(NOW(), INTERVAL 34 DAY),
    DATE_SUB(CURDATE(), INTERVAL 20 DAY),
    DATE_SUB(NOW(), INTERVAL 21 DAY),
    1, 1, NULL),

-- Độc giả Lê Minh Châu (user_id = 3)
(6, 3, 2, 'borrowed',
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_ADD(CURDATE(), INTERVAL 11 DAY),
    NULL, 1, NULL, NULL),

(7, 3, 7, 'borrowed',
    DATE_SUB(NOW(), INTERVAL 20 DAY),
    DATE_SUB(NOW(), INTERVAL 19 DAY),
    DATE_SUB(CURDATE(), INTERVAL 5 DAY),
    NULL, 1, NULL, NULL),

(8, 3, 10, 'pending',
    DATE_SUB(NOW(), INTERVAL 2 HOUR),
    NULL, NULL, NULL, NULL, NULL, NULL),

(9, 3, 6, 'rejected',
    DATE_SUB(NOW(), INTERVAL 8 DAY),
    NULL, NULL, NULL, 1, NULL,
    'Bản sách yêu cầu đang được kiểm kê định kỳ tại quầy thủ thư.'),

(10, 3, 12, 'cancelled',
    DATE_SUB(NOW(), INTERVAL 10 DAY),
    NULL, NULL, NULL, NULL, NULL, NULL),

-- Độc giả Hoàng Mai Anh (user_id = 5)
(11, 5, 4, 'borrowed',
    DATE_SUB(NOW(), INTERVAL 3 DAY),
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_ADD(CURDATE(), INTERVAL 12 DAY),
    NULL, 1, NULL, NULL),

(12, 5, 13, 'borrowed',
    DATE_SUB(NOW(), INTERVAL 2 DAY),
    DATE_SUB(NOW(), INTERVAL 1 DAY),
    DATE_ADD(CURDATE(), INTERVAL 13 DAY),
    NULL, 1, NULL, NULL),

(13, 5, 19, 'borrowed',
    DATE_SUB(NOW(), INTERVAL 5 DAY),
    DATE_SUB(NOW(), INTERVAL 4 DAY),
    DATE_ADD(CURDATE(), INTERVAL 10 DAY),
    NULL, 1, NULL, NULL),

(14, 5, 11, 'pending',
    DATE_SUB(NOW(), INTERVAL 5 HOUR),
    NULL, NULL, NULL, NULL, NULL, NULL),

(15, 5, 1, 'returned',
    DATE_SUB(NOW(), INTERVAL 28 DAY),
    DATE_SUB(NOW(), INTERVAL 27 DAY),
    DATE_SUB(CURDATE(), INTERVAL 13 DAY),
    DATE_SUB(NOW(), INTERVAL 15 DAY),
    1, 1, NULL);

-- -----------------------------------------------------------------------------
-- 5. ĐỐI CHIẾU TỒN KHO: available_copies = total_copies - số phiếu đang borrowed
-- -----------------------------------------------------------------------------
UPDATE books
SET available_copies = CAST(total_copies AS SIGNED) - (
    SELECT COUNT(*) FROM loans
    WHERE loans.book_id = books.id AND loans.status = 'borrowed'
);
