/**
 * Potion Pantry - Frontend Authentication Guard & Google Identity Services (frontend/auth.js)
 * Manages Google Sign-in, session storage in localStorage, auth redirects, and navbar user badge.
 */

const AUTH_CONFIG = {
  SESSION_KEY: 'grim_user_session',
  API_BASE: 'http://127.0.0.1:8000',
  LOGIN_PAGE: 'login.html',
  HOME_PAGE: 'index.html',
};

/**
 * Returns stored session object or null if not authenticated.
 */
function getAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_CONFIG.SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.session_token || !session.user) return null;
    return session;
  } catch (err) {
    console.error('Failed to parse auth session:', err);
    return null;
  }
}

/**
 * Persists session data returned by backend.
 */
function setAuthSession(sessionData) {
  localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Clears session and logs out of backend session cookie.
 */
async function signOutUser() {
  try {
    await fetch(`${AUTH_CONFIG.API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (err) {
    console.warn('Backend logout call failed or offline:', err);
  } finally {
    localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
    window.location.href = AUTH_CONFIG.LOGIN_PAGE;
  }
}

/**
 * Route Guard: Protects dashboard/home pages. Redirects to login if unauthenticated.
 */
function requireAuth() {
  const session = getAuthSession();
  if (!session) {
    const returnUrl = encodeURIComponent(window.location.pathname.split('/').pop() || AUTH_CONFIG.HOME_PAGE);
    window.location.href = `${AUTH_CONFIG.LOGIN_PAGE}?redirect=${returnUrl}`;
    return null;
  }
  return session;
}

/**
 * Redirects away from login page if already authenticated.
 */
function redirectIfAuthenticated() {
  const session = getAuthSession();
  if (session) {
    const params = new URLSearchParams(window.location.search);
    const destination = params.get('redirect') || AUTH_CONFIG.HOME_PAGE;
    window.location.href = destination;
  }
}

/**
 * Renders user profile pill & dropdown with Sign Out option in header nav on hover.
 */
function initNavbarAuth() {
  const session = getAuthSession();
  if (!session) return;

  const user = session.user || {};
  const navWrap = document.querySelector('.header-nav-wrap') || document.querySelector('.main-header');
  if (!navWrap || document.getElementById('navbarUserAuth')) return;

  const authContainer = document.createElement('div');
  authContainer.id = 'navbarUserAuth';
  authContainer.className = 'navbar-auth-container';

  // 1. Visible Compact Profile Pill
  const pill = document.createElement('div');
  pill.className = 'navbar-user-pill';
  pill.setAttribute('role', 'button');
  pill.setAttribute('aria-haspopup', 'true');
  pill.setAttribute('aria-expanded', 'false');
  pill.title = `${user.name || 'Alchemist'} (${user.email || ''})`;

  // Avatar Wrapper
  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'user-avatar-badge';

  if (user.picture) {
    const img = document.createElement('img');
    img.src = user.picture;
    img.alt = user.name || 'User';
    img.className = 'user-avatar-img';
    avatarWrapper.appendChild(img);
  } else {
    const initial = document.createElement('span');
    initial.textContent = (user.name || user.email || 'A').charAt(0).toUpperCase();
    initial.className = 'user-avatar-initial';
    avatarWrapper.appendChild(initial);
  }

  // Name
  const nameSpan = document.createElement('span');
  nameSpan.className = 'user-name-text';
  nameSpan.textContent = user.name ? user.name.split(' ')[0] : 'Alchemist';

  // Dropdown caret SVG icon
  const caret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  caret.setAttribute('class', 'dropdown-caret');
  caret.setAttribute('width', '11');
  caret.setAttribute('height', '11');
  caret.setAttribute('viewBox', '0 0 24 24');
  caret.setAttribute('fill', 'none');
  caret.setAttribute('stroke', 'currentColor');
  caret.setAttribute('stroke-width', '2.5');
  caret.setAttribute('stroke-linecap', 'round');
  caret.setAttribute('stroke-linejoin', 'round');
  const caretPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  caretPoly.setAttribute('points', '6 9 12 15 18 9');
  caret.appendChild(caretPoly);

  pill.appendChild(avatarWrapper);
  pill.appendChild(nameSpan);
  pill.appendChild(caret);

  // 2. Dropdown Menu appearing on hover
  const dropdown = document.createElement('div');
  dropdown.className = 'navbar-auth-dropdown';
  dropdown.setAttribute('role', 'menu');

  const userHeader = document.createElement('div');
  userHeader.className = 'dropdown-user-header';

  const dropName = document.createElement('div');
  dropName.className = 'dropdown-user-name';
  dropName.textContent = user.name || 'Alchemist';

  const dropEmail = document.createElement('div');
  dropEmail.className = 'dropdown-user-email';
  dropEmail.textContent = user.email || '';
  dropEmail.title = user.email || '';

  userHeader.appendChild(dropName);
  if (user.email) userHeader.appendChild(dropEmail);

  const divider = document.createElement('div');
  divider.className = 'dropdown-divider';

  // Sign out button inside dropdown
  const signOutBtn = document.createElement('button');
  signOutBtn.type = 'button';
  signOutBtn.className = 'btn-dropdown-logout';
  signOutBtn.setAttribute('role', 'menuitem');
  signOutBtn.title = 'Clear session and return to login';

  const logoutSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  logoutSvg.setAttribute('width', '13');
  logoutSvg.setAttribute('height', '13');
  logoutSvg.setAttribute('viewBox', '0 0 24 24');
  logoutSvg.setAttribute('fill', 'none');
  logoutSvg.setAttribute('stroke', 'currentColor');
  logoutSvg.setAttribute('stroke-width', '2');
  logoutSvg.setAttribute('stroke-linecap', 'round');
  logoutSvg.setAttribute('stroke-linejoin', 'round');
  logoutSvg.innerHTML = '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>';

  const logoutText = document.createElement('span');
  logoutText.textContent = 'Sign Out';

  signOutBtn.appendChild(logoutSvg);
  signOutBtn.appendChild(logoutText);

  signOutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    signOutUser();
  });

  dropdown.appendChild(userHeader);
  dropdown.appendChild(divider);
  dropdown.appendChild(signOutBtn);

  // Click & Touch toggle support (alongside hover)
  pill.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = authContainer.classList.toggle('is-active');
    pill.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!authContainer.contains(e.target)) {
      authContainer.classList.remove('is-active');
      pill.setAttribute('aria-expanded', 'false');
    }
  });

  authContainer.appendChild(pill);
  authContainer.appendChild(dropdown);
  navWrap.appendChild(authContainer);
}

// Attach to window for global access
window.PotionAuth = {
  getAuthSession,
  setAuthSession,
  signOutUser,
  requireAuth,
  redirectIfAuthenticated,
  initNavbarAuth,
  AUTH_CONFIG,
};

