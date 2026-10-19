<?php
declare(strict_types=1);

/**
 * Helper đọc JSON request body, Authorization header và kiểm tra quyền tùy chọn (Người 1 + Người 2).
 */
function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
        sendError(400, 'INVALID_JSON', 'Dữ liệu gửi lên không phải JSON hợp lệ.');
    }

    return $data;
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
