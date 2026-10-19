<?php
declare(strict_types=1);

/**
 * Kịch bản kiểm thử tự động các chức năng của Người 2 (Categories, Books, Search/Filter/Pagination, Statistics)
 * Chạy song song cùng `tests/run-api-tests.php` của Người 1.
 */
$baseUrl = getenv('LIBRARY_API_URL') ?: 'http://localhost:8000/api/v1';
$adminEmail = getenv('LIBRARY_ADMIN_EMAIL') ?: 'admin@example.com';
$adminPassword = getenv('LIBRARY_ADMIN_PASSWORD') ?: 'Admin12345';
$memberEmail = 'an@example.com';
$memberPassword = 'ThuVien123';

$passed = 0;

function callM2Api(string $method, string $path, ?array $body = null, ?string $token = null): array
{
    global $baseUrl;
    $ch = curl_init($baseUrl . $path);
    $headers = ['Accept: application/json'];
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE));
    }
    if ($token !== null) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $decoded = is_string($raw) && $raw !== '' ? json_decode($raw, true) : null;
    return ['status' => $status, 'body' => $decoded];
}

function assertM2(bool $cond, string $label, ?array $res = null): void
{
    global $passed;
    if (!$cond) {
        $detail = '';
        if ($res !== null) {
            $code = $res['body']['error']['code'] ?? '';
            $detail = ' | HTTP ' . ($res['status'] ?? '?') . ($code ? ' | ' . $code : '');
        }
        echo "[FAIL] $label$detail\n";
        exit(1);
    }
    $passed++;
    echo "[PASS] $label\n";
}

echo "=== KIEM THU MODULE NGUOI 2 (CATEGORIES, BOOKS, SEARCH, STATISTICS) ===\n";

// 0. Đăng nhập Admin & Member
$adminLogin = callM2Api('POST', '/auth/login', ['email' => $adminEmail, 'password' => $adminPassword]);
assertM2($adminLogin['status'] === 200 && !empty($adminLogin['body']['data']['access_token']), 'Dang nhap Admin', $adminLogin);
$adminToken = $adminLogin['body']['data']['access_token'];

$memberLogin = callM2Api('POST', '/auth/login', ['email' => $memberEmail, 'password' => $memberPassword]);
assertM2($memberLogin['status'] === 200 && !empty($memberLogin['body']['data']['access_token']), 'Dang nhap Member', $memberLogin);
$memberToken = $memberLogin['body']['data']['access_token'];

// 1. Categories (DM01 - DM04)
$catList = callM2Api('GET', '/categories');
assertM2($catList['status'] === 200 && is_array($catList['body']['data'] ?? null) && count($catList['body']['data']) >= 5, 'DM01: GET /categories cong khai', $catList);

$catForbidden = callM2Api('POST', '/categories', ['name' => 'Test Member Cat'], $memberToken);
assertM2($catForbidden['status'] === 403, 'DM02: Chan Member tao danh muc (403)', $catForbidden);

$catInvalid = callM2Api('POST', '/categories', ['name' => 'A'], $adminToken);
assertM2($catInvalid['status'] === 422, 'DM02: Chan ten danh muc qua ngan (422)', $catInvalid);

$catCreate = callM2Api('POST', '/categories', [
    'name'        => 'Danh muc Test M2 ' . bin2hex(random_bytes(3)),
    'description' => 'Mo ta danh muc test'
], $adminToken);
assertM2($catCreate['status'] === 201 && !empty($catCreate['body']['data']['id']), 'DM02: Admin tao danh muc moi (201)', $catCreate);
$newCatId = (int) $catCreate['body']['data']['id'];

$catUpdate = callM2Api('PUT', '/categories/' . $newCatId, [
    'name'        => 'Danh muc Test M2 Updated ' . bin2hex(random_bytes(3)),
    'description' => 'Da cap nhat'
], $adminToken);
assertM2($catUpdate['status'] === 200, 'DM03: Admin cap nhat danh muc (200)', $catUpdate);

$catDelInUse = callM2Api('DELETE', '/categories/1', null, $adminToken);
assertM2($catDelInUse['status'] === 409 && ($catDelInUse['body']['error']['code'] ?? '') === 'CATEGORY_IN_USE', 'DM04: Chan xoa danh muc dang co sach (409 CATEGORY_IN_USE)', $catDelInUse);

$catDelEmpty = callM2Api('DELETE', '/categories/' . $newCatId, null, $adminToken);
assertM2($catDelEmpty['status'] === 200, 'DM04: Xoa danh muc rong thanh cong (200)', $catDelEmpty);

// 2. Books Search, Filter, Sort, Pagination & Access Control (B01 - B17)
$publicBooks = callM2Api('GET', '/books?page=1&limit=5&sort=title&order=asc');
assertM2(
    $publicBooks['status'] === 200
    && isset($publicBooks['body']['data']['books'])
    && isset($publicBooks['body']['meta']['total']),
    'B01: GET /books phan trang + sap xep (200)',
    $publicBooks
);
foreach ($publicBooks['body']['data']['books'] as $b) {
    assertM2((int) $b['is_active'] === 1, 'B02: GET /books cong khai chi tra sach is_active = 1');
}

$guestInactive = callM2Api('GET', '/books?include_inactive=1');
assertM2($guestInactive['status'] === 403, 'B03: Guest gui include_inactive=1 bi chan (403)', $guestInactive);

$memberInactive = callM2Api('GET', '/books?include_inactive=1', null, $memberToken);
assertM2($memberInactive['status'] === 403, 'B03: Member gui include_inactive=1 bi chan (403)', $memberInactive);

