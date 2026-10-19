const appWrapper = document.getElementById('app-wrapper');
const btnEdgeToggle = document.getElementById('btn-edge-toggle');
const edgeToggleIcon = document.getElementById('edge-toggle-icon');
const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');
const statusBanner = document.getElementById('status-banner');
const topBooksTbody = document.getElementById('top-books-tbody');
const overdueLoansTbody = document.getElementById('overdue-loans-tbody');
const categoriesBreakdownTbody = document.getElementById('categories-breakdown-tbody');

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

async function loadDashboard() {
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

        const res = await apiFetch('/statistics?top_limit=6');
        const s = res.data.summary;

        document.getElementById('kpi-members').textContent =
            s.active_members + ' / ' + s.total_members + ' hoạt động';
        const subMem = document.getElementById('kpi-members-sub');
        if (subMem) {
            subMem.textContent = 'Đang khóa: ' + (s.locked_members || 0) + ' tài khoản';
        }

        document.getElementById('kpi-books').textContent =
            s.available_copies + ' / ' + s.total_copies + ' bản';
        const subBooks = document.getElementById('kpi-books-sub');
        if (subBooks) {
            subBooks.textContent =
                (s.active_book_titles ?? s.active_titles ?? 0) + ' đầu sách đang mở / ' +
                (s.total_categories ?? 0) + ' danh mục';
        }

        document.getElementById('kpi-active-loans').textContent =
            s.pending_loans + ' chờ / ' + s.borrowed_loans + ' đang mượn';
        const subLoans = document.getElementById('kpi-loans-sub');
        if (subLoans) {
            subLoans.textContent = 'Đã hoàn trả: ' + (s.returned_loans ?? 0) + ' lượt';
        }

        document.getElementById('kpi-overdue').textContent = s.overdue_loans + ' phiếu';

        // 1. Render Top Books
        topBooksTbody.textContent = '';
        const topBooks = res.data.top_books || res.data.most_borrowed_books || [];
        if (topBooks.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 7;
            td.className = 'text-center py-4 text-secondary';
            td.textContent = 'Chưa có dữ liệu sách.';
            tr.appendChild(td);
            topBooksTbody.appendChild(tr);
        } else {
            topBooks.forEach(function (b) {
                const tr = document.createElement('tr');

                const tdId = document.createElement('td');
                tdId.className = 'fw-bold text-secondary';
                tdId.textContent = '#' + (b.id || b.book_id);

                const tdTitle = document.createElement('td');
                tdTitle.className = 'fw-bold text-dark';
                tdTitle.textContent = b.title;

                const tdAuthor = document.createElement('td');
                tdAuthor.textContent = b.author;

                const tdCat = document.createElement('td');
                const badgeCat = document.createElement('span');
                badgeCat.className = 'badge bg-light text-dark border';
                badgeCat.textContent = b.category_name;
                tdCat.appendChild(badgeCat);

                const tdStock = document.createElement('td');
                tdStock.textContent = b.available_copies + ' / ' + b.total_copies + ' bản';

                const tdCur = document.createElement('td');
                tdCur.textContent = (b.currently_borrowed ?? 0) + ' bản';

                const tdCount = document.createElement('td');
                const badgeCnt = document.createElement('span');
                badgeCnt.className = 'badge bg-primary-subtle text-primary rounded-pill px-3';
                badgeCnt.textContent = (b.loan_count ?? b.total_loans ?? 0) + ' lượt';
                tdCount.appendChild(badgeCnt);

                tr.appendChild(tdId);
                tr.appendChild(tdTitle);
                tr.appendChild(tdAuthor);
                tr.appendChild(tdCat);
                tr.appendChild(tdStock);
                tr.appendChild(tdCur);
                tr.appendChild(tdCount);
                topBooksTbody.appendChild(tr);
            });
        }

        // 2. Render Overdue Loans
        if (overdueLoansTbody) {
            overdueLoansTbody.textContent = '';
            const overdueList = res.data.overdue_list || [];
            if (overdueList.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 5;
                td.className = 'text-center py-4 text-success fw-semibold';
                td.textContent = 'Không có phiếu mượn nào quá hạn.';
                tr.appendChild(td);
                overdueLoansTbody.appendChild(tr);
            } else {
                overdueList.forEach(function (item) {
                    const tr = document.createElement('tr');

                    const tdId = document.createElement('td');
                    tdId.className = 'fw-bold text-secondary';
                    tdId.textContent = '#' + item.loan_id;

                    const tdUser = document.createElement('td');
                    const uName = document.createElement('div');
                    uName.className = 'fw-bold text-dark';
                    uName.textContent = item.borrower_name;
                    const uEmail = document.createElement('div');
                    uEmail.className = 'small text-secondary';
                    uEmail.textContent = item.borrower_email;
                    tdUser.appendChild(uName);
                    tdUser.appendChild(uEmail);

                    const tdBook = document.createElement('td');
                    tdBook.className = 'fw-semibold';
                    tdBook.textContent = item.book_title;

                    const tdDue = document.createElement('td');
                    tdDue.textContent = item.due_date;

                    const tdDays = document.createElement('td');
                    const badgeDays = document.createElement('span');
                    badgeDays.className = 'badge bg-danger-subtle text-danger rounded-pill px-2';
                    badgeDays.textContent = 'Trễ ' + item.days_overdue + ' ngày';
                    tdDays.appendChild(badgeDays);

                    tr.appendChild(tdId);
                    tr.appendChild(tdUser);
                    tr.appendChild(tdBook);
                    tr.appendChild(tdDue);
                    tr.appendChild(tdDays);
                    overdueLoansTbody.appendChild(tr);
                });
            }
        }

        // 3. Render Categories Breakdown
        if (categoriesBreakdownTbody) {
            categoriesBreakdownTbody.textContent = '';
            const cats = res.data.categories_breakdown || [];
            if (cats.length === 0) {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.colSpan = 3;
                td.className = 'text-center py-4 text-secondary';
                td.textContent = 'Chưa có danh mục.';
                tr.appendChild(td);
                categoriesBreakdownTbody.appendChild(tr);
            } else {
                cats.forEach(function (cat) {
                    const tr = document.createElement('tr');

                    const tdName = document.createElement('td');
                    tdName.className = 'fw-bold text-dark';
                    tdName.textContent = cat.category_name;

                    const tdTitles = document.createElement('td');
                    const bTitles = document.createElement('span');
                    bTitles.className = 'badge bg-light text-dark border';
                    bTitles.textContent = cat.total_titles + ' đầu sách';
                    tdTitles.appendChild(bTitles);

                    const tdCopies = document.createElement('td');
                    tdCopies.textContent = cat.available_copies + ' / ' + cat.total_copies + ' bản';

                    tr.appendChild(tdName);
                    tr.appendChild(tdTitles);
                    tr.appendChild(tdCopies);
                    categoriesBreakdownTbody.appendChild(tr);
                });
            }
        }
    } catch (error) {
        if (error.status === 401) {
            doLogout();
            return;
        }
        showBanner(error.message || 'Không thể tải thống kê hệ thống.', 'danger');
    }
}

document.getElementById('btn-refresh').addEventListener('click', loadDashboard);
loadDashboard();
