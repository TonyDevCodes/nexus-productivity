// ============================================================
// calendar.js — month view with due-date tasks
// ============================================================

import { store } from '../store.js';
import { t } from '../utils/i18n.js';
import { escapeHtml } from '../utils/helpers.js';
import { buildMonthGrid, monthLabel, todayISO, formatFull } from '../utils/date.js';
import { openTaskModal } from '../components/taskModal.js';
import { openModal, closeModal } from '../components/modal.js';

let viewDate = new Date();

const DOW_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DOW_SQ = ['Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht', 'Die'];

export function renderCalendar(root) {
  const lang = store.state.settings.lang;
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const cells = buildMonthGrid(year, month);
  const today = todayISO();

  const tasksByDate = {};
  store.state.tasks.forEach(tk => {
    if (!tk.dueDate) return;
    (tasksByDate[tk.dueDate] ||= []).push(tk);
  });

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Timeline</div>
        <h1>${t('calendar', lang)}</h1>
      </div>
    </div>

    <div class="calendar-head">
      <div class="calendar-nav">
        <button class="btn btn-icon btn-secondary" id="cal-prev" aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <h2 style="font-size:var(--fs-lg);min-width:180px;text-align:center">${monthLabel(year, month, lang)}</h2>
        <button class="btn btn-icon btn-secondary" id="cal-next" aria-label="Next month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
      <button class="btn btn-secondary btn-sm" id="cal-today">Today</button>
    </div>

    <div class="calendar-grid">
      ${(lang === 'sq' ? DOW_SQ : DOW_EN).map(d => `<div class="calendar-dow">${d}</div>`).join('')}
      ${cells.map(cell => {
        const dayTasks = (tasksByDate[cell.iso] || []).sort((a, b) => (b.priority > a.priority ? 1 : -1));
        const visible = dayTasks.slice(0, 3);
        const overflow = dayTasks.length - visible.length;
        return `
          <div class="calendar-cell ${cell.inMonth ? '' : 'out'} ${cell.iso === today ? 'today' : ''}" data-date="${cell.iso}">
            <span class="calendar-cell__num ${dayTasks.length ? 'has-events' : ''}">${cell.date.getDate()}</span>
            ${visible.map(tk => `<div class="calendar-event priority-${tk.priority} ${tk.status === 'done' ? 'done' : ''}">${escapeHtml(tk.title)}</div>`).join('')}
            ${overflow > 0 ? `<div class="calendar-more">+${overflow} more</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  root.querySelector('#cal-prev').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar(root); });
  root.querySelector('#cal-next').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar(root); });
  root.querySelector('#cal-today').addEventListener('click', () => { viewDate = new Date(); renderCalendar(root); });

  root.querySelectorAll('.calendar-cell').forEach(cell => {
    cell.addEventListener('click', () => openDayDetail(cell.dataset.date, tasksByDate[cell.dataset.date] || []));
  });
}

function openDayDetail(iso, tasks) {
  const lang = store.state.settings.lang;
  openModal({
    title: formatFull(iso, lang),
    bodyHtml: `
      <div id="day-task-list">
        ${tasks.length ? tasks.map(tk => `
          <div class="priority-list-row" data-task-id="${tk.id}" style="cursor:pointer">
            <span class="badge badge-${tk.priority}">${tk.priority}</span>
            <span style="flex:1">${escapeHtml(tk.title)}</span>
            ${tk.status === 'done' ? '<span style="color:var(--signal-green);font-size:var(--fs-xs)">✓ done</span>' : ''}
          </div>
        `).join('') : `<p style="color:var(--text-muted);font-size:var(--fs-sm)">No tasks due this day yet.</p>`}
      </div>
    `,
    footHtml: `<button class="btn btn-primary" id="day-add-task">+ Add task for this day</button>`,
    onMount: (overlay) => {
      overlay.querySelectorAll('[data-task-id]').forEach(row => {
        row.addEventListener('click', () => {
          const task = store.state.tasks.find(t => t.id === row.dataset.taskId);
          closeModal();
          if (task) openTaskModal({ task });
        });
      });
      overlay.querySelector('#day-add-task').addEventListener('click', () => {
        closeModal();
        openTaskModal({ defaultDueDate: iso });
      });
    },
  });
}
