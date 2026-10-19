const DEFAULT_BOOK_GRADIENTS = [
    'linear-gradient(135deg, #0ea5e9 0%, #1e3a8a 100%)',
    'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
    'linear-gradient(135deg, #475569 0%, #0f172a 100%)',
    'linear-gradient(135deg, #059669 0%, #064e3b 100%)',
    'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
    'linear-gradient(135deg, #7c3aed 0%, #3b0764 100%)'
];

const LOAN_STATUS_BADGES = {
    pending: { text: 'Chờ duyệt', cls: 'text-bg-warning' },
    borrowed: { text: 'Đang mượn', cls: 'text-bg-primary' },
    returned: { text: 'Đã trả', cls: 'text-bg-success' },
    rejected: { text: 'Bị từ chối', cls: 'text-bg-danger' },
    cancelled: { text: 'Đã hủy', cls: 'text-bg-secondary' }
};

const libraryState = {
    user: null,
    categories: [],
    books: [],
    loans: [],
    selectedBook: null,
    viewMode: 'shelves',
    q: '',
    categoryId: 0
};

const shellEl = document.getElementById('readowl-shell');
const btnEdgeToggle = document.getElementById('btn-edge-toggle');
const edgeToggleIcon = document.getElementById('edge-toggle-icon');
const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');
const bannerEl = document.getElementById('library-banner');

let borrowModalInstance = null;
let libraryLoadVersion = 0;
let librarySearchTimer = null;

function toggleMemberSidebar() {
    const collapsed = shellEl.classList.toggle('sidebar-collapsed');
    if (edgeToggleIcon) {
        edgeToggleIcon.className = collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
    }
}

if (btnEdgeToggle) {
    btnEdgeToggle.addEventListener('click', toggleMemberSidebar);
}
if (btnHamburgerToggle) {
    btnHamburgerToggle.addEventListener('click', toggleMemberSidebar);
}

function showLibraryBanner(type, text) {
    const map = {
        success: 'alert-success',
        error: 'alert-danger',
        info: 'alert-warning'
    };
    bannerEl.className = 'alert ' + (map[type] || 'alert-info') + ' mb-3';
    bannerEl.textContent = text;
}

function hideLibraryBanner() {
    bannerEl.className = 'alert d-none mb-3';
    bannerEl.textContent = '';
}

function getBookGradient(book) {
    if (book.cover_path && book.cover_path.indexOf('linear-gradient') === 0) {
        return book.cover_path;
    }
    return DEFAULT_BOOK_GRADIENTS[(Number(book.id) || 0) % DEFAULT_BOOK_GRADIENTS.length];
}

function switchViewMode(mode) {
    libraryState.viewMode = mode;

    document.getElementById('view-shelves').hidden = mode !== 'shelves';
    document.getElementById('view-all-books').hidden = mode !== 'all-books';
    document.getElementById('view-loans-table').hidden = mode !== 'loans-table';

    document.querySelectorAll('[data-view-mode]').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-view-mode') === mode);
    });
}

document.querySelectorAll('[data-view-mode]').forEach(function (btn) {
    btn.addEventListener('click', function () {
        switchViewMode(btn.getAttribute('data-view-mode'));
    });
});

document.querySelectorAll('[data-switch-view]').forEach(function (btn) {
    btn.addEventListener('click', function () {
        switchViewMode(btn.getAttribute('data-switch-view'));
    });
});

/* ==========================================================================
   1. TẠO PHẦN TỬ BÌA SÁCH ĐẶT TRÊN KỆ 3D
   ========================================================================== */
