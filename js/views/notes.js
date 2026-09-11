// ============================================================
// notes.js — markdown notes with folders, tags, pin, autosave
// ============================================================

import { store } from '../store.js';
import { t } from '../utils/i18n.js';
import { escapeHtml, truncate, debounce, renderMarkdown } from '../utils/helpers.js';
import { emptyStateHTML } from '../components/state.js';
import { toast } from '../components/toast.js';
import { confirmDialog } from '../components/modal.js';

let activeNoteId = null;
let searchQuery = '';

export function renderNotes(root) {
  const lang = store.state.settings.lang;
  const notes = store.state.notes;

  if (!activeNoteId && notes.length) activeNoteId = notes[0].id;
  if (activeNoteId && !notes.find(n => n.id === activeNoteId)) activeNoteId = notes[0]?.id || null;

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Knowledge base</div>
        <h1>${t('notes', lang)}</h1>
      </div>
      <button class="btn btn-primary" id="new-note-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        ${t('new_note', lang)}
      </button>
    </div>

    ${notes.length === 0 ? emptyStateHTML(t('no_notes', lang), t('no_notes_desc', lang)) : `
      <div class="notes-layout">
        <div class="notes-list">
          <div style="padding:12px;border-bottom:1px solid var(--border)">
            <input class="input" id="notes-search" type="search" placeholder="Search notes…" value="${escapeHtml(searchQuery)}">
          </div>
          <div id="notes-list-items"></div>
        </div>
        <div class="note-editor" id="note-editor"></div>
      </div>
    `}
  `;

  if (notes.length === 0) {
    root.querySelector('#new-note-btn').addEventListener('click', () => createNote(root));
    return;
  }

  root.querySelector('#new-note-btn').addEventListener('click', () => createNote(root));
  root.querySelector('#notes-search').addEventListener('input', debounce((e) => {
    searchQuery = e.target.value;
    renderList(root);
  }, 150));

  renderList(root);
  renderEditor(root);
}

function createNote(root) {
  const note = store.addNote({ title: 'Untitled note', content: '' });
  activeNoteId = note.id;
  renderNotes(root);
  setTimeout(() => root.querySelector('.note-editor__title-input')?.focus(), 0);
}

function filteredNotes() {
  const q = searchQuery.trim().toLowerCase();
  const notes = [...store.state.notes].sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
  if (!q) return notes;
  return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(tg => tg.toLowerCase().includes(q)));
}

function renderList(root) {
  const listEl = root.querySelector('#notes-list-items');
  if (!listEl) return;
  const notes = filteredNotes();
  listEl.innerHTML = notes.map(n => `
    <div class="notes-list__item ${n.id === activeNoteId ? 'active' : ''}" data-note-id="${n.id}">
      <div class="notes-list__title">${n.pinned ? '<span class="pin-star">★</span>' : ''} ${escapeHtml(n.title || 'Untitled')}</div>
      <div class="notes-list__snippet">${escapeHtml(truncate(n.content.replace(/[#*`>-]/g, ''), 60)) || 'Empty note'}</div>
    </div>
  `).join('') || `<p style="padding:16px;color:var(--text-muted);font-size:var(--fs-sm)">No matches.</p>`;

  listEl.querySelectorAll('[data-note-id]').forEach(item => {
    item.addEventListener('click', () => {
      activeNoteId = item.dataset.noteId;
      renderList(root);
      renderEditor(root);
    });
  });
}

function renderEditor(root) {
  const editorWrap = root.querySelector('#note-editor');
  if (!editorWrap) return;
  const note = store.state.notes.find(n => n.id === activeNoteId);
  if (!note) { editorWrap.innerHTML = ''; return; }

  editorWrap.innerHTML = `
    <div class="note-editor__toolbar">
      <input class="note-editor__title-input" id="note-title" value="${escapeHtml(note.title)}" placeholder="Untitled note">
      <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
        <span id="autosave-indicator" style="font-size:var(--fs-xs);color:var(--text-muted);font-family:var(--font-mono)"></span>
        <button class="btn btn-icon btn-ghost" id="pin-btn" aria-label="Pin note" title="Pin note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" style="color:${note.pinned ? 'var(--signal-amber)' : 'var(--text-muted)'}"><path d="m12 17-5 5V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16Z"/></svg>
        </button>
        <button class="btn btn-icon btn-ghost" id="delete-note-btn" aria-label="Delete note" title="Delete note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
        </button>
      </div>
    </div>
    <div style="display:flex;gap:8px;padding:0 16px 12px;flex-wrap:wrap;align-items:center;border-bottom:1px solid var(--border)">
      <input class="input" id="note-folder" style="max-width:160px" value="${escapeHtml(note.folder)}" placeholder="Folder">
      <input class="input" id="note-tags" style="max-width:240px" value="${escapeHtml(note.tags.join(', '))}" placeholder="tags, comma, separated">
    </div>
    <div class="note-editor__split">
      <div class="note-editor__pane raw"><textarea id="note-content" placeholder="Write in Markdown…">${escapeHtml(note.content)}</textarea></div>
      <div class="note-editor__pane preview markdown-body" id="note-preview">${renderMarkdown(note.content)}</div>
    </div>
  `;

  const save = debounce(() => {
    store.updateNote(note.id, {
      title: root.querySelector('#note-title').value.trim() || 'Untitled note',
      content: root.querySelector('#note-content').value,
      folder: root.querySelector('#note-folder').value.trim() || 'Inbox',
      tags: root.querySelector('#note-tags').value.split(',').map(x => x.trim()).filter(Boolean),
    });
    const ind = root.querySelector('#autosave-indicator');
    if (ind) { ind.textContent = t('autosaved', store.state.settings.lang); setTimeout(() => { if (ind) ind.textContent = ''; }, 1600); }
    renderList(root);
  }, 500);

  root.querySelector('#note-title').addEventListener('input', save);
  root.querySelector('#note-folder').addEventListener('input', save);
  root.querySelector('#note-tags').addEventListener('input', save);
  root.querySelector('#note-content').addEventListener('input', (e) => {
    root.querySelector('#note-preview').innerHTML = renderMarkdown(e.target.value);
    save();
  });

  root.querySelector('#pin-btn').addEventListener('click', () => {
    store.togglePinNote(note.id);
    renderList(root);
    renderEditor(root);
  });

  root.querySelector('#delete-note-btn').addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Delete note', message: `Delete "${note.title}"? This can't be undone.` });
    if (ok) {
      store.deleteNote(note.id);
      activeNoteId = null;
      toast('Note deleted', 'success');
      renderNotes(root);
    }
  });
}
