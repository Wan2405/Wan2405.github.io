<?php

function getLoanConfig()
{
    $config = require __DIR__ . '/../../../config/app.php';
    return [
        'max_active_loans' => isset($config['max_active_loans']) ? (int) $config['max_active_loans'] : 3,
        'loan_duration_days' => isset($config['loan_duration_days']) ? (int) $config['loan_duration_days'] : 14
    ];
}

function buildLoanLinks(array $loan, string $viewerRole)
{
    $id = (int) $loan['id'];
    $status = $loan['status'];
    $links = [
        'self' => [
            'href' => '/api/v1/loans/' . $id,
            'method' => 'GET'
        ],
        'book' => [
            'href' => '/api/v1/books/' . (int) $loan['book_id'],
            'method' => 'GET'
        ]
    ];

    if ($viewerRole === 'member' && $status === 'pending') {
        $links['cancel'] = [
            'href' => '/api/v1/loans/' . $id,
            'method' => 'PATCH',
            'body' => ['status' => 'cancelled']
        ];
    }

    if ($viewerRole === 'admin') {
        $links['user'] = [
            'href' => '/api/v1/users/' . (int) $loan['user_id'],
            'method' => 'GET'
        ];
        if ($status === 'pending') {
            $links['approve'] = [
                'href' => '/api/v1/loans/' . $id,
                'method' => 'PATCH',
                'body' => ['status' => 'borrowed']
            ];
            $links['reject'] = [
                'href' => '/api/v1/loans/' . $id,
                'method' => 'PATCH',
                'body' => ['status' => 'rejected', 'rejection_reason' => '']
            ];
        } elseif ($status === 'borrowed') {
            $links['return'] = [
                'href' => '/api/v1/loans/' . $id,
                'method' => 'PATCH',
                'body' => ['status' => 'returned']
            ];
        }
    }

    return $links;
}

function formatLoanRow(array $row, string $viewerRole)
{
    $isOverdue = (int) ($row['is_overdue'] ?? 0) === 1;
    $isReturnedLate = false;
    if ($row['status'] === 'returned' && !empty($row['returned_at']) && !empty($row['due_date'])) {
        $returnedDate = substr((string) $row['returned_at'], 0, 10);
        if ($returnedDate > $row['due_date']) {
            $isReturnedLate = true;
        }
    }

    return [
        'id' => (int) $row['id'],
        'user_id' => (int) $row['user_id'],
        'user_name' => $row['user_name'] ?? null,
        'user_email' => $row['user_email'] ?? null,
        'user_is_active' => isset($row['user_is_active']) ? (int) $row['user_is_active'] : null,
        'book_id' => (int) $row['book_id'],
        'book_title' => $row['book_title'] ?? null,
        'book_author' => $row['book_author'] ?? null,
        'book_cover' => $row['book_cover'] ?? null,
        'book_available_copies' => isset($row['book_available_copies']) ? (int) $row['book_available_copies'] : null,
        'book_total_copies' => isset($row['book_total_copies']) ? (int) $row['book_total_copies'] : null,
        'category_id' => isset($row['category_id']) ? (int) $row['category_id'] : null,
        'category_name' => $row['category_name'] ?? null,
        'status' => $row['status'],
        'is_overdue' => $isOverdue,
        'is_returned_late' => $isReturnedLate,
        'requested_at' => $row['requested_at'],
        'borrowed_at' => $row['borrowed_at'],
        'due_date' => $row['due_date'],
        'returned_at' => $row['returned_at'],
        'approved_by' => $row['approved_by'] !== null ? (int) $row['approved_by'] : null,
        'approved_by_name' => $row['approved_by_name'] ?? null,
        'returned_by' => $row['returned_by'] !== null ? (int) $row['returned_by'] : null,
        'returned_by_name' => $row['returned_by_name'] ?? null,
        'rejection_reason' => $row['rejection_reason'],
        'links' => buildLoanLinks($row, $viewerRole)
    ];
}

function fetchLoanDetailById(PDO $pdo, int $loanId)
{
    $sql = "
        SELECT
            l.id,
            l.user_id,
            u.full_name AS user_name,
            u.email AS user_email,
            u.is_active AS user_is_active,
            l.book_id,
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
        WHERE l.id = :id
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $loanId]);
    return $stmt->fetch();
}
