// ============================================================
// date.js — date formatting and calendar-grid math
// ============================================================

export function todayISO() {
  return toISODate(new Date());
}

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSameDay(isoA, isoB) {
  return isoA === isoB;
}

export function isOverdue(isoDate, done) {
  if (!isoDate || done) return false;
  return isoDate < todayISO();
}

export function isDueToday(isoDate) {
  return isoDate === todayISO();
}

export function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

export function formatShort(iso, locale = 'en-US') {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale === 'sq' ? 'sq-AL' : 'en-US', { month: 'short', day: 'numeric' });
}

export function formatFull(iso, locale = 'en-US') {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(locale === 'sq' ? 'sq-AL' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function monthLabel(year, month, locale = 'en-US') {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString(locale === 'sq' ? 'sq-AL' : 'en-US', { month: 'long', year: 'numeric' });
}

// Builds a 6-week (42 cell) grid for the given year/month (0-indexed month),
// each cell = { date: Date, iso: string, inMonth: boolean }
export function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  // convert JS Sunday(0)-first to Monday-first index
  const firstDow = (firstOfMonth.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstDow);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({
      date: d,
      iso: toISODate(d),
      inMonth: d.getMonth() === month,
    });
  }
  return cells;
}

export function lastNDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(daysAgoISO(i));
  return out;
}
