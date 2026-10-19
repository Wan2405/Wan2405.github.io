/* ==========================================================================
   CẤU HÌNH MENU SIDEBAR QUẢN TRỊ (CHỈ GỒM CÁC CHỨC NĂNG TRONG DỰ ÁN)
   ========================================================================== */
const ADMIN_SIDEBAR_ITEMS = [
    {
        icon: 'bi-grid-1x2-fill',
        title: 'Tổng quan (Dashboard)',
        href: '/admin/dashboard.html',
        active: false
    },
    {
        icon: 'bi-people-fill',
        title: 'Quản lý độc giả',
        href: '/admin/users.html',
        active: true
    },
    {
        icon: 'bi-journal-arrow-up',
        title: 'Quản lý mượn – trả',
        href: '/admin/loans.html',
        active: false
    },
    {
        icon: 'bi-book-half',
        title: 'Quản lý kho sách',
        href: '/admin/books.html',
        active: false
    },
    {
        icon: 'bi-tags-fill',
        title: 'Quản lý danh mục',
        href: '/admin/categories.html',
        active: false
    }
];

const LOAN_STATUS_LABELS = {
    pending: 'Chờ xử lý',
    borrowed: 'Đang mượn',
    returned: 'Đã trả',
    rejected: 'Bị từ chối',
    cancelled: 'Đã hủy'
};

const state = {
    page: 1,
    limit: 10,
    q: '',
    isActive: '',
    totalPages: 1,
    pendingAction: null // { type: 'toggle' | 'delete', user: {...} }
};

const appWrapper = document.getElementById('app-wrapper');
const btnEdgeToggle = document.getElementById('btn-edge-toggle');
const edgeToggleIcon = document.getElementById('edge-toggle-icon');
const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');

const statusBanner = document.getElementById('status-banner');
const usersTableBody = document.getElementById('users-table-body');
const paginationInfo = document.getElementById('pagination-info');
const pageIndicator = document.getElementById('page-indicator');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');

const topbarSearchForm = document.getElementById('topbar-search-form');
const searchInput = document.getElementById('search-input');
const limitSelect = document.getElementById('limit-select');
const btnResetFilter = document.getElementById('btn-reset-filter');
const btnRefresh = document.getElementById('btn-refresh');
const subnavButtons = document.querySelectorAll('.settings-subnav-btn[data-status-filter]');

let detailModalInstance = null;
let confirmModalInstance = null;

/* ==========================================================================
   1. ĐÓNG / MỞ SIDEBAR BẰNG NÚT "<" HOẶC NÚT 3 GẠCH NGANG (HAMBURGER)
   ========================================================================== */
function toggleSidebar() {
    const collapsed = appWrapper.classList.toggle('sidebar-collapsed');
    if (edgeToggleIcon) {
        edgeToggleIcon.className = collapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left';
    }
}

if (btnEdgeToggle) {
    btnEdgeToggle.addEventListener('click', toggleSidebar);
}
if (btnHamburgerToggle) {
    btnHamburgerToggle.addEventListener('click', toggleSidebar);
}

/* ==========================================================================
   2. KHỞI TẠO MENU SIDEBAR
   ========================================================================== */
function renderSidebarMenu() {
    const navList = document.getElementById('sidebar-nav-main');
    navList.textContent = '';

    ADMIN_SIDEBAR_ITEMS.forEach(function (item) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.href;
        a.className = 'sidebar-link' + (item.active ? ' active' : '');

        const icon = document.createElement('i');
        icon.className = 'bi ' + item.icon;

        const span = document.createElement('span');
        span.textContent = item.title;

        a.appendChild(icon);
        a.appendChild(span);

        li.appendChild(a);
        navList.appendChild(li);
    });
}

/* ==========================================================================
   3. HIỂN THỊ THÔNG BÁO
   ========================================================================== */
function showBanner(type, message) {
    const map = {
        success: 'alert-success',
        error: 'alert-danger',
        info: 'alert-warning'
    };
    statusBanner.className = 'alert ' + (map[type] || 'alert-info') + ' mb-3';
    statusBanner.textContent = message;
}

