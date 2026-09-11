// ============================================================
// router.js — tiny hash router (no page reload, no server config
// needed for static hosting).
// ============================================================

const routes = new Map();
let notFoundHandler = () => {};
let currentRoute = null;

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function currentPath() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash || 'dashboard';
}

export function navigate(path) {
  if (window.location.hash === `#/${path}`) {
    resolve();
  } else {
    window.location.hash = `#/${path}`;
  }
}

function resolve() {
  const full = currentPath();
  const [base, ...rest] = full.split('/');
  const handler = routes.get(base);
  currentRoute = base;
  if (handler) handler(rest.join('/'));
  else notFoundHandler(base);
}

export function getCurrentRoute() {
  return currentRoute;
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
