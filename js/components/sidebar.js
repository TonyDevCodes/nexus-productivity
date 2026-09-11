// ============================================================
// sidebar.js — fixed left navigation
// ============================================================

import { store } from '../store.js';
import { t } from '../utils/i18n.js';

const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/></svg>',
  notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><path d="M9 13h6M9 17h6"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>',
};

const ROUTES = [
  ['dashboard', 'dashboard'],
  ['projects', 'projects'],
  ['notes', 'notes'],
  ['calendar', 'calendar'],
  ['settings', 'settings'],
];

export function renderSidebar(activeRoute) {
  const { lang } = store.state.settings;
  const el = document.getElementById('sidebar');
  el.innerHTML = `
    <div class="sidebar__brand">
      <div class="sidebar__brand-mark"></div>
      <div class="sidebar__brand-name">NEXUS<span>.</span></div>
    </div>
    <nav class="sidebar__nav" aria-label="Primary">
      ${ROUTES.map(([route, key]) => `
        <a href="#/${route}" class="nav-item ${activeRoute === route ? 'active' : ''}" data-route="${route}" ${activeRoute === route ? 'aria-current="page"' : ''}>
          ${ICONS[route]}
          <span class="nav-item__label">${t(key, lang)}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sidebar__footer">
      <button class="sidebar-collapse-btn" id="collapse-btn" aria-label="Toggle sidebar width">
        ${ICONS.chevron}
      </button>
    </div>
  `;

  document.getElementById('collapse-btn').addEventListener('click', () => {
    const collapsed = !store.state.settings.sidebarCollapsed;
    store.updateSettings({ sidebarCollapsed: collapsed });
    document.getElementById('app-shell').classList.toggle('sidebar-collapsed', collapsed);
  });

  el.querySelectorAll('.nav-item').forEach(a => {
    a.addEventListener('click', () => {
      document.getElementById('app-shell').classList.remove('mobile-open');
    });
  });
}