function hideBanner() {
    statusBanner.className = 'alert d-none mb-3';
    statusBanner.textContent = '';
}

/* ==========================================================================
   4. KIỂM TRA PHIÊN ĐĂNG NHẬP & PHÂN QUYỀN
   ========================================================================== */
async function verifyAdminSession() {
    if (!sessionStorage.getItem('token')) {
        window.location.replace('../login.html');
        return false;
    }

    try {
        const result = await apiFetch('/auth/me');
        const user = result.data;

        // Nếu là độc giả (Member), chuyển thẳng về giao diện thư viện mượn sách
        if (user.role !== 'admin') {
            window.location.replace('../my-loans.html');
            return false;
        }

        document.getElementById('sidebar-user-name').textContent = user.full_name;
        document.getElementById('sidebar-user-role').textContent = 'Quản trị viên';
        document.getElementById('topbar-user-name').textContent = user.full_name;

        const initial = user.full_name ? user.full_name.trim().charAt(0).toUpperCase() : 'A';
        document.getElementById('topbar-avatar-text').textContent = initial;

        return true;
    } catch (error) {
        if (error.status === 401) {
            window.location.replace('../login.html');
            return false;
        }
        showBanner('error', error.message || 'Không kiểm tra được phiên đăng nhập.');
        return false;
    }
}

/* ==========================================================================
   5. TẢI & HIỂN THỊ DANH SÁCH ĐỘC GIẢ
   ========================================================================== */
async function loadUsers() {
    const params = new URLSearchParams();
    params.set('page', String(state.page));
    params.set('limit', String(state.limit));

    if (state.q !== '') {
        params.set('q', state.q);
    }
    if (state.isActive !== '') {
        params.set('is_active', state.isActive);
    }

    try {
        const result = await apiFetch('/users?' + params.toString());
        const users = result.data || [];
        const meta = result.meta || { page: 1, limit: state.limit, total: 0, total_pages: 1 };

        state.page = meta.page;
        state.totalPages = meta.total_pages;

        if (meta.summary) {
            document.getElementById('stat-total-members').textContent = meta.summary.total_members;
            document.getElementById('stat-active-members').textContent = meta.summary.active_members;
            document.getElementById('stat-locked-members').textContent = meta.summary.locked_members;
        }

        renderUsersTable(users);
        renderPagination(meta);
    } catch (error) {
        if (error.status === 401) {
            window.location.replace('../login.html');
            return;
        }
        showBanner('error', error.message || 'Không tải được danh sách độc giả.');
    }
}

