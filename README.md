# Nexus - Personal Productivity OS

A single-page productivity workspace - dashboard, Kanban projects, Markdown notes, and a calendar - built with **zero frameworks and zero build step**: vanilla HTML, CSS and JavaScript (ES Modules), running entirely in the browser with local-first data storage.

**Live demo:** https://nexus-productivity.pages.dev
*(Installable as a PWA - open the link on desktop or mobile and use "Add to Home Screen" / "Install app".)*

---

## Why no framework?

The brief called for a modular, senior-grade codebase without relying on React/Vue/build tooling. Rather than treat that as a constraint, it became the design principle: prove that clean architecture comes from *discipline*, not from a framework enforcing it.

- **ES Modules** (`import`/`export`) give the same separation of concerns a framework would (store / router / views / components) without a bundler.
- **No build step** means the entire app can be opened from a static file host - Cloudflare Pages, GitHub Pages, or a plain folder - with zero configuration.
- **A single central store** (`store.js`) is the only place state is mutated. Every view reads from it and calls its methods; nothing touches `localStorage` directly except the store itself.

## Architecture

```
nexus/
├── index.html              # shell: sidebar mount point, topbar, script tags
├── css/
│   ├── variables.css       # design tokens (color, type, spacing, motion)
│   ├── style.css           # layout, shell, responsive grid
│   └── components.css      # buttons, cards, kanban, modal, calendar, notes
├── js/
│   ├── app.js               # bootstraps theme, router, sidebar, store subscription
│   ├── router.js            # hash-based router (#/dashboard, #/projects, ...)
│   ├── store.js              # single source of truth + pub/sub + persistence
│   ├── utils/
│   │   ├── storage.js        # localStorage read/write + JSON export/import
│   │   ├── helpers.js        # id generation, debounce, tiny markdown parser
│   │   ├── date.js            # calendar-grid math, overdue/due-today logic
│   │   └── i18n.js            # EN/SQ dictionary
│   ├── components/            # sidebar, modal, toast, task card, task form
│   └── views/                 # dashboard, kanban, notes, calendar, settings
├── manifest.json            # PWA manifest
├── sw.js                     # service worker (offline app-shell caching)
└── assets/                   # generated icons (192px / 512px / favicon)
```

**Data flow:** a view calls a `store` method (e.g. `store.addTask(...)`) → the store mutates its in-memory state, persists it to `localStorage`, and notifies subscribers → `app.js`'s subscription re-renders the current route if the change came from a shared component (like the task modal opened from three different views). Notes are the one exception: their autosave re-renders only the sidebar list, never the editor itself, so a mid-sentence save never steals focus from the textarea.

## Feature summary

| Module | Highlights |
|---|---|
| **Dashboard** | Live stat cards (total / completed today / overdue / productivity score), a Chart.js 7-day completion graph, top-priority list, and an inline quick-add bar. |
| **Projects (Kanban)** | Unlimited projects, drag-and-drop between To Do / In Progress / Done (SortableJS), full task editor (priority, due date, tags, subtasks, estimate), live search + priority filters, multi-select bulk complete/delete. |
| **Notes** | Markdown editor with a live-rendering preview pane (dependency-free ~70-line parser — headings, bold/italic, code, links, lists, blockquotes), folders, tags, pin, autosave. |
| **Calendar** | Month grid built from raw date math (no date library), tasks plotted on their due date, day-detail modal, "add task for this day." |
| **Settings** | Dark / Light / System theme, full JSON export/import (portable backup), reset-all-data with confirmation. |

## Cross-cutting concerns

- **Accessibility:** visible focus rings, `aria-live` on the main view region, keyboard-operable cards and modals, `prefers-reduced-motion` respected.
- **Resilience:** every view renders inside a try/catch that falls back to a friendly error state rather than a blank screen; empty states guide the user to the first action instead of showing nothing.
- **Responsive:** single-column layouts and a slide-in sidebar below 920px; the Kanban board stacks vertically on mobile.
- **PWA:** manifest + service worker cache the app shell for offline load, and the icon set is generated (not stock) to match the visual identity.

## Design system

The visual identity is deliberately **not** the generic "AI-dashboard" look (warm cream + terracotta, or black + acid green). It leans into a *mission-control* aesthetic that matches what the app actually does - monitoring and directing work in progress:

- **Palette:** near-black graphite base (`#0B0E14`), amber signal accent for attention/priority, cyan for flow states, green for resolved, red for overdue - colors that map to *meaning* (priority/status), not decoration.
- **Type:** Space Grotesk (display) + Inter (body) + JetBrains Mono (dates, counts, ids) - a technical pairing that reinforces the "instrument panel" feel.
- **Signature detail:** cut-corner ("HUD notch") stat cards and a pulsing status dot on section eyebrows, echoing radar/telemetry displays without leaning on cliché numbered-step or terminal-window motifs.

## Known limitations

- Data is stored per-browser via `localStorage`; there is no server sync between devices (by design - the brief specified local-first storage with manual export/import as the backup mechanism).
- The Markdown renderer covers common syntax but is not a full CommonMark implementation - it was built intentionally small to keep the "zero dependencies" constraint honest.
