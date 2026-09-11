// ============================================================
// modal.js — generic modal dialog with basic focus management
// ============================================================

let activeOverlay = null;
let lastFocused = null;

export function openModal({ title, bodyHtml, footHtml = '', onMount, onClose, wide = false }) {
  closeModal();
  lastFocused = document.activeElement;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="${wide ? 'max-width:720px' : ''}">
      <div class="modal__head">
        <h3 id="modal-title">${title}</h3>
        <button class="modal-close" aria-label="Close" data-close>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal__body">${bodyHtml}</div>
      ${footHtml ? `<div class="modal__foot">${footHtml}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  activeOverlay = overlay;

  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeModal(); });
  overlay.querySelector('[data-close]').addEventListener('click', () => closeModal());

  const escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
  document.addEventListener('keydown', escHandler);
  overlay._escHandler = escHandler;
  overlay._onClose = onClose;

  const focusable = overlay.querySelector('input, textarea, select, button');
  if (focusable) focusable.focus();

  if (onMount) onMount(overlay);
  return overlay;
}

export function closeModal() {
  if (!activeOverlay) return;
  document.removeEventListener('keydown', activeOverlay._escHandler);
  if (activeOverlay._onClose) activeOverlay._onClose();
  activeOverlay.remove();
  document.body.style.overflow = '';
  activeOverlay = null;
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

export function confirmDialog({ title, message, confirmLabel = 'Delete', danger = true }) {
  return new Promise((resolve) => {
    // closeModal() always fires onClose, regardless of which button
    // triggered it. Guard so the explicit confirm/cancel answer always
    // wins over that generic fallback (a Promise only honors the first
    // resolve() call, so order matters here).
    let settled = false;
    const settle = (value) => { if (!settled) { settled = true; resolve(value); } };

    openModal({
      title,
      bodyHtml: `<p style="color:var(--text-secondary)">${message}</p>`,
      footHtml: `
        <button class="btn btn-secondary" data-cancel>Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm>${confirmLabel}</button>
      `,
      onMount: (overlay) => {
        overlay.querySelector('[data-cancel]').addEventListener('click', () => { settle(false); closeModal(); });
        overlay.querySelector('[data-confirm]').addEventListener('click', () => { settle(true); closeModal(); });
      },
      onClose: () => settle(false),
    });
  });
}