function createShelfBookElement(book, loanInfo) {
    const item = document.createElement('div');
    item.className = 'book-item';

    const cover = document.createElement('div');
    cover.className = 'book-cover-card';
    cover.style.background = getBookGradient(book);

    const stockTag = document.createElement('span');
    stockTag.className = 'book-stock-tag';
    if (loanInfo) {
        stockTag.textContent = loanInfo.status === 'borrowed' ? 'Đang mượn' : (loanInfo.status === 'pending' ? 'Chờ duyệt' : 'Đã trả');
    } else {
        stockTag.textContent = book.available_copies > 0
            ? ('Còn ' + book.available_copies + ' / ' + book.total_copies + ' bản')
            : 'Hết bản';
    }
    // Nhan so luong se dat duoi phan chu thich, khong chen tren bia sach.
    if (loanInfo) {
        if (loanInfo.status === 'pending') {
            stockTag.className += ' book-stock-tag--pending';
        } else if (loanInfo.status === 'borrowed') {
            stockTag.className += ' book-stock-tag--borrowed';
        } else {
            stockTag.className += ' book-stock-tag--returned';
        }
    } else if (book.available_copies < 1) {
        stockTag.className += ' book-stock-tag--empty';
    }

    const catSpan = document.createElement('span');
    catSpan.className = 'book-cover-category';
    catSpan.textContent = book.category_name || 'THƯ VIỆN';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'book-cover-title';
    titleSpan.textContent = book.title;

    const authorSpan = document.createElement('span');
    authorSpan.className = 'book-cover-author';
    authorSpan.textContent = book.author;

    cover.appendChild(catSpan);
    cover.appendChild(titleSpan);
    cover.appendChild(authorSpan);
    item.appendChild(cover);

    const caption = document.createElement('div');
    caption.className = 'book-caption';

    const capTitle = document.createElement('div');
    capTitle.className = 'book-caption-title';
    capTitle.textContent = book.title;
    capTitle.title = book.title;

    const capSub = document.createElement('div');
    capSub.className = 'book-caption-sub';
    if (loanInfo && loanInfo.due_date && loanInfo.status === 'borrowed') {
        capSub.textContent = 'Hạn trả: ' + loanInfo.due_date;
    } else if (loanInfo && loanInfo.status === 'pending') {
        capSub.textContent = 'Đang chờ thủ thư duyệt';
    } else {
        capSub.textContent = book.author;
    }

    caption.appendChild(capTitle);
    caption.appendChild(capSub);
    caption.appendChild(stockTag);
    item.appendChild(caption);

    item.addEventListener('click', function () {
        // Lay thong tin moi tu API, ca khi sach khong con trong bo loc hien tai.
        openBookBorrowModal(book.id);
    });

    return item;
}

/* ==========================================================================
   2. RENDER CÁC KỆ SÁCH & BẢNG PHIẾU MƯỢN
   ========================================================================== */
function renderLibraryViews() {
    const books = libraryState.books;
    const loans = libraryState.loans;

    document.getElementById('tab-loans-count').textContent = loans.length;

    // Kệ 1: Đang mượn & Chờ duyệt (Currently reading)
    const activeLoans = loans.filter(function (l) {
        return l.status === 'borrowed' || l.status === 'pending';
    });

    const shelfActive = document.getElementById('shelf-active-loans');
    shelfActive.textContent = '';

    if (activeLoans.length === 0) {
        // Nếu chưa có sách đang mượn, hiển thị 3 cuốn gợi ý đầu tiên trên kệ 1
        books.slice(0, 3).forEach(function (b) {
            shelfActive.appendChild(createShelfBookElement(b, null));
        });
    } else {
        activeLoans.slice(0, 6).forEach(function (l) {
            const matchedBook = books.find(function (b) {
                return Number(b.id) === Number(l.book_id);
            }) || {
                id: l.book_id,
                title: l.book_title,
                author: l.book_author,
                category_name: l.category_name,
                cover_path: l.book_cover,
                available_copies: l.book_available_copies,
                total_copies: l.book_total_copies
            };
            shelfActive.appendChild(createShelfBookElement(matchedBook, l));
        });
    }

    // Cập nhật hộp "Continue reading / Đang mượn gần nhất" ở góc dưới Sidebar giống Ảnh 2
    const latestActive = activeLoans[0] || null;
    if (latestActive) {
        document.getElementById('continue-reading-label').textContent =
            latestActive.status === 'borrowed' ? 'Đang mượn đọc' : 'Đang chờ duyệt';
        document.getElementById('continue-reading-cat').textContent = latestActive.category_name || 'THƯ VIỆN';
        document.getElementById('continue-reading-book').textContent = latestActive.book_title;
        document.getElementById('continue-reading-due').textContent = latestActive.due_date
            ? ('Hạn: ' + latestActive.due_date)
            : 'Chờ thủ thư giao';
        document.getElementById('continue-reading-cover').style.background =
            latestActive.book_cover || DEFAULT_BOOK_GRADIENTS[0];
        document.getElementById('continue-reading-bar').style.width =
            latestActive.status === 'borrowed' ? '75%' : '40%';
    } else {
        document.getElementById('continue-reading-label').textContent = 'Chưa có sách đang mượn';
        document.getElementById('continue-reading-cat').textContent = 'THƯ VIỆN';
        document.getElementById('continue-reading-book').textContent = 'Khám phá sách trên kệ';
        document.getElementById('continue-reading-due').textContent = '';
        document.getElementById('continue-reading-cover').style.background = DEFAULT_BOOK_GRADIENTS[0];
        document.getElementById('continue-reading-bar').style.width = '0%';
    }

    // Kệ 2: Sách sẵn sàng cho mượn (Next up)
    const shelfAvailable = document.getElementById('shelf-available-books');
    shelfAvailable.textContent = '';
    books.filter(function (b) {
        return b.available_copies > 0;
    }).slice(0, 6).forEach(function (b) {
        shelfAvailable.appendChild(createShelfBookElement(b, null));
    });

    // Kệ 3: Đã trả (Finished) hoặc các sách còn lại trên kệ
    const returnedLoans = loans.filter(function (l) {
        return l.status === 'returned';
    });
    const shelfFinished = document.getElementById('shelf-finished-books');
    shelfFinished.textContent = '';

    const remainingBooks = books.slice(3, 9);
    if (returnedLoans.length > 0) {
        returnedLoans.forEach(function (l) {
            const matchedBook = books.find(function (b) {
                return Number(b.id) === Number(l.book_id);
            }) || {
                id: l.book_id,
                title: l.book_title,
                author: l.book_author,
                category_name: l.category_name,
                cover_path: l.book_cover,
                available_copies: l.book_available_copies,
                total_copies: l.book_total_copies
            };
            shelfFinished.appendChild(createShelfBookElement(matchedBook, l));
        });
    }
    remainingBooks.forEach(function (b) {
        if (shelfFinished.children.length < 6) {
            shelfFinished.appendChild(createShelfBookElement(b, null));
        }
    });

    // Tab 2: All Books Grid
    const allGrid = document.getElementById('all-books-grid');
    allGrid.textContent = '';
    document.getElementById('all-books-total').textContent = 'Tổng cộng ' + books.length + ' đầu sách';
    books.forEach(function (b) {
        allGrid.appendChild(createShelfBookElement(b, null));
    });

    // Tab 3: Bảng Phiếu mượn của tôi
    renderLoansTable(loans);
}

