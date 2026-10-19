-- =============================================================================
-- CẤU TRÚC CƠ SỞ DỮ LIỆU CHUNG (SCHEMA) — HỆ THỐNG THƯ VIỆN MƯỢN - TRẢ SÁCH
-- Engine: InnoDB | Charset: utf8mb4_unicode_ci
-- Tương thích đầy đủ Người 1 (users, loans) và Người 2 (categories, books, statistics)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS library_rest
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE library_rest;
SET NAMES utf8mb4;
SET time_zone = '+07:00';

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS loans;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Bảng tài khoản người dùng: Admin kiêm thủ thư và Member (độc giả)
CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'member') NOT NULL DEFAULT 'member',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_active CHECK (is_active IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng danh mục sách
CREATE TABLE categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng đầu sách (mỗi dòng là 1 đầu sách, có thể có nhiều bản sách)
CREATE TABLE books (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    isbn VARCHAR(20) NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(200) NOT NULL,
    publisher VARCHAR(200) NULL,
    publish_year SMALLINT UNSIGNED NULL,
    description TEXT NULL,
    cover_path VARCHAR(255) NULL,
    total_copies INT UNSIGNED NOT NULL DEFAULT 0,
    available_copies INT UNSIGNED NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_books_category (category_id),
    INDEX idx_books_active_avail (is_active, available_copies),
    INDEX idx_books_title (title),
    INDEX idx_books_author (author),

    CONSTRAINT fk_books_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_books_copies
        CHECK (available_copies <= total_copies),
    CONSTRAINT chk_books_active
        CHECK (is_active IN (0, 1)),
    CONSTRAINT chk_books_year
        CHECK (publish_year IS NULL OR publish_year BETWEEN 1000 AND 2100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng phiếu mượn - trả sách
CREATE TABLE loans (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    book_id INT UNSIGNED NOT NULL,
    status ENUM('pending', 'borrowed', 'returned', 'rejected', 'cancelled')
        NOT NULL DEFAULT 'pending',
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    borrowed_at DATETIME NULL,
    due_date DATE NULL,
    returned_at DATETIME NULL,
    approved_by INT UNSIGNED NULL,
    returned_by INT UNSIGNED NULL,
    rejection_reason VARCHAR(500) NULL,

    INDEX idx_loans_user_status (user_id, status),
    INDEX idx_loans_book_status (book_id, status),
    INDEX idx_loans_status_due (status, due_date),

    CONSTRAINT fk_loans_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_loans_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_loans_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_loans_returned_by
        FOREIGN KEY (returned_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
