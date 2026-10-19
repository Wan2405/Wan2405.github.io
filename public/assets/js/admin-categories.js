const appWrapper = document.getElementById('app-wrapper');
const btnEdgeToggle = document.getElementById('btn-edge-toggle');
const edgeToggleIcon = document.getElementById('edge-toggle-icon');
const btnHamburgerToggle = document.getElementById('btn-hamburger-toggle');
const statusBanner = document.getElementById('status-banner');
const categoriesTableBody = document.getElementById('categories-table-body');

let catModal = null;
let categoriesList = [];

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

function renderCategories() {
    categoriesTableBody.textContent = '';

    categoriesList.forEach(function (c) {
        const tr = document.createElement('tr');

        const tdId = document.createElement('td');
        tdId.className = 'fw-bold text-secondary';
        tdId.textContent = '#' + c.id;

        const tdName = document.createElement('td');
        tdName.className = 'fw-bold text-dark';
        tdName.textContent = c.name;

        const tdDesc = document.createElement('td');
        tdDesc.className = 'text-secondary small';
        tdDesc.textContent = c.description || '—';

        const tdCount = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge bg-light text-dark border rounded-pill px-3';
        badge.textContent = c.book_count + ' đầu sách';
        tdCount.appendChild(badge);

        const tdActions = document.createElement('td');
        tdActions.className = 'text-end';
        const grp = document.createElement('div');
        grp.className = 'd-inline-flex gap-1';

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn-sm btn-purple text-white';
        btnEdit.textContent = 'Sửa';
        btnEdit.addEventListener('click', function () {
            openCategoryModal(c);
        });

        const btnDel = document.createElement('button');
        btnDel.type = 'button';
        btnDel.className = 'btn btn-sm btn-danger text-white';
        btnDel.textContent = 'Xóa';
        btnDel.addEventListener('click', function () {
            deleteCategory(c);
        });

        grp.appendChild(btnEdit);
        grp.appendChild(btnDel);
        tdActions.appendChild(grp);

        tr.appendChild(tdId);
        tr.appendChild(tdName);
        tr.appendChild(tdDesc);
        tr.appendChild(tdCount);
        tr.appendChild(tdActions);
        categoriesTableBody.appendChild(tr);
    });
}

function openCategoryModal(cat) {
    if (!catModal) {
        catModal = new bootstrap.Modal(document.getElementById('categoryFormModal'));
    }
    if (cat) {
        document.getElementById('cat-modal-title').textContent = 'Cập nhật danh mục #' + cat.id;
        document.getElementById('cat-id-input').value = String(cat.id);
        document.getElementById('cat-name-input').value = cat.name || '';
        document.getElementById('cat-desc-input').value = cat.description || '';
    } else {
        document.getElementById('cat-modal-title').textContent = 'Thêm danh mục mới';
        document.getElementById('cat-id-input').value = '';
        document.getElementById('cat-name-input').value = '';
        document.getElementById('cat-desc-input').value = '';
    }
    catModal.show();
}

async function deleteCategory(cat) {
    if (!window.confirm('Xác nhận xóa danh mục "' + cat.name + '"?')) {
        return;
    }
    try {
        const res = await apiFetch('/categories/' + cat.id, { method: 'DELETE' });
        showBanner(res.message || 'Đã xóa danh mục.', 'success');
        await loadCategories();
    } catch (error) {
        showBanner(error.message || 'Không thể xóa danh mục đang có sách.', 'danger');
    }
}

document.getElementById('btn-add-category').addEventListener('click', function () {
    openCategoryModal(null);
});

document.getElementById('category-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = document.getElementById('cat-id-input').value;
    const payload = {
        name: document.getElementById('cat-name-input').value.trim(),
        description: document.getElementById('cat-desc-input').value.trim()
    };

    try {
        const res = await apiFetch(id ? '/categories/' + id : '/categories', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        if (catModal) catModal.hide();
        showBanner(res.message || 'Lưu danh mục thành công.', 'success');
        await loadCategories();
    } catch (error) {
        showBanner(error.message || 'Dữ liệu danh mục không hợp lệ.', 'danger');
    }
});

async function loadCategories() {
    try {
        const res = await apiFetch('/categories');
        categoriesList = res.data || [];
        renderCategories();
    } catch (error) {
        showBanner(error.message || 'Không thể tải danh mục.', 'danger');
    }
}

async function initAdminCategories() {
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
        await loadCategories();
    } catch (error) {
        doLogout();
    }
}

initAdminCategories();
