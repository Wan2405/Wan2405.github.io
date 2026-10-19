/**
 * Shared REST API Client & Auth Helper (`public/assets/js/api.js`)
 * Tương thích 100% cả Người 1 (`apiFetch`, `sessionStorage.token`) và Người 2 (`window.LibraryApi`, `renderNavbar`, `resolveCoverUrl`, `getCurrentUser`).
 * Hỗ trợ chạy cả trên `php -S localhost:8000 -t public router.php` lẫn Apache XAMPP (`/LTW-GK/public/...`).
 */
(function (window) {
    'use strict';

    const LEGACY_TOKEN_KEY = 'library_access_token';
    const USER_STORAGE_KEY = 'library_current_user';

    function detectPaths() {
        const pathname = window.location.pathname || '';
        const publicIdx = pathname.indexOf('/public/');
        if (publicIdx !== -1) {
            const projectRoot = pathname.substring(0, publicIdx);
            return {
                apiBase: projectRoot + '/api/v1',
                publicBase: projectRoot + '/public',
            };
        }
        return {
            apiBase: '/api/v1',
            publicBase: '',
        };
    }

    const PATHS = detectPaths();

    function getToken() {
        return sessionStorage.getItem('token') || localStorage.getItem(LEGACY_TOKEN_KEY) || null;
    }

    function getUser() {
        try {
            const raw = sessionStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(USER_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            return null;
        }
    }

    function setSession(token, user) {
        if (token) {
            sessionStorage.setItem('token', token);
            localStorage.setItem(LEGACY_TOKEN_KEY, token);
        }
        if (user) {
            const json = JSON.stringify(user);
            sessionStorage.setItem(USER_STORAGE_KEY, json);
            localStorage.setItem(USER_STORAGE_KEY, json);
        }
    }

    function clearSession() {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
    }

    function resolveUrl(relativePath) {
        if (!relativePath) {
            return PATHS.publicBase || '/';
        }
        if (/^https?:\/\//i.test(relativePath)) {
            return relativePath;
        }
        const cleaned = String(relativePath).replace(/^\/+/, '');
        return (PATHS.publicBase ? PATHS.publicBase + '/' : '/') + cleaned;
    }

    function resolveCoverUrl(coverPath) {
        const fallback = resolveUrl('assets/images/covers/default-book.svg');
        if (!coverPath) {
            return fallback;
        }
        return resolveUrl(coverPath);
    }

    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Hàm `apiFetch(path, options)` dùng chung cho toàn bộ các trang của Người 1 & Người 2.
     */
    async function apiFetch(path, options = {}) {
        let cleanPath = String(path).startsWith('/') ? String(path) : '/' + String(path);
        const queryObj = options.query || options.params;
        if (queryObj && typeof queryObj === 'object') {
            const sp = new URLSearchParams();
            Object.entries(queryObj).forEach(([k, v]) => {
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                    sp.append(k, String(v).trim());
                }
            });
            const qs = sp.toString();
            if (qs) {
                cleanPath += (cleanPath.includes('?') ? '&' : '?') + qs;
            }
        }

        const headers = { ...(options.headers || {}) };
        const token = getToken();

        let bodyPayload = options.body;
        if (bodyPayload !== undefined && bodyPayload !== null && typeof bodyPayload === 'object') {
            bodyPayload = JSON.stringify(bodyPayload);
        }

        if (bodyPayload !== undefined && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        if (token && !headers.Authorization) {
            headers.Authorization = 'Bearer ' + token;
        }

        const fetchOpts = {
            ...options,
            headers,
        };
        delete fetchOpts.query;
        delete fetchOpts.params;
        if (bodyPayload !== undefined) {
            fetchOpts.body = bodyPayload;
        }

        const response = await fetch(PATHS.apiBase + cleanPath, fetchOpts);
        const text = await response.text();
        let data = null;

        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = null;
        }

        if (!response.ok) {
            const error = (data && data.error) || {
                code: 'HTTP_ERROR',
                message: 'Yêu cầu không thành công.',
            };
            error.status = response.status;
            throw error;
        }

        if (data && data.data) {
            if (cleanPath.startsWith('/auth/login') && data.data.access_token) {
                setSession(data.data.access_token, data.data.user || null);
            } else if (cleanPath.startsWith('/auth/me') && data.data.id) {
                setSession(token, data.data);
            } else if ((cleanPath === '/books' || cleanPath.startsWith('/books?')) && Array.isArray(data.data)) {
                data.data.books = data.data;
                if (!window.__cachedLibraryCategories) {
                    try {
                        const catResp = await fetch(PATHS.apiBase + '/categories', { headers });
                        const catJson = await catResp.json();
                        if (catJson && Array.isArray(catJson.data)) {
                            window.__cachedLibraryCategories = catJson.data;
                        }
                    } catch (e) {
                        window.__cachedLibraryCategories = [];
                    }
                }
                data.data.categories = window.__cachedLibraryCategories || [];
            }
        }

        return data;
    }

    async function request(endpoint, options = {}) {
        return apiFetch(endpoint, options);
    }

    function showAlert(containerOrId, type, message, autoHideMs = 4500) {
        const el = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)
            : containerOrId;
        if (!el) return;

        el.innerHTML = `
            <div class="alert alert-${escapeHtml(type)}">
                <div>${escapeHtml(message)}</div>
                <button type="button" class="alert-close" aria-label="Đóng">&times;</button>
            </div>
        `;
        const closeBtn = el.querySelector('.alert-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                el.innerHTML = '';
            });
        }
        if (autoHideMs > 0) {
            setTimeout(() => {
                if (el.innerHTML.includes(escapeHtml(message))) {
                    el.innerHTML = '';
                }
            }, autoHideMs);
        }
    }

    /**
     * Render thanh điều hướng chung cho trang công khai (`public/index.html`, `public/book-detail.html`)
     */
    async function renderNavbar(arg1 = '', arg2 = '') {
        let activeKey = arg1;
        let navContainer = document.getElementById('app-navbar');
        if (typeof arg1 === 'string' && arg1.startsWith('#')) {
            navContainer = document.querySelector(arg1) || navContainer;
            activeKey = arg2 || '';
        }
        if (!navContainer) return;

        let user = getUser();
        const token = getToken();
        if (token && !user) {
            try {
                const meRes = await apiFetch('/auth/me');
                if (meRes && meRes.data) {
                    user = meRes.data;
                    setSession(token, user);
                }
            } catch (err) {
                clearSession();
            }
        }

        const isAdmin = user && user.role === 'admin';
        const isMember = user && user.role === 'member';

        const navLinks = [
            { key: 'catalog', label: 'Tra cứu sách', href: resolveUrl('index.html') },
        ];

        if (isMember) {
            navLinks.push({ key: 'my-loans', label: 'Kệ sách & Phiếu mượn (ReadOwl)', href: resolveUrl('my-loans.html') });
            navLinks.push({ key: 'profile', label: 'Hồ sơ cá nhân', href: resolveUrl('profile.html') });
        }

        if (isAdmin) {
            navLinks.push({ key: 'admin-dashboard', label: 'Dashboard', href: resolveUrl('admin/dashboard.html') });
            navLinks.push({ key: 'admin-books', label: 'Quản lý Sách', href: resolveUrl('admin/books.html') });
            navLinks.push({ key: 'admin-categories', label: 'Danh mục', href: resolveUrl('admin/categories.html') });
            navLinks.push({ key: 'admin-loans', label: 'Mượn - Trả', href: resolveUrl('admin/loans.html') });
            navLinks.push({ key: 'admin-users', label: 'Độc giả', href: resolveUrl('admin/users.html') });
        }

        const linksHtml = navLinks.map((item) => `
            <a href="${item.href}" class="nav-link ${item.key === activeKey ? 'active' : ''}">
                ${escapeHtml(item.label)}
            </a>
        `).join('');

        let authHtml = '';
        if (user) {
            const roleBadge = isAdmin
                ? '<span class="badge badge--info">Admin</span>'
                : '<span class="badge badge--success">Độc giả</span>';
            authHtml = `
                <div class="site-navbar__user" style="display:flex;align-items:center;gap:0.65rem;">
                    <a href="${resolveUrl('profile.html')}" style="font-weight:600;text-decoration:none;color:inherit;">
                        ${escapeHtml(user.full_name || user.email)}
                    </a>
                    ${roleBadge}
                    <button type="button" id="btn-logout-nav" class="btn btn--outline btn--sm">Đăng xuất</button>
                </div>
            `;
        } else {
            authHtml = `
                <div class="site-navbar__actions" style="display:flex;align-items:center;gap:0.5rem;">
                    <a href="${resolveUrl('login.html')}" class="btn btn--outline btn--sm">Đăng nhập</a>
                    <a href="${resolveUrl('register.html')}" class="btn btn--primary btn--sm">Đăng ký</a>
                </div>
            `;
        }

        navContainer.innerHTML = `
            <div class="container site-navbar__inner">
                <a href="${resolveUrl('index.html')}" class="site-navbar__brand">
                    <span>🦉 ReadOwl Library</span>
                    <span class="site-navbar__badge">REST API v1</span>
                </a>
                <div class="site-navbar__links">
                    ${linksHtml}
                </div>
                ${authHtml}
            </div>
        `;

        const logoutBtn = document.getElementById('btn-logout-nav');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                clearSession();
                window.location.href = resolveUrl('index.html');
            });
        }
    }

    function requireAdminPage() {
        const token = getToken();
        if (!token) {
            window.location.replace(resolveUrl('login.html'));
            return false;
        }
        return true;
    }

    function fixRootRelativeLinks(rootNode = document) {
        if (!PATHS.publicBase) return;
        rootNode.querySelectorAll('a[href^="/"]').forEach((anchor) => {
            const href = anchor.getAttribute('href');
            if (href && !href.startsWith(PATHS.publicBase + '/')) {
                anchor.setAttribute('href', PATHS.publicBase + href);
            }
        });
    }

    function initResponsiveSidebar() {
        const shell = document.getElementById('app-wrapper') || document.getElementById('readowl-shell');
        if (!shell) return;

        function checkMobileCollapse() {
            if (window.innerWidth <= 991.98) {
                if (!shell.classList.contains('sidebar-collapsed')) {
                    shell.classList.add('sidebar-collapsed');
                    const icon = document.getElementById('edge-toggle-icon');
                    if (icon) icon.className = 'bi bi-chevron-right';
                }
            }
        }
        checkMobileCollapse();

        // Tao backdrop dong sidebar tren thiet bi di dong
        let backdrop = document.getElementById('mobile-sidebar-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'mobile-sidebar-backdrop';
            backdrop.className = 'sidebar-mobile-backdrop';
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', () => {
                shell.classList.add('sidebar-collapsed');
                const icon = document.getElementById('edge-toggle-icon');
                if (icon) icon.className = 'bi bi-chevron-right';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        fixRootRelativeLinks(document);
        if (PATHS.publicBase && typeof MutationObserver !== 'undefined') {
            const obs = new MutationObserver(() => fixRootRelativeLinks(document));
            obs.observe(document.body, { childList: true, subtree: true });
        }
        initResponsiveSidebar();
    });

    window.apiFetch = apiFetch;
    window.resolveCoverUrl = resolveCoverUrl;
    window.resolvePublicPageUrl = resolveUrl;
    window.getCurrentUser = getUser;
    window.renderNavbar = renderNavbar;
    window.LibraryApi = {
        API_BASE_URL: PATHS.apiBase,
        PUBLIC_BASE_URL: PATHS.publicBase,
        getToken,
        getUser,
        setSession,
        clearSession,
        resolveUrl,
        resolveCoverUrl,
        escapeHtml,
        request,
        apiFetch,
        showAlert,
        renderNavbar,
        requireAdminPage,
    };
})(window);
