// ============================================================
// taskCard.js — renders a single task card (Kanban)
// ============================================================

import { store } from '../store.js';
import { escapeHtml } from '../utils/helpers.js';
import { formatShort, isOverdue } from '../utils/date.js';

const CLOCK_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';

export function taskCardHTML(task, { selectable = false, selected = false } = {}) {
  const lang = store.state.settings.lang;
  const overdue = isOverdue(task.dueDate, task.status === 'done');
  const doneSubtasks = task.subtasks.filter(s => s.done).length;

  return `
    <div class="task-card priority-${task.priority}" draggable="true" data-task-id="${task.id}" tabindex="0" role="button" aria-label="${escapeHtml(task.title)}">
      <div class="task-card__top">
        <div style="display:flex;align-items:flex-start;gap:6px;flex:1;min-width:0">
          ${selectable ? `<input type="checkbox" class="task-card__select" data-select-task ${selected ? 'checked' : ''} aria-label="Select task">` : ''}
          <span class="task-card__title ${task.status === 'done' ? 'done' : ''}">${escapeHtml(task.title)}</span>
        </div>
      </div>
      <div class="task-card__meta">
        <span class="badge badge-${task.priority}">${task.priority}</span>
        ${task.dueDate ? `<span class="task-card__due ${overdue ? 'overdue' : ''}">${CLOCK_ICON} ${formatShort(task.dueDate, lang)}</span>` : ''}
        ${task.estimatedTime ? `<span class="task-card__due">${task.estimatedTime}m</span>` : ''}
      </div>
      ${task.tags.length ? `<div class="task-card__tags">${task.tags.slice(0, 4).map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
      ${task.subtasks.length ? `<div class="task-card__progress">☑ ${doneSubtasks}/${task.subtasks.length} subtasks</div>` : ''}
    </div>
  `;
}
