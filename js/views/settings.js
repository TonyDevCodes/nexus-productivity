// ============================================================
// settings.js — appearance, language, backup, danger zone
// ============================================================

import { store } from '../store.js';
import { t } from '../utils/i18n.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/modal.js';
import { exportStateAsFile, importStateFromFile } from '../utils/storage.js';
import { applyTheme } from '../app.js';

export function renderSettings(root) {
  const lang = store.state.settings.lang;
  const s = store.state.settings;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Configuration</div>
        <h1>${t('settings', lang)}</h1>
      </div>
    </div>

    <div class="settings-section card">
      <h2>${t('theme', lang)}</h2>
      <p class="settings-section__desc">Choose how Nexus looks on this device.</p>
      <div class="theme-options">
        ${['dark', 'light', 'system'].map(mode => `
          <div class="theme-option ${s.theme === mode ? 'active' : ''}" data-theme-option="${mode}">
            <div style="text-transform:capitalize;font-weight:600;font-size:var(--fs-sm)">${mode}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="settings-section card">
      <h2>${t('backup', lang)}</h2>
      <p class="settings-section__desc">Your data lives only in this browser. Export it regularly.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-secondary" id="export-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          ${t('export_data', lang)}
        </button>
        <button class="btn btn-secondary" id="import-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          ${t('import_data', lang)}
        </button>
        <input type="file" id="import-file" accept="application/json" style="display:none">
      </div>
    </div>

    <div class="settings-section card" style="border-color:color-mix(in srgb, var(--signal-red) 30%, var(--border))">
      <h2 style="color:var(--signal-red)">${t('danger_zone', lang)}</h2>
      <p class="settings-section__desc">Irreversible actions.</p>
      <button class="btn btn-danger" id="reset-btn">${t('reset_all', lang)}</button>
    </div>
  `;

  root.querySelectorAll('[data-theme-option]').forEach(opt => {
    opt.addEventListener('click', () => {
      const mode = opt.dataset.themeOption;
      store.updateSettings({ theme: mode });
      applyTheme();
      renderSettings(root);
      toast(`Theme set to ${mode}`, 'success');
    });
  });

  root.querySelector('#export-btn').addEventListener('click', () => {
    exportStateAsFile(store.state);
    toast('Backup exported', 'success');
  });

  const fileInput = root.querySelector('#import-file');
  root.querySelector('#import-btn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importStateFromFile(file);
      const ok = await confirmDialog({ title: 'Import backup', message: 'This will replace all current data with the imported file. Continue?', confirmLabel: 'Import' });
      if (ok) {
        store.replaceAll(data);
        applyTheme();
        toast('Backup imported', 'success');
        window.dispatchEvent(new CustomEvent('nexus:relanguage'));
      }
    } catch (err) {
      toast('Could not read that file — is it a valid Nexus backup?', 'error');
    }
    fileInput.value = '';
  });

  root.querySelector('#reset-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({ title: t('reset_all', lang), message: 'This permanently deletes all projects, tasks, notes and settings. This cannot be undone.', confirmLabel: t('reset_all', lang) });
    if (ok) {
      store.resetAll();
      applyTheme();
      toast('All data reset', 'success');
      window.dispatchEvent(new CustomEvent('nexus:relanguage'));
    }
  });
}
