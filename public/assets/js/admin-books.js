const appWrapper = document.getElementById('app-wrapper');
const btnEdgeToggle = document.getElementById('btn-edge-toggle');
const edgeToggleIcon = document.getElementById('edge-toggle-icon');
const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');
const statusBanner = document.getElementById('status-banner');
const booksTableBody = document.getElementById('books-table-body');
const searchInput = document.getElementById('search-input');

let bookModal = null;
let allCategories = [];
let allBooks = [];
let searchKeyword = '';
let searchDebounceTimer = null;
let latestBooksSeq = 0;

function toggleSidebar() {
    const collapsed = appWrapper.classList.toggle('sidebar-collapsed');
    if (edgeToggleIcon) {
        edgeToggleIcon.className = collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
    }
}

if (btnEdgeToggle) btnEdgeToggle.addEventListener('click', toggleSidebar);
if (btnHamburgerToggle) btnHamburgerToggle.addEventListener('click', toggleSidebar);

function doLogout() {
    if (window.LibraryApi) {
        window.LibraryApi.clearSession();
    } else {
        sessionStorage.removeItem('token');
    }
    window.location.replace('../login.html');
}

document.getElementById('btn-sidebar-logout').addEventListener('click', doLogout);
document.getElementById('btn-topbar-logout').addEventListener('click', doLogout);

function showBanner(message, type) {
    statusBanner.className = 'alert alert-' + type + ' mb-3';
    statusBanner.textContent = message;
    statusBanner.classList.remove('d-none');
}

