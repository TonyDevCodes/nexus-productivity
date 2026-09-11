// ============================================================
// i18n.js — minimal translation dictionary (EN + SQ)
// ============================================================

export const DICT = {
  en: {
    dashboard: 'Dashboard', projects: 'Projects', notes: 'Notes',
    calendar: 'Calendar', settings: 'Settings',
    total_tasks: 'Total tasks', completed_today: 'Completed today',
    overdue: 'Overdue', productivity: 'Productivity score',
    last_7_days: 'Completed — last 7 days', top_priority: 'Top priority tasks',
    quick_add_placeholder: 'Add a task and press Enter…',
    new_project: 'New project', todo: 'To do', in_progress: 'In progress', done: 'Done',
    search_placeholder: 'Search tasks across all projects…',
    all: 'All', low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
    bulk_complete: 'Mark completed', bulk_delete: 'Delete selected',
    selected: 'selected', new_note: 'New note', pinned: 'Pinned',
    autosaved: 'Autosaved', theme: 'Appearance', language: 'Language',
    danger_zone: 'Danger zone', reset_all: 'Reset all data', backup: 'Backup',
    export_data: 'Export JSON', import_data: 'Import JSON',
    no_tasks: 'No tasks yet', no_tasks_desc: 'Add your first task to get moving.',
    no_notes: 'No notes yet', no_notes_desc: 'Capture your first idea.',
    no_projects: 'No projects yet', no_projects_desc: 'Create a project to start organizing work.',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', close: 'Close',
    title: 'Title', description: 'Description', priority: 'Priority', due_date: 'Due date',
    tags: 'Tags', subtasks: 'Subtasks', estimated_time: 'Estimated time (min)',
    add_subtask: 'Add subtask', create: 'Create', project: 'Project',
  },
  sq: {
    dashboard: 'Paneli', projects: 'Projektet', notes: 'Shënime',
    calendar: 'Kalendari', settings: 'Cilësimet',
    total_tasks: 'Totali i detyrave', completed_today: 'Përfunduar sot',
    overdue: 'Vonuar', productivity: 'Rezultati i produktivitetit',
    last_7_days: 'Përfunduar — 7 ditët e fundit', top_priority: 'Detyrat me prioritet të lartë',
    quick_add_placeholder: 'Shto një detyrë dhe shtyp Enter…',
    new_project: 'Projekt i ri', todo: 'Për të bërë', in_progress: 'Në proces', done: 'Përfunduar',
    search_placeholder: 'Kërko detyra në të gjitha projektet…',
    all: 'Të gjitha', low: 'E ulët', medium: 'Mesatare', high: 'E lartë', urgent: 'Urgjente',
    bulk_complete: 'Shëno si përfunduar', bulk_delete: 'Fshi të zgjedhurat',
    selected: 'të zgjedhura', new_note: 'Shënim i ri', pinned: 'Të fiksuara',
    autosaved: 'U ruajt automatikisht', theme: 'Pamja', language: 'Gjuha',
    danger_zone: 'Zona e rrezikshme', reset_all: 'Rivendos të gjitha të dhënat', backup: 'Rezervë',
    export_data: 'Eksporto JSON', import_data: 'Importo JSON',
    no_tasks: 'Ende pa detyra', no_tasks_desc: 'Shto detyrën tënde të parë për të filluar.',
    no_notes: 'Ende pa shënime', no_notes_desc: 'Kap idenë tënde të parë.',
    no_projects: 'Ende pa projekte', no_projects_desc: 'Krijo një projekt për të organizuar punën.',
    save: 'Ruaj', cancel: 'Anulo', delete: 'Fshi', edit: 'Ndrysho', close: 'Mbyll',
    title: 'Titulli', description: 'Përshkrimi', priority: 'Prioriteti', due_date: 'Afati',
    tags: 'Etiketat', subtasks: 'Nën-detyra', estimated_time: 'Koha e vlerësuar (min)',
    add_subtask: 'Shto nën-detyrë', create: 'Krijo', project: 'Projekti',
  },
};

export function t(key, lang = 'en') {
  return (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
}
