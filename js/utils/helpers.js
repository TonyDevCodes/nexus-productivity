// ============================================================
// helpers.js — small generic utilities used across the app
// ============================================================

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncate(str = '', n = 90) {
  return str.length > n ? str.slice(0, n).trim() + '…' : str;
}

export function classNames(...args) {
  return args.filter(Boolean).join(' ');
}

// Extremely small, dependency-free markdown → HTML converter.
// Covers headings, bold/italic, inline code, code fences, links,
// blockquotes, unordered/ordered lists and paragraphs — enough for
// day-to-day note taking without pulling in a full parser.
export function renderMarkdown(src = '') {
  let html = escapeHtml(src);

  // code fences first so their contents are not touched later
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');

  html = html.replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>');

  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // lists: group consecutive list lines
  const lines = html.split('\n');
  const out = [];
  let listType = null;
  for (const line of lines) {
    const ul = /^\s*[-*] (.*)$/.exec(line);
    const ol = /^\s*\d+\. (.*)$/.exec(line);
    if (ul) {
      if (listType !== 'ul') { if (listType) out.push(`</${listType}>`); out.push('<ul>'); listType = 'ul'; }
      out.push(`<li>${ul[1]}</li>`);
    } else if (ol) {
      if (listType !== 'ol') { if (listType) out.push(`</${listType}>`); out.push('<ol>'); listType = 'ol'; }
      out.push(`<li>${ol[1]}</li>`);
    } else {
      if (listType) { out.push(`</${listType}>`); listType = null; }
      out.push(line);
    }
  }
  if (listType) out.push(`</${listType}>`);
  html = out.join('\n');

  // paragraphs: wrap remaining bare lines
  html = html
    .split(/\n{2,}/)
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h\d|ul|ol|pre|blockquote)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');

  return html;
}
