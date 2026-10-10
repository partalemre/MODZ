// MODZ kit — icons. Original drawings on a 24×24 grid, live area 3.5–20.5, stroked at
// 1.75 rendered px with round caps and joins (the builder scales the stroke with the size).
// `icon(name)` gives the path markup; `GLYPH` is the one-cell stand-in for the terminal.

export const ICON_GRID = 24

const PATHS = {
  trash: 'M4 6.5h16M9.5 6.5V5A1.5 1.5 0 0 1 11 3.5h2A1.5 1.5 0 0 1 14.5 5v1.5M6 6.5l.9 12.1a2 2 0 0 0 2 1.9h6.2a2 2 0 0 0 2-1.9L18 6.5M10 10.5v6M14 10.5v6',
  shield: 'M12 3.5l7 2.6v5.3c0 4.4-2.9 7.6-7 9.1-4.1-1.5-7-4.7-7-9.1V6.1zM9 12l2.2 2.2L15.2 10',
  key: 'M12 15a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM8 15h.01M10.9 12.1l8.6-8.6M16.5 6.5l2.2 2.2M13.9 9.1l1.7 1.7',
  eye: 'M3 12c2-3.8 5.1-6 9-6s7 2.2 9 6c-2 3.8-5.1 6-9 6s-7-2.2-9-6zM14.75 12a2.75 2.75 0 1 1-5.5 0 2.75 2.75 0 0 1 5.5 0z',
  pencil: 'M4.5 19.5l1-4.2L15.9 4.9a2.1 2.1 0 0 1 3 0l.2.2a2.1 2.1 0 0 1 0 3L8.7 18.5zM14 6.8l3.2 3.2',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  clock: 'M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0zM12 7.5V12l3 2',
  cube: 'M12 3.5l7.5 4.2v8.6L12 20.5l-7.5-4.2V7.7zM4.5 7.7L12 12l7.5-4.3M12 12v8.5',
  bookmark: 'M7.5 3.5h9a1.5 1.5 0 0 1 1.5 1.5v15.5l-6-4-6 4V5a1.5 1.5 0 0 1 1.5-1.5zM12 7.5v5M9.5 10h5',
  bulb: 'M8.6 14.3a6 6 0 1 1 6.8 0c-.6.5-.9 1.1-.9 1.9v1.3h-5v-1.3c0-.8-.3-1.4-.9-1.9zM10 20.5h4',
  play: 'M8.5 5.5v13l10-6.5z',
  pause: 'M9 5.5v13M15 5.5v13',
  folder: 'M3.5 7.5a2 2 0 0 1 2-2h3.8l2.2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM3.5 10.5h17',
  file: 'M6.5 3.5h7l4.5 4.5v10.5a2 2 0 0 1-2 2h-9.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2zM13.5 3.5v4.5H18M8.5 12.5h7M8.5 16h4.5',
  branch: 'M9 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM9 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 7.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 8v8M17 9.5c0 3.6-2.6 5-6 5.5-1.2.2-2 .7-2.5 1.6',
  terminal: 'M3.5 6.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2zM7.5 9.5l3 2.5-3 2.5M12.5 15h4',
  bell: 'M5.5 17h13l-1.5-2.2V11a5 5 0 0 0-10 0v3.8zM10.2 19.8a2 2 0 0 0 3.6 0M12 3.5V6',
  sparkle: 'M11 5.5c.6 4 3 6.4 7 7-4 .6-6.4 3-7 7-.6-4-3-6.4-7-7 4-.6 6.4-3 7-7zM18.5 3.5v3M17 5h3',
  list: 'M9.5 7h10M9.5 12h10M9.5 17h10M5 7h.01M5 12h.01M5 17h.01',
  flag: 'M5.5 20.5v-16M5.5 4.5h11.5l-2.5 4 2.5 4H5.5',
  bolt: 'M13.5 3.5L5.5 13.5h6l-1 7 8-10h-6z',
  gauge: 'M5.6 18.4a9 9 0 1 1 12.8 0M12 13.5l3.5-4.5M13 13.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z',
  rewind: 'M11.5 6.5v11L4 12zM20 6.5v11L12.5 12z',
  plug: 'M9 3.5v4M15 3.5v4M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0zM12 16v4.5',
} as const

export type IconName = keyof typeof PATHS

export const ICON_NAMES = Object.keys(PATHS) as IconName[]

// The path markup of an icon; the caller wraps it in a stroked, scaled group.
export const icon = (name: IconName): string => `<path d="${PATHS[name]}"/>`

// One terminal cell per icon, chosen from glyphs every common monospace font carries.
export const GLYPH: Record<IconName, string> = {
  trash: '⌫',
  shield: '◈',
  key: '⚷',
  eye: '◉',
  pencil: '✎',
  check: '✓',
  x: '✕',
  clock: '◷',
  cube: '▣',
  bookmark: '❏',
  bulb: '✧',
  play: '▸',
  pause: '‖',
  folder: '▤',
  file: '▢',
  branch: '⑂',
  terminal: '❯',
  bell: '◬',
  sparkle: '✦',
  list: '≡',
  flag: '⚑',
  bolt: 'ϟ',
  gauge: '◔',
  rewind: '«',
  plug: '⏚',
}
