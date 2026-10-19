<?php
declare(strict_types=1);

/**
 * Front Controller / REST API Router cho toàn bộ hệ thống `/api/v1/*`
 * Tích hợp đầy đủ các module của Người 1 (auth, users, loans) và Người 2 (categories, books, statistics).
 */
require_once __DIR__ . '/common/response.php';
require_once __DIR__ . '/common/db.php';
require_once __DIR__ . '/common/request.php';
require_once __DIR__ . '/common/auth.php';

handleCorsAndPreflight();

set_exception_handler(static function (Throwable $e): void {
    error_log(sprintf('[Library REST API Error] %s in %s:%d', $e->getMessage(), $e->getFile(), $e->getLine()));
    sendError(500, 'SERVER_ERROR', 'Lỗi hệ thống nội bộ.');
});

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// Hỗ trợ cả khi chạy qua router.php (/api/v1/...) lẫn khi chạy dưới thư mục con XAMPP (/LTW-GK/api/v1/...)
$routePath = '';
if (isset($_GET['_route'])) {
    $routePath = trim((string) $_GET['_route'], '/');
} elseif (preg_match('#/api/v1(?:/(.*))?$#', $uriPath, $matches)) {
    $routePath = isset($matches[1]) ? trim($matches[1], '/') : '';
}

$segments = $routePath === '' ? [] : explode('/', $routePath);
$resource = $segments[0] ?? '';
$subSegment = $segments[1] ?? null;
$extraSegment = $segments[2] ?? null;

// 0. Healthcheck endpoint
if ($resource === '' || $resource === 'health') {
    if ($method !== 'GET') {
        sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được phép.');
    }

    $pdo = getConnection();
    $dbStatus = (int) $pdo->query('SELECT 1')->fetchColumn() === 1 ? 'connected' : 'error';

    jsonSuccess([
        'service'   => 'Library Management REST API',
        'version'   => 'v1',
        'db_status' => $dbStatus,
        'timestamp' => date('c'),
    ], 'Hệ thống REST API đang hoạt động bình thường.');
}

// Không cho phép đường dẫn vượt quá 2 phân đoạn (/api/v1/{resource}/{id_or_sub})
if ($extraSegment !== null) {
    sendError(404, 'NOT_FOUND', 'Không tìm thấy đường dẫn yêu cầu.');
}

switch ($resource) {
    // =========================================================================
    // NGƯỜI 1: XÁC THỰC & TÀI KHOẢN (AUTH)
    // =========================================================================
    case 'auth':
        if ($subSegment === 'register') {
            if ($method !== 'POST') {
                sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
            }
            require __DIR__ . '/modules/auth/register.php';
            exit;
        }

        if ($subSegment === 'login') {
            if ($method !== 'POST') {
                sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
            }
            require __DIR__ . '/modules/auth/login.php';
            exit;
        }

        if ($subSegment === 'me') {
            if ($method !== 'GET') {
                header('Allow: GET');
                sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
            }
            require __DIR__ . '/modules/auth/me.php';
            exit;
        }

        sendError(404, 'NOT_FOUND', 'Không tìm thấy đường dẫn xác thực.');

    case 'me':
        if ($subSegment !== null) {
            sendError(404, 'NOT_FOUND', 'Không tìm thấy đường dẫn yêu cầu.');
        }
        if ($method !== 'GET') {
            header('Allow: GET');
            sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
        }
        require __DIR__ . '/modules/auth/me.php';
        exit;

    // =========================================================================
    // NGƯỜI 1: QUẢN LÝ ĐỘC GIẢ (USERS)
    // =========================================================================
    case 'users':
        if ($subSegment === null) {
            if ($method !== 'GET') {
                sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
            }
            require __DIR__ . '/modules/users/list.php';
            exit;
        }

        if (!ctype_digit($subSegment) || (int) $subSegment < 1) {
            sendError(404, 'NOT_FOUND', 'Không tìm thấy độc giả.');
        }

        $targetUserId = (int) $subSegment;
        if ($method === 'GET') {
            require __DIR__ . '/modules/users/detail.php';
            exit;
        }
        if ($method === 'PATCH') {
            require __DIR__ . '/modules/users/update-status.php';
            exit;
        }
        if ($method === 'DELETE') {
            require __DIR__ . '/modules/users/delete.php';
            exit;
        }

        sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');

    // =========================================================================
    // NGƯỜI 1: QUẢN LÝ MƯỢN – TRẢ SÁCH (LOANS)
    // =========================================================================
    case 'loans':
        if ($subSegment === null) {
            if ($method === 'GET') {
                require __DIR__ . '/modules/loans/list.php';
                exit;
            }
            if ($method === 'POST') {
                require __DIR__ . '/modules/loans/create.php';
                exit;
            }
            sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
        }

        if (!ctype_digit($subSegment) || (int) $subSegment < 1) {
            sendError(404, 'NOT_FOUND', 'Không tìm thấy phiếu mượn.');
        }

        $targetLoanId = (int) $subSegment;
        if ($method === 'GET') {
            require __DIR__ . '/modules/loans/detail.php';
            exit;
        }
        if ($method === 'PATCH') {
            require __DIR__ . '/modules/loans/update.php';
            exit;
        }

        sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');

    // =========================================================================
    // NGƯỜI 2: QUẢN LÝ DANH MỤC SÁCH (CATEGORIES)
    // =========================================================================
    case 'categories':
        require_once __DIR__ . '/modules/categories/routes.php';
        handleCategoryRoutes($method, $subSegment);

    // =========================================================================
    // NGƯỜI 2: QUẢN LÝ SÁCH & TRA CỨU CÔNG KHAI (BOOKS)
    // =========================================================================
    case 'books':
        require_once __DIR__ . '/modules/books/routes.php';
        handleBookRoutes($method, $subSegment);

    // =========================================================================
    // NGƯỜI 2: THỐNG KÊ HỆ THỐNG (STATISTICS)
    // =========================================================================
    case 'statistics':
        require_once __DIR__ . '/modules/statistics/routes.php';
        handleStatisticsRoutes($method, $subSegment);

    default:
        sendError(404, 'NOT_FOUND', sprintf("Tài nguyên '/api/v1/%s' không tồn tại.", $resource));
}
