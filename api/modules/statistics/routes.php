<?php
declare(strict_types=1);

/**
 * Module Thống kê hệ thống (Statistics) — Người 2 (tích hợp Người 1)
 * Endpoints (Chỉ Admin):
 *   - GET /api/v1/statistics
 *   - GET /api/v1/statistics/top-books
 *   - GET /api/v1/statistics/overdue
 *   - GET /api/v1/statistics/categories
 */
function handleStatisticsRoutes(string $method, ?string $subRoute): never
{
    if ($method !== 'GET') {
        sendError(405, 'METHOD_NOT_ALLOWED', 'Module thống kê chỉ hỗ trợ phương thức GET.');
    }

    // B18 / B19: Bắt buộc quyền Admin (Guest -> 401, Member -> 403)
    requireAdmin();

    $pdo = getConnection();

    // Kiểm tra tham số top_limit (1..20, mặc định 5)
    $topLimit = 5;
    if (isset($_GET['top_limit']) && $_GET['top_limit'] !== '') {
        $rawTop = trim((string) $_GET['top_limit']);
        if (!ctype_digit($rawTop) || (int) $rawTop < 1 || (int) $rawTop > 20) {
            sendError(422, 'VALIDATION_ERROR', 'Tham số top_limit phải là số nguyên từ 1 đến 20.', [
                'top_limit' => 'Chỉ chấp nhận giá trị từ 1 đến 20.',
            ]);
        }
        $topLimit = (int) $rawTop;
    }

    if ($subRoute === 'top-books') {
        jsonSuccess(
            fetchMostBorrowedBooks($pdo, $topLimit),
            'Lấy danh sách sách mượn nhiều nhất thành công.'
        );
    }

    if ($subRoute === 'overdue') {
        jsonSuccess(
            fetchOverdueLoansList($pdo),
            'Lấy danh sách phiếu mượn quá hạn thành công.'
        );
    }

    if ($subRoute === 'categories') {
        jsonSuccess(
            fetchCategoriesBreakdown($pdo),
            'Lấy thống kê theo danh mục thành công.'
        );
    }

    if ($subRoute !== null) {
        sendError(404, 'ENDPOINT_NOT_FOUND', 'Đường dẫn thống kê không tồn tại.');
    }

    $summary = fetchSystemSummary($pdo);
    $topBooks = fetchMostBorrowedBooks($pdo, $topLimit);
    $overdueList = fetchOverdueLoansList($pdo);
    $categoriesBreakdown = fetchCategoriesBreakdown($pdo);

    jsonSuccess([
        'summary'              => $summary,
        'top_books'            => $topBooks,
        'most_borrowed_books'  => $topBooks,
        'overdue_list'         => $overdueList,
        'categories_breakdown' => $categoriesBreakdown,
    ], 'Lấy số liệu thống kê tổng hợp thành công.');
}

function fetchSystemSummary(PDO $pdo): array
{
    $booksRow = $pdo->query("
        SELECT
            COUNT(*) AS total_book_titles,
            COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) AS active_book_titles,
            COALESCE(SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END), 0) AS inactive_book_titles,
            COALESCE(SUM(total_copies), 0) AS total_copies,
            COALESCE(SUM(available_copies), 0) AS available_copies
        FROM books
    ")->fetch();

    $totalCategories = (int) $pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn();

    $membersRow = $pdo->query("
        SELECT
            COUNT(*) AS total_members,
            COALESCE(SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END), 0) AS active_members,
            COALESCE(SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END), 0) AS locked_members
        FROM users
        WHERE role = 'member'
    ")->fetch();

    $loansRow = $pdo->query("
        SELECT
            COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_cnt,
            COALESCE(SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END), 0) AS borrowed_cnt,
            COALESCE(SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END), 0) AS returned_cnt,
            COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_cnt,
            COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelled_cnt,
            COALESCE(SUM(CASE WHEN status = 'borrowed' AND due_date < CURDATE() THEN 1 ELSE 0 END), 0) AS overdue_cnt
        FROM loans
    ")->fetch();

    $totalCopies = (int) $booksRow['total_copies'];
    $availableCopies = (int) $booksRow['available_copies'];
    $borrowedCopies = max(0, $totalCopies - $availableCopies);

    $totalTitles = (int) $booksRow['total_book_titles'];
    $activeTitles = (int) $booksRow['active_book_titles'];
    $inactiveTitles = (int) $booksRow['inactive_book_titles'];

    $pendingLoans = (int) $loansRow['pending_cnt'];
    $borrowedLoans = (int) $loansRow['borrowed_cnt'];
    $returnedLoans = (int) $loansRow['returned_cnt'];
    $rejectedLoans = (int) $loansRow['rejected_cnt'];
    $cancelledLoans = (int) $loansRow['cancelled_cnt'];
    $overdueLoans = (int) $loansRow['overdue_cnt'];

    return [
        // Trường chuẩn theo Người 2 (Nguoi_2_Sach_Tra_cuu_Thong_ke.md)
        'total_book_titles'    => $totalTitles,
        'active_book_titles'   => $activeTitles,
        'inactive_book_titles' => $inactiveTitles,
        'total_categories'     => $totalCategories,
        'total_copies'         => $totalCopies,
        'available_copies'     => $availableCopies,
        'borrowed_copies'      => $borrowedCopies,
        'total_members'        => (int) $membersRow['total_members'],
        'active_members'       => (int) $membersRow['active_members'],
        'locked_members'       => (int) $membersRow['locked_members'],
        'loans_by_status'      => [
            'pending'   => $pendingLoans,
            'borrowed'  => $borrowedLoans,
            'returned'  => $returnedLoans,
            'rejected'  => $rejectedLoans,
            'cancelled' => $cancelledLoans,
        ],
        'overdue_loans'        => $overdueLoans,
        // Trường tương thích thêm với Người 1 (admin-dashboard.js)
        'total_titles'         => $totalTitles,
        'active_titles'        => $activeTitles,
        'pending_loans'        => $pendingLoans,
        'borrowed_loans'       => $borrowedLoans,
        'returned_loans'       => $returnedLoans,
    ];
}

