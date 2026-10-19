<?php
declare(strict_types=1);

/**
 * Module Quản lý Danh mục sách (Categories) — Người 2
 * Endpoints:
 *   - GET    /api/v1/categories
 *   - GET    /api/v1/categories/{id}
 *   - POST   /api/v1/categories       (Admin)
 *   - PUT    /api/v1/categories/{id}  (Admin)
 *   - DELETE /api/v1/categories/{id}  (Admin)
 */
function handleCategoryRoutes(string $method, ?string $idParam): never
{
    $pdo = getConnection();

    // 1. Danh sách danh mục (Public: Guest / Member / Admin)
    if ($idParam === null && $method === 'GET') {
        $sql = "
            SELECT
                c.id,
                c.name,
                c.description,
                c.created_at,
                COUNT(b.id) AS book_count,
                COALESCE(SUM(CASE WHEN b.is_active = 1 THEN 1 ELSE 0 END), 0) AS active_book_count
            FROM categories c
            LEFT JOIN books b ON b.category_id = c.id
            GROUP BY c.id, c.name, c.description, c.created_at
            ORDER BY c.name ASC, c.id ASC
        ";
        $rows = $pdo->query($sql)->fetchAll();

        $categories = array_map(static function (array $row): array {
            return [
                'id'                => (int) $row['id'],
                'name'              => $row['name'],
                'description'       => $row['description'],
                'book_count'        => (int) $row['book_count'],
                'active_book_count' => (int) $row['active_book_count'],
                'created_at'        => $row['created_at'],
            ];
        }, $rows);

        jsonSuccess($categories, 'Lấy danh sách danh mục sách thành công.');
    }

    // 2. Tạo danh mục mới (Admin)
    if ($idParam === null && $method === 'POST') {
        requireAdmin();
        $body = readJsonBody();

        $name = isset($body['name']) && is_string($body['name']) ? trim($body['name']) : '';
        $description = array_key_exists('description', $body) && $body['description'] !== null
            ? trim((string) $body['description'])
            : null;

        $errors = [];
        $nameLen = mb_strlen($name, 'UTF-8');
        if ($name === '') {
            $errors['name'] = 'Tên danh mục không được để trống.';
        } elseif ($nameLen < 2 || $nameLen > 100) {
            $errors['name'] = 'Tên danh mục phải từ 2 đến 100 ký tự.';
        }

        if ($description !== null && mb_strlen($description, 'UTF-8') > 1000) {
            $errors['description'] = 'Mô tả danh mục không được vượt quá 1000 ký tự.';
        }

        if (!empty($errors)) {
            sendError(422, 'VALIDATION_ERROR', 'Dữ liệu danh mục không hợp lệ.', $errors);
        }

        $dupStmt = $pdo->prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(:name) LIMIT 1');
        $dupStmt->execute(['name' => $name]);
        if ($dupStmt->fetch()) {
            sendError(409, 'CATEGORY_NAME_EXISTS', 'Tên danh mục đã tồn tại trong hệ thống.', [
                'name' => 'Vui lòng chọn tên danh mục khác.',
            ]);
        }

        $insertStmt = $pdo->prepare('
            INSERT INTO categories (name, description)
            VALUES (:name, :description)
        ');
        $insertStmt->execute([
            'name'        => $name,
            'description' => ($description === '') ? null : $description,
        ]);

        $newId = (int) $pdo->lastInsertId();
        header('Location: /api/v1/categories/' . $newId);

        $created = fetchCategoryById($pdo, $newId);
        jsonSuccess($created, 'Tạo danh mục sách thành công.', 201);
    }

    if ($idParam === null) {
        sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ cho đường dẫn này.');
    }

    // Kiểm tra ID danh mục hợp lệ
    if (!ctype_digit($idParam) || (int) $idParam <= 0) {
        sendError(422, 'VALIDATION_ERROR', 'Mã danh mục (id) phải là số nguyên dương.', [
            'id' => 'Mã danh mục không hợp lệ.',
        ]);
    }
    $categoryId = (int) $idParam;

    // 3. Xem chi tiết 1 danh mục (Public)
    if ($method === 'GET') {
        $category = fetchCategoryById($pdo, $categoryId);
        if ($category === null) {
            sendError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục sách.');
        }
        jsonSuccess($category, 'Lấy thông tin danh mục sách thành công.');
    }

    // 4. Cập nhật danh mục (Admin)
    if ($method === 'PUT' || $method === 'PATCH') {
        requireAdmin();

        $existing = fetchCategoryById($pdo, $categoryId);
        if ($existing === null) {
            sendError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục sách cần cập nhật.');
        }

        $body = readJsonBody();
        $name = isset($body['name']) && is_string($body['name']) ? trim($body['name']) : '';
        $description = array_key_exists('description', $body)
            ? ($body['description'] !== null ? trim((string) $body['description']) : null)
            : $existing['description'];

        $errors = [];
        $nameLen = mb_strlen($name, 'UTF-8');
        if ($name === '') {
            $errors['name'] = 'Tên danh mục không được để trống.';
        } elseif ($nameLen < 2 || $nameLen > 100) {
            $errors['name'] = 'Tên danh mục phải từ 2 đến 100 ký tự.';
        }

        if ($description !== null && mb_strlen($description, 'UTF-8') > 1000) {
            $errors['description'] = 'Mô tả danh mục không được vượt quá 1000 ký tự.';
        }

        if (!empty($errors)) {
            sendError(422, 'VALIDATION_ERROR', 'Dữ liệu cập nhật danh mục không hợp lệ.', $errors);
        }

        $dupStmt = $pdo->prepare('
            SELECT id FROM categories
            WHERE LOWER(name) = LOWER(:name) AND id <> :id
            LIMIT 1
        ');
        $dupStmt->execute(['name' => $name, 'id' => $categoryId]);
        if ($dupStmt->fetch()) {
            sendError(409, 'CATEGORY_NAME_EXISTS', 'Tên danh mục đã tồn tại ở một danh mục khác.', [
                'name' => 'Vui lòng chọn tên danh mục khác.',
            ]);
        }

        $updateStmt = $pdo->prepare('
            UPDATE categories
            SET name = :name, description = :description
            WHERE id = :id
        ');
        $updateStmt->execute([
            'name'        => $name,
            'description' => ($description === '') ? null : $description,
            'id'          => $categoryId,
        ]);

        $updated = fetchCategoryById($pdo, $categoryId);
        jsonSuccess($updated, 'Cập nhật danh mục sách thành công.');
    }

    // 5. Xóa danh mục (Admin) — chặn xóa nếu còn sách thuộc danh mục (DM04)
    if ($method === 'DELETE') {
        requireAdmin();

        $existing = fetchCategoryById($pdo, $categoryId);
        if ($existing === null) {
            sendError(404, 'CATEGORY_NOT_FOUND', 'Không tìm thấy danh mục sách cần xóa.');
        }

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM books WHERE category_id = :id');
        $countStmt->execute(['id' => $categoryId]);
        $bookCount = (int) $countStmt->fetchColumn();

        if ($bookCount > 0) {
            sendError(
                409,
                'CATEGORY_IN_USE',
                sprintf(
                    'Không thể xóa danh mục "%s" vì đang có %d đầu sách thuộc danh mục này.',
                    $existing['name'],
                    $bookCount
                ),
                ['category_id' => 'Danh mục đang có sách liên kết.']
            );
        }

        $delStmt = $pdo->prepare('DELETE FROM categories WHERE id = :id');
        $delStmt->execute(['id' => $categoryId]);

        jsonSuccess(
            [
                'id'         => $categoryId,
                'deleted_id' => $categoryId,
                'name'       => $existing['name'],
            ],
            'Đã xóa danh mục sách thành công.'
        );
    }

    sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
}

function fetchCategoryById(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('
        SELECT
            c.id,
            c.name,
            c.description,
            c.created_at,
            COUNT(b.id) AS book_count,
            COALESCE(SUM(CASE WHEN b.is_active = 1 THEN 1 ELSE 0 END), 0) AS active_book_count
        FROM categories c
        LEFT JOIN books b ON b.category_id = c.id
        WHERE c.id = :id
        GROUP BY c.id, c.name, c.description, c.created_at
        LIMIT 1
    ');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();

    if (!$row) {
        return null;
    }

    return [
        'id'                => (int) $row['id'],
        'name'              => $row['name'],
        'description'       => $row['description'],
        'book_count'        => (int) $row['book_count'],
        'active_book_count' => (int) $row['active_book_count'],
        'created_at'        => $row['created_at'],
    ];
}
