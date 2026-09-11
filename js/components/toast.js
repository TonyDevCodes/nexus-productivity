// ============================================================
// toast.js — lightweight toast notification system
// ============================================================

let root = null;

function ensureRoot() {
  if (!root) root = document.getElementById('toast-root');
  return root;
}

const ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
};

export function toast(message, type = 'info', duration = 3400) {
  const r = ensureRoot();
  if (!r) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <span style="width:18px;height:18px;flex-shrink:0;color:var(--signal-${type === 'success' ? 'green' : type === 'error' ? 'red' : type === 'warning' ? 'amber' : 'cyan'})">${ICONS[type] || ICONS.info}</span>
    <span>${message}</span>
  `;
  r.appendChild(el);
  const remove = () => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 220);
  };
  setTimeout(remove, duration);
  el.addEventListener('click', remove);
}
