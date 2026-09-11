// ============================================================
// dashboard.js — overview cards, activity chart, quick add
// ============================================================

import { store } from '../store.js';
import { t } from '../utils/i18n.js';
import { escapeHtml, uid } from '../utils/helpers.js';
import { lastNDays, formatShort, isOverdue } from '../utils/date.js';
import { emptyStateHTML } from '../components/state.js';
import { openTaskModal } from '../components/taskModal.js';
import { toast } from '../components/toast.js';

let chartInstance = null;

export function renderDashboard(root) {
  const lang = store.state.settings.lang;
  const s = store.state;
  const overdue = store.overdueTasks.length;
  const completedToday = store.completedTodayCount;
  const total = s.tasks.length;
  const score = store.productivityScore;

  const topPriority = s.tasks
    .filter(tk => tk.status !== 'done')
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
    .slice(0, 6);

  root.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">Mission control</div>
        <h1>${t('dashboard', lang)}</h1>
        <div class="page-head__sub">${new Date().toLocaleDateString(lang === 'sq' ? 'sq-AL' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      </div>
    </div>

    <div class="quick-add">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--signal-amber)" stroke-width="2" style="flex-shrink:0;margin-top:9px"><path d="M12 5v14M5 12h14"/></svg>
      <input class="input" id="quick-add-input" type="text" placeholder="${t('quick_add_placeholder', lang)}" aria-label="Quick add task">
      <button class="btn btn-primary btn-sm" id="quick-add-full">More options</button>
    </div>

    <div class="grid-stats">
      <div class="stat-card stat-card--cyan">
        <div class="stat-card__label">${t('total_tasks', lang)}</div>
        <div class="stat-card__value">${total}</div>
        <div class="stat-card__delta">${s.projects.length} project${s.projects.length === 1 ? '' : 's'}</div>
      </div>
      <div class="stat-card stat-card--green">
        <div class="stat-card__label">${t('completed_today', lang)}</div>
        <div class="stat-card__value">${completedToday}</div>
        <div class="stat-card__delta">keep the streak going</div>
      </div>
      <div class="stat-card stat-card--red">
        <div class="stat-card__label">${t('overdue', lang)}</div>
        <div class="stat-card__value">${overdue}</div>
        <div class="stat-card__delta">${overdue ? 'needs attention' : 'all clear'}</div>
      </div>
      <div class="stat-card stat-card--amber">
        <div class="stat-card__label">${t('productivity', lang)}</div>
        <div class="stat-card__value">${score}%</div>
        <div class="stat-card__delta">${score >= 70 ? 'strong pace' : score >= 40 ? 'steady' : 'ramping up'}</div>
      </div>
    </div>

    <div class="grid-2col">
      <div class="card chart-card">
        <div class="eyebrow" style="margin-bottom:12px">${t('last_7_days', lang)}</div>
        <canvas id="activity-chart" role="img" aria-label="Tasks completed in the last 7 days"></canvas>
      </div>
      <div class="card">
        <div class="eyebrow" style="margin-bottom:12px">${t('top_priority', lang)}</div>
        <div id="top-priority-list">
          ${topPriority.length ? topPriority.map(rowHTML).join('') : emptyStateHTML(t('no_tasks', lang), t('no_tasks_desc', lang))}
        </div>
      </div>
    </div>
  `;

  wireQuickAdd(root);
  wireTopList(root);
  drawChart();
}

function priorityRank(p) {
  return { urgent: 4, high: 3, medium: 2, low: 1 }[p] || 0;
}

function rowHTML(task) {
  const lang = store.state.settings.lang;
  const overdue = isOverdue(task.dueDate, task.status === 'done');
  return `
    <div class="priority-list-row" data-task-id="${task.id}" style="cursor:pointer">
      <span class="badge badge-${task.priority}" style="flex-shrink:0">${task.priority}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(task.title)}</span>
      ${task.dueDate ? `<span style="font-family:var(--font-mono);font-size:var(--fs-xs);color:${overdue ? 'var(--signal-red)' : 'var(--text-muted)'}">${formatShort(task.dueDate, lang)}</span>` : ''}
    </div>
  `;
}

function wireQuickAdd(root) {
  const input = root.querySelector('#quick-add-input');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      store.addTask({ title: input.value.trim() });
      toast('Task added', 'success');
      input.value = '';
      renderDashboard(root);
    }
  });
  root.querySelector('#quick-add-full').addEventListener('click', () => {
    openTaskModal({});
  });
}

function wireTopList(root) {
  root.querySelectorAll('#top-priority-list [data-task-id]').forEach(row => {
    row.addEventListener('click', () => {
      const task = store.state.tasks.find(t => t.id === row.dataset.taskId);
      if (task) openTaskModal({ task });
    });
  });
}

function drawChart() {
  const canvas = document.getElementById('activity-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const days = lastNDays(7);
  const counts = days.map(iso => store.state.tasks.filter(t => t.completedAt && new Date(t.completedAt).toISOString().slice(0, 10) === iso).length);
  const lang = store.state.settings.lang;
  const labels = days.map(d => formatShort(d, lang));

  const styles = getComputedStyle(document.documentElement);
  const amber = styles.getPropertyValue('--signal-amber').trim();
  const text = styles.getPropertyValue('--text-muted').trim();
  const grid = styles.getPropertyValue('--border').trim();

  chartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Completed',
        data: counts,
        backgroundColor: amber,
        borderRadius: 6,
        maxBarThickness: 34,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: text, font: { family: 'JetBrains Mono', size: 11 } } },
        y: { beginAtZero: true, ticks: { precision: 0, color: text }, grid: { color: grid } },
      },
    },
  });
}
