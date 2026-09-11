// ============================================================
// taskModal.js — create / edit task form, shared across views
// ============================================================

import { store } from '../store.js';
import { openModal, closeModal, confirmDialog } from './modal.js';
import { toast } from './toast.js';
import { uid, escapeHtml } from '../utils/helpers.js';
import { t } from '../utils/i18n.js';

export function openTaskModal({ task = null, projectId = null, defaultStatus = 'todo', defaultDueDate = '' } = {}) {
  const lang = store.state.settings.lang;
  const isEdit = !!task;
  const projects = store.state.projects;
  const allTags = store.allTags;

  let subtasks = task ? task.subtasks.map(s => ({ ...s })) : [];
  let selectedTags = new Set(task ? task.tags : []);

  const bodyHtml = `
    <div class="field">
      <label for="tf-title">${t('title', lang)}</label>
      <input class="input" id="tf-title" type="text" value="${escapeHtml(task?.title || '')}" placeholder="e.g. Send Q3 report" required>
    </div>
    <div class="field">
      <label for="tf-desc">${t('description', lang)}</label>
      <textarea class="textarea" id="tf-desc" rows="3" placeholder="Details…">${escapeHtml(task?.description || '')}</textarea>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="tf-project">${t('project', lang)}</label>
        <select class="select" id="tf-project">
          ${projects.map(p => `<option value="${p.id}" ${((task?.projectId || projectId) === p.id) ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="tf-priority">${t('priority', lang)}</label>
        <select class="select" id="tf-priority">
          ${['low', 'medium', 'high', 'urgent'].map(p => `<option value="${p}" ${task?.priority === p || (!task && p === 'medium') ? 'selected' : ''}>${t(p, lang)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="tf-due">${t('due_date', lang)}</label>
        <input class="input" id="tf-due" type="date" value="${task?.dueDate || defaultDueDate || ''}">
      </div>
      <div class="field">
        <label for="tf-est">${t('estimated_time', lang)}</label>
        <input class="input" id="tf-est" type="number" min="0" step="5" value="${task?.estimatedTime || ''}" placeholder="60">
      </div>
    </div>
    <div class="field">
      <label>${t('tags', lang)}</label>
      <div class="tag-select-list" id="tf-tags">
        ${allTags.map(tag => `<button type="button" class="tag-option ${selectedTags.has(tag) ? 'selected' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join('')}
        <button type="button" class="tag-option" id="tf-new-tag" style="border-style:dashed">+ new</button>
      </div>
    </div>
    <div class="field">
      <label>${t('subtasks', lang)}</label>
      <div id="tf-subtasks"></div>
      <button type="button" class="btn btn-ghost btn-sm" id="tf-add-subtask" style="margin-top:6px;align-self:flex-start">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        ${t('add_subtask', lang)}
      </button>
    </div>
  `;

  const footHtml = `
    ${isEdit ? '<button class="btn btn-danger" id="tf-delete" style="margin-right:auto">' + t('delete', lang) + '</button>' : ''}
    <button class="btn btn-secondary" data-cancel>${t('cancel', lang)}</button>
    <button class="btn btn-primary" id="tf-save">${isEdit ? t('save', lang) : t('create', lang)}</button>
  `;

  openModal({
    title: isEdit ? t('edit', lang) + ' task' : 'New task',
    bodyHtml,
    footHtml,
    onMount: (overlay) => {
      const subtaskList = overlay.querySelector('#tf-subtasks');

      function renderSubtasks() {
        subtaskList.innerHTML = subtasks.map(s => `
          <div class="subtask-row" data-id="${s.id}">
            <input type="checkbox" ${s.done ? 'checked' : ''} data-sub-toggle>
            <input type="text" class="input" value="${escapeHtml(s.text)}" data-sub-text>
            <button type="button" class="btn btn-icon btn-ghost btn-sm" data-sub-remove aria-label="Remove subtask">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        `).join('') || `<p style="color:var(--text-muted);font-size:var(--fs-xs)">No subtasks yet.</p>`;

        subtaskList.querySelectorAll('[data-sub-toggle]').forEach(cb => {
          cb.addEventListener('change', (e) => {
            const id = e.target.closest('[data-id]').dataset.id;
            subtasks = subtasks.map(s => s.id === id ? { ...s, done: e.target.checked } : s);
          });
        });
        subtaskList.querySelectorAll('[data-sub-text]').forEach(inp => {
          inp.addEventListener('input', (e) => {
            const id = e.target.closest('[data-id]').dataset.id;
            const s = subtasks.find(s => s.id === id);
            if (s) s.text = e.target.value;
          });
        });
        subtaskList.querySelectorAll('[data-sub-remove]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = e.target.closest('[data-id]').dataset.id;
            subtasks = subtasks.filter(s => s.id !== id);
            renderSubtasks();
          });
        });
      }
      renderSubtasks();

      overlay.querySelector('#tf-add-subtask').addEventListener('click', () => {
        subtasks.push({ id: uid('sub'), text: '', done: false });
        renderSubtasks();
        subtaskList.querySelector('[data-sub-text]:last-of-type')?.focus();
      });

      const tagWrap = overlay.querySelector('#tf-tags');
      tagWrap.querySelectorAll('.tag-option[data-tag]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tag = btn.dataset.tag;
          if (selectedTags.has(tag)) selectedTags.delete(tag); else selectedTags.add(tag);
          btn.classList.toggle('selected');
        });
      });
      overlay.querySelector('#tf-new-tag').addEventListener('click', () => {
        const name = prompt('New tag name:');
        if (!name) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        selectedTags.add(trimmed);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tag-option selected';
        btn.dataset.tag = trimmed;
        btn.textContent = trimmed;
        btn.addEventListener('click', () => {
          if (selectedTags.has(trimmed)) selectedTags.delete(trimmed); else selectedTags.add(trimmed);
          btn.classList.toggle('selected');
        });
        tagWrap.insertBefore(btn, overlay.querySelector('#tf-new-tag'));
      });

      overlay.querySelector('[data-cancel]').addEventListener('click', () => closeModal());

      overlay.querySelector('#tf-save').addEventListener('click', () => {
        const title = overlay.querySelector('#tf-title').value.trim();
        if (!title) {
          toast('Title is required', 'error');
          overlay.querySelector('#tf-title').focus();
          return;
        }
        const payload = {
          title,
          description: overlay.querySelector('#tf-desc').value.trim(),
          projectId: overlay.querySelector('#tf-project').value,
          priority: overlay.querySelector('#tf-priority').value,
          dueDate: overlay.querySelector('#tf-due').value,
          estimatedTime: overlay.querySelector('#tf-est').value ? Number(overlay.querySelector('#tf-est').value) : null,
          tags: [...selectedTags],
          subtasks: subtasks.filter(s => s.text.trim()),
        };
        if (isEdit) {
          store.updateTask(task.id, payload);
          toast('Task updated', 'success');
        } else {
          store.addTask({ ...payload, status: defaultStatus });
          toast('Task created', 'success');
        }
        closeModal();
      });

      if (isEdit) {
        overlay.querySelector('#tf-delete').addEventListener('click', async () => {
          const ok = await confirmDialog({ title: 'Delete task', message: `Delete "${task.title}"? This can't be undone.` });
          if (ok) {
            store.deleteTask(task.id);
            toast('Task deleted', 'success');
          }
        });
      }
    },
  });
}
