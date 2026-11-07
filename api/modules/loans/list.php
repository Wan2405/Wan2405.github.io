<?php

require_once __DIR__ . '/helpers.php';

$currentUser = requireAuth();
$pdo = getConnection();
$fields = [];

// 1. Kiem tra phan trang: page & limit
$page = 1;
if (isset($_GET['page']) && $_GET['page'] !== '') {
    $pageRaw = trim((string) $_GET['page']);
    if (!ctype_digit($pageRaw) || (int) $pageRaw < 1) {
        $fields['page'] = 'Số trang (page) phải là số nguyên dương lớn hơn hoặc bằng 1.';
    } else {
        $page = (int) $pageRaw;
    }
}

$limit = 20;
if (isset($_GET['limit']) && $_GET['limit'] !== '') {
    $limitRaw = trim((string) $_GET['limit']);
    if (!ctype_digit($limitRaw) || (int) $limitRaw < 1 || (int) $limitRaw > 100) {
        $fields['limit'] = 'Số lượng mỗi trang (limit) phải từ 1 đến 100.';
    } else {
        $limit = (int) $limitRaw;
    }
}

// 2. Kiem tra bo loc status
$statusFilter = '';
if (isset($_GET['status']) && $_GET['status'] !== '') {
    $statusFilter = strtolower(trim((string) $_GET['status']));
    $allowedStatuses = ['pending', 'borrowed', 'returned', 'rejected', 'cancelled', 'overdue'];
    if (!in_array($statusFilter, $allowedStatuses, true)) {
        $fields['status'] = 'Trạng thái lọc chỉ chấp nhận pending, borrowed, returned, rejected, cancelled hoặc overdue.';
    }
}

// 3. Kiem tra quyen voi user_id / book_id / q
$where = [];
$params = [];

if ($currentUser['role'] === 'member') {
    // Quy uoc muc G: Member co tinh dat user_id cua nguoi khac -> 403
    if (isset($_GET['user_id']) && $_GET['user_id'] !== '') {
        $uidRaw = trim((string) $_GET['user_id']);
        if (!ctype_digit($uidRaw) || (int) $uidRaw !== (int) $currentUser['id']) {
            sendError(403, 'FORBIDDEN', 'Độc giả chỉ được phép xem danh sách phiếu mượn của chính mình.');
        }
    }
    $where[] = 'l.user_id = :auth_user_id';
    $params['auth_user_id'] = (int) $currentUser['id'];
} else {
    // Admin co the loc theo user_id va book_id
    if (isset($_GET['user_id']) && $_GET['user_id'] !== '') {
        $uidRaw = trim((string) $_GET['user_id']);
        if (!ctype_digit($uidRaw) || (int) $uidRaw < 1) {
            $fields['user_id'] = 'Mã độc giả (user_id) phải là số nguyên dương.';
        } else {
            $where[] = 'l.user_id = :filter_user_id';
            $params['filter_user_id'] = (int) $uidRaw;
        }
    }
}

if (isset($_GET['book_id']) && $_GET['book_id'] !== '') {
    $bidRaw = trim((string) $_GET['book_id']);
    if (!ctype_digit($bidRaw) || (int) $bidRaw < 1) {
        $fields['book_id'] = 'Mã sách (book_id) phải là số nguyên dương.';
    } else {
        $where[] = 'l.book_id = :filter_book_id';
        $params['filter_book_id'] = (int) $bidRaw;
    }
}

$q = '';
if (isset($_GET['q']) && $_GET['q'] !== '') {
    if (!is_string($_GET['q'])) {
        $fields['q'] = 'Từ khóa tìm kiếm không hợp lệ.';
    } else {
        $q = trim($_GET['q']);
        if (mb_strlen($q, 'UTF-8') > 150) {
            $fields['q'] = 'Từ khóa tìm kiếm không được vượt quá 150 ký tự.';
        }
    }
}

if (!empty($fields)) {
    sendError(422, 'VALIDATION_ERROR', 'Tham số lọc phiếu mượn không hợp lệ.', $fields);
}

if ($statusFilter === 'overdue') {
    $where[] = "l.status = 'borrowed' AND l.due_date IS NOT NULL AND l.due_date < CURDATE()";
} elseif ($statusFilter !== '') {
    $where[] = 'l.status = :status';
    $params['status'] = $statusFilter;
}