function renderLoansTable(loans) {
    const tbody = document.getElementById('member-loans-tbody');
    tbody.textContent = '';

    if (!loans || loans.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.className = 'text-center py-4 text-secondary';
        td.textContent = 'Bạn chưa có phiếu mượn nào. Hãy chọn một cuốn sách trên kệ để gửi yêu cầu mượn!';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    loans.forEach(function (loan) {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.className = 'fw-bold text-secondary';
        tdId.textContent = '#' + loan.id;
        tr.appendChild(tdId);

        const tdBook = document.createElement('td');
        const tDiv = document.createElement('div');
        tDiv.className = 'fw-bold';
        tDiv.textContent = loan.book_title;
        const aDiv = document.createElement('div');
        aDiv.className = 'small text-secondary';
        aDiv.textContent = loan.book_author;
        tdBook.appendChild(tDiv);
        tdBook.appendChild(aDiv);
        tr.appendChild(tdBook);

        const tdReq = document.createElement('td');
        tdReq.className = 'small';
        tdReq.textContent = loan.requested_at || '—';
        tr.appendChild(tdReq);

        const tdDates = document.createElement('td');
        tdDates.className = 'small';
        const dateLines = [];
        if (loan.borrowed_at) {
            dateLines.push('Ngày mượn: ' + loan.borrowed_at);
        }
        if (loan.due_date) {
            dateLines.push('Hạn trả: ' + loan.due_date);
        }
        if (loan.returned_at) {
            dateLines.push('Ngày trả: ' + loan.returned_at);
        }
        tdDates.textContent = dateLines.join(' | ') || (loan.status === 'pending' ? 'Chờ giao sách' : '—');
        tr.appendChild(tdDates);

        const tdStatus = document.createElement('td');
        const badgeInfo = LOAN_STATUS_BADGES[loan.status] || { text: loan.status, cls: 'text-bg-secondary' };
        const badge = document.createElement('span');
        badge.className = 'badge ' + badgeInfo.cls;
        badge.textContent = badgeInfo.text;
        tdStatus.appendChild(badge);

        if (loan.is_overdue) {
            const over = document.createElement('span');
            over.className = 'badge text-bg-danger ms-1';
            over.textContent = 'Quá hạn';
            tdStatus.appendChild(over);
        }
        if (loan.rejection_reason) {
            const reason = document.createElement('div');
            reason.className = 'small text-danger mt-1';
            reason.textContent = 'Lý do: ' + loan.rejection_reason;
            tdStatus.appendChild(reason);
        }
        tr.appendChild(tdStatus);

        const tdAct = document.createElement('td');
        tdAct.className = 'text-end';
        if (loan.status === 'pending') {
            const btnCancel = document.createElement('button');
            btnCancel.type = 'button';
            btnCancel.className = 'btn btn-sm btn-danger text-white';
            btnCancel.textContent = 'Hủy yêu cầu';
            btnCancel.addEventListener('click', function () {
                cancelPendingLoan(loan.id);
            });
            tdAct.appendChild(btnCancel);
        } else {
            const dash = document.createElement('span');
            dash.className = 'text-secondary small';
            dash.textContent = '—';
            tdAct.appendChild(dash);
        }
        tr.appendChild(tdAct);

        tbody.appendChild(tr);
    });
}

/* ==========================================================================
   3. MODAL XEM CHI TIẾT ĐẦU SÁCH & GỬI YÊU CẦU MƯỢN
   ========================================================================== */
async function openBookBorrowModal(bookId) {
    try {
        const result = await apiFetch('/books/' + encodeURIComponent(bookId));
        showBookBorrowModal(result.data);
    } catch (error) {
        handleLibraryError(error);
    }
}

function showBookBorrowModal(book) {
    libraryState.selectedBook = book;

    const coverEl = document.getElementById('modal-book-cover');
    coverEl.style.background = getBookGradient(book);
    document.getElementById('modal-book-cat-cover').textContent = book.category_name || 'THƯ VIỆN';
    document.getElementById('modal-book-title-cover').textContent = book.title;
    document.getElementById('modal-book-author-cover').textContent = book.author;

    document.getElementById('modal-book-category').textContent = book.category_name || 'Sách thư viện';
    document.getElementById('modal-book-title').textContent = book.title;
    document.getElementById('modal-book-author').textContent = 'Tác giả: ' + book.author;
    document.getElementById('modal-book-publisher').textContent =
        (book.publisher || 'Đang cập nhật') + (book.publication_year ? (' (' + book.publication_year + ')') : '');
    document.getElementById('modal-book-stock').textContent =
        book.available_copies + ' / ' + book.total_copies + ' cuốn';
    document.getElementById('modal-book-desc').textContent =
        book.description || 'Đầu sách phục vụ tra cứu và mượn đọc tại thư viện.';

    const existingActiveLoan = libraryState.loans.find(function (l) {
        return Number(l.book_id) === Number(book.id) && (l.status === 'pending' || l.status === 'borrowed');
    });

    const btnBorrow = document.getElementById('btn-submit-borrow');
    if (existingActiveLoan) {
        btnBorrow.disabled = true;
        btnBorrow.textContent = existingActiveLoan.status === 'borrowed'
            ? 'Bạn đang mượn cuốn sách này'
            : 'Đã gửi yêu cầu (Chờ duyệt)';
    } else if (Number(book.is_active) !== 1) {
        btnBorrow.disabled = true;
        btnBorrow.textContent = 'Đầu sách đã ngừng cho mượn';
    } else if (book.available_copies < 1) {
        btnBorrow.disabled = true;
        btnBorrow.textContent = 'Tạm hết bản có sẵn';
    } else {
        btnBorrow.disabled = false;
        btnBorrow.textContent = 'Gửi yêu cầu mượn sách';
    }

    if (!borrowModalInstance) {
        borrowModalInstance = new bootstrap.Modal(document.getElementById('bookBorrowModal'));
    }
    borrowModalInstance.show();
}

document.getElementById('btn-submit-borrow').addEventListener('click', async function () {
    const book = libraryState.selectedBook;
    if (!book) {
        return;
    }

    const btn = document.getElementById('btn-submit-borrow');
    btn.disabled = true;
    btn.textContent = 'Đang gửi yêu cầu...';

    try {
        const result = await apiFetch('/loans', {
            method: 'POST',
            body: JSON.stringify({ book_id: book.id })
        });
        if (borrowModalInstance) {
            borrowModalInstance.hide();
        }
        showLibraryBanner('success', result.message || 'Đã gửi yêu cầu mượn sách thành công!');
        await loadBooksAndLoans();
    } catch (error) {
        if (borrowModalInstance) {
            borrowModalInstance.hide();
        }
        handleLibraryError(error);
    }
});

async function cancelPendingLoan(loanId) {
    hideLibraryBanner();
    try {
        const result = await apiFetch('/loans/' + encodeURIComponent(loanId), {
            method: 'PATCH',
            body: JSON.stringify({ status: 'cancelled' })
        });
        showLibraryBanner('info', result.message || 'Đã hủy yêu cầu mượn sách.');
        await loadBooksAndLoans();
    } catch (error) {
        handleLibraryError(error);
    }
}

/* ==========================================================================
   4. TẢI DỮ LIỆU TỪ API & KHỞI CHẠY
   ========================================================================== */
function handleLibraryError(error) {
    if (error.status === 401) {
        window.location.replace('login.html');
        return;
    }
    showLibraryBanner('error', error.message || 'Không tải được dữ liệu thư viện. Vui lòng thử lại.');
}

// API gioi han toi da 100 phieu moi trang. Doc tiep den trang cuoi,
// khong chi doi limit len 100 roi bo sot phan lich su con lai.
async function loadAllMemberLoans(loadVersion) {
    const loans = [];
    let page = 1;
    let totalPages = 1;
    do {
        const result = await apiFetch('/loans?page=' + page + '&limit=100');
        if (loadVersion !== libraryLoadVersion) {
            return null;
        }
        loans.push(...(result.data || []));
        totalPages = Number(result.meta.total_pages) || 1;
        page += 1;
    } while (page <= totalPages);
    return loans;
}

async function loadBooksAndLoans() {
    const loadVersion = ++libraryLoadVersion;
    const params = new URLSearchParams();
    params.set('limit', '50');
    if (libraryState.q !== '') {
        params.set('q', libraryState.q);
    }
    if (libraryState.categoryId > 0) {
        params.set('category_id', String(libraryState.categoryId));
    }

    try {
        const booksRes = await apiFetch('/books?' + params.toString());
        if (loadVersion !== libraryLoadVersion) {
            return;
        }
        const loans = await loadAllMemberLoans(loadVersion);
        if (loadVersion !== libraryLoadVersion || loans === null) {
            return;
        }

        // Chi ap dung ket qua khi ca sach va phieu muon cua lan tai moi nhat da xong.
        libraryState.categories = (booksRes.data && booksRes.data.categories) || [];
        libraryState.books = Array.isArray(booksRes.data)
            ? booksRes.data
            : ((booksRes.data && booksRes.data.books) || []);
        libraryState.loans = loans;

        const catSelect = document.getElementById('category-filter');
        const selectedCategory = String(libraryState.categoryId || '');
        catSelect.textContent = '';
        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'Tất cả danh mục';
        catSelect.appendChild(allOption);
        libraryState.categories.forEach(function (c) {
            const option = document.createElement('option');
            option.value = String(c.id);
            option.textContent = c.name;
            catSelect.appendChild(option);
        });
        catSelect.value = selectedCategory;
        if (!catSelect.value && libraryState.categoryId > 0) {
            libraryState.categoryId = 0;
        }
        renderLibraryViews();
    } catch (error) {
        if (loadVersion === libraryLoadVersion) {
            handleLibraryError(error);
        }
    }
}

document.getElementById('library-search-input').addEventListener('input', function (event) {
    libraryState.q = event.target.value.trim();
    // Vo hieu ket qua dang cho ngay khi nguoi dung doi tu khoa.
    libraryLoadVersion += 1;
    clearTimeout(librarySearchTimer);
    librarySearchTimer = setTimeout(loadBooksAndLoans, 300);
});

document.getElementById('category-filter').addEventListener('change', function (event) {
    libraryState.categoryId = Number(event.target.value) || 0;
    clearTimeout(librarySearchTimer);
    loadBooksAndLoans();
});

document.getElementById('btn-member-logout').addEventListener('click', function () {
    sessionStorage.removeItem('token');
    window.location.replace('login.html');
});

async function initMemberLibrary() {
    if (!sessionStorage.getItem('token')) {
        window.location.replace('login.html');
        return;
    }

    try {
        const meRes = await apiFetch('/auth/me');
        const user = meRes.data;
        libraryState.user = user;

        // Nếu là Admin thì chuyển thẳng sang giao diện Quản trị của Admin
        if (user.role === 'admin') {
            window.location.replace('admin/users.html');
            return;
        }

        document.getElementById('member-display-name').textContent = user.full_name;
        document.getElementById('member-avatar-initial').textContent = user.full_name
            ? user.full_name.trim().charAt(0).toUpperCase()
            : 'Đ';

        await loadBooksAndLoans();
    } catch (error) {
        if (error.status === 401) {
            window.location.replace('login.html');
            return;
        }
        showLibraryBanner('error', error.message || 'Không tải được dữ liệu thư viện.');
    }
}

initMemberLibrary();
