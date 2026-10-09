// File-type badges (DESIGN.md §2): ts/js Amber, py Tide, md/txt faint Iris, json/csv/yaml Moss,
// pdf Flare, images Orchid, shell and git files neutral.

import type { Role } from './theme'

export type BadgeKind = { label: string; role: Role }

const BY_EXT: Record<string, BadgeKind> = {}
const add = (role: Role, label: string, exts: string[]) => {
  for (const ext of exts) BY_EXT[ext] = { label, role }
}
add('warn', 'JS', ['js', 'mjs', 'cjs'])
add('warn', 'JSX', ['jsx'])
add('warn', 'TS', ['ts', 'mts', 'cts'])
add('warn', 'TSX', ['tsx'])
add('read', 'PY', ['py', 'pyi'])
add('read', 'GO', ['go'])
add('read', 'DOC', ['doc', 'docx', 'rtf', 'odt'])
add('read', 'CSS', ['css', 'scss'])
add('note', 'MD', ['md', 'markdown', 'mdx'])
add('note', 'TXT', ['txt', 'log'])
add('ok', '{}', ['json', 'jsonc'])
add('ok', 'CSV', ['csv', 'tsv'])
add('ok', 'YML', ['yaml', 'yml'])
add('ok', 'XLS', ['xls', 'xlsx', 'ods'])
add('ok', 'TML', ['toml'])
add('danger', 'PDF', ['pdf'])
add('plan', 'IMG', ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'bmp', 'ico'])
add('plan', 'SVG', ['svg'])
add('edit', 'RS', ['rs'])
add('edit', 'HTM', ['html', 'htm'])
add('edit', 'SWF', ['swift'])
add('edit', 'DRT', ['dart'])
add('neutral', 'SH', ['sh', 'bash', 'zsh', 'fish'])
add('neutral', 'LCK', ['lock'])

const GIT_FILES = new Set(['.gitignore', '.gitattributes', '.gitmodules', '.gitkeep'])
const MAX_LABEL = 3

export function badgeOf(name: string): BadgeKind {
  const lower = name.toLowerCase()
  if (GIT_FILES.has(lower)) return { label: 'GIT', role: 'neutral' }
  const dot = lower.lastIndexOf('.')
  const ext = dot > 0 ? lower.slice(dot + 1) : ''
  const known = BY_EXT[ext]
  if (known) return known
  const label = ext ? ext.slice(0, MAX_LABEL).toUpperCase() : '·'
  return { label, role: 'neutral' }
}