if ($q !== '') {
    $escapedQ = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q);
    $where[] = "(u.full_name LIKE :q_uname ESCAPE '\\\\'
                 OR u.email LIKE :q_uemail ESCAPE '\\\\'
                 OR b.title LIKE :q_btitle ESCAPE '\\\\'
                 OR b.author LIKE :q_bauthor ESCAPE '\\\\')";
    $params['q_uname'] = '%' . $escapedQ . '%';
    $params['q_uemail'] = '%' . $escapedQ . '%';
    $params['q_btitle'] = '%' . $escapedQ . '%';
    $params['q_bauthor'] = '%' . $escapedQ . '%';
}

$whereSql = count($where) > 0 ? ('WHERE ' . implode(' AND ', $where)) : '';

// Dem tong so phieu muon khop bo loc
$countSql = "
    SELECT COUNT(*)
    FROM loans l
    INNER JOIN users u ON u.id = l.user_id
    INNER JOIN books b ON b.id = l.book_id
    $whereSql
";
$countStmt = $pdo->prepare($countSql);
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$totalPages = $total > 0 ? (int) ceil($total / $limit) : 1;
$offset = ($page - 1) * $limit;

// Thong ke summary theo pham vi quyen (Member: cua minh; Admin: toan he thong)
$summaryWhere = $currentUser['role'] === 'member' ? 'WHERE user_id = :sum_uid' : '';
$summaryStmt = $pdo->prepare(
    "SELECT
        COUNT(*) AS total_loans,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_count,
        COALESCE(SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END), 0) AS borrowed_count,
        COALESCE(SUM(CASE WHEN status = 'borrowed' AND due_date IS NOT NULL AND due_date < CURDATE() THEN 1 ELSE 0 END), 0) AS overdue_count,
        COALESCE(SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END), 0) AS returned_count,
        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_count,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_count
     FROM loans
     $summaryWhere"
);
if ($currentUser['role'] === 'member') {
    $summaryStmt->execute(['sum_uid' => (int) $currentUser['id']]);
} else {
    $summaryStmt->execute();
}
$summaryRow = $summaryStmt->fetch();

$listSql = "
    SELECT
        l.id,
        l.user_id,
        u.full_name AS user_name,
        u.email AS user_email,
        u.is_active AS user_is_active,
        l.book_id,
        b.category_id AS category_id,
        b.title AS book_title,
        b.author AS book_author,
        b.cover_path AS book_cover,
        b.available_copies AS book_available_copies,
        b.total_copies AS book_total_copies,
        c.name AS category_name,
        l.status,
        l.requested_at,
        l.borrowed_at,
        l.due_date,
        l.returned_at,
        l.approved_by,
        ua.full_name AS approved_by_name,
        l.returned_by,
        ur.full_name AS returned_by_name,
        l.rejection_reason,
        CASE
            WHEN l.status = 'borrowed' AND l.due_date IS NOT NULL AND l.due_date < CURDATE() THEN 1
            ELSE 0
        END AS is_overdue
    FROM loans l
    INNER JOIN users u ON u.id = l.user_id
    INNER JOIN books b ON b.id = l.book_id
    INNER JOIN categories c ON c.id = b.category_id
    LEFT JOIN users ua ON ua.id = l.approved_by
    LEFT JOIN users ur ON ur.id = l.returned_by
    $whereSql
    ORDER BY
        CASE l.status
            WHEN 'pending' THEN 1
            WHEN 'borrowed' THEN 2
            ELSE 3
        END ASC,
        l.requested_at DESC,
        l.id DESC
    LIMIT :limit OFFSET :offset
";

$stmt = $pdo->prepare($listSql);
foreach ($params as $k => $v) {
    $stmt->bindValue(':' . $k, $v, is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$rows = $stmt->fetchAll();
$data = [];
foreach ($rows as $row) {
    $data[] = formatLoanRow($row, $currentUser['role']);
}

sendJson(200, [
    'success' => true,
    'data' => $data,
    'meta' => [
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'total_pages' => $totalPages,
        'summary' => [
            'total_loans' => (int) ($summaryRow['total_loans'] ?? 0),
            'pending_count' => (int) ($summaryRow['pending_count'] ?? 0),
            'borrowed_count' => (int) ($summaryRow['borrowed_count'] ?? 0),
            'overdue_count' => (int) ($summaryRow['overdue_count'] ?? 0),
            'returned_count' => (int) ($summaryRow['returned_count'] ?? 0),
            'rejected_count' => (int) ($summaryRow['rejected_count'] ?? 0),
            'cancelled_count' => (int) ($summaryRow['cancelled_count'] ?? 0)
        ]
    ],
    'message' => 'Lấy danh sách phiếu mượn thành công.'
]);
