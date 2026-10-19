<?php
declare(strict_types=1);

/**
 * Module Quản lý Đầu sách & Tra cứu công khai (Books) — Người 2 (tích hợp Người 1)
 * Endpoints:
 *   - GET    /api/v1/books       (Public; Admin được dùng include_inactive=1)
 *   - GET    /api/v1/books/{id}  (Public chỉ xem is_active=1; Admin xem được cả is_active=0)
 *   - POST   /api/v1/books       (Admin)
 *   - PUT    /api/v1/books/{id}  (Admin)
 *   - DELETE /api/v1/books/{id}  (Admin)
 */
function handleBookRoutes(string $method, ?string $idParam): never
{
    $pdo = getConnection();

    // 1. Tra cứu & phân trang danh sách sách: GET /api/v1/books
    if ($idParam === null && $method === 'GET') {
        $authUser = getOptionalAuthUser();
        $isAdmin = ($authUser !== null && ($authUser['role'] ?? '') === 'admin');

        $errors = [];

        // Kiểm tra include_inactive: chỉ Admin được phép dùng include_inactive=1
        $includeInactive = false;
        if (isset($_GET['include_inactive']) && $_GET['include_inactive'] !== '') {
            $rawInactive = strtolower(trim((string) $_GET['include_inactive']));
            if (!in_array($rawInactive, ['0', '1', 'true', 'false'], true)) {
                $errors['include_inactive'] = 'Tham số include_inactive chỉ chấp nhận 0 hoặc 1.';
            } elseif ($rawInactive === '1' || $rawInactive === 'true') {
                if (!$isAdmin) {
                    sendError(
                        403,
                        'FORBIDDEN',
                        'Chỉ Quản trị viên (Admin) mới được phép tra cứu sách ngừng hoạt động (include_inactive=1).'
                    );
                }
                $includeInactive = true;
            }
        }

        // Kiểm tra phân trang page & limit
        $page = 1;
        if (isset($_GET['page']) && $_GET['page'] !== '') {
            $rawPage = trim((string) $_GET['page']);
            if (!ctype_digit($rawPage) || (int) $rawPage < 1) {
                $errors['page'] = 'Số trang (page) phải là số nguyên dương lớn hơn hoặc bằng 1.';
            } else {
                $page = (int) $rawPage;
            }
        }

        // Mặc định limit = 50 khi không truyền (để giao diện kệ sách độc giả lấy đủ sách), hoặc theo tham số truyền vào (1..50)
        $limit = 50;
        if (isset($_GET['limit']) && $_GET['limit'] !== '') {
            $rawLimit = trim((string) $_GET['limit']);
            if (!ctype_digit($rawLimit) || (int) $rawLimit < 1 || (int) $rawLimit > 50) {
                $errors['limit'] = 'Số lượng mỗi trang (limit) phải từ 1 đến 50.';
            } else {
                $limit = (int) $rawLimit;
            }
        }

        // Kiểm tra bộ lọc category_id (cho phép 0 = tất cả danh mục như trên giao diện my-loans.html)
        $categoryId = null;
        if (isset($_GET['category_id']) && $_GET['category_id'] !== '') {
            $rawCat = trim((string) $_GET['category_id']);
            if ($rawCat === '0') {
                $categoryId = null;
            } elseif (!ctype_digit($rawCat) || (int) $rawCat <= 0) {
                $errors['category_id'] = 'Mã danh mục (category_id) phải là số nguyên dương.';
            } else {
                $categoryId = (int) $rawCat;
            }
        }

        // Kiểm tra bộ lọc available (0 hoặc 1)
        $availableFilter = null;
        if (isset($_GET['available']) && $_GET['available'] !== '') {
            $rawAvail = strtolower(trim((string) $_GET['available']));
            if (in_array($rawAvail, ['1', 'true'], true)) {
                $availableFilter = 1;
            } elseif (in_array($rawAvail, ['0', 'false'], true)) {
                $availableFilter = 0;
            } else {
                $errors['available'] = 'Tham số available chỉ chấp nhận 0 hoặc 1.';
            }
        }

        // Kiểm tra sắp xếp sort & order
        $sort = isset($_GET['sort']) && trim((string) $_GET['sort']) !== ''
            ? strtolower(trim((string) $_GET['sort']))
            : 'created_at';
        $allowedSort = [
            'title'            => 'b.title',
            'created_at'       => 'b.created_at',
            'publish_year'     => 'b.publish_year',
            'available_copies' => 'b.available_copies',
        ];
        if (!isset($allowedSort[$sort])) {
            $errors['sort'] = 'Tham số sort chỉ chấp nhận: title, created_at.';
        }

        $defaultOrder = ($sort === 'title') ? 'asc' : 'desc';
        $order = isset($_GET['order']) && trim((string) $_GET['order']) !== ''
            ? strtolower(trim((string) $_GET['order']))
            : $defaultOrder;
        if (!in_array($order, ['asc', 'desc'], true)) {
            $errors['order'] = 'Tham số order chỉ chấp nhận: asc, desc.';
        }

        // Kiểm tra từ khóa tìm kiếm q
        $q = '';
        if (isset($_GET['q'])) {
            if (!is_string($_GET['q'])) {
                $errors['q'] = 'Từ khóa tìm kiếm không hợp lệ.';
            } else {
                $q = trim($_GET['q']);
                if (mb_strlen($q, 'UTF-8') > 200) {
                    $errors['q'] = 'Từ khóa tìm kiếm (q) không được vượt quá 200 ký tự.';
                }
            }
        }

        if (!empty($errors)) {
            sendError(422, 'VALIDATION_ERROR', 'Tham số truy vấn danh sách sách không hợp lệ.', $errors);
        }

        // Xây dựng mệnh đề WHERE an toàn bằng Prepared Statement
        $where = [];
        $params = [];

        if (!$includeInactive) {
            $where[] = 'b.is_active = 1';
        }

        if ($categoryId !== null) {
            $where[] = 'b.category_id = :category_id';
            $params['category_id'] = $categoryId;
        }

        if ($availableFilter === 1) {
            $where[] = 'b.available_copies > 0';
        }

        if ($q !== '') {
            $escapedQ = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q);
            $where[] = "(b.title LIKE :q_title ESCAPE '\\\\' OR b.author LIKE :q_author ESCAPE '\\\\' OR b.isbn LIKE :q_isbn ESCAPE '\\\\')";
            $params['q_title']  = '%' . $escapedQ . '%';
            $params['q_author'] = '%' . $escapedQ . '%';
            $params['q_isbn']   = '%' . $escapedQ . '%';
        }

        $whereSql = empty($where) ? '' : ('WHERE ' . implode(' AND ', $where));

        // Đếm tổng số bản ghi khớp điều kiện
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM books b $whereSql");
        foreach ($params as $key => $val) {
            $countStmt->bindValue(':' . $key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $totalPages = $total === 0 ? 0 : (int) ceil($total / $limit);
        $offset = ($page - 1) * $limit;

        $sortColumn = $allowedSort[$sort];
        $orderDir = strtoupper($order);

        $sql = "
            SELECT
                b.id,
                b.category_id,
                c.name AS category_name,
                b.isbn,
                b.title,
                b.author,
                b.publisher,
                b.publish_year,
                b.description,
                b.cover_path,
                b.total_copies,
                b.available_copies,
                b.is_active,
                b.created_at,
                b.updated_at
            FROM books b
            INNER JOIN categories c ON c.id = b.category_id
            $whereSql
            ORDER BY $sortColumn $orderDir, b.id DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue(':' . $key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $books = array_map('formatBookRecord', $rows);

        // Lấy danh sách danh mục đính kèm để tương thích cả giao diện kệ sách ReadOwl và bộ lọc
        $catRows = $pdo->query('SELECT id, name, description FROM categories ORDER BY id ASC')->fetchAll();
        $categories = array_map(static function (array $c): array {
            return [
                'id'          => (int) $c['id'],
                'name'        => $c['name'],
                'description' => $c['description'],
            ];
        }, $catRows);

        sendJson(200, [
            'success' => true,
            'data'    => [
                'categories' => $categories,
                'books'      => $books,
            ],
            'meta'    => [
                'page'        => $page,
                'limit'       => $limit,
                'total'       => $total,
                'total_pages' => $totalPages,
            ],
            'message' => 'Lấy danh sách sách thành công.',
        ]);
    }

    // 2. Thêm mới đầu sách (Admin): POST /api/v1/books
    if ($idParam === null && $method === 'POST') {
        requireAdmin();
        $body = readJsonBody();

        $validated = validateBookPayload($pdo, $body, null);

        $stmt = $pdo->prepare('
            INSERT INTO books (
                category_id, isbn, title, author, publisher, publish_year,
                description, cover_path, total_copies, available_copies, is_active
            ) VALUES (
                :category_id, :isbn, :title, :author, :publisher, :publish_year,
                :description, :cover_path, :total_copies, :available_copies, :is_active
            )
        ');
        $stmt->execute([
            'category_id'      => $validated['category_id'],
            'isbn'             => $validated['isbn'],
            'title'            => $validated['title'],
            'author'           => $validated['author'],
            'publisher'        => $validated['publisher'],
            'publish_year'     => $validated['publish_year'],
            'description'      => $validated['description'],
            'cover_path'       => $validated['cover_path'],
            'total_copies'     => $validated['total_copies'],
            'available_copies' => $validated['total_copies'], // S05: available_copies = total_copies khi tạo mới
            'is_active'        => $validated['is_active'],
        ]);

        $newBookId = (int) $pdo->lastInsertId();
        header('Location: /api/v1/books/' . $newBookId);

        $created = fetchBookById($pdo, $newBookId);
        jsonSuccess($created, 'Thêm đầu sách mới thành công.', 201);
    }

    if ($idParam === null) {
        sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ cho đường dẫn này.');
    }

    // Kiểm tra ID đầu sách hợp lệ
    if (!ctype_digit($idParam) || (int) $idParam <= 0) {
        sendError(422, 'VALIDATION_ERROR', 'Mã đầu sách (id) phải là số nguyên dương.', [
            'id' => 'Mã đầu sách không hợp lệ.',
        ]);
    }
    $bookId = (int) $idParam;

    // 3. Xem chi tiết đầu sách: GET /api/v1/books/{id}
    if ($method === 'GET') {
        $book = fetchBookById($pdo, $bookId);
        if ($book === null) {
            sendError(404, 'BOOK_NOT_FOUND', 'Không tìm thấy đầu sách.');
        }

        jsonSuccess($book, 'Lấy thông tin chi tiết đầu sách thành công.');
    }

    // 4. Cập nhật thông tin sách & điều chỉnh số bản (Admin): PUT /api/v1/books/{id}
    if ($method === 'PUT' || $method === 'PATCH') {
        requireAdmin();
        $body = readJsonBody();

        try {
            $pdo->beginTransaction();

            $lockStmt = $pdo->prepare('SELECT * FROM books WHERE id = :id FOR UPDATE');
            $lockStmt->execute(['id' => $bookId]);
            $existing = $lockStmt->fetch();

            if (!$existing) {
                $pdo->rollBack();
                sendError(404, 'BOOK_NOT_FOUND', 'Không tìm thấy đầu sách cần cập nhật.');
            }

            $validated = validateBookPayload($pdo, $body, $existing);

            // Đếm số bản đang thực sự giữ bởi độc giả (borrowed) và số phiếu active (pending/borrowed)
            $loanCntStmt = $pdo->prepare("
                SELECT
                    COALESCE(SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END), 0) AS borrowed_cnt,
                    COALESCE(SUM(CASE WHEN status IN ('pending', 'borrowed') THEN 1 ELSE 0 END), 0) AS active_cnt
                FROM loans
                WHERE book_id = :book_id
            ");
            $loanCntStmt->execute(['book_id' => $bookId]);
            $loanCounts = $loanCntStmt->fetch();

            $borrowedFromStock = max(0, (int) $existing['total_copies'] - (int) $existing['available_copies']);
            $borrowedCopies = max($borrowedFromStock, (int) ($loanCounts['borrowed_cnt'] ?? 0));
            $activeOrBorrowed = max($borrowedCopies, (int) ($loanCounts['active_cnt'] ?? 0));

            $totalCopiesNew = $validated['total_copies'];

            // S06 / B12: Không cho giảm total_copies xuống nhỏ hơn số bản đang mượn / giữ chỗ
            if ($totalCopiesNew < $activeOrBorrowed) {
                $pdo->rollBack();
                sendError(
                    409,
                    'INVALID_TOTAL_COPIES',
                    sprintf(
                        'Không thể giảm tổng số bản xuống %d vì hiện đang có %d bản đang được mượn hoặc chờ duyệt.',
                        $totalCopiesNew,
                        $activeOrBorrowed
                    ),
                    [
                        'total_copies' => sprintf('Tổng số bản tối thiểu phải từ %d trở lên.', $activeOrBorrowed),
                    ]
                );
            }

            $availableCopiesNew = $totalCopiesNew - $borrowedCopies;

            $updateStmt = $pdo->prepare('
                UPDATE books
                SET
                    category_id      = :category_id,
                    isbn             = :isbn,
                    title            = :title,
                    author           = :author,
                    publisher        = :publisher,
                    publish_year     = :publish_year,
                    description      = :description,
                    cover_path       = :cover_path,
                    total_copies     = :total_copies,
                    available_copies = :available_copies,
                    is_active        = :is_active,
                    updated_at       = CURRENT_TIMESTAMP
                WHERE id = :id
            ');
            $updateStmt->execute([
                'category_id'      => $validated['category_id'],
                'isbn'             => $validated['isbn'],
                'title'            => $validated['title'],
                'author'           => $validated['author'],
                'publisher'        => $validated['publisher'],
                'publish_year'     => $validated['publish_year'],
                'description'      => $validated['description'],
                'cover_path'       => $validated['cover_path'],
                'total_copies'     => $totalCopiesNew,
                'available_copies' => $availableCopiesNew,
                'is_active'        => $validated['is_active'],
                'id'               => $bookId,
            ]);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        $updated = fetchBookById($pdo, $bookId);
        jsonSuccess($updated, 'Cập nhật thông tin đầu sách thành công.');
    }

    // 5. Xóa / Ngừng hoạt động đầu sách (Admin): DELETE /api/v1/books/{id}
    if ($method === 'DELETE') {
        requireAdmin();

        try {
            $pdo->beginTransaction();

            $lockStmt = $pdo->prepare('SELECT * FROM books WHERE id = :id FOR UPDATE');
            $lockStmt->execute(['id' => $bookId]);
            $existing = $lockStmt->fetch();

            if (!$existing) {
                $pdo->rollBack();
                sendError(404, 'BOOK_NOT_FOUND', 'Không tìm thấy đầu sách cần xóa.');
            }

            // S07 / B15: Nếu đang có phiếu pending hoặc borrowed -> trả 409 Conflict
            $activeLoanStmt = $pdo->prepare("
                SELECT COUNT(*) FROM loans
                WHERE book_id = :book_id AND status IN ('pending', 'borrowed')
            ");
            $activeLoanStmt->execute(['book_id' => $bookId]);
            $activeLoanCount = (int) $activeLoanStmt->fetchColumn();

            if ($activeLoanCount > 0) {
                $pdo->rollBack();
                sendError(
                    409,
                    'BOOK_HAS_ACTIVE_LOANS',
                    sprintf(
                        'Không thể xóa đầu sách "%s" vì đang có %d phiếu mượn chờ duyệt hoặc đang mượn.',
                        $existing['title'],
                        $activeLoanCount
                    )
                );
            }

            // Kiểm tra lịch sử phiếu mượn (returned, rejected, cancelled)
            $historyStmt = $pdo->prepare('SELECT COUNT(*) FROM loans WHERE book_id = :book_id');
            $historyStmt->execute(['book_id' => $bookId]);
            $totalLoanCount = (int) $historyStmt->fetchColumn();

            if ($totalLoanCount > 0) {
                // S07 Phương án 1: Ngừng hoạt động mềm để bảo toàn lịch sử mượn trả
                $softStmt = $pdo->prepare('
                    UPDATE books
                    SET is_active = 0, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                ');
                $softStmt->execute(['id' => $bookId]);
                $pdo->commit();

                jsonSuccess(
                    [
                        'id'         => $bookId,
                        'deleted_id' => $bookId,
                        'title'      => $existing['title'],
                        'mode'       => 'deactivated',
                        'is_active'  => 0,
                    ],
                    'Đầu sách đã có lịch sử mượn trả nên được chuyển sang trạng thái ngừng cho mượn (is_active = 0) để bảo toàn lịch sử.'
                );
            }

            // Sách chưa từng có bất kỳ bản ghi nào trong bảng loans -> xóa cứng (204 No Content)
            $delStmt = $pdo->prepare('DELETE FROM books WHERE id = :id');
            $delStmt->execute(['id' => $bookId]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        http_response_code(204);
        exit;
    }

    sendError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
}

/**
 * Kiểm tra dữ liệu đầu vào khi tạo mới hoặc cập nhật sách.
 */
function validateBookPayload(PDO $pdo, array $body, ?array $existingBook): array
{
    $errors = [];

    $title = array_key_exists('title', $body) && is_string($body['title'])
        ? trim($body['title'])
        : ($existingBook['title'] ?? '');
    if ($title === '') {
        $errors['title'] = 'Tên sách (title) không được để trống.';
    } elseif (mb_strlen($title, 'UTF-8') > 200) {
        $errors['title'] = 'Tên sách không được vượt quá 200 ký tự.';
    }

    $author = array_key_exists('author', $body) && is_string($body['author'])
        ? trim($body['author'])
        : ($existingBook['author'] ?? '');
    if ($author === '') {
        $errors['author'] = 'Tác giả (author) không được để trống.';
    } elseif (mb_strlen($author, 'UTF-8') > 200) {
        $errors['author'] = 'Tên tác giả không được vượt quá 200 ký tự.';
    }

    // category_id
    $categoryId = null;
    $rawCat = array_key_exists('category_id', $body)
        ? $body['category_id']
        : ($existingBook['category_id'] ?? null);

    if ($rawCat === null || $rawCat === '') {
        $errors['category_id'] = 'Danh mục sách (category_id) là bắt buộc.';
    } elseif (is_int($rawCat) && $rawCat > 0) {
        $categoryId = $rawCat;
    } elseif (is_string($rawCat) && ctype_digit(trim($rawCat)) && (int) trim($rawCat) > 0) {
        $categoryId = (int) trim($rawCat);
    } else {
        $errors['category_id'] = 'Mã danh mục (category_id) phải là số nguyên dương.';
    }

    if ($categoryId !== null) {
        $catStmt = $pdo->prepare('SELECT id FROM categories WHERE id = :id LIMIT 1');
        $catStmt->execute(['id' => $categoryId]);
        if (!$catStmt->fetch()) {
            $errors['category_id'] = 'Danh mục sách được chọn không tồn tại trong hệ thống.';
        }
    }

    // isbn (tùy chọn, duy nhất)
    $isbn = null;
    $rawIsbn = array_key_exists('isbn', $body)
        ? $body['isbn']
        : ($existingBook['isbn'] ?? null);
    if ($rawIsbn !== null && trim((string) $rawIsbn) !== '') {
        $isbn = trim((string) $rawIsbn);
        if (mb_strlen($isbn, 'UTF-8') > 20) {
            $errors['isbn'] = 'Mã ISBN không được vượt quá 20 ký tự.';
        }
    }

    // publisher (tùy chọn)
    $publisher = null;
    $rawPub = array_key_exists('publisher', $body)
        ? $body['publisher']
        : ($existingBook['publisher'] ?? null);
    if ($rawPub !== null && trim((string) $rawPub) !== '') {
        $publisher = trim((string) $rawPub);
        if (mb_strlen($publisher, 'UTF-8') > 200) {
            $errors['publisher'] = 'Tên nhà xuất bản không được vượt quá 200 ký tự.';
        }
    }

    // publish_year (tùy chọn, 1000 .. năm hiện tại + 1)
    $publishYear = null;
    $maxYear = (int) date('Y') + 1;
    $rawYear = array_key_exists('publish_year', $body)
        ? $body['publish_year']
        : ($existingBook['publish_year'] ?? null);
    if ($rawYear !== null && $rawYear !== '') {
        if (is_int($rawYear)) {
            $publishYear = $rawYear;
        } elseif (is_string($rawYear) && ctype_digit(trim($rawYear))) {
            $publishYear = (int) trim($rawYear);
        } else {
            $errors['publish_year'] = 'Năm xuất bản phải là số nguyên hợp lệ.';
        }

        if ($publishYear !== null && ($publishYear < 1000 || $publishYear > $maxYear)) {
            $errors['publish_year'] = sprintf('Năm xuất bản phải nằm trong khoảng từ 1000 đến %d.', $maxYear);
        }
    }

    // description (tùy chọn)
    $description = null;
    $rawDesc = array_key_exists('description', $body)
        ? $body['description']
        : ($existingBook['description'] ?? null);
    if ($rawDesc !== null && trim((string) $rawDesc) !== '') {
        $description = trim((string) $rawDesc);
        if (mb_strlen($description, 'UTF-8') > 5000) {
            $errors['description'] = 'Mô tả sách không được vượt quá 5000 ký tự.';
        }
    }

    // cover_path (tùy chọn, đường dẫn nội bộ)
    $coverPath = null;
    $rawCover = array_key_exists('cover_path', $body)
        ? $body['cover_path']
        : ($existingBook['cover_path'] ?? null);
    if ($rawCover !== null && trim((string) $rawCover) !== '') {
        $coverPath = trim((string) $rawCover);
        if (mb_strlen($coverPath, 'UTF-8') > 255) {
            $errors['cover_path'] = 'Đường dẫn ảnh bìa không được vượt quá 255 ký tự.';
        } elseif (preg_match('#^https?://#i', $coverPath)) {
            $errors['cover_path'] = 'Ảnh bìa chỉ sử dụng đường dẫn nội bộ trong dự án.';
        }
    }

    // total_copies (bắt buộc >= 0)
    $totalCopies = null;
    $rawTotal = array_key_exists('total_copies', $body)
        ? $body['total_copies']
        : ($existingBook['total_copies'] ?? null);
    if ($rawTotal === null || $rawTotal === '') {
        $errors['total_copies'] = 'Tổng số bản sách (total_copies) là bắt buộc.';
    } elseif (is_int($rawTotal) && $rawTotal >= 0 && $rawTotal <= 10000) {
        $totalCopies = $rawTotal;
    } elseif (is_string($rawTotal) && ctype_digit(trim($rawTotal)) && (int) trim($rawTotal) <= 10000) {
        $totalCopies = (int) trim($rawTotal);
    } else {
        $errors['total_copies'] = 'Tổng số bản sách (total_copies) phải là số nguyên không âm (0 - 10000).';
    }

    // is_active (0 hoặc 1, mặc định 1 khi tạo mới)
    $isActive = $existingBook !== null ? (int) $existingBook['is_active'] : 1;
    if (array_key_exists('is_active', $body) && $body['is_active'] !== null && $body['is_active'] !== '') {
        $rawActive = $body['is_active'];
        if ($rawActive === 1 || $rawActive === '1' || $rawActive === true || $rawActive === 'true') {
            $isActive = 1;
        } elseif ($rawActive === 0 || $rawActive === '0' || $rawActive === false || $rawActive === 'false') {
            $isActive = 0;
        } else {
            $errors['is_active'] = 'Trạng thái hoạt động (is_active) chỉ chấp nhận 0 hoặc 1.';
        }
    }

    if (!empty($errors)) {
        sendError(422, 'VALIDATION_ERROR', 'Dữ liệu đầu sách không hợp lệ.', $errors);
    }

    // Kiểm tra trùng ISBN -> 409 Conflict
    if ($isbn !== null) {
        if ($existingBook === null) {
            $isbnStmt = $pdo->prepare('SELECT id FROM books WHERE isbn = :isbn LIMIT 1');
            $isbnStmt->execute(['isbn' => $isbn]);
        } else {
            $isbnStmt = $pdo->prepare('SELECT id FROM books WHERE isbn = :isbn AND id <> :id LIMIT 1');
            $isbnStmt->execute(['isbn' => $isbn, 'id' => (int) $existingBook['id']]);
        }

        if ($isbnStmt->fetch()) {
            sendError(409, 'DUPLICATE_ISBN', 'Mã ISBN này đã tồn tại ở một đầu sách khác trong hệ thống.', [
                'isbn' => 'Mã ISBN đã được sử dụng.',
            ]);
        }
    }

    return [
        'category_id'  => $categoryId,
        'isbn'         => $isbn,
        'title'        => $title,
        'author'       => $author,
        'publisher'    => $publisher,
        'publish_year' => $publishYear,
        'description'  => $description,
        'cover_path'   => $coverPath,
        'total_copies' => $totalCopies,
        'is_active'    => $isActive,
    ];
}

function fetchBookById(PDO $pdo, int $bookId): ?array
{
    $stmt = $pdo->prepare('
        SELECT
            b.id,
            b.category_id,
            c.name AS category_name,
            b.isbn,
            b.title,
            b.author,
            b.publisher,
            b.publish_year,
            b.description,
            b.cover_path,
            b.total_copies,
            b.available_copies,
            b.is_active,
            b.created_at,
            b.updated_at
        FROM books b
        INNER JOIN categories c ON c.id = b.category_id
        WHERE b.id = :id
        LIMIT 1
    ');
    $stmt->execute(['id' => $bookId]);
    $row = $stmt->fetch();

    if (!$row) {
        return null;
    }

    return formatBookRecord($row);
}

function formatBookRecord(array $row): array
{
    $totalCopies = (int) $row['total_copies'];
    $availableCopies = (int) $row['available_copies'];
    $isActive = (int) $row['is_active'];

    return [
        'id'               => (int) $row['id'],
        'category_id'      => (int) $row['category_id'],
        'category_name'    => $row['category_name'],
        'isbn'             => $row['isbn'],
        'title'            => $row['title'],
        'author'           => $row['author'],
        'publisher'        => $row['publisher'],
        'publish_year'     => $row['publish_year'] !== null ? (int) $row['publish_year'] : null,
        'description'      => $row['description'],
        'cover_path'       => $row['cover_path'],
        'total_copies'     => $totalCopies,
        'available_copies' => $availableCopies,
        'borrowed_copies'  => max(0, $totalCopies - $availableCopies),
        'is_available'     => ($isActive === 1 && $availableCopies > 0),
        'is_active'        => $isActive,
        'created_at'       => $row['created_at'],
        'updated_at'       => $row['updated_at'],
    ];
}