$adminInactive = callM2Api('GET', '/books?include_inactive=1', null, $adminToken);
assertM2($adminInactive['status'] === 200, 'B03: Admin gui include_inactive=1 thanh cong (200)', $adminInactive);

$invalidQuery = callM2Api('GET', '/books?page=0&limit=999&sort=invalid');
assertM2($invalidQuery['status'] === 422, 'B04: Tham so truy van sai tra 422 VALIDATION_ERROR', $invalidQuery);

$filterAvail = callM2Api('GET', '/books?available=1&category_id=1&q=Clean');
assertM2($filterAvail['status'] === 200 && count($filterAvail['body']['data']['books']) >= 1, 'TC01-TC03: Tim kiem q + loc category_id + available=1', $filterAvail);

$bookUnauth = callM2Api('POST', '/books', ['title' => 'X', 'author' => 'Y', 'category_id' => 1, 'total_copies' => 2]);
assertM2($bookUnauth['status'] === 401, 'B08: Guest POST /books bi chan (401)', $bookUnauth);

$bookForbid = callM2Api('POST', '/books', ['title' => 'X', 'author' => 'Y', 'category_id' => 1, 'total_copies' => 2], $memberToken);
assertM2($bookForbid['status'] === 403, 'B09: Member POST /books bi chan (403)', $bookForbid);

$bookCreate = callM2Api('POST', '/books', [
    'category_id'  => 1,
    'isbn'         => '978-604-999-' . random_int(100, 999),
    'title'        => 'Sach Test M2 Full CRUD',
    'author'       => 'Tac gia M2',
    'publisher'    => 'NXB Tre',
    'publish_year' => 2024,
    'total_copies' => 5,
    'is_active'    => 1
], $adminToken);
assertM2(
    $bookCreate['status'] === 201
    && (int) $bookCreate['body']['data']['available_copies'] === 5,
    'B10: Admin tao sach moi 201 Created, available_copies = total_copies',
    $bookCreate
);
$createdBookId = (int) $bookCreate['body']['data']['id'];

$bookUpdate = callM2Api('PUT', '/books/' . $createdBookId, [
    'category_id'  => 1,
    'title'        => 'Sach Test M2 Da Cap Nhat',
    'author'       => 'Tac gia M2',
    'total_copies' => 8
], $adminToken);
assertM2(
    $bookUpdate['status'] === 200
    && (int) $bookUpdate['body']['data']['available_copies'] === 8,
    'B11: Admin tang total_copies tu 5 len 8 -> available_copies = 8',
    $bookUpdate
);

// Sach #1 dang co phieu borrowed/pending trong seed.sql -> giam total_copies xuong 0 phai tra 409
$bookReduceConflict = callM2Api('PUT', '/books/1', [
    'category_id'  => 1,
    'title'        => 'Clean Code — Mã Nguồn Sạch',
    'author'       => 'Robert C. Martin',
    'total_copies' => 0
], $adminToken);
assertM2($bookReduceConflict['status'] === 409, 'B12: Giam total_copies nho hon so ban dang muon tra 409 Conflict', $bookReduceConflict);

// Sach #1 dang co phieu active -> DELETE phai tra 409 BOOK_HAS_ACTIVE_LOANS
$bookDelActive = callM2Api('DELETE', '/books/1', null, $adminToken);
assertM2($bookDelActive['status'] === 409 && ($bookDelActive['body']['error']['code'] ?? '') === 'BOOK_HAS_ACTIVE_LOANS', 'B15: Chan xoa sach dang co phieu pending/borrowed (409)', $bookDelActive);

// Sach #8 chi co phieu returned (lich su) -> DELETE chuyen sang is_active = 0 (200 deactivated)
$bookDelHistory = callM2Api('DELETE', '/books/8', null, $adminToken);
assertM2($bookDelHistory['status'] === 200 && ($bookDelHistory['body']['data']['mode'] ?? '') === 'deactivated', 'S07: Xoa sach da co lich su chuyen sang mode=deactivated (200)', $bookDelHistory);
// Khoi phuc lai is_active = 1 cho sach #8
callM2Api('PUT', '/books/8', ['is_active' => 1], $adminToken);

// Xoa sach chua co lich su -> 204 No Content
$bookDelClean = callM2Api('DELETE', '/books/' . $createdBookId, null, $adminToken);
assertM2($bookDelClean['status'] === 204, 'B14: Xoa sach chua co lich su tra 204 No Content', $bookDelClean);

// 3. Statistics (B18 - B21)
$statGuest = callM2Api('GET', '/statistics');
assertM2($statGuest['status'] === 401, 'B18: Guest GET /statistics bi chan (401)', $statGuest);

$statMember = callM2Api('GET', '/statistics', null, $memberToken);
assertM2($statMember['status'] === 403, 'B19: Member GET /statistics bi chan (403)', $statMember);

$statAdmin = callM2Api('GET', '/statistics?top_limit=5', null, $adminToken);
assertM2(
    $statAdmin['status'] === 200
    && isset($statAdmin['body']['data']['summary'])
    && isset($statAdmin['body']['data']['top_books'])
    && isset($statAdmin['body']['data']['overdue_list'])
    && isset($statAdmin['body']['data']['categories_breakdown']),
    'B20/B21: Admin GET /statistics tra day du summary, top_books, overdue_list, categories_breakdown (200)',
    $statAdmin
);

echo "So kiem tra Nguoi 2 dat: $passed\n";
echo "KET QUA NGUOI 2: DAT 100%\n";
