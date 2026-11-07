const message = document.getElementById('message');
const profileInfo = document.getElementById('profile-info');
const logoutButton = document.getElementById('logout-button');
const topbarLogoutBtn = document.getElementById('topbar-logout-btn');

const appWrapper = document.getElementById('app-wrapper');
const btnEdgeToggle = document.getElementById('btn-edge-toggle');
const edgeToggleIcon = document.getElementById('edge-toggle-icon');
const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');

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

function doLogout() {
    window.LibraryApi.clearSession();
    window.location.replace('login.html');
}

logoutButton.addEventListener('click', doLogout);
if (topbarLogoutBtn) {
    topbarLogoutBtn.addEventListener('click', doLogout);
}

// Tạo menu Sidebar theo đúng vai trò:
// Độc giả (member) tuyệt đối không thấy chức năng quản trị của Admin.
function renderProfileSidebar(role) {
    const nav = document.getElementById('profile-sidebar-nav');
    nav.textContent = '';

    const items = role === 'admin'
        ? [
            { icon: 'bi-grid-1x2-fill', title: 'Tổng quan', href: 'admin/dashboard.html' },
            { icon: 'bi-people-fill', title: 'Quản lý độc giả', href: 'admin/users.html' },
            { icon: 'bi-journal-arrow-up', title: 'Quản lý mượn – trả', href: 'admin/loans.html' },
            { icon: 'bi-book-half', title: 'Quản lý kho sách', href: 'admin/books.html' },
            { icon: 'bi-tags-fill', title: 'Quản lý danh mục', href: 'admin/categories.html' },
            { icon: 'bi-search', title: 'Tra cứu sách công khai', href: 'index.html' }
        ]
        : [
            { icon: 'bi-journal-bookmark-fill', title: 'Thư viện & Mượn sách', href: 'my-loans.html' }
        ];

    items.forEach(function (item) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.href;
        a.className = 'sidebar-link';

        const icon = document.createElement('i');
        icon.className = 'bi ' + item.icon;

        const span = document.createElement('span');
        span.textContent = item.title;

        a.appendChild(icon);
        a.appendChild(span);
        li.appendChild(a);
        nav.appendChild(li);
    });
}

async function loadProfile() {
    if (!sessionStorage.getItem('token')) {
        window.location.replace('login.html');
        return;
    }

    try {
        const result = await apiFetch('/auth/me');
        const user = result.data;
        const isAdmin = user.role === 'admin';
        document.body.classList.toggle('profile-page', user.role === 'member');
        const roleLabel = isAdmin ? 'Quản trị viên' : 'Độc giả';
        const workspaceHref = isAdmin ? 'admin/users.html' : 'my-loans.html';

        renderProfileSidebar(user.role);

        document.getElementById('sidebar-brand-link').href = workspaceHref;
        document.getElementById('dropdown-workspace-link').href = workspaceHref;
        document.getElementById('btn-back-workspace').href = workspaceHref;
        document.getElementById('subnav-main-feature').href = workspaceHref;
        document.getElementById('subnav-main-feature-text').textContent = isAdmin
            ? 'Quản lý độc giả'
            : 'Thư viện & Mượn sách';

        document.getElementById('sidebar-user-name').textContent = user.full_name;
        document.getElementById('sidebar-user-role').textContent = roleLabel;
        document.getElementById('topbar-user-name').textContent = user.full_name;
        document.getElementById('topbar-avatar-text').textContent = user.full_name
            ? user.full_name.trim().charAt(0).toUpperCase()
            : 'U';

        document.getElementById('card-display-name').textContent = user.full_name;
        document.getElementById('card-display-role').textContent = roleLabel + ' • ' + user.email;

        // textContent de hien thi du lieu an toan, khong chen HTML tu CSDL.
        document.getElementById('user-id').textContent = user.id;
        document.getElementById('full-name').textContent = user.full_name;
        document.getElementById('email').textContent = user.email;
        document.getElementById('role').textContent = roleLabel;
        document.getElementById('is-active').textContent =
            user.is_active === 1 ? 'Đang hoạt động' : 'Đã vô hiệu hóa';
        document.getElementById('created-at').textContent = user.created_at;

        message.hidden = true;
        message.textContent = '';
        profileInfo.hidden = false;
        document.body.classList.remove('profile-loading');
    } catch (error) {
        if (error.status === 401) {
            window.location.replace('login.html');
            return;
        }
        document.body.classList.remove('profile-loading');
        message.hidden = false;
        message.className = 'alert alert-danger';
        message.textContent = error.status
            ? error.message
            : 'Không kết nối được máy chủ. Hãy kiểm tra server và tải lại trang.';
    }
}

loadProfile();
