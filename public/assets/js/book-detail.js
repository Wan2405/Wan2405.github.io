/**
 * book-detail.js — Chi tiết sách & Gửi yêu cầu mượn sách (`POST /api/v1/loans`)
 * Tự động đồng bộ Admin Theme (Sidebar tím đậm) khi Admin đăng nhập,
 * và ReadOwl khi Độc giả / Khách truy cập.
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

    const initialUser = window.LibraryApi ? window.LibraryApi.getUser() : null;
    if (initialUser && initialUser.role === 'admin') {
        document.body.classList.add('admin-theme-mode');
    }

    const shell = document.getElementById('readowl-shell');
    const btnEdgeToggle = document.getElementById('btn-edge-toggle');
    const edgeToggleIcon = document.getElementById('edge-toggle-icon');
    const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');
    const btnAdminHamburger = document.getElementById('btn-admin-hamburger');

    const alertEl = document.getElementById('detail-alert');
    const loadingEl = document.getElementById('detail-loading');
    const notFoundEl = document.getElementById('detail-not-found');
    const notFoundMsgEl = document.getElementById('not-found-msg');
    const contentEl = document.getElementById('detail-content');

    const cover3dEl = document.getElementById('book-cover-3d');
    const coverCatEl = document.getElementById('cover-cat-text');
    const coverTitleEl = document.getElementById('cover-title-text');
    const coverAuthorEl = document.getElementById('cover-author-text');
    const availBadgeEl = document.getElementById('book-availability-badge');

    const catEl = document.getElementById('book-category');
    const isbnBadgeEl = document.getElementById('book-isbn-badge');
    const titleEl = document.getElementById('book-title');
    const authorEl = document.getElementById('book-author');
    const isbnEl = document.getElementById('book-isbn');
    const publisherEl = document.getElementById('book-publisher');
    const yearEl = document.getElementById('book-year');
    const copiesEl = document.getElementById('book-copies');
    const descEl = document.getElementById('book-description');
    const borrowBtn = document.getElementById('btn-borrow-book');
    const borrowHint = document.getElementById('borrow-hint');

    let currentBook = null;
    let currentUser = null;

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

    function showBanner(type, text) {
        const cls = type === 'success' ? 'alert-success' : (type === 'warning' ? 'alert-warning' : 'alert-danger');
        alertEl.className = 'alert ' + cls + ' mb-3';
        alertEl.textContent = text;
        alertEl.classList.remove('d-none');
    }

    async function initSidebarAuth() {
        const navEl = document.getElementById('detail-sidebar-nav');
        const bottomNavEl = document.getElementById('detail-sidebar-bottom');
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

        currentUser = user;
        const isAdmin = Boolean(user && user.role === 'admin');
        document.body.classList.toggle('admin-theme-mode', isAdmin);

        navEl.textContent = '';
        if (bottomNavEl) bottomNavEl.textContent = '';

        if (isAdmin) {
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

    function renderBook(book) {
        currentBook = book;
        document.title = book.title + ' — Hệ thống Thư viện';

        cover3dEl.style.background = getCoverGradient(book.id);
        coverCatEl.textContent = book.category_name || 'THƯ VIỆN';
        coverTitleEl.textContent = book.title;
        coverAuthorEl.textContent = book.author;

        const hasCopies = Number(book.available_copies) > 0;
        availBadgeEl.className = 'book-stock-tag' + (hasCopies ? '' : ' book-stock-tag--empty');
        availBadgeEl.textContent = hasCopies
            ? ('Còn ' + book.available_copies + ' / ' + book.total_copies + ' bản sẵn sàng')
            : 'Đã hết bản cho mượn tạm thời';

        catEl.textContent = book.category_name || 'Danh mục chung';
        isbnBadgeEl.textContent = 'ISBN: ' + (book.isbn || 'Đang cập nhật');
        titleEl.textContent = book.title;
        authorEl.textContent = book.author;
        isbnEl.textContent = book.isbn || 'Đang cập nhật';
        publisherEl.textContent = book.publisher || 'Đang cập nhật';
        yearEl.textContent = String(book.publish_year || book.publication_year || '—');
        copiesEl.textContent = book.available_copies + ' / ' + book.total_copies + ' cuốn';
        descEl.textContent = book.description || 'Chưa có mô tả chi tiết cho đầu sách này.';

        if (!hasCopies) {
            borrowBtn.disabled = true;
            borrowBtn.textContent = 'Tạm thời hết sách';
            borrowHint.textContent = 'Tất cả bản sao của đầu sách này hiện đang được mượn.';
        } else if (!currentUser) {
            borrowBtn.disabled = false;
            borrowBtn.textContent = 'Đăng nhập để mượn sách này';
            borrowHint.textContent = 'Bạn cần đăng nhập tài khoản độc giả để gửi yêu cầu mượn.';
        } else {
            borrowBtn.disabled = false;
            borrowBtn.textContent = 'Đăng ký mượn sách này';
            borrowHint.textContent = 'Tối đa 3 cuốn đang mượn cùng lúc • Thời hạn mượn tiêu chuẩn 14 ngày.';
        }
    }

    async function loadBookDetail() {
        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');

        if (!bookId || !/^\d+$/.test(bookId)) {
            loadingEl.classList.add('d-none');
            notFoundMsgEl.textContent = 'Mã định danh đầu sách trên URL không hợp lệ.';
            notFoundEl.classList.remove('d-none');
            return;
        }

        try {
            const res = await apiFetch('/books/' + encodeURIComponent(bookId));
            loadingEl.classList.add('d-none');
            renderBook(res.data);
            contentEl.classList.remove('d-none');
        } catch (err) {
            loadingEl.classList.add('d-none');
            notFoundMsgEl.textContent = err.message || 'Không tìm thấy đầu sách theo yêu cầu.';
            notFoundEl.classList.remove('d-none');
        }
    }

    borrowBtn.addEventListener('click', async function () {
        if (!currentBook) return;

        const token = window.LibraryApi ? window.LibraryApi.getToken() : sessionStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        borrowBtn.disabled = true;
        const originalLabel = borrowBtn.textContent;
        borrowBtn.textContent = 'Đang gửi yêu cầu mượn...';

        try {
            const res = await apiFetch('/loans', {
                method: 'POST',
                body: { book_id: Number(currentBook.id) }
            });
            showBanner('success', res.message || 'Đã gửi yêu cầu mượn sách thành công! Vui lòng chờ thủ thư duyệt.');
            borrowBtn.textContent = 'Đã gửi yêu cầu mượn';
        } catch (err) {
            showBanner('error', err.message || 'Không thể tạo phiếu mượn cho đầu sách này.');
            borrowBtn.disabled = false;
            borrowBtn.textContent = originalLabel;
        }
    });

    async function bootstrap() {
        await initSidebarAuth();
        await loadBookDetail();
    }

    bootstrap();
})();
