// Line icons on a 24 grid, drawn for MODZ (DESIGN.md §4): round caps and joins, no fill.

export const ICONS = {
  pauseCircle: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  shieldCheck: '<path d="M12 3l7 2.8v5.4c0 4.4-2.9 8-7 9.8-4.1-1.8-7-5.4-7-9.8V5.8z"/><path d="m9 12.2 2.1 2.1 4-4.1"/>',
  bookmarkPlus: '<path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z"/><path d="M12 7.5v5.5M9.25 10.25h5.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2.2h7.4a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5s1.2-6.1 3.5-8.5z"/>',
  bulb: '<path d="M8.6 14.3a6 6 0 1 1 6.8 0c-.6.5-.9 1.1-.9 1.9v1.3h-5v-1.3c0-.8-.3-1.4-.9-1.9zM10 20.5h4"/>',
} as const