function populateCategorySelect() {
    const select = document.getElementById('book-category-input');
    select.textContent = '';
    allCategories.forEach(function (c) {
        const opt = document.createElement('option');
        opt.value = String(c.id);
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

function renderBooksTable() {
    booksTableBody.textContent = '';

    if (allBooks.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.className = 'text-center py-4 text-secondary';
        td.textContent = 'Không tìm thấy đầu sách nào phù hợp.';
        tr.appendChild(td);
        booksTableBody.appendChild(tr);
        return;
    }

    allBooks.forEach(function (b) {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.className = 'fw-bold text-secondary';
        tdId.textContent = '#' + b.id;

        const tdInfo = document.createElement('td');
        const titleEl = document.createElement('div');
        titleEl.className = 'fw-bold text-dark';
        titleEl.textContent = b.title;
        const authorEl = document.createElement('div');
        authorEl.className = 'small text-secondary';
        const pubYear = b.publish_year || b.publication_year;
        authorEl.textContent =
            b.author +
            (b.publisher ? ' • ' + b.publisher : '') +
            (pubYear ? ' (' + pubYear + ')' : '') +
            (b.isbn ? ' • ISBN: ' + b.isbn : '');
        tdInfo.appendChild(titleEl);
        tdInfo.appendChild(authorEl);

        const tdCat = document.createElement('td');
        const catBadge = document.createElement('span');
        catBadge.className = 'badge bg-light text-dark border';
        catBadge.textContent = b.category_name;
        tdCat.appendChild(catBadge);

        const tdStock = document.createElement('td');
        const stockBadge = document.createElement('span');
        stockBadge.className = b.available_copies > 0
            ? 'badge bg-success-subtle text-success rounded-pill px-3'
            : 'badge bg-danger-subtle text-danger rounded-pill px-3';
        stockBadge.textContent = b.available_copies + ' / ' + b.total_copies + ' bản';
        tdStock.appendChild(stockBadge);

        const tdStatus = document.createElement('td');
        const activeBadge = document.createElement('span');
        activeBadge.className = Number(b.is_active) === 1
            ? 'badge bg-primary-subtle text-primary rounded-pill px-3'
            : 'badge bg-secondary-subtle text-secondary rounded-pill px-3';
        activeBadge.textContent = Number(b.is_active) === 1 ? 'Đang cho mượn' : 'Ngừng cho mượn';
        tdStatus.appendChild(activeBadge);

        const tdActions = document.createElement('td');
        tdActions.className = 'text-end';
        const grp = document.createElement('div');
        grp.className = 'd-inline-flex gap-1';

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn-sm btn-purple text-white';
        btnEdit.textContent = 'Sửa';
        btnEdit.addEventListener('click', function () {
            openBookModal(b);
        });

        const btnDel = document.createElement('button');
        btnDel.type = 'button';
        btnDel.className = 'btn btn-sm btn-danger text-white';
        btnDel.textContent = 'Xóa / Ngừng';
        btnDel.addEventListener('click', function () {
            deleteOrDeactivateBook(b);
        });

        grp.appendChild(btnEdit);
        grp.appendChild(btnDel);
        tdActions.appendChild(grp);

        tr.appendChild(tdId);
        tr.appendChild(tdInfo);
        tr.appendChild(tdCat);
        tr.appendChild(tdStock);
        tr.appendChild(tdStatus);
        tr.appendChild(tdActions);
        booksTableBody.appendChild(tr);
    });
}

function openBookModal(book) {
    if (!bookModal) {
        bookModal = new bootstrap.Modal(document.getElementById('bookFormModal'));
    }
    populateCategorySelect();

    const isbnInput = document.getElementById('book-isbn-input');
    const coverInput = document.getElementById('book-cover-input');

    if (book) {
        document.getElementById('book-modal-title').textContent = 'Cập nhật đầu sách #' + book.id;
        document.getElementById('book-id-input').value = String(book.id);
        document.getElementById('book-title-input').value = book.title || '';
        document.getElementById('book-author-input').value = book.author || '';
        if (isbnInput) isbnInput.value = book.isbn || '';
        document.getElementById('book-category-input').value = String(book.category_id);
        document.getElementById('book-copies-input').value = String(book.total_copies);
        document.getElementById('book-publisher-input').value = book.publisher || '';
        document.getElementById('book-year-input').value = (book.publish_year || book.publication_year) ? String(book.publish_year || book.publication_year) : '';
        if (coverInput) coverInput.value = book.cover_path || 'assets/images/covers/default-book.svg';
        document.getElementById('book-desc-input').value = book.description || '';
        document.getElementById('book-active-input').checked = Number(book.is_active) === 1;
    } else {
        document.getElementById('book-modal-title').textContent = 'Thêm đầu sách mới';
        document.getElementById('book-id-input').value = '';
        document.getElementById('book-title-input').value = '';
        document.getElementById('book-author-input').value = '';
        if (isbnInput) isbnInput.value = '';
        document.getElementById('book-copies-input').value = '3';
        document.getElementById('book-publisher-input').value = '';
        document.getElementById('book-year-input').value = '2024';
        if (coverInput) coverInput.value = 'assets/images/covers/default-book.svg';
        document.getElementById('book-desc-input').value = '';
        document.getElementById('book-active-input').checked = true;
    }
    bookModal.show();
}

async function deleteOrDeactivateBook(book) {
    if (!window.confirm('Xác nhận xóa hoặc ngừng cho mượn đầu sách "' + book.title + '"?')) {
        return;
    }
    try {
        const res = await apiFetch('/books/' + book.id, { method: 'DELETE' });
        showBanner(res.message || 'Đã xử lý đầu sách.', 'success');
        await loadBooks();
    } catch (error) {
        showBanner(error.message || 'Không thể xóa đầu sách.', 'danger');
    }
}

document.getElementById('btn-add-book').addEventListener('click', function () {
    openBookModal(null);
});

document.getElementById('book-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('book-id-input').value;
    const isbnInput = document.getElementById('book-isbn-input');
    const coverInput = document.getElementById('book-cover-input');

    const payload = {
        title: document.getElementById('book-title-input').value.trim(),
        author: document.getElementById('book-author-input').value.trim(),
        isbn: isbnInput && isbnInput.value.trim() !== '' ? isbnInput.value.trim() : null,
        category_id: Number(document.getElementById('book-category-input').value),
        total_copies: Number(document.getElementById('book-copies-input').value),
        publisher: document.getElementById('book-publisher-input').value.trim(),
        publish_year: document.getElementById('book-year-input').value
            ? Number(document.getElementById('book-year-input').value)
            : null,
        cover_path: coverInput ? coverInput.value : 'assets/images/covers/default-book.svg',
        description: document.getElementById('book-desc-input').value.trim(),
        is_active: document.getElementById('book-active-input').checked ? 1 : 0
    };

    try {
        const res = await apiFetch(id ? '/books/' + id : '/books', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        if (bookModal) bookModal.hide();
        showBanner(res.message || 'Lưu đầu sách thành công.', 'success');
        await loadBooks();
    } catch (error) {
        showBanner(error.message || 'Dữ liệu đầu sách không hợp lệ.', 'danger');
    }
});

document.getElementById('topbar-search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchKeyword = searchInput.value.trim();
    loadBooks();
});

searchInput.addEventListener('input', function () {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(function () {
        searchKeyword = searchInput.value.trim();
        loadBooks();
    }, 300);
});

async function loadBooks() {
    const seq = ++latestBooksSeq;
    const params = new URLSearchParams({ include_inactive: '1', limit: '50' });
    if (searchKeyword !== '') {
        params.set('q', searchKeyword);
    }

    try {
        const res = await apiFetch('/books?' + params.toString());
        if (seq !== latestBooksSeq) {
            return;
        }
        allCategories = (res.data && res.data.categories) || [];
        allBooks = Array.isArray(res.data)
            ? res.data
            : ((res.data && res.data.books) || []);
        renderBooksTable();
    } catch (error) {
        if (seq !== latestBooksSeq) {
            return;
        }
        showBanner(error.message || 'Không thể tải danh sách sách.', 'danger');
    }
}

async function initAdminBooks() {
    if (!sessionStorage.getItem('token') && !(window.LibraryApi && window.LibraryApi.getToken())) {
        window.location.replace('../login.html');
        return;
    }
    try {
        const me = await apiFetch('/auth/me');
        if (!me.data || me.data.role !== 'admin') {
            window.location.replace('../my-loans.html');
            return;
        }
        document.getElementById('sidebar-user-name').textContent = me.data.full_name;
        document.getElementById('topbar-user-name').textContent = me.data.full_name;
        document.getElementById('topbar-avatar-text').textContent = me.data.full_name.charAt(0).toUpperCase();
        await loadBooks();
    } catch (error) {
        doLogout();
    }
}

initAdminBooks();