function renderUsersTable(users) {
    usersTableBody.textContent = '';

    if (!users || users.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.className = 'text-center py-4 text-secondary';
        td.textContent = 'Không tìm thấy độc giả nào khớp với bộ lọc hiện tại.';
        tr.appendChild(td);
        usersTableBody.appendChild(tr);
        return;
    }

    users.forEach(function (user) {
        const tr = document.createElement('tr');
        const isActive = Number(user.is_active) === 1;

        // 1. Mã ĐG
        const tdId = document.createElement('td');
        tdId.className = 'fw-bold text-secondary';
        tdId.textContent = '#' + user.id;
        tr.appendChild(tdId);

        // 2. Họ tên & Email
        const tdUser = document.createElement('td');
        const nameDiv = document.createElement('div');
        nameDiv.className = 'fw-bold text-dark';
        nameDiv.textContent = user.full_name;
        const emailDiv = document.createElement('div');
        emailDiv.className = 'small text-secondary';
        emailDiv.textContent = user.email;
        tdUser.appendChild(nameDiv);
        tdUser.appendChild(emailDiv);
        tr.appendChild(tdUser);

        // 3. Ngày đăng ký
        const tdCreated = document.createElement('td');
        tdCreated.className = 'text-secondary small';
        tdCreated.textContent = user.created_at;
        tr.appendChild(tdCreated);

        // 4. Tình trạng mượn
        const tdLoans = document.createElement('td');
        const badgeWrap = document.createElement('div');
        badgeWrap.className = 'd-flex flex-wrap gap-1';

        const bBadge = document.createElement('span');
        bBadge.className = 'badge ' + (user.borrowed_count > 0 ? 'text-bg-primary' : 'text-bg-light text-secondary border');
        bBadge.textContent = 'Đang mượn: ' + (user.borrowed_count || 0) + '/3';
        badgeWrap.appendChild(bBadge);

        if (user.pending_count > 0) {
            const pBadge = document.createElement('span');
            pBadge.className = 'badge text-bg-warning';
            pBadge.textContent = 'Chờ duyệt: ' + user.pending_count;
            badgeWrap.appendChild(pBadge);
        }

        if (user.overdue_count > 0) {
            const oBadge = document.createElement('span');
            oBadge.className = 'badge text-bg-danger';
            oBadge.textContent = 'Quá hạn: ' + user.overdue_count;
            badgeWrap.appendChild(oBadge);
        }

        tdLoans.appendChild(badgeWrap);
        tr.appendChild(tdLoans);

        // 5. Trạng thái
        const tdStatus = document.createElement('td');
        const stBadge = document.createElement('span');
        stBadge.className = 'badge rounded-pill ' + (isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle');
        stBadge.textContent = isActive ? 'Đang hoạt động' : 'Đã bị khóa';
        tdStatus.appendChild(stBadge);
        tr.appendChild(tdStatus);

        // 6. Thao tác: Chi tiết | Khóa/Mở khóa | Xóa
        const tdActions = document.createElement('td');
        tdActions.className = 'text-end';
        const btnGroup = document.createElement('div');
        btnGroup.className = 'd-inline-flex gap-1';

        // Nút Chi tiết
        const btnDetail = document.createElement('button');
        btnDetail.type = 'button';
        btnDetail.className = 'btn btn-sm btn-primary text-white';
        btnDetail.title = 'Xem chi tiết & lịch sử mượn';
        btnDetail.textContent = 'Chi tiết';
        btnDetail.addEventListener('click', function () {
            openUserDetailModal(user.id);
        });

        // Nút Khóa / Mở khóa
        const btnToggle = document.createElement('button');
        btnToggle.type = 'button';
        btnToggle.className = 'btn btn-sm text-white ' + (isActive ? 'btn-warning' : 'btn-success');
        btnToggle.textContent = isActive ? 'Khóa' : 'Mở khóa';
        btnToggle.addEventListener('click', function () {
            openActionConfirmModal('toggle', user);
        });

        // Nút Xóa User
        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn btn-sm btn-danger text-white';
        btnDelete.title = 'Xóa tài khoản độc giả';
        btnDelete.textContent = 'Xóa';
        btnDelete.addEventListener('click', function () {
            openActionConfirmModal('delete', user);
        });

        btnGroup.appendChild(btnDetail);
        btnGroup.appendChild(btnToggle);
        btnGroup.appendChild(btnDelete);
        tdActions.appendChild(btnGroup);
        tr.appendChild(tdActions);

        usersTableBody.appendChild(tr);
    });
}

function renderPagination(meta) {
    const total = meta.total || 0;
    const page = meta.page || 1;
    const limit = meta.limit || state.limit;
    const totalPages = meta.total_pages || 1;

    if (total === 0) {
        paginationInfo.textContent = 'Không có bản ghi nào';
    } else {
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        paginationInfo.textContent = 'Hiển thị ' + start + ' – ' + end + ' / ' + total + ' độc giả';
    }

    pageIndicator.textContent = 'Trang ' + page + ' / ' + totalPages;
    btnPrevPage.disabled = page <= 1;
    btnNextPage.disabled = page >= totalPages;
}

/* ==========================================================================
   6. XEM CHI TIẾT ĐỘC GIẢ
   ========================================================================== */
async function openUserDetailModal(userId) {
    hideBanner();
    try {
        const result = await apiFetch('/users/' + encodeURIComponent(userId));
        const user = result.data;
        const isActive = Number(user.is_active) === 1;

        document.getElementById('detail-id').textContent = '#' + user.id;
        document.getElementById('detail-name').textContent = user.full_name;
        document.getElementById('detail-email').textContent = user.email;
        document.getElementById('detail-role').textContent = 'Độc giả (Member)';
        document.getElementById('detail-created').textContent = user.created_at;
        document.getElementById('detail-status').textContent = isActive ? 'Đang hoạt động' : 'Đã bị khóa';

        const stats = user.loan_stats || {};
        document.getElementById('detail-stat-pending').textContent = stats.pending_count || 0;
        document.getElementById('detail-stat-borrowed').textContent = stats.borrowed_count || 0;
        document.getElementById('detail-stat-returned').textContent = stats.returned_count || 0;
        document.getElementById('detail-stat-overdue').textContent = stats.overdue_count || 0;

        const tbody = document.getElementById('detail-loans-body');
        tbody.textContent = '';
        const loans = user.recent_loans || [];

        if (loans.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 5;
            td.className = 'text-center py-3 text-secondary';
            td.textContent = 'Độc giả chưa có lịch sử mượn – trả sách.';
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            loans.forEach(function (loan) {
                const tr = document.createElement('tr');

                const tdId = document.createElement('td');
                tdId.textContent = '#' + loan.id;
                tr.appendChild(tdId);

                const tdBook = document.createElement('td');
                const titleDiv = document.createElement('div');
                titleDiv.className = 'fw-semibold';
                titleDiv.textContent = loan.book_title;
                const authorDiv = document.createElement('div');
                authorDiv.className = 'small text-secondary';
                authorDiv.textContent = loan.book_author;
                tdBook.appendChild(titleDiv);
                tdBook.appendChild(authorDiv);
                tr.appendChild(tdBook);

                const tdReq = document.createElement('td');
                tdReq.className = 'small';
                tdReq.textContent = loan.requested_at || '—';
                tr.appendChild(tdReq);

                const tdDue = document.createElement('td');
                tdDue.className = 'small';
                tdDue.textContent = loan.due_date || '—';
                tr.appendChild(tdDue);

                const tdStatus = document.createElement('td');
                const badge = document.createElement('span');
                badge.className = 'badge text-bg-secondary';
                badge.textContent = LOAN_STATUS_LABELS[loan.status] || loan.status;
                tdStatus.appendChild(badge);

                if (loan.is_overdue) {
                    const over = document.createElement('span');
                    over.className = 'badge text-bg-danger ms-1';
                    over.textContent = 'Quá hạn';
                    tdStatus.appendChild(over);
                }
                tr.appendChild(tdStatus);
                tbody.appendChild(tr);
            });
        }

        if (!detailModalInstance) {
            detailModalInstance = new bootstrap.Modal(document.getElementById('detailModal'));
        }
        detailModalInstance.show();
    } catch (error) {
        if (error.status === 401) {
            window.location.replace('../login.html');
            return;
        }
        showBanner('error', error.message || 'Không tải được hồ sơ độc giả.');
    }
}

/* ==========================================================================
   7. XÁC NHẬN KHÓA/MỞ KHÓA HOẶC XÓA ĐỘC GIẢ
   ========================================================================== */
function openActionConfirmModal(type, user) {
    state.pendingAction = { type: type, user: user };
    const titleEl = document.getElementById('actionConfirmTitle');
    const msgEl = document.getElementById('action-confirm-message');
    const noteEl = document.getElementById('action-confirm-note');
    const btnSubmit = document.getElementById('btn-confirm-submit');

    if (type === 'delete') {
        titleEl.textContent = 'Xác nhận xóa tài khoản độc giả';
        msgEl.textContent = 'Bạn có chắc chắn muốn XÓA vĩnh viễn độc giả "' + user.full_name + '" (' + user.email + ')?';
        noteEl.textContent = 'Lưu ý: Chỉ xóa được độc giả chưa có bất kỳ phiếu mượn nào. Tài khoản đã có phiếu mượn cần dùng chức năng Khóa để giữ nguyên lịch sử.';
        btnSubmit.className = 'btn btn-danger';
        btnSubmit.textContent = 'Xác nhận xóa';
    } else {
        const isActive = Number(user.is_active) === 1;
        titleEl.textContent = isActive ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản';
        msgEl.textContent = isActive
            ? 'Bạn có muốn KHÓA tài khoản của "' + user.full_name + '" (' + user.email + ')?'
            : 'Bạn có muốn MỞ KHÓA tài khoản của "' + user.full_name + '" (' + user.email + ')?';
        noteEl.textContent = isActive
            ? 'Độc giả bị khóa sẽ không thể đăng nhập hoặc gửi yêu cầu mượn sách mới.'
            : 'Độc giả sẽ có thể đăng nhập và mượn sách trở lại bình thường.';
        btnSubmit.className = 'btn ' + (isActive ? 'btn-warning text-dark fw-semibold' : 'btn-success');
        btnSubmit.textContent = isActive ? 'Khóa tài khoản' : 'Mở khóa';
    }

    if (!confirmModalInstance) {
        confirmModalInstance = new bootstrap.Modal(document.getElementById('actionConfirmModal'));
    }
    confirmModalInstance.show();
}

document.getElementById('btn-confirm-submit').addEventListener('click', async function () {
    const action = state.pendingAction;
    if (!action || !action.user) {
        return;
    }

    const btn = document.getElementById('btn-confirm-submit');
    btn.disabled = true;

    try {
        if (action.type === 'delete') {
            const result = await apiFetch('/users/' + encodeURIComponent(action.user.id), {
                method: 'DELETE'
            });
            if (confirmModalInstance) {
                confirmModalInstance.hide();
            }
            showBanner('success', (result && result.message) || 'Đã xóa tài khoản độc giả thành công.');
            if (state.page > 1) {
                state.page = 1;
            }
            await loadUsers();
        } else {
            const targetActive = Number(action.user.is_active) === 1 ? 0 : 1;
            const result = await apiFetch('/users/' + encodeURIComponent(action.user.id), {
                method: 'PATCH',
                body: JSON.stringify({ is_active: targetActive })
            });
            if (confirmModalInstance) {
                confirmModalInstance.hide();
            }
            showBanner('success', result.message || 'Cập nhật trạng thái thành công.');
            await loadUsers();
        }
    } catch (error) {
        if (confirmModalInstance) {
            confirmModalInstance.hide();
        }
        if (error.status === 401) {
            window.location.replace('../login.html');
            return;
        }
        showBanner('error', error.message || 'Không thể thực hiện thao tác.');
    } finally {
        btn.disabled = false;
        state.pendingAction = null;
    }
});

/* ==========================================================================
   8. GẮN SỰ KIỆN TÌM KIẾM, LỌC, PHÂN TRANG & ĐĂNG XUẤT
   ========================================================================== */
topbarSearchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    hideBanner();
    state.q = searchInput.value.trim();
    state.page = 1;
    loadUsers();
});

