<?php
// Kiem thu tuan tu Auth, quyen, du lieu dau vao va muon-tra; khong phai test dong thoi.
// Chay khi web server va MySQL dang bat: php tests/run-api-tests.php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
if (!extension_loaded('curl')) {
    fwrite(STDERR, "Hay bat extension=curl trong php.ini truoc khi chay.\n");
    exit(1);
}

$baseUrl = rtrim(getenv('LIBRARY_API_URL') ?: 'http://localhost:8000/api/v1', '/');
$passed = 0;
$failed = false;
$adminToken = '';
$testUserId = 0;
$testLoanId = 0;
$temporaryBookId = 0;

function callApi(string $method, string $path, ?array $body = null, ?string $token = null): array
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
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10
    ]);
    $raw = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $networkError = curl_error($ch);
    curl_close($ch);
    if ($raw === false) {
        throw new RuntimeException('Khong ket noi duoc web server: ' . $networkError);
    }
    $data = $status === 204 ? null : json_decode($raw, true);
    if ($status !== 204 && !is_array($data)) {
        throw new RuntimeException('API tra du lieu khong phai JSON; HTTP ' . $status . '. Xem Terminal PHP.');
    }
    return ['status' => $status, 'body' => $data];
}

function assertTest(bool $condition, string $label, array $response = []): void
{
    global $passed;
    if (!$condition) {
        // Khong in body dang nhap vi body co the chua access_token.
        $code = $response['body']['error']['code'] ?? '';
        throw new RuntimeException($label . ' | HTTP ' . ($response['status'] ?? '?') . ' | ' . $code);
    }
    $passed++;
    echo '[PASS] ' . $label . "\n";
}

function expectStatus(array $response, int $status, string $label): void
{
    assertTest($response['status'] === $status, $label, $response);
}

function bookStock(int $bookId): int
{
    $response = callApi('GET', '/books/' . $bookId);
    if ($response['status'] !== 200) {
        throw new RuntimeException('Khong doc duoc ton kho sach kiem thu.');
    }
    return (int) $response['body']['data']['available_copies'];
}

