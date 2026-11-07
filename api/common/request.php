<?php
declare(strict_types=1);

/**
 * Helper đọc JSON request body, Authorization header và kiểm tra quyền tùy chọn (Người 1 + Người 2).
 */
function readJsonBody(): array
{
    $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($contentType !== 'application/json') {
        sendError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Vui lòng gửi Content-Type: application/json.');
    }

    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        sendError(400, 'INVALID_JSON', 'Body phải chứa một JSON object hợp lệ.');
    }

    try {
        $object = json_decode($raw, false, 512, JSON_THROW_ON_ERROR);
        if (!$object instanceof stdClass) {
            sendError(400, 'INVALID_JSON', 'Body phải là JSON object, không phải mảng hoặc giá trị đơn.');
        }
        return json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $e) {
        sendError(400, 'INVALID_JSON', 'Dữ liệu gửi lên không phải JSON hợp lệ.');
    }
}

/** Không ép mảng/object/bool/số thực thành số nguyên. Hỗ trợ chuỗi số từ client cũ. */
function validatedInteger(mixed $value, int $minimum, int $maximum): ?int
{
    if (is_int($value)) {
        return $value >= $minimum && $value <= $maximum ? $value : null;
    }
    if (!is_string($value) || !ctype_digit(trim($value))) {
        return null;
    }
    $digits = ltrim(trim($value), '0');
    $digits = $digits === '' ? '0' : $digits;
    $maxDigits = (string) $maximum;
    if (strlen($digits) > strlen($maxDigits)
        || (strlen($digits) === strlen($maxDigits) && strcmp($digits, $maxDigits) > 0)) {
        return null;
    }
    $number = (int) $digits;
    return $number >= $minimum ? $number : null;
}

/** Chuỗi tùy chọn dùng null/chuỗi rỗng để xóa; trường bị bỏ qua giữ giá trị mặc định. */
function validatedText(array $body, string $key, ?string $default, int $maxLength, array &$errors, bool $required = false): ?string
{
    $value = array_key_exists($key, $body) ? $body[$key] : $default;
    if ($value === null && !$required) {
        return null;
    }
    if (!is_string($value)) {
        $errors[$key] = $required ? 'Trường này phải là chuỗi không rỗng.' : 'Trường này phải là chuỗi hoặc null.';
        return null;
    }
    $value = trim($value);
    if (($required && $value === '') || mb_strlen($value, 'UTF-8') > $maxLength || str_contains($value, "\0")) {
        $errors[$key] = 'Trường này phải có ' . ($required ? '1' : '0') . '–' . $maxLength . ' ký tự hợp lệ.';
    }
    return !$required && $value === '' ? null : $value;
}

/** Chặn query dạng mảng và số quá lớn trước khi các module thực hiện ép kiểu. */
function validateQueryParameters(): void
{
    $errors = [];
    $maxima = [
        'page' => intdiv(PHP_INT_MAX, 100), 'limit' => PHP_INT_MAX, 'top_limit' => PHP_INT_MAX,
        'user_id' => 4294967295, 'book_id' => 4294967295, 'category_id' => 4294967295,
    ];
    foreach ($_GET as $key => $value) {
        if (!is_string($key) || !mb_check_encoding($key, 'UTF-8') || str_contains($key, "\0")) {
            $errors['query'] = 'Tên tham số truy vấn không hợp lệ.';
            continue;
        }
        if (!is_string($value) || !mb_check_encoding($value, 'UTF-8') || str_contains($value, "\0")) {
            $errors[$key] = 'Tham số truy vấn phải là một giá trị văn bản hợp lệ.';
        } elseif (isset($maxima[$key]) && ctype_digit(trim($value))
            && validatedInteger($value, 0, $maxima[$key]) === null) {
            $errors[$key] = 'Giá trị số vượt quá phạm vi cho phép.';
        }
    }
    if ($errors) {
        sendError(422, 'VALIDATION_ERROR', 'Tham số truy vấn không hợp lệ.', $errors);
    }
}

function getJsonBody(): array
{
    return readJsonBody();
}

function authorizationHeader(): string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim((string) $_SERVER['HTTP_AUTHORIZATION']);
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return trim((string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $k => $v) {
            if (strtolower((string) $k) === 'authorization') {
                return trim((string) $v);
            }
        }
    }
    return '';
}

/**
 * Trả về thông tin user nếu request có kèm Bearer token hợp lệ,
 * hoặc trả về null nếu khách vãng lai không gửi Authorization header.
 */
function getOptionalAuthUser(): ?array
{
    $header = authorizationHeader();
    if ($header === '') {
        return null;
    }
    $_SERVER['HTTP_AUTHORIZATION'] = $header;
    return requireAuth();
}