function fetchMostBorrowedBooks(PDO $pdo, int $topLimit): array
{
    $sql = "
        SELECT
            b.id AS book_id,
            b.title,
            b.author,
            b.isbn,
            b.total_copies,
            b.available_copies,
            c.name AS category_name,
            COALESCE(SUM(CASE WHEN l.status IN ('borrowed', 'returned') THEN 1 ELSE 0 END), 0) AS total_loans,
            COALESCE(SUM(CASE WHEN l.status = 'borrowed' THEN 1 ELSE 0 END), 0) AS currently_borrowed
        FROM books b
        INNER JOIN categories c ON c.id = b.category_id
        LEFT JOIN loans l ON l.book_id = b.id
        GROUP BY b.id, b.title, b.author, b.isbn, b.total_copies, b.available_copies, c.name
        ORDER BY total_loans DESC, currently_borrowed DESC, b.id ASC
        LIMIT :top_limit
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':top_limit', $topLimit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();

    return array_map(static function (array $row): array {
        $bookId = (int) $row['book_id'];
        $totalLoans = (int) $row['total_loans'];
        return [
            'id'                 => $bookId,
            'book_id'            => $bookId,
            'title'              => $row['title'],
            'author'             => $row['author'],
            'isbn'               => $row['isbn'],
            'category_name'      => $row['category_name'],
            'total_copies'       => (int) $row['total_copies'],
            'available_copies'   => (int) $row['available_copies'],
            'loan_count'         => $totalLoans,
            'total_loans'        => $totalLoans,
            'currently_borrowed' => (int) $row['currently_borrowed'],
        ];
    }, $rows);
}

function fetchOverdueLoansList(PDO $pdo): array
{
    $sql = "
        SELECT
            l.id AS loan_id,
            l.user_id,
            u.full_name AS borrower_name,
            u.email AS borrower_email,
            l.book_id,
            b.title AS book_title,
            b.isbn AS book_isbn,
            l.borrowed_at,
            l.due_date,
            DATEDIFF(CURDATE(), l.due_date) AS days_overdue
        FROM loans l
        INNER JOIN users u ON u.id = l.user_id
        INNER JOIN books b ON b.id = l.book_id
        WHERE l.status = 'borrowed' AND l.due_date < CURDATE()
        ORDER BY days_overdue DESC, l.due_date ASC
    ";

    $rows = $pdo->query($sql)->fetchAll();

    return array_map(static function (array $row): array {
        return [
            'loan_id'        => (int) $row['loan_id'],
            'user_id'        => (int) $row['user_id'],
            'borrower_name'  => $row['borrower_name'],
            'borrower_email' => $row['borrower_email'],
            'book_id'        => (int) $row['book_id'],
            'book_title'     => $row['book_title'],
            'book_isbn'      => $row['book_isbn'],
            'borrowed_at'    => $row['borrowed_at'],
            'due_date'       => $row['due_date'],
            'days_overdue'   => (int) $row['days_overdue'],
        ];
    }, $rows);
}

function fetchCategoriesBreakdown(PDO $pdo): array
{
    $sql = "
        SELECT
            c.id AS category_id,
            c.name AS category_name,
            COUNT(b.id) AS total_titles,
            COALESCE(SUM(b.total_copies), 0) AS total_copies,
            COALESCE(SUM(b.available_copies), 0) AS available_copies
        FROM categories c
        LEFT JOIN books b ON b.category_id = c.id
        GROUP BY c.id, c.name
        ORDER BY total_titles DESC, c.name ASC
    ";

    $rows = $pdo->query($sql)->fetchAll();

    return array_map(static function (array $row): array {
        return [
            'category_id'      => (int) $row['category_id'],
            'category_name'    => $row['category_name'],
            'total_titles'     => (int) $row['total_titles'],
            'total_copies'     => (int) $row['total_copies'],
            'available_copies' => (int) $row['available_copies'],
        ];
    }, $rows);
}