searchInput.addEventListener('input', function () {
    if (searchInput.value.trim() === '' && state.q !== '') {
        state.q = '';
        state.page = 1;
        loadUsers();
    }
});

subnavButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
        subnavButtons.forEach(function (b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        hideBanner();
        state.isActive = btn.getAttribute('data-status-filter') || '';
        state.page = 1;
        loadUsers();
    });
});

limitSelect.addEventListener('change', function () {
    hideBanner();
    state.limit = Number(limitSelect.value) || 10;
    state.page = 1;
    loadUsers();
});

btnResetFilter.addEventListener('click', function () {
    hideBanner();
    searchInput.value = '';
    limitSelect.value = '10';
    state.q = '';
    state.isActive = '';
    state.limit = 10;
    state.page = 1;
    subnavButtons.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-status-filter') === '');
    });
    loadUsers();
});

btnRefresh.addEventListener('click', function () {
    hideBanner();
    loadUsers();
});

btnPrevPage.addEventListener('click', function () {
    if (state.page > 1) {
        state.page -= 1;
        loadUsers();
    }
});

btnNextPage.addEventListener('click', function () {
    if (state.page < state.totalPages) {
        state.page += 1;
        loadUsers();
    }
});

function handleLogout() {
    sessionStorage.removeItem('token');
    window.location.replace('../login.html');
}

document.getElementById('btn-sidebar-logout').addEventListener('click', handleLogout);
document.getElementById('btn-topbar-logout').addEventListener('click', handleLogout);

async function initPage() {
    renderSidebarMenu();
    const ok = await verifyAdminSession();
    if (ok) {
        await loadUsers();
    }
}

initPage();
