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
        active: false
    },
    {
        icon: 'bi-journal-arrow-up',
        title: 'Quản lý mượn – trả',
        href: '/admin/loans.html',
        active: true
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

const LOAN_STATUS_META = {
    pending: { label: 'Chờ xử lý', cls: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle' },
    borrowed: { label: 'Đang mượn', cls: 'bg-primary-subtle text-primary border border-primary-subtle' },
    returned: { label: 'Đã trả', cls: 'bg-success-subtle text-success border border-success-subtle' },
    rejected: { label: 'Bị từ chối', cls: 'bg-danger-subtle text-danger border border-danger-subtle' },
    cancelled: { label: 'Độc giả đã hủy', cls: 'bg-secondary-subtle text-secondary border border-secondary-subtle' }
};

const loanState = {
    page: 1,
    limit: 10,
    q: '',
    status: '',
    totalPages: 1,
    pendingAction: null // { type: 'borrowed' | 'returned' | 'rejected', loan: {...} }
};

const appWrapper = document.getElementById('app-wrapper');
const btnEdgeToggle = document.getElementById('btn-edge-toggle');
const edgeToggleIcon = document.getElementById('edge-toggle-icon');
const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');

const statusBanner = document.getElementById('status-banner');
const loansTableBody = document.getElementById('loans-table-body');
const paginationInfo = document.getElementById('pagination-info');
const pageIndicator = document.getElementById('page-indicator');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');

const topbarSearchForm = document.getElementById('topbar-search-form');
const searchInput = document.getElementById('search-input');
const limitSelect = document.getElementById('limit-select');
const btnResetFilter = document.getElementById('btn-reset-filter');
const btnRefresh = document.getElementById('btn-refresh');
const statusNavButtons = document.querySelectorAll('.settings-subnav-btn[data-loan-status]');

let detailModalInstance = null;
let confirmModalInstance = null;
let rejectModalInstance = null;

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

async function verifyAdminSession() {
    if (!sessionStorage.getItem('token')) {
        window.location.replace('../login.html');
        return false;
    }

    try {
        const result = await apiFetch('/auth/me');
        const user = result.data;

        if (user.role !== 'admin') {
            window.location.replace('../my-loans.html');
            return false;
        }

        document.getElementById('sidebar-user-name').textContent = user.full_name;
        document.getElementById('sidebar-user-role').textContent = 'Quản trị viên';
        document.getElementById('topbar-user-name').textContent = user.full_name;
        document.getElementById('topbar-avatar-text').textContent = user.full_name
            ? user.full_name.trim().charAt(0).toUpperCase()
            : 'A';

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

async function loadLoans() {
    const params = new URLSearchParams();
    params.set('page', String(loanState.page));
    params.set('limit', String(loanState.limit));

    if (loanState.status !== '') {
        params.set('status', loanState.status);
    }
    if (loanState.q !== '') {
        params.set('q', loanState.q);
    }

    try {
        const result = await apiFetch('/loans?' + params.toString());
        const loans = result.data || [];
        const meta = result.meta || { page: 1, limit: loanState.limit, total: 0, total_pages: 1 };

        loanState.page = meta.page;
        loanState.totalPages = meta.total_pages;

        if (meta.summary) {
            document.getElementById('stat-pending').textContent = meta.summary.pending_count || 0;
            document.getElementById('stat-borrowed').textContent = meta.summary.borrowed_count || 0;
            document.getElementById('stat-overdue').textContent = meta.summary.overdue_count || 0;
            document.getElementById('stat-returned').textContent = meta.summary.returned_count || 0;
        }

        renderLoansTable(loans);
        renderPagination(meta);
    } catch (error) {
        if (error.status === 401) {
            window.location.replace('../login.html');
            return;
        }
        showBanner('error', error.message || 'Không tải được danh sách phiếu mượn.');
    }
}

function renderLoansTable(loans) {
    loansTableBody.textContent = '';

    if (!loans || loans.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6;
        td.className = 'text-center py-4 text-secondary';
        td.textContent = 'Không có phiếu mượn nào khớp với điều kiện lọc.';
        tr.appendChild(td);
        loansTableBody.appendChild(tr);
        return;
    }

    loans.forEach(function (loan) {
        const tr = document.createElement('tr');

        // 1. Mã phiếu
        const tdId = document.createElement('td');
        tdId.className = 'fw-bold text-secondary';
        tdId.textContent = '#' + loan.id;
        tr.appendChild(tdId);

        // 2. Độc giả
        const tdUser = document.createElement('td');
        const uName = document.createElement('div');
        uName.className = 'fw-bold text-dark';
        uName.textContent = loan.user_name || ('ĐG #' + loan.user_id);
        const uEmail = document.createElement('div');
        uEmail.className = 'small text-secondary';
        uEmail.textContent = loan.user_email || '';
        tdUser.appendChild(uName);
        tdUser.appendChild(uEmail);

        if (loan.user_is_active === 0) {
            const lockedTag = document.createElement('span');
            lockedTag.className = 'badge text-bg-danger mt-1';
            lockedTag.textContent = 'Tài khoản đang khóa';
            tdUser.appendChild(lockedTag);
        }
        tr.appendChild(tdUser);

        // 3. Đầu sách
        const tdBook = document.createElement('td');
        const bTitle = document.createElement('div');
        bTitle.className = 'fw-semibold text-dark';
        bTitle.textContent = loan.book_title || ('Sách #' + loan.book_id);
        const bSub = document.createElement('div');
        bSub.className = 'small text-secondary';
        bSub.textContent = (loan.book_author || '')
            + (loan.book_available_copies !== null
                ? (' • Kho: còn ' + loan.book_available_copies + '/' + loan.book_total_copies)
                : '');
        tdBook.appendChild(bTitle);
        tdBook.appendChild(bSub);
        tr.appendChild(tdBook);

        // 4. Mốc thời gian
        const tdTime = document.createElement('td');
        tdTime.className = 'small';
        const reqLine = document.createElement('div');
        reqLine.textContent = 'Yêu cầu: ' + (loan.requested_at || '—');
        tdTime.appendChild(reqLine);

        if (loan.due_date) {
            const dueLine = document.createElement('div');
            dueLine.className = loan.is_overdue ? 'text-danger fw-bold' : 'text-primary fw-medium';
            dueLine.textContent = 'Hạn trả: ' + loan.due_date;
            tdTime.appendChild(dueLine);
        }
        if (loan.returned_at) {
            const retLine = document.createElement('div');
            retLine.className = 'text-success';
            retLine.textContent = 'Đã trả: ' + loan.returned_at;
            tdTime.appendChild(retLine);
        }
        tr.appendChild(tdTime);

        // 5. Trạng thái
        const tdStatus = document.createElement('td');
        const stInfo = LOAN_STATUS_META[loan.status] || { label: loan.status, cls: 'text-bg-secondary' };
        const stBadge = document.createElement('span');
        stBadge.className = 'badge rounded-pill ' + stInfo.cls;
        stBadge.textContent = stInfo.label;
        tdStatus.appendChild(stBadge);

        if (loan.is_overdue) {
            const overBadge = document.createElement('span');
            overBadge.className = 'badge rounded-pill text-bg-danger ms-1';
            overBadge.textContent = 'Quá hạn';
            tdStatus.appendChild(overBadge);
        } else if (loan.is_returned_late) {
            const lateBadge = document.createElement('span');
            lateBadge.className = 'badge rounded-pill text-bg-warning ms-1';
            lateBadge.textContent = 'Trả trễ';
            tdStatus.appendChild(lateBadge);
        }
        tr.appendChild(tdStatus);

        // 6. Thao tác theo trạng thái & hypermedia links
        const tdAct = document.createElement('td');
        tdAct.className = 'text-end';
        const grp = document.createElement('div');
        grp.className = 'd-inline-flex flex-wrap gap-1 justify-content-end';

        const btnDetail = document.createElement('button');
        btnDetail.type = 'button';
        btnDetail.className = 'btn btn-sm btn-primary text-white';
        btnDetail.textContent = 'Chi tiết';
        btnDetail.addEventListener('click', function () {
            openLoanDetailModal(loan.id);
        });
        grp.appendChild(btnDetail);

        const links = loan.links || {};

        if (links.approve || loan.status === 'pending') {
            const btnApprove = document.createElement('button');
            btnApprove.type = 'button';
            btnApprove.className = 'btn btn-sm btn-success text-white';
            btnApprove.textContent = 'Giao sách';
            btnApprove.addEventListener('click', function () {
                openConfirmLoanAction('borrowed', loan);
            });
            grp.appendChild(btnApprove);
        }

        if (links.reject || loan.status === 'pending') {
            const btnReject = document.createElement('button');
            btnReject.type = 'button';
            btnReject.className = 'btn btn-sm btn-danger text-white';
            btnReject.textContent = 'Từ chối';
            btnReject.addEventListener('click', function () {
                openRejectLoanModal(loan);
            });
            grp.appendChild(btnReject);
        }

        if (links.return || loan.status === 'borrowed') {
            const btnReturn = document.createElement('button');
            btnReturn.type = 'button';
            btnReturn.className = 'btn btn-sm btn-primary text-white';
            btnReturn.textContent = 'Nhận trả';
            btnReturn.addEventListener('click', function () {
                openConfirmLoanAction('returned', loan);
            });
            grp.appendChild(btnReturn);
        }

        tdAct.appendChild(grp);
        tr.appendChild(tdAct);

        loansTableBody.appendChild(tr);
    });
}

function renderPagination(meta) {
    const total = meta.total || 0;
    const page = meta.page || 1;
    const limit = meta.limit || loanState.limit;
    const totalPages = meta.total_pages || 1;

    if (total === 0) {
        paginationInfo.textContent = 'Không có phiếu mượn nào';
    } else {
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        paginationInfo.textContent = 'Hiển thị ' + start + ' – ' + end + ' / ' + total + ' phiếu mượn';
    }

    pageIndicator.textContent = 'Trang ' + page + ' / ' + totalPages;
    btnPrevPage.disabled = page <= 1;
    btnNextPage.disabled = page >= totalPages;
}

/* ==========================================================================
   CHI TIẾT PHIẾU MƯỢN
   ========================================================================== */
async function openLoanDetailModal(loanId) {
    hideBanner();
    try {
        const res = await apiFetch('/loans/' + encodeURIComponent(loanId));
        const loan = res.data;
        const stInfo = LOAN_STATUS_META[loan.status] || { label: loan.status };

        document.getElementById('d-loan-id').textContent = '#' + loan.id;
        document.getElementById('d-loan-status').textContent =
            stInfo.label + (loan.is_overdue ? ' (Đang quá hạn)' : '');
        document.getElementById('d-loan-user').textContent =
            (loan.user_name || '') + ' (' + (loan.user_email || '') + ')';
        document.getElementById('d-loan-book').textContent =
            (loan.book_title || '') + ' — ' + (loan.book_author || '');
        document.getElementById('d-loan-req').textContent = loan.requested_at || '—';
        document.getElementById('d-loan-bor').textContent = loan.borrowed_at || '—';
        document.getElementById('d-loan-due').textContent = loan.due_date || '—';
        document.getElementById('d-loan-ret').textContent = loan.returned_at || '—';

        const staffParts = [];
        if (loan.approved_by_name) {
            staffParts.push('Duyệt: ' + loan.approved_by_name);
        }
        if (loan.returned_by_name) {
            staffParts.push('Nhận trả: ' + loan.returned_by_name);
        }
        document.getElementById('d-loan-staff').textContent = staffParts.join(' | ') || '—';

        const rejectWrap = document.getElementById('d-reject-wrap');
        if (loan.rejection_reason) {
            rejectWrap.hidden = false;
            document.getElementById('d-loan-reason').textContent = loan.rejection_reason;
        } else {
            rejectWrap.hidden = true;
        }

        if (!detailModalInstance) {
            detailModalInstance = new bootstrap.Modal(document.getElementById('loanDetailModal'));
        }
        detailModalInstance.show();
    } catch (error) {
        showBanner('error', error.message || 'Không tải được chi tiết phiếu mượn.');
    }
}

/* ==========================================================================
   XÁC NHẬN GIAO SÁCH (borrowed) HOẶC NHẬN TRẢ SÁCH (returned)
   ========================================================================== */
function openConfirmLoanAction(targetStatus, loan) {
    loanState.pendingAction = { type: targetStatus, loan: loan };
    const titleEl = document.getElementById('loan-confirm-title');
    const msgEl = document.getElementById('loan-confirm-msg');
    const noteEl = document.getElementById('loan-confirm-note');
    const btnSubmit = document.getElementById('btn-loan-confirm-submit');

    if (targetStatus === 'borrowed') {
        titleEl.textContent = 'Xác nhận giao sách thực tế';
        msgEl.textContent = 'Xác nhận giao cuốn "' + loan.book_title + '" cho độc giả "' + loan.user_name + '"?';
        noteEl.textContent = 'Hệ thống sẽ chuyển trạng thái sang Đang mượn (borrowed), tính hạn trả 14 ngày và trừ 1 bản khả dụng trong kho sách.';
        btnSubmit.className = 'btn btn-success';
        btnSubmit.textContent = 'Xác nhận giao sách';
    } else {
        titleEl.textContent = 'Xác nhận đã nhận trả sách';
        msgEl.textContent = 'Xác nhận độc giả "' + loan.user_name + '" đã mang trả cuốn "' + loan.book_title + '"?';
        noteEl.textContent = 'Hệ thống sẽ chuyển trạng thái sang Đã trả (returned), lưu thời điểm trả và cộng lại 1 bản khả dụng vào kho sách.';
        btnSubmit.className = 'btn btn-primary';
        btnSubmit.textContent = 'Xác nhận nhận trả';
    }

    if (!confirmModalInstance) {
        confirmModalInstance = new bootstrap.Modal(document.getElementById('loanConfirmModal'));
    }
    confirmModalInstance.show();
}

document.getElementById('btn-loan-confirm-submit').addEventListener('click', async function () {
    const action = loanState.pendingAction;
    if (!action || !action.loan) {
        return;
    }

    const btn = document.getElementById('btn-loan-confirm-submit');
    btn.disabled = true;

    try {
        const res = await apiFetch('/loans/' + encodeURIComponent(action.loan.id), {
            method: 'PATCH',
            body: JSON.stringify({ status: action.type })
        });
        if (confirmModalInstance) {
            confirmModalInstance.hide();
        }
        showBanner('success', res.message || 'Cập nhật phiếu mượn thành công.');
        await loadLoans();
    } catch (error) {
        if (confirmModalInstance) {
            confirmModalInstance.hide();
        }
        showBanner('error', error.message || 'Không thể cập nhật trạng thái phiếu mượn.');
    } finally {
        btn.disabled = false;
        loanState.pendingAction = null;
    }
});

/* ==========================================================================
   TỪ CHỐI YÊU CẦU MƯỢN (rejected + rejection_reason)
   ========================================================================== */
function openRejectLoanModal(loan) {
    loanState.pendingAction = { type: 'rejected', loan: loan };
    document.getElementById('reject-loan-info').textContent =
        'Phiếu #' + loan.id + ' — Độc giả: ' + loan.user_name + ' — Sách: ' + loan.book_title;
    document.getElementById('rejection-reason-input').value = '';
    document.getElementById('rejection-reason-error').textContent = '';

    if (!rejectModalInstance) {
        rejectModalInstance = new bootstrap.Modal(document.getElementById('loanRejectModal'));
    }
    rejectModalInstance.show();
}

document.getElementById('reject-loan-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    const action = loanState.pendingAction;
    if (!action || !action.loan) {
        return;
    }

    const reasonInput = document.getElementById('rejection-reason-input');
    const errorEl = document.getElementById('rejection-reason-error');
    const reason = reasonInput.value.trim();

    if (reason.length < 1 || reason.length > 500) {
        errorEl.textContent = 'Vui lòng nhập lý do từ chối từ 1 đến 500 ký tự.';
        return;
    }

    const btn = document.getElementById('btn-reject-submit');
    btn.disabled = true;

    try {
        const res = await apiFetch('/loans/' + encodeURIComponent(action.loan.id), {
            method: 'PATCH',
            body: JSON.stringify({
                status: 'rejected',
                rejection_reason: reason
            })
        });
        if (rejectModalInstance) {
            rejectModalInstance.hide();
        }
        showBanner('success', res.message || 'Đã từ chối yêu cầu mượn sách.');
        await loadLoans();
    } catch (error) {
        if (error.fields && error.fields.rejection_reason) {
            errorEl.textContent = error.fields.rejection_reason;
        } else {
            if (rejectModalInstance) {
                rejectModalInstance.hide();
            }
            showBanner('error', error.message || 'Không thể từ chối phiếu mượn.');
        }
    } finally {
        btn.disabled = false;
    }
});

/* ==========================================================================
   GẮN SỰ KIỆN TÌM KIẾM, BỘ LỌC, PHÂN TRANG & ĐĂNG XUẤT
   ========================================================================== */
topbarSearchForm.addEventListener('submit', function (event) {
    event.preventDefault();
    hideBanner();
    loanState.q = searchInput.value.trim();
    loanState.page = 1;
    loadLoans();
});

searchInput.addEventListener('input', function () {
    if (searchInput.value.trim() === '' && loanState.q !== '') {
        loanState.q = '';
        loanState.page = 1;
        loadLoans();
    }
});

statusNavButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
        statusNavButtons.forEach(function (b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        hideBanner();
        loanState.status = btn.getAttribute('data-loan-status') || '';
        loanState.page = 1;
        loadLoans();
    });
});

limitSelect.addEventListener('change', function () {
    hideBanner();
    loanState.limit = Number(limitSelect.value) || 10;
    loanState.page = 1;
    loadLoans();
});

btnResetFilter.addEventListener('click', function () {
    hideBanner();
    searchInput.value = '';
    limitSelect.value = '10';
    loanState.q = '';
    loanState.status = '';
    loanState.limit = 10;
    loanState.page = 1;
    statusNavButtons.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-loan-status') === '');
    });
    loadLoans();
});

btnRefresh.addEventListener('click', function () {
    hideBanner();
    loadLoans();
});

btnPrevPage.addEventListener('click', function () {
    if (loanState.page > 1) {
        loanState.page -= 1;
        loadLoans();
    }
});

btnNextPage.addEventListener('click', function () {
    if (loanState.page < loanState.totalPages) {
        loanState.page += 1;
        loadLoans();
    }
});

function handleLogout() {
    sessionStorage.removeItem('token');
    window.location.replace('../login.html');
}

document.getElementById('btn-sidebar-logout').addEventListener('click', handleLogout);
document.getElementById('btn-topbar-logout').addEventListener('click', handleLogout);

async function initLoansPage() {
    renderSidebarMenu();
    const ok = await verifyAdminSession();
    if (ok) {
        await loadLoans();
    }
}

initLoansPage();