echo "=== KIEM THU REST API THU VIEN ===\n";
echo "Script tao 1 doc gia TEST rieng, giu lich su test va khoa tai khoan khi ket thuc.\n";
try {
    $response = callApi('POST', '/auth/login', [
        'email' => getenv('LIBRARY_ADMIN_EMAIL') ?: 'admin@example.com',
        'password' => getenv('LIBRARY_ADMIN_PASSWORD') ?: 'Admin12345'
    ]);
    assertTest($response['status'] === 200
        && !empty($response['body']['data']['access_token'])
        && ($response['body']['data']['user']['role'] ?? '') === 'admin', 'Dang nhap Admin', $response);
    $adminToken = $response['body']['data']['access_token'];

    $users = callApi('GET', '/users?page=1&limit=10', null, $adminToken);
    assertTest($users['status'] === 200 && is_array($users['body']['data'] ?? null)
        && isset($users['body']['meta']['total']), 'GET /users tra data la mang va meta', $users);
    expectStatus(callApi('GET', '/users?page=0', null, $adminToken), 422, 'Tu choi page = 0');
    expectStatus(callApi('GET', '/me'), 401, 'Tu choi request thieu JWT');
    expectStatus(callApi('GET', '/me', null, 'abc.def.ghi'), 401, 'Tu choi JWT sai');
    expectStatus(callApi('GET', '/auth/login'), 405, 'Tu choi sai HTTP method');

    $email = 'test.api.' . bin2hex(random_bytes(6)) . '@example.com';
    $password = 'Test_' . bin2hex(random_bytes(8));
    $response = callApi('POST', '/auth/register', [
        'full_name' => 'TEST API - co the khoa', 'email' => $email,
        'password' => $password, 'role' => 'admin'
    ]);
    assertTest($response['status'] === 201 && ($response['body']['data']['role'] ?? '') === 'member',
        'Dang ky luon tao Member du client gui role admin', $response);
    $testUserId = (int) $response['body']['data']['id'];
    expectStatus(callApi('POST', '/auth/register', [
        'full_name' => 'TEST trung email', 'email' => $email, 'password' => $password
    ]), 409, 'Khong cho email trung');
    expectStatus(callApi('POST', '/auth/login', ['email' => $email, 'password' => 'MatKhauSai']),
        401, 'Khong chap nhan mat khau sai');
    $response = callApi('POST', '/auth/login', ['email' => $email, 'password' => $password]);
    assertTest($response['status'] === 200 && !empty($response['body']['data']['access_token']),
        'Dang nhap doc gia TEST', $response);
    $memberToken = $response['body']['data']['access_token'];
    $me = callApi('GET', '/me', null, $memberToken);
    assertTest($me['status'] === 200 && (int) ($me['body']['data']['id'] ?? 0) === $testUserId,
        'GET /me dung chu token', $me);
    expectStatus(callApi('GET', '/users', null, $memberToken), 403, 'Member khong duoc xem danh sach doc gia');

    $books = callApi('GET', '/books');
    expectStatus($books, 200, 'Doc danh sach sach');
    $selectedBook = null;
    foreach ($books['body']['data']['books'] as $book) {
        if ((int) $book['is_active'] === 1 && (int) $book['available_copies'] > 0) {
            $selectedBook = $book;
            break;
        }
    }
    if (!$selectedBook) {
        throw new RuntimeException('Can it nhat 1 dau sach hoat dong con ban de thu muon-tra.');
    }
    $bookId = (int) $selectedBook['id'];
    $stockBefore = bookStock($bookId);
    $response = callApi('POST', '/books', [
        'category_id' => (int) $selectedBook['category_id'], 'title' => 'TEST sach ngung cho muon',
        'author' => 'TEST API', 'total_copies' => 1, 'is_active' => 0
    ], $adminToken);
    assertTest($response['status'] === 201 && ($response['body']['data']['is_active'] ?? null) === 0,
        'Them sach luu dung is_active = 0', $response);
    $temporaryBookId = (int) $response['body']['data']['id'];
    $inactiveBook = callApi('GET', '/books/' . $temporaryBookId, null, $adminToken);
    assertTest(($inactiveBook['body']['data']['is_active'] ?? null) === 0,
        'Admin doc duoc sach ngung cho muon da luu vao CSDL', $inactiveBook);
    expectStatus(callApi('GET', '/books/' . $temporaryBookId), 404, 'Guest khong doc duoc sach inactive');
    expectStatus(callApi('GET', '/books/' . $temporaryBookId, null, $memberToken),
        404, 'Member khong doc duoc sach inactive');
    expectStatus(callApi('POST', '/loans', ['book_id' => $temporaryBookId], $memberToken),
        409, 'Khong muon duoc sach ngung cho muon');
    expectStatus(callApi('DELETE', '/books/' . $temporaryBookId, null, $adminToken),
        204, 'Xoa sach TEST chua co lich su');
    $temporaryBookId = 0;

    $response = callApi('POST', '/loans', ['book_id' => $bookId], $memberToken);
    assertTest($response['status'] === 201 && ($response['body']['data']['status'] ?? '') === 'pending',
        'Tao phieu moi phai thanh cong 201 pending', $response);
    $testLoanId = (int) $response['body']['data']['id'];
    assertTest(bookStock($bookId) === $stockBefore, 'Phieu pending khong tru ton kho');
    expectStatus(callApi('POST', '/loans', ['book_id' => $bookId], $memberToken),
        409, 'Chan phieu pending trung cung sach');
    expectStatus(callApi('PATCH', '/loans/' . $testLoanId, ['status' => 'borrowed'], $memberToken),
        403, 'Member khong tu duyet giao sach');

    $response = callApi('PATCH', '/loans/' . $testLoanId, ['status' => 'borrowed'], $adminToken);
    assertTest($response['status'] === 200 && ($response['body']['data']['status'] ?? '') === 'borrowed',
        'Admin giao sach thanh cong', $response);
    assertTest(bookStock($bookId) === $stockBefore - 1, 'Giao sach tru dung 1 ban');
    expectStatus(callApi('PATCH', '/loans/' . $testLoanId, ['status' => 'borrowed'], $adminToken),
        409, 'Khong giao lai phieu da borrowed');
    $response = callApi('PATCH', '/loans/' . $testLoanId, ['status' => 'returned'], $adminToken);
    assertTest($response['status'] === 200 && ($response['body']['data']['status'] ?? '') === 'returned',
        'Admin nhan tra thanh cong', $response);
    assertTest(bookStock($bookId) === $stockBefore, 'Tra sach cong lai dung 1 ban');
    expectStatus(callApi('PATCH', '/loans/' . $testLoanId, ['status' => 'returned'], $adminToken),
        409, 'Chan tra sach lan hai');
    assertTest(bookStock($bookId) === $stockBefore, 'Tra lap khong lam tang ton kho');
    $historyDelete = callApi('DELETE', '/users/' . $testUserId, null, $adminToken);
    assertTest($historyDelete['status'] === 409
        && ($historyDelete['body']['error']['code'] ?? '') === 'USER_HAS_LOAN_HISTORY',
        'Khong xoa tai khoan da co lich su', $historyDelete);
    expectStatus(callApi('GET', '/loans/' . $testLoanId, null, $adminToken),
        200, 'Phieu muon van con sau khi bi chan xoa');
    expectStatus(callApi('PATCH', '/users/' . $testUserId, ['is_active' => 0], $adminToken),
        200, 'Khoa doc gia TEST');
    expectStatus(callApi('GET', '/me', null, $memberToken), 401, 'JWT cu bi tu choi sau khi khoa tai khoan');
} catch (Throwable $e) {
    $failed = true;
    fwrite(STDERR, '[FAIL] ' . $e->getMessage() . "\n");
} finally {
    // Neu test dung giua chung, thu hoan tra sach va khoa tai khoan TEST.
    try {
        if ($testLoanId && $adminToken) {
            $loan = callApi('GET', '/loans/' . $testLoanId, null, $adminToken);
            $status = $loan['body']['data']['status'] ?? '';
            if ($status === 'borrowed' || $status === 'pending') {
                $cleanup = callApi('PATCH', '/loans/' . $testLoanId,
                    $status === 'borrowed' ? ['status' => 'returned']
                        : ['status' => 'rejected', 'rejection_reason' => 'Dọn dữ liệu kiểm thử bị gián đoạn.'], $adminToken);
                if ($cleanup['status'] !== 200) {
                    throw new RuntimeException('Khong don duoc phieu TEST #' . $testLoanId);
                }
            }
        }
        if ($temporaryBookId && $adminToken) {
            $cleanup = callApi('DELETE', '/books/' . $temporaryBookId, null, $adminToken);
            if (!in_array($cleanup['status'], [200, 204, 404], true)) {
                throw new RuntimeException('Khong don duoc sach TEST #' . $temporaryBookId);
            }
        }
        if ($testUserId && $adminToken) {
            $cleanup = callApi('PATCH', '/users/' . $testUserId, ['is_active' => 0], $adminToken);
            if ($cleanup['status'] !== 200) {
                throw new RuntimeException('Khong khoa duoc doc gia TEST #' . $testUserId);
            }
        }
    } catch (Throwable $e) {
        $failed = true;
        fwrite(STDERR, '[CAN KIEM TRA] ' . $e->getMessage() . "\n");
    }
}
echo 'So kiem tra dat: ' . $passed . "\n";
echo $failed ? "KET QUA: CHUA DAT\n" : "KET QUA: DAT\n";
exit($failed ? 1 : 0);
