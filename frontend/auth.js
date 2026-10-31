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
 * Renders user profile pill & Sign Out button in header nav if authenticated.
 */
function initNavbarAuth() {
  const session = getAuthSession();
  if (!session) return;

  const user = session.user;
  const navWrap = document.querySelector('.header-nav-wrap') || document.querySelector('.main-header');
  if (!navWrap || document.getElementById('navbarUserAuth')) return;

  const authContainer = document.createElement('div');
  authContainer.id = 'navbarUserAuth';
  authContainer.className = 'navbar-auth-container';

  // User avatar or initial
  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'user-avatar-badge';
  avatarWrapper.title = user.email || 'Authenticated Alchemist';

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

  // Name display
  const nameSpan = document.createElement('span');
  nameSpan.className = 'user-name-text';
  nameSpan.textContent = user.name ? user.name.split(' ')[0] : 'Alchemist';

  // Sign out button
  const signOutBtn = document.createElement('button');
  signOutBtn.type = 'button';
  signOutBtn.className = 'btn-sign-out';
  signOutBtn.textContent = 'Sign Out';
  signOutBtn.title = 'Clear session and return to login';
  signOutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signOutUser();
  });

  authContainer.appendChild(avatarWrapper);
  authContainer.appendChild(nameSpan);
  authContainer.appendChild(signOutBtn);

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

