// ============================================================
// state.js — empty / loading / error state block renderer
// ============================================================

const INBOX_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></svg>';
const ERROR_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>';

export function emptyStateHTML(title, desc, actionHtml = '') {
  return `
    <div class="state-block">
      ${INBOX_ICON}
      <h3>${title}</h3>
      <p>${desc}</p>
      ${actionHtml}
    </div>
  `;
}

export function errorStateHTML(title, desc) {
  return `
    <div class="state-block error">
      ${ERROR_ICON}
      <h3>${title}</h3>
      <p>${desc}</p>
    </div>
  `;
}

export function skeletonRows(n = 3, height = 64) {
  return Array.from({ length: n }).map(() => `<div class="skeleton" style="height:${height}px;margin-bottom:12px"></div>`).join('');
}
