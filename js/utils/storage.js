// ============================================================
// storage.js — thin, safe wrapper around localStorage
// ============================================================

const KEY = 'nexus:data:v1';

export function loadState(defaults) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaults);
    const parsed = JSON.parse(raw);
    // shallow-merge so new fields introduced in later versions
    // don't break existing saved data
    return { ...structuredClone(defaults), ...parsed };
  } catch (err) {
    console.error('[nexus] failed to load state, falling back to defaults', err);
    return structuredClone(defaults);
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('[nexus] failed to persist state', err);
    return false;
  }
}

export function clearState() {
  localStorage.removeItem(KEY);
}

export function exportStateAsFile(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `nexus-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importStateFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
