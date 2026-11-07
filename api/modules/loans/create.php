<?php

require_once __DIR__ . '/helpers.php';

// Muc C: Tao yeu cau muon sach (Member).
// user_id luon lay tu requireAuth(), khong lay tu request body (Test A22).
$currentUser = requireAuth();
if ($currentUser['role'] !== 'member') {
    sendError(403, 'FORBIDDEN', 'Chỉ tài khoản độc giả (Member) mới được gửi yêu cầu mượn sách.');
}

$body = readJsonBody();
$fields = [];

$bookId = 0;
if (!array_key_exists('book_id', $body)) {
    $fields['book_id'] = 'Vui lòng cung cấp mã đầu sách (book_id).';
} elseif (validatedInteger($body['book_id'], 1, 4294967295) !== null) {
    $bookId = validatedInteger($body['book_id'], 1, 4294967295);
} else {
    $fields['book_id'] = 'Mã đầu sách (book_id) phải là số nguyên dương.';
}

if (!empty($fields)) {
    sendError(422, 'VALIDATION_ERROR', 'Dữ liệu tạo yêu cầu mượn không hợp lệ.', $fields);
}

$loanConfig = getLoanConfig();
$maxActiveLoans = $loanConfig['max_active_loans'];
$pdo = getConnection();

try {
    $pdo->beginTransaction();

    // 1. Khoa dong users cua doc gia truoc (Muc F: thu tu khoa users -> books -> loans)
    $uStmt = $pdo->prepare(
        'SELECT id, role, is_active FROM users WHERE id = :id FOR UPDATE'
    );
    $uStmt->execute(['id' => (int) $currentUser['id']]);
    $userRow = $uStmt->fetch();

    if (!$userRow || (int) $userRow['is_active'] !== 1 || $userRow['role'] !== 'member') {
        $pdo->rollBack();
        sendError(403, 'ACCOUNT_UNAVAILABLE', 'Tài khoản độc giả không còn hoạt động.');
    }

    // 2. Khoa dong books
    $bStmt = $pdo->prepare(
        'SELECT id, title, total_copies, available_copies, is_active
         FROM books
         WHERE id = :id
         FOR UPDATE'
    );
    $bStmt->execute(['id' => $bookId]);
    $bookRow = $bStmt->fetch();

    if (!$bookRow) {
        $pdo->rollBack();
        sendError(404, 'BOOK_NOT_FOUND', 'Đầu sách không tồn tại.');
    }

    if ((int) $bookRow['is_active'] !== 1) {
        $pdo->rollBack();
        sendError(409, 'BOOK_INACTIVE', 'Đầu sách này hiện đã ngừng cho mượn.');
    }

    if ((int) $bookRow['available_copies'] < 1) {
        $pdo->rollBack();
        sendError(409, 'OUT_OF_STOCK', 'Đầu sách này hiện đã hết bản có sẵn để mượn.');
    }

    // 3. Kiem tra so luot dang muon (status = 'borrowed') chua vuot gioi han 3
    $activeStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM loans WHERE user_id = :uid AND status = 'borrowed'"
    );
    $activeStmt->execute(['uid' => (int) $currentUser['id']]);
    $borrowedCount = (int) $activeStmt->fetchColumn();

    if ($borrowedCount >= $maxActiveLoans) {
        $pdo->rollBack();
        sendError(
            409,
            'BORROW_LIMIT_REACHED',
            'Bạn đang mượn tối đa ' . $maxActiveLoans . ' cuốn sách. Vui lòng trả sách trước khi gửi yêu cầu mới.'
        );
    }

    // 4. Kiem tra chua co yeu cau pending/borrowed cung dau sach cua doc gia (Test A08)
    $dupStmt = $pdo->prepare(
        "SELECT COUNT(*) FROM loans
         WHERE user_id = :uid AND book_id = :bid AND status IN ('pending', 'borrowed')"
    );
    $dupStmt->execute([
        'uid' => (int) $currentUser['id'],
        'bid' => $bookId
    ]);
    if ((int) $dupStmt->fetchColumn() > 0) {
        $pdo->rollBack();
        sendError(
            409,
            'DUPLICATE_LOAN',
            'Bạn đã có yêu cầu đang chờ xử lý hoặc đang mượn đầu sách này.'
        );
    }

    // 5. Tao phieu muon trang thai pending; KHONG giam available_copies (Test A07)
    $insStmt = $pdo->prepare(
        "INSERT INTO loans (user_id, book_id, status)
         VALUES (:user_id, :book_id, 'pending')"
    );
    $insStmt->execute([
        'user_id' => (int) $currentUser['id'],
        'book_id' => $bookId
    ]);

    $loanId = (int) $pdo->lastInsertId();
    $createdLoan = fetchLoanDetailById($pdo, $loanId);

    $pdo->commit();
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}

header('Location: /api/v1/loans/' . $loanId);
sendJson(201, [
    'success' => true,
    'data' => formatLoanRow($createdLoan, $currentUser['role']),
    'message' => 'Đã gửi yêu cầu mượn sách thành công! Vui lòng chờ thủ thư xác nhận.'
]);
