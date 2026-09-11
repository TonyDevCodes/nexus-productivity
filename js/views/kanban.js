// ============================================================
// kanban.js — projects + drag & drop kanban board
// ============================================================

import { store } from '../store.js';
import { t } from '../utils/i18n.js';
import { escapeHtml, debounce } from '../utils/helpers.js';
import { emptyStateHTML } from '../components/state.js';
import { taskCardHTML } from '../components/taskCard.js';
import { openTaskModal } from '../components/taskModal.js';
import { openModal, closeModal, confirmDialog } from '../components/modal.js';
import { toast } from '../components/toast.js';

const COLUMNS = [
  ['todo', 'todo'],
  ['in_progress', 'in_progress'],
  ['done', 'done'],
];

let uiState = {
  activeProjectId: null,
  search: '',
  priorityFilter: 'all',
  selected: new Set(),
  sortables: [],
};

export function renderKanban(root) {
  const lang = store.state.settings.lang;
  const projects = store.state.projects;

  if (!uiState.activeProjectId || !projects.find(p => p.id === uiState.activeProjectId)) {
    uiState.activeProjectId = projects[0]?.id || null;
  }

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Workflow</div>
        <h1>${t('projects', lang)}</h1>
      </div>
      <button class="btn btn-primary" id="add-task-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        New task
      </button>
    </div>

    <div class="project-tabs" id="project-tabs"></div>

    ${projects.length === 0 ? emptyStateHTML(t('no_projects', lang), t('no_projects_desc', lang), `<button class="btn btn-primary btn-sm" id="empty-new-project">${t('new_project', lang)}</button>`) : renderBoardShell(lang)}
  `;

  renderProjectTabs(root);

  if (projects.length === 0) {
    root.querySelector('#empty-new-project')?.addEventListener('click', () => openProjectModal());
    return;
  }

  root.querySelector('#add-task-btn').addEventListener('click', () => openTaskModal({ projectId: uiState.activeProjectId }));

  wireToolbar(root);
  renderBoard(root);
}

function renderBoardShell(lang) {
  return `
    <div class="kanban-toolbar">
      <input class="input" id="kanban-search" type="search" placeholder="${t('search_placeholder', lang)}" value="${escapeHtml(uiState.search)}" style="max-width:280px">
      <div class="filter-bar" id="priority-filters" style="margin-bottom:0">
        ${['all', 'low', 'medium', 'high', 'urgent'].map(p => `<button class="filter-chip ${uiState.priorityFilter === p ? 'active' : ''}" data-priority="${p}">${t(p, lang)}</button>`).join('')}
      </div>
    </div>
    <div id="bulk-bar-wrap"></div>
    <div class="kanban-board" id="kanban-board"></div>
  `;
}

function renderProjectTabs(root) {
  const wrap = root.querySelector('#project-tabs');
  if (!wrap) return;
  wrap.innerHTML = `
    ${store.state.projects.map(p => `
      <button class="project-tab ${uiState.activeProjectId === p.id ? 'active' : ''}" data-project-id="${p.id}">
        <span class="dot" style="background:${p.color}"></span>${escapeHtml(p.name)}
      </button>
    `).join('')}
    <button class="project-tab project-tab-add" id="new-project-tab">+ ${t('new_project', lang_())}</button>
  `;
  wrap.querySelectorAll('[data-project-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      uiState.activeProjectId = btn.dataset.projectId;
      uiState.selected.clear();
      renderKanban(document.getElementById('view-root'));
    });
    btn.addEventListener('dblclick', () => {
      const project = store.state.projects.find(p => p.id === btn.dataset.projectId);
      openProjectModal(project);
    });
  });
  wrap.querySelector('#new-project-tab').addEventListener('click', () => openProjectModal());
}

function lang_() { return store.state.settings.lang; }

function wireToolbar(root) {
  const searchInput = root.querySelector('#kanban-search');
  const debounced = debounce((val) => { uiState.search = val; renderBoard(root); }, 200);
  searchInput.addEventListener('input', (e) => debounced(e.target.value));

  root.querySelectorAll('#priority-filters [data-priority]').forEach(btn => {
    btn.addEventListener('click', () => {
      uiState.priorityFilter = btn.dataset.priority;
      root.querySelectorAll('#priority-filters .filter-chip').forEach(b => b.classList.toggle('active', b === btn));
      renderBoard(root);
    });
  });
}

function filteredTasks(projectId) {
  const q = uiState.search.trim().toLowerCase();
  return store.state.tasks.filter(tsk => {
    if (tsk.projectId !== projectId) return false;
    if (uiState.priorityFilter !== 'all' && tsk.priority !== uiState.priorityFilter) return false;
    if (q && !(tsk.title.toLowerCase().includes(q) || tsk.description.toLowerCase().includes(q) || tsk.tags.some(tg => tg.toLowerCase().includes(q)))) return false;
    return true;
  });
}

function renderBoard(root) {
  const board = root.querySelector('#kanban-board');
  if (!board) return;
  uiState.sortables.forEach(s => s.destroy?.());
  uiState.sortables = [];

  const tasks = filteredTasks(uiState.activeProjectId);
  const lang = store.state.settings.lang;

  board.innerHTML = COLUMNS.map(([status, key]) => {
    const colTasks = tasks.filter(tk => tk.status === status);
    return `
      <div class="kanban-col">
        <div class="kanban-col__head">
          <span class="kanban-col__title">${t(key, lang)} <span class="kanban-col__count">${colTasks.length}</span></span>
        </div>
        <div class="kanban-col__body" data-status="${status}" role="list">
          ${colTasks.length ? colTasks.map(tk => taskCardHTML(tk, { selectable: true, selected: uiState.selected.has(tk.id) })).join('') : `<p style="color:var(--text-muted);font-size:var(--fs-xs);text-align:center;padding:16px 0">—</p>`}
        </div>
      </div>
    `;
  }).join('');

  renderBulkBar(root);
  wireCards(root);
  wireDragDrop(root);
}

function renderBulkBar(root) {
  const wrap = root.querySelector('#bulk-bar-wrap');
  if (!wrap) return;
  const lang = store.state.settings.lang;
  if (uiState.selected.size === 0) { wrap.innerHTML = ''; return; }
  wrap.innerHTML = `
    <div class="bulk-bar">
      <strong>${uiState.selected.size}</strong> ${t('selected', lang)}
      <button class="btn btn-secondary btn-sm" id="bulk-complete">${t('bulk_complete', lang)}</button>
      <button class="btn btn-danger btn-sm" id="bulk-delete">${t('bulk_delete', lang)}</button>
      <button class="btn btn-ghost btn-sm" id="bulk-clear" style="margin-left:auto">Clear</button>
    </div>
  `;
  wrap.querySelector('#bulk-complete').addEventListener('click', () => {
    store.completeTasks([...uiState.selected]);
    uiState.selected.clear();
    toast('Tasks marked as completed', 'success');
    renderBoard(document.getElementById('view-root'));
  });
  wrap.querySelector('#bulk-delete').addEventListener('click', async () => {
    const ok = await confirmDialog({ title: 'Delete tasks', message: `Delete ${uiState.selected.size} selected task(s)? This can't be undone.` });
    if (ok) {
      store.deleteTasks([...uiState.selected]);
      uiState.selected.clear();
      toast('Tasks deleted', 'success');
      renderBoard(document.getElementById('view-root'));
    }
  });
  wrap.querySelector('#bulk-clear').addEventListener('click', () => {
    uiState.selected.clear();
    renderBoard(document.getElementById('view-root'));
  });
}

