/**
 * catalog.js — Trang tra cứu, lọc, sắp xếp & phân trang sách công khai
 * Tự động đồng bộ giao diện Admin Theme (Sidebar tím đậm) khi Admin đăng nhập,
 * và giao diện ReadOwl khi Độc giả / Khách truy cập.
 */
(function () {
    'use strict';

    const COVER_PALETTES = [
        'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)',
        'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
        'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
        'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)',
        'linear-gradient(135deg, #be123c 0%, #881337 100%)',
        'linear-gradient(135deg, #0369a1 0%, #0c4a6e 100%)',
        'linear-gradient(135deg, #4338ca 0%, #312e81 100%)',
        'linear-gradient(135deg, #15803d 0%, #14532d 100%)'
    ];

    const state = {
        q: '',
        category_id: '',
        available: false,
        sort: 'created_at',
        order: 'desc',
        page: 1,
        limit: 10
    };

    // Kích hoạt sớm Admin Theme ngay từ bộ nhớ phiên để tránh nháy giao diện
    const initialUser = window.LibraryApi ? window.LibraryApi.getUser() : null;
    if (initialUser && initialUser.role === 'admin') {
        document.body.classList.add('admin-theme-mode');
    }

    const shell = document.getElementById('readowl-shell');
    const btnEdgeToggle = document.getElementById('btn-edge-toggle');
    const edgeToggleIcon = document.getElementById('edge-toggle-icon');
    const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');
    const btnAdminHamburger = document.getElementById('btn-admin-hamburger');

    const formEl = document.getElementById('catalog-filter-form');
    const qInput = document.getElementById('filter-q');
    const categorySelect = document.getElementById('filter-category');
    const sortSelect = document.getElementById('filter-sort');
    const limitSelect = document.getElementById('filter-limit');
    const availableCheckbox = document.getElementById('filter-available');
    const resetBtn = document.getElementById('btn-reset-filter');

    const summaryTextEl = document.getElementById('catalog-summary-text');
    const alertEl = document.getElementById('catalog-alert');
    const loadingEl = document.getElementById('catalog-loading');
    const emptyEl = document.getElementById('catalog-empty');
    const shelfWrapEl = document.getElementById('catalog-shelf-wrap');
    const gridEl = document.getElementById('catalog-grid');
    const paginationEl = document.getElementById('catalog-pagination');
    const paginationInfoEl = document.getElementById('pagination-info');
    const pageIndicatorEl = document.getElementById('pagination-page-indicator');
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');

    let debounceTimer = null;

    function toggleSidebar() {
        const collapsed = shell.classList.toggle('sidebar-collapsed');
        if (edgeToggleIcon) {
            edgeToggleIcon.className = collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
        }
    }

    if (btnEdgeToggle) btnEdgeToggle.addEventListener('click', toggleSidebar);
    if (btnHamburgerToggle) btnHamburgerToggle.addEventListener('click', toggleSidebar);
    if (btnAdminHamburger) btnAdminHamburger.addEventListener('click', toggleSidebar);

    function doLogout() {
        if (window.LibraryApi) {
            window.LibraryApi.clearSession();
        } else {
            sessionStorage.removeItem('token');
        }
        window.location.href = 'login.html';
    }

    const btnAdminTopbarLogout = document.getElementById('btn-admin-topbar-logout');
    if (btnAdminTopbarLogout) {
        btnAdminTopbarLogout.addEventListener('click', doLogout);
    }

    function getCoverGradient(bookId) {
        return COVER_PALETTES[Math.abs(Number(bookId) || 0) % COVER_PALETTES.length];
    }

    function showError(msg) {
        alertEl.textContent = msg;
        alertEl.classList.remove('d-none');
    }

    function hideError() {
        alertEl.textContent = '';
        alertEl.classList.add('d-none');
    }

    /**
     * Khởi tạo menu Sidebar & Theme theo đúng trạng thái đăng nhập (Admin / Member / Guest)
     */
    async function initSidebarAuth() {
        const navEl = document.getElementById('catalog-sidebar-nav');
        const bottomNavEl = document.getElementById('catalog-sidebar-bottom');
        const userPill = document.getElementById('sidebar-user-pill');
        const avatarEl = document.getElementById('sidebar-avatar-initial');
        const nameEl = document.getElementById('sidebar-display-name');

        let user = window.LibraryApi ? window.LibraryApi.getUser() : null;
        const token = window.LibraryApi ? window.LibraryApi.getToken() : sessionStorage.getItem('token');

        if (token) {
            try {
                const meRes = await apiFetch('/auth/me');
                if (meRes && meRes.data) {
                    user = meRes.data;
                    if (window.LibraryApi) {
                        window.LibraryApi.setSession(token, user);
                    }
                }
            } catch (e) {
                user = null;
                if (window.LibraryApi) {
                    window.LibraryApi.clearSession();
                } else {
                    sessionStorage.removeItem('token');
                }
            }
        }

        const isAdmin = Boolean(user && user.role === 'admin');
        document.body.classList.toggle('admin-theme-mode', isAdmin);

        navEl.textContent = '';
        if (bottomNavEl) bottomNavEl.textContent = '';

        if (isAdmin) {
            // Đồng bộ 100% thông tin Admin trên Sidebar tím & Topbar giống hệt các trang Admin
            const displayName = user.full_name || 'Quản trị Thư viện';
            const initial = displayName.trim().charAt(0).toUpperCase() || 'A';

            const adminSideName = document.getElementById('admin-sidebar-name');
            const adminTopName = document.getElementById('admin-topbar-name');
            const adminTopAvatar = document.getElementById('admin-topbar-avatar');

            if (adminSideName) adminSideName.textContent = displayName;
            if (adminTopName) adminTopName.textContent = displayName;
            if (adminTopAvatar) adminTopAvatar.textContent = initial;

            const adminItems = [
                { icon: 'bi-grid-1x2-fill', label: 'Tổng quan (Dashboard)', href: 'admin/dashboard.html' },
                { icon: 'bi-people-fill', label: 'Quản lý độc giả', href: 'admin/users.html' },
                { icon: 'bi-journal-arrow-up', label: 'Quản lý mượn – trả', href: 'admin/loans.html' },
                { icon: 'bi-book-half', label: 'Quản lý kho sách', href: 'admin/books.html' },
                { icon: 'bi-tags-fill', label: 'Quản lý danh mục', href: 'admin/categories.html' },
                { icon: 'bi-search', label: 'Tra cứu sách công khai', href: 'index.html', active: true }
            ];

            adminItems.forEach(function (item) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = item.href;
                a.className = 'readowl-nav-btn' + (item.active ? ' active' : '');

                const icon = document.createElement('i');
                icon.className = 'bi ' + item.icon;
                const span = document.createElement('span');
                span.textContent = item.label;

                a.appendChild(icon);
                a.appendChild(span);
                li.appendChild(a);
                navEl.appendChild(li);
            });

            if (bottomNavEl) {
                const liProfile = document.createElement('li');
                const aProfile = document.createElement('a');
                aProfile.href = 'profile.html';
                aProfile.className = 'readowl-nav-btn';
                const iconP = document.createElement('i');
                iconP.className = 'bi bi-person-gear';
                const spanP = document.createElement('span');
                spanP.textContent = 'Hồ sơ cá nhân';
                aProfile.appendChild(iconP);
                aProfile.appendChild(spanP);
                liProfile.appendChild(aProfile);
                bottomNavEl.appendChild(liProfile);

                const liLogout = document.createElement('li');
                const btnLogout = document.createElement('button');
                btnLogout.type = 'button';
                btnLogout.className = 'readowl-nav-btn';
                const iconL = document.createElement('i');
                iconL.className = 'bi bi-box-arrow-left';
                const spanL = document.createElement('span');
                spanL.textContent = 'Đăng xuất';
                btnLogout.appendChild(iconL);
                btnLogout.appendChild(spanL);
                btnLogout.addEventListener('click', doLogout);
                liLogout.appendChild(btnLogout);
                bottomNavEl.appendChild(liLogout);
            }
            return;
        }

        // Giao diện ReadOwl dành cho Độc giả (Member) hoặc Khách (Guest)
        const items = [
            { icon: 'bi-compass-fill', label: 'Tra cứu & Kệ sách', href: 'index.html', active: true }
        ];

        if (!user) {
            items.push({ icon: 'bi-box-arrow-in-right', label: 'Đăng nhập', href: 'login.html' });
            items.push({ icon: 'bi-person-plus', label: 'Đăng ký tài khoản', href: 'register.html' });
            userPill.href = 'login.html';
            avatarEl.textContent = 'K';
            nameEl.textContent = 'Khách (Bấm để đăng nhập)';
        } else {
            items.push({ icon: 'bi-bookshelf', label: 'Kệ sách của tôi', href: 'my-loans.html' });
            items.push({ icon: 'bi-person-circle', label: 'Hồ sơ cá nhân', href: 'profile.html' });
            userPill.href = 'profile.html';
            avatarEl.textContent = (user.full_name || 'Đ').trim().charAt(0).toUpperCase();
            nameEl.textContent = user.full_name;
        }

        items.forEach(function (item) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.href;
            a.className = 'readowl-nav-btn' + (item.active ? ' active' : '');

            const icon = document.createElement('i');
            icon.className = 'bi ' + item.icon;
            const span = document.createElement('span');
            span.textContent = item.label;

            a.appendChild(icon);
            a.appendChild(span);
            li.appendChild(a);
            navEl.appendChild(li);
        });

        if (user) {
            const liLogout = document.createElement('li');
            const btnLogout = document.createElement('button');
            btnLogout.type = 'button';
            btnLogout.className = 'readowl-nav-btn text-danger';
            const icon = document.createElement('i');
            icon.className = 'bi bi-box-arrow-left';
            const span = document.createElement('span');
            span.textContent = 'Đăng xuất';
            btnLogout.appendChild(icon);
            btnLogout.appendChild(span);
            btnLogout.addEventListener('click', doLogout);
            liLogout.appendChild(btnLogout);
            navEl.appendChild(liLogout);
        }
    }

    async function loadCategories() {
        try {
            const res = await apiFetch('/categories');
            const categories = Array.isArray(res.data) ? res.data : [];
            categories.forEach(function (cat) {
                const opt = document.createElement('option');
                opt.value = String(cat.id);
                opt.textContent = cat.name + (cat.active_book_count !== undefined ? ' (' + cat.active_book_count + ')' : '');
                categorySelect.appendChild(opt);
            });
        } catch (err) {
            showError(err.message || 'Không thể tải danh sách danh mục.');
        }
    }

    /**
     * Dựng thẻ sách 3D chuẩn ReadOwl (dùng textContent 100% chống XSS)
     */
    function createBookShelfItem(book) {
        const wrapper = document.createElement('a');
        wrapper.className = 'book-item text-decoration-none';
        wrapper.href = 'book-detail.html?id=' + encodeURIComponent(book.id);

        const cover = document.createElement('div');
        cover.className = 'book-cover-card';
        cover.style.background = getCoverGradient(book.id);

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

        const strip = document.createElement('div');
        strip.className = 'book-progress-strip';
        const fill = document.createElement('div');
        fill.className = 'book-progress-fill';
        const hasCopies = Number(book.available_copies) > 0;
        const ratio = Number(book.total_copies) > 0
            ? Math.round((Number(book.available_copies) / Number(book.total_copies)) * 100)
            : 0;
        fill.style.width = Math.max(12, ratio) + '%';
        strip.appendChild(fill);

        const caption = document.createElement('div');
        caption.className = 'book-caption';

        const capTitle = document.createElement('div');
        capTitle.className = 'book-caption-title';
        capTitle.textContent = book.title;

        const capSub = document.createElement('div');
        capSub.className = 'book-caption-sub';
        const pubYear = book.publish_year || book.publication_year;
        capSub.textContent = book.author + (pubYear ? ' • ' + pubYear : '');

        const stockTag = document.createElement('span');
        stockTag.className = 'book-stock-tag' + (hasCopies ? '' : ' book-stock-tag--empty');
        stockTag.textContent = hasCopies
            ? ('Còn ' + book.available_copies + '/' + book.total_copies + ' bản')
            : 'Hết bản tạm thời';

        caption.appendChild(capTitle);
        caption.appendChild(capSub);
        caption.appendChild(stockTag);

        wrapper.appendChild(cover);
        wrapper.appendChild(strip);
        wrapper.appendChild(caption);

        return wrapper;
    }

    async function loadBooks() {
        hideError();
        loadingEl.classList.remove('d-none');
        emptyEl.classList.add('d-none');
        gridEl.textContent = '';
        paginationEl.classList.add('d-none');

        const query = {
            page: state.page,
            limit: state.limit,
            sort: state.sort,
            order: state.order
        };

        if (state.q !== '') query.q = state.q;
        if (state.category_id !== '') query.category_id = state.category_id;
        if (state.available) query.available = '1';

        try {
            const res = await apiFetch('/books', { query });
            loadingEl.classList.add('d-none');

            const books = Array.isArray(res.data)
                ? res.data
                : (res.data && Array.isArray(res.data.books) ? res.data.books : []);
            const meta = res.meta || { page: state.page, limit: state.limit, total: books.length, total_pages: 1 };

            summaryTextEl.textContent = 'Tìm thấy ' + meta.total + ' đầu sách đang hoạt động';
            const totalBadgeEl = document.getElementById('catalog-total-badge');
            if (totalBadgeEl) {
                totalBadgeEl.textContent = meta.total + ' cuốn';
            }
            const sidebarStats = document.getElementById('sidebar-stats-books');
            if (sidebarStats) {
                sidebarStats.textContent = meta.total + ' Đầu sách';
            }

            if (books.length === 0) {
                shelfWrapEl.classList.add('d-none');
                emptyEl.classList.remove('d-none');
            } else {
                shelfWrapEl.classList.remove('d-none');
                const fragment = document.createDocumentFragment();
                books.forEach(function (book) {
                    fragment.appendChild(createBookShelfItem(book));
                });
                gridEl.appendChild(fragment);
            }

            if (meta.total > 0) {
                paginationEl.classList.remove('d-none');
                const totalPages = Math.max(1, Number(meta.total_pages) || 1);
                paginationInfoEl.textContent =
                    'Hiển thị ' + books.length + ' trên tổng số ' + meta.total + ' đầu sách';
                pageIndicatorEl.textContent = 'Trang ' + meta.page + ' / ' + totalPages;
                prevBtn.disabled = meta.page <= 1;
                nextBtn.disabled = meta.page >= totalPages;
            }
        } catch (err) {
            loadingEl.classList.add('d-none');
            showError(err.message || 'Đã xảy ra lỗi khi tải danh sách sách.');
        }
    }

    function applyFiltersAndResetPage() {
        state.q = qInput.value.trim();
        state.category_id = categorySelect.value;
        state.available = availableCheckbox.checked;

        const parts = sortSelect.value.split(':');
        state.sort = parts[0] || 'created_at';
        state.order = parts[1] || 'desc';
        state.limit = Number(limitSelect.value) || 10;
        state.page = 1;

        loadBooks();
    }

    formEl.addEventListener('submit', function (e) {
        e.preventDefault();
        if (debounceTimer) clearTimeout(debounceTimer);
        applyFiltersAndResetPage();
    });

    qInput.addEventListener('input', function () {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFiltersAndResetPage, 300);
    });

    categorySelect.addEventListener('change', applyFiltersAndResetPage);
    sortSelect.addEventListener('change', applyFiltersAndResetPage);
    limitSelect.addEventListener('change', applyFiltersAndResetPage);
    availableCheckbox.addEventListener('change', applyFiltersAndResetPage);

    resetBtn.addEventListener('click', function () {
        qInput.value = '';
        categorySelect.value = '';
        sortSelect.value = 'created_at:desc';
        limitSelect.value = '10';
        availableCheckbox.checked = false;
        applyFiltersAndResetPage();
    });

    prevBtn.addEventListener('click', function () {
        if (state.page > 1) {
            state.page -= 1;
            loadBooks();
        }
    });

    nextBtn.addEventListener('click', function () {
        state.page += 1;
        loadBooks();
    });

    initSidebarAuth();
    loadCategories();
    loadBooks();
})();
