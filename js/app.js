// ============================================================
// app.js — main entry point. Boots the shell, theme, router,
// and wires the sidebar + topbar chrome.
// ============================================================

import { store } from './store.js';
import { registerRoute, setNotFound, startRouter, navigate, getCurrentRoute } from './router.js';
import { renderSidebar } from './components/sidebar.js';
import { renderDashboard } from './views/dashboard.js';
import { renderKanban } from './views/kanban.js';
import { renderNotes } from './views/notes.js';
import { renderCalendar } from './views/calendar.js';
import { renderSettings } from './views/settings.js';
import { errorStateHTML } from './components/state.js';
import { t } from './utils/i18n.js';
import { debounce } from './utils/helpers.js';

const viewRoot = document.getElementById('view-root');
const shell = document.getElementById('app-shell');

const TITLES = { dashboard: 'dashboard', projects: 'projects', notes: 'notes', calendar: 'calendar', settings: 'settings' };

export function applyTheme() {
  const { theme } = store.state.settings;
  const resolved = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  document.documentElement.setAttribute('data-theme', resolved);
}

function updateTopbar(route) {
  const lang = store.state.settings.lang;
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = t(TITLES[route] || route, lang);
}

function safeRender(renderFn, route) {
  try {
    renderFn(viewRoot);
    updateTopbar(route);
  } catch (err) {
    console.error(`[nexus] render failure on route "${route}"`, err);
    viewRoot.innerHTML = errorStateHTML('Something broke', 'This view hit an unexpected error. Try another section, or reload — your data is safe in local storage.');
  }
}

function registerRoutes() {
  registerRoute('dashboard', () => { renderSidebarSafe('dashboard'); safeRender(renderDashboard, 'dashboard'); });
  registerRoute('projects', () => { renderSidebarSafe('projects'); safeRender(renderKanban, 'projects'); });
  registerRoute('notes', () => { renderSidebarSafe('notes'); safeRender(renderNotes, 'notes'); });
  registerRoute('calendar', () => { renderSidebarSafe('calendar'); safeRender(renderCalendar, 'calendar'); });
  registerRoute('settings', () => { renderSidebarSafe('settings'); safeRender(renderSettings, 'settings'); });
  setNotFound(() => navigate('dashboard'));
}

function renderSidebarSafe(route) {
  try { renderSidebar(route); } catch (err) { console.error('[nexus] sidebar render failure', err); }
}

function rerenderCurrentRoute() {
  const route = getCurrentRoute() || 'dashboard';
  const map = {
    dashboard: renderDashboard,
    projects: renderKanban,
    calendar: renderCalendar,
    settings: renderSettings,
  };
  const fn = map[route];
  if (fn) safeRender(fn, route);
}

function wireChrome() {
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => shell.classList.add('mobile-open'));
  document.getElementById('scrim')?.addEventListener('click', () => shell.classList.remove('mobile-open'));

  if (store.state.settings.sidebarCollapsed) shell.classList.add('sidebar-collapsed');

  window.addEventListener('nexus:relanguage', () => {
    renderSidebarSafe(getCurrentRoute() || 'dashboard');
    rerenderCurrentRoute();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.state.settings.theme === 'system') applyTheme();
  });
}

function wireStoreSubscription() {
  // Data created/edited through shared components (e.g. the task
  // modal opened from Dashboard or Calendar) should be reflected
  // back on whichever view is currently showing. Notes manage their
  // own incremental re-render to protect editor focus during
  // autosave, so we skip full re-renders on that reason.
  const debounced = debounce(() => rerenderCurrentRoute(), 60);
  store.subscribe((_state, reason) => {
    if (reason === 'notes') return;
    debounced();
  });
}

function boot() {
  applyTheme();
  registerRoutes();
  wireChrome();
  wireStoreSubscription();
  startRouter();
}

boot();