function wireCards(root) {
  root.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-select-task]')) return;
      const task = store.state.tasks.find(t => t.id === card.dataset.taskId);
      if (task) openTaskModal({ task });
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') card.click();
    });
    card.querySelector('[data-select-task]')?.addEventListener('change', (e) => {
      const id = card.dataset.taskId;
      if (e.target.checked) uiState.selected.add(id); else uiState.selected.delete(id);
      renderBulkBar(root);
    });
  });
}

function wireDragDrop(root) {
  root.querySelectorAll('.kanban-col__body').forEach(colEl => {
    if (typeof Sortable === 'undefined') return;
    const s = new Sortable(colEl, {
      group: 'kanban',
      animation: 180,
      ghostClass: 'dragging',
      onAdd: (evt) => {
        const taskId = evt.item.dataset.taskId;
        const status = evt.to.dataset.status;
        store.moveTask(taskId, status);
        toast('Task moved', 'success', 1600);
      },
      onStart: () => colEl.classList.add('drag-over'),
      onEnd: () => root.querySelectorAll('.kanban-col__body').forEach(c => c.classList.remove('drag-over')),
    });
    uiState.sortables.push(s);
  });
}

// ---------------- project modal ----------------
function openProjectModal(project = null) {
  const lang = store.state.settings.lang;
  const isEdit = !!project;
  openModal({
    title: isEdit ? 'Edit project' : t('new_project', lang),
    bodyHtml: `
      <div class="field">
        <label for="pf-name">${t('title', lang)}</label>
        <input class="input" id="pf-name" type="text" value="${escapeHtml(project?.name || '')}" placeholder="e.g. Website Redesign">
      </div>
      <div class="field">
        <label>Color</label>
        <div class="tag-select-list" id="pf-colors">
          ${['#4FD1E8', '#F2A83D', '#34D399', '#8B7CF6', '#F0555F', '#F2794A'].map(c => `<button type="button" class="tag-option" data-color="${c}" style="background:${c}22;border-color:${(project?.color || '#4FD1E8') === c ? c : 'var(--border)'};color:${c}"></button>`).join('')}
        </div>
      </div>
    `,
    footHtml: `
      ${isEdit ? '<button class="btn btn-danger" id="pf-delete" style="margin-right:auto">' + t('delete', lang) + '</button>' : ''}
      <button class="btn btn-secondary" data-cancel>${t('cancel', lang)}</button>
      <button class="btn btn-primary" id="pf-save">${t('save', lang)}</button>
    `,
    onMount: (overlay) => {
      let color = project?.color || '#4FD1E8';
      overlay.querySelectorAll('[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
          color = btn.dataset.color;
          overlay.querySelectorAll('[data-color]').forEach(b => b.style.borderColor = 'var(--border)');
          btn.style.borderColor = color;
        });
      });
      overlay.querySelector('[data-cancel]').addEventListener('click', () => closeModal());
      overlay.querySelector('#pf-save').addEventListener('click', () => {
        const name = overlay.querySelector('#pf-name').value.trim();
        if (!name) { toast('Project name is required', 'error'); return; }
        if (isEdit) {
          store.updateProject(project.id, { name, color });
          toast('Project updated', 'success');
        } else {
          const p = store.addProject(name, color);
          uiState.activeProjectId = p.id;
          toast('Project created', 'success');
        }
        closeModal();
        renderKanban(document.getElementById('view-root'));
      });
      if (isEdit) {
        overlay.querySelector('#pf-delete').addEventListener('click', async () => {
          const ok = await confirmDialog({ title: 'Delete project', message: `Delete "${project.name}" and all its tasks? This can't be undone.` });
          if (ok) {
            store.deleteProject(project.id);
            uiState.activeProjectId = null;
            toast('Project deleted', 'success');
            closeModal();
            renderKanban(document.getElementById('view-root'));
          }
        });
      }
    },
  });
}

export function refreshKanbanIfActive() {
  const root = document.getElementById('view-root');
  if (root && root.querySelector('#kanban-board')) renderBoard(root);
}
