<?php
declare(strict_types=1);

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

    $host = $config['host'] ?? '127.0.0.1';
    $port = $config['port'] ?? 3306;
    $dbname = $config['dbname'] ?? 'library_rest';
    $charset = $config['charset'] ?? 'utf8mb4';
    $username = $config['username'] ?? 'root';
    $password = $config['password'] ?? '';

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

    return $pdo;
}

function getDbConnection(): PDO
{
    return getConnection();
}
