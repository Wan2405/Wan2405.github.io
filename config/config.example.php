<?php
/**
 * File cấu hình mẫu (Config Template) - Hệ thống thư viện REST API
 *
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Sao chép file này thành `config/config.php`:
 *      copy config\config.example.php config\config.php
 * 2. Tạo chuỗi khóa bí mật JWT ngẫu nhiên (tối thiểu 32 bytes) bằng lệnh:
 *      C:\xampp\php\php.exe -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"
 * 3. Điền thông tin kết nối MySQL/MariaDB và JWT_SECRET vào `config/config.php`.
 * 4. KHÔNG commit file `config/config.php` chứa secret thật lên Git.
 */

declare(strict_types=1);

// Thống nhất múi giờ ứng dụng (+07:00) theo quy ước nhóm
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Tự động suy ra đường dẫn gốc của dự án trong htdocs (ví dụ: "/LTW-GK" hoặc "")
// Có thể ghi đè cố định nếu cần, nhưng để tự động giúp chạy trên máy khác không cần sửa nhiều nơi (Test B21).
$detectedBasePath = '';
if (!empty($_SERVER['SCRIPT_NAME'])) {
    // Nếu gọi qua /<folder>/api/index.php -> lấy "/<folder>"
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
    $detectedBasePath = preg_replace('#/api(?:/.*)?$#', '', $scriptDir);
    if ($detectedBasePath === '/' || $detectedBasePath === '.') {
        $detectedBasePath = '';
    }
}

// 1. Cấu hình Database (MySQL / MariaDB trên XAMPP)
defined('DB_HOST')    || define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
defined('DB_PORT')    || define('DB_PORT', (int)(getenv('DB_PORT') ?: 3306));
defined('DB_NAME')    || define('DB_NAME', getenv('DB_NAME') ?: 'library_rest');
defined('DB_USER')    || define('DB_USER', getenv('DB_USER') ?: 'root');
defined('DB_PASS')    || define('DB_PASS', getenv('DB_PASS') ?: '');
defined('DB_CHARSET') || define('DB_CHARSET', 'utf8mb4');

// 2. Đường dẫn ứng dụng & API
defined('APP_TIMEZONE')  || define('APP_TIMEZONE', 'Asia/Ho_Chi_Minh');
defined('APP_BASE_PATH') || define('APP_BASE_PATH', $detectedBasePath);
defined('API_BASE_PATH') || define('API_BASE_PATH', APP_BASE_PATH . '/api/v1');

// 3. Cấu hình JWT (Dùng chung với module Auth của Người 1)
defined('JWT_SECRET')         || define('JWT_SECRET', getenv('JWT_SECRET') ?: 'REPLACE_WITH_64_HEX_CHARACTERS_GENERATED_BY_RANDOM_BYTES_32');
defined('JWT_ALGO')           || define('JWT_ALGO', 'HS256');
defined('JWT_ISSUER')         || define('JWT_ISSUER', 'library-rest-api');
defined('JWT_AUDIENCE')       || define('JWT_AUDIENCE', 'library-rest-client');
defined('JWT_EXPIRY_SECONDS') || define('JWT_EXPIRY_SECONDS', 3600 * 8); // 8 giờ

// 4. Quy tắc nghiệp vụ cốt lõi (Mục 4.2, 4.4, 4.18)
defined('MAX_ACTIVE_LOANS') || define('MAX_ACTIVE_LOANS', 3);
defined('LOAN_DAYS')        || define('LOAN_DAYS', 14);

// 5. Danh sách ảnh bìa hợp lệ được phép sử dụng (Test B22 - Chống Path Traversal / URL tùy ý)
defined('DEFAULT_BOOK_COVER') || define('DEFAULT_BOOK_COVER', 'assets/images/covers/default.svg');
defined('ALLOWED_BOOK_COVERS') || define('ALLOWED_BOOK_COVERS', [
    'assets/images/covers/default.svg',
    'assets/images/covers/clean-code.svg',
    'assets/images/covers/rest-api.svg',
    'assets/images/covers/database.svg',
    'assets/images/covers/algorithms.svg',
    'assets/images/covers/networks.svg',
    'assets/images/covers/ai-intro.svg',
    'assets/images/covers/literature.svg',
    'assets/images/covers/history.svg',
]);

return [
    'db' => [
        'host'    => DB_HOST,
        'port'    => DB_PORT,
        'name'    => DB_NAME,
        'user'    => DB_USER,
        'pass'    => DB_PASS,
        'charset' => DB_CHARSET,
    ],
    'app' => [
        'timezone'      => APP_TIMEZONE,
        'base_path'     => APP_BASE_PATH,
        'api_base_path' => API_BASE_PATH,
    ],
    'jwt' => [
        'secret'         => JWT_SECRET,
        'algo'           => JWT_ALGO,
        'issuer'         => JWT_ISSUER,
        'audience'       => JWT_AUDIENCE,
        'expiry_seconds' => JWT_EXPIRY_SECONDS,
    ],
    'rules' => [
        'max_active_loans'    => MAX_ACTIVE_LOANS,
        'loan_days'           => LOAN_DAYS,
        'default_book_cover'  => DEFAULT_BOOK_COVER,
        'allowed_book_covers' => ALLOWED_BOOK_COVERS,
    ],
];
