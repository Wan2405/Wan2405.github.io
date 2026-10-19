<?php
declare(strict_types=1);

/**
 * Chuẩn hóa JSON Response cho toàn bộ REST API (Người 1 + Người 2).
 */
function sendJson(int $statusCode, array $payload): never
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function sendError(int $statusCode, string $code, string $message, array $fields = []): never
{
    $error = [
        'code'    => $code,
        'message' => $message,
    ];

    if (!empty($fields)) {
        $error['fields'] = (object) $fields;
    }

    sendJson($statusCode, [
        'success' => false,
        'error'   => $error,
    ]);
}

function jsonSuccess(
    mixed $data = null,
    string $message = 'Thành công.',
    int $statusCode = 200,
    ?array $meta = null
): never {
    $payload = [
        'success' => true,
        'data'    => $data,
    ];

    if ($meta !== null) {
        $payload['meta'] = $meta;
    }

    $payload['message'] = $message;

    sendJson($statusCode, $payload);
}

function jsonError(
    string $code,
    string $message,
    int $statusCode = 400,
    array $fields = []
): never {
    sendError($statusCode, $code, $message, $fields);
}

function handleCorsAndPreflight(): void
{
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
