// ============================================================
// store.js — the single central state container.
// Every view reads from here and mutates only through the
// methods below, which persist to localStorage and notify
// subscribers. No component talks to localStorage directly.
// ============================================================

import { loadState, saveState, clearState } from './utils/storage.js';
import { uid } from './utils/helpers.js';
import { todayISO } from './utils/date.js';

const DEFAULT_PROJECTS = [
  { id: 'proj_default', name: 'General', color: '#4FD1E8', createdAt: Date.now() },
];

const DEFAULTS = {
  projects: DEFAULT_PROJECTS,
  tasks: [],
  notes: [],
  settings: {
    theme: 'dark',       // dark | light | system
    lang: 'en',           // en | sq
    sidebarCollapsed: false,
  },
};

class Store {
  constructor() {
    this.state = loadState(DEFAULTS);
    this._listeners = new Set();
  }

  // ---------------- pub/sub ----------------
  subscribe(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  _emit(reason) {
    saveState(this.state);
    this._listeners.forEach(fn => fn(this.state, reason));
  }

  // ---------------- settings ----------------
  updateSettings(patch) {
    this.state.settings = { ...this.state.settings, ...patch };
    this._emit('settings');
  }

  // ---------------- projects ----------------
  addProject(name, color) {
    const project = { id: uid('proj'), name: name.trim() || 'Untitled', color: color || randomColor(), createdAt: Date.now() };
    this.state.projects.push(project);
    this._emit('projects');
    return project;
  }

  updateProject(id, patch) {
    const p = this.state.projects.find(p => p.id === id);
    if (!p) return;
    Object.assign(p, patch);
    this._emit('projects');
  }

  deleteProject(id) {
    this.state.projects = this.state.projects.filter(p => p.id !== id);
    this.state.tasks = this.state.tasks.filter(t => t.projectId !== id);
    this._emit('projects');
  }

  // ---------------- tasks ----------------
  addTask(data) {
    const task = {
      id: uid('task'),
      projectId: data.projectId || this.state.projects[0]?.id,
      title: data.title?.trim() || 'Untitled task',
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate || '',
      tags: data.tags || [],
      subtasks: data.subtasks || [],
      estimatedTime: data.estimatedTime || null,
      createdAt: Date.now(),
      completedAt: null,
    };
    this.state.tasks.unshift(task);
    this._emit('tasks');
    return task;
  }

  updateTask(id, patch) {
    const task = this.state.tasks.find(t => t.id === id);
    if (!task) return;
    const wasDone = task.status === 'done';
    Object.assign(task, patch);
    const isDone = task.status === 'done';
    if (!wasDone && isDone) task.completedAt = Date.now();
    if (wasDone && !isDone) task.completedAt = null;
    this._emit('tasks');
  }

  moveTask(id, status) {
    this.updateTask(id, { status });
  }

  deleteTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id);
    this._emit('tasks');
  }

  deleteTasks(ids) {
    const set = new Set(ids);
    this.state.tasks = this.state.tasks.filter(t => !set.has(t.id));
    this._emit('tasks');
  }

  completeTasks(ids) {
    const set = new Set(ids);
    this.state.tasks.forEach(t => {
      if (set.has(t.id) && t.status !== 'done') {
        t.status = 'done';
        t.completedAt = Date.now();
      }
    });
    this._emit('tasks');
  }

  toggleSubtask(taskId, subtaskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;
    const st = task.subtasks.find(s => s.id === subtaskId);
    if (!st) return;
    st.done = !st.done;
    this._emit('tasks');
  }

  // ---------------- notes ----------------
  addNote(data = {}) {
    const note = {
      id: uid('note'),
      title: data.title || 'Untitled note',
      content: data.content || '',
      folder: data.folder || 'Inbox',
      tags: data.tags || [],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.state.notes.unshift(note);
    this._emit('notes');
    return note;
  }

  updateNote(id, patch) {
    const note = this.state.notes.find(n => n.id === id);
    if (!note) return;
    Object.assign(note, patch, { updatedAt: Date.now() });
    this._emit('notes');
  }

  deleteNote(id) {
    this.state.notes = this.state.notes.filter(n => n.id !== id);
    this._emit('notes');
  }

  togglePinNote(id) {
    const note = this.state.notes.find(n => n.id === id);
    if (!note) return;
    note.pinned = !note.pinned;
    this._emit('notes');
  }

  // ---------------- derived / selectors ----------------
  get allTags() {
    const s = new Set();
    this.state.tasks.forEach(t => t.tags.forEach(tag => s.add(tag)));
    return [...s];
  }

  tasksForProject(projectId) {
    return this.state.tasks.filter(t => t.projectId === projectId);
  }

  get overdueTasks() {
    const today = todayISO();
    return this.state.tasks.filter(t => t.dueDate && t.dueDate < today && t.status !== 'done');
  }

  get completedTodayCount() {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return this.state.tasks.filter(t => t.completedAt && t.completedAt >= start.getTime()).length;
  }

  get productivityScore() {
    const total = this.state.tasks.length;
    if (!total) return 0;
    const done = this.state.tasks.filter(t => t.status === 'done').length;
    const overdue = this.overdueTasks.length;
    const raw = (done / total) * 100 - overdue * 2;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  // ---------------- backup ----------------
  replaceAll(newState) {
    this.state = { ...DEFAULTS, ...newState };
    this._emit('all');
  }

  resetAll() {
    clearState();
    this.state = structuredClone(DEFAULTS);
    this._emit('all');
  }
}

function randomColor() {
  const palette = ['#4FD1E8', '#F2A83D', '#34D399', '#8B7CF6', '#F0555F', '#F2794A'];
  return palette[Math.floor(Math.random() * palette.length)];
}

export const store = new Store();
