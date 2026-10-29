// File-type badges (DESIGN.md §0.3): a short label on a neutral fill. The type is told by the label, never by a
// colour: colour is kept for what Claude is doing to the file right now.

const BY_EXT: Record<string, string> = {}
const add = (label: string, exts: string[]) => {
  for (const ext of exts) BY_EXT[ext] = label
}
add('JS', ['js', 'mjs', 'cjs'])
add('JSX', ['jsx'])
add('TS', ['ts', 'mts', 'cts'])
add('TSX', ['tsx'])
add('PY', ['py', 'pyi'])
add('GO', ['go'])
add('DOC', ['doc', 'docx', 'rtf', 'odt'])
add('CSS', ['css', 'scss'])
add('MD', ['md', 'markdown', 'mdx'])
add('TXT', ['txt', 'log'])
add('{}', ['json', 'jsonc'])
add('CSV', ['csv', 'tsv'])
add('YML', ['yaml', 'yml'])
add('XLS', ['xls', 'xlsx', 'ods'])
add('TML', ['toml'])
add('PDF', ['pdf'])
add('IMG', ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic', 'bmp', 'ico'])
add('SVG', ['svg'])
add('RS', ['rs'])
add('HTM', ['html', 'htm'])
add('SWF', ['swift'])
add('DRT', ['dart'])
add('SH', ['sh', 'bash', 'zsh', 'fish'])
add('LCK', ['lock'])

const GIT_FILES = new Set(['.gitignore', '.gitattributes', '.gitmodules', '.gitkeep'])
const MAX_LABEL = 3

export function badgeOf(name: string): string {
  const lower = name.toLowerCase()
  if (GIT_FILES.has(lower)) return 'GIT'
  const dot = lower.lastIndexOf('.')
  const ext = dot > 0 ? lower.slice(dot + 1) : ''
  return BY_EXT[ext] ?? (ext ? ext.slice(0, MAX_LABEL).toUpperCase() : '·')
}
