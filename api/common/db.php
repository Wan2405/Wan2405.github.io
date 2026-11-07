<?php
declare(strict_types=1);

// File này được nạp ở mọi request API và cả các script CLI dùng DB.
// DATETIME/DATE của thư viện được lưu và hiển thị theo giờ Việt Nam.
date_default_timezone_set('Asia/Ho_Chi_Minh');

/**
 * Kết nối CSDL dùng chung (PDO MySQL/MariaDB, utf8mb4, InnoDB)
 * Tương thích cả getConnection() (Người 1) và getDbConnection() (Người 2).
 */
function getConnection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dbConfigFile = __DIR__ . '/../../config/database.php';
    if (is_file($dbConfigFile)) {
        $config = require $dbConfigFile;
    } else {
        $fullConfig = require __DIR__ . '/../../config/config.php';
        $config = $fullConfig['db'];
    }

    if (!is_array($config)) {
        throw new RuntimeException('Cấu hình cơ sở dữ liệu phải trả về một mảng.');
    }

    $host = $config['host'] ?? '127.0.0.1';
    $port = $config['port'] ?? 3306;
    // Hỗ trợ cả database.php (name/user/password) và cấu hình cũ
    // (dbname/username/password), cùng config.php['db'] (name/user/pass).
    $dbname = $config['dbname'] ?? $config['name'] ?? 'library_rest';
    $charset = $config['charset'] ?? 'utf8mb4';
    $username = $config['username'] ?? $config['user'] ?? 'root';
    $password = $config['password'] ?? $config['pass'] ?? '';

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $host,
        (string) $port,
        $dbname,
        $charset
    );

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    // SET trong schema/seed chỉ tác động phiên import, vì vậy cần đặt lại
    // cho từng kết nối mới. Offset không phụ thuộc bảng timezone của MySQL.
    $pdo->exec("SET time_zone = '+07:00'");

    return $pdo;
}

function getDbConnection(): PDO
{
    return getConnection();
}
