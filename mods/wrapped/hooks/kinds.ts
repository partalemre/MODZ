import type { ProjectKind } from '../types'

// What kind of thing a project or a file is, told from what it holds and never from its name, so a shared card says
// "Game" or "TypeScript file" and gives away nothing else. Read on this machine, with no model.

export type FileKind = 'test' | 'agent' | 'doc' | 'config' | 'style' | 'data' | 'script' | 'code'

const WEB_DEPENDENCY = /"(next|react|vue|svelte|astro|nuxt|vite|@remix-run\/[a-z-]+)"\s*:/
const GAME_WORD = /\b(game|oyun|oyunu|unity|godot|gameplay)\b/gi
const GAME_MENTIONS = 3
const GAME_DENSITY = 1 / 1000
const README = 'README.md'
const WRITING = /\.(md|mdx|txt|docx?|pdf|pptx?|xlsx?|csv|canvas)$/i
const CODE = /\.(ts|tsx|js|jsx|py|go|rs|swift|dart|kt|java|cs|c|cpp|rb|sh|html)$/i

const RULES: readonly (readonly [ProjectKind, RegExp])[] = [
  ['claude', /^\.claude-plugin$/],
  ['game', /^(project\.godot|.+\.uproject|ProjectSettings|.+\.unity)$/],
  ['mobile', /^(pubspec\.yaml|.+\.xcodeproj|.+\.xcworkspace|android|ios)$/],
  ['web', /^((next|vite|astro|nuxt|svelte|tailwind)\.config\.[a-z]+|wrangler\.(toml|jsonc?)|supabase)$/],
  ['tool', /^(package\.json|Cargo\.toml|go\.mod|pyproject\.toml|requirements\.txt|setup\.py|Package\.swift|.+\.slnx?|Makefile|bin|src)$/],
]

type Texts = { packageText?: string; readmeText?: string }

// A game on its own engine leaves no marker, so a readme that keeps calling it one settles it: measured against its
// length, as a long readme that says "not a game" a few times is not about a game.
const isAboutGame = (readme: string): boolean => {
  const mentions = (readme.match(GAME_WORD) ?? []).length

  return mentions >= GAME_MENTIONS && mentions / readme.length >= GAME_DENSITY
}

// `packageText` alone tells a web app from a command-line tool.
export function projectKindOf(names: readonly string[], { packageText = '', readmeText = '' }: Texts = {}): ProjectKind {
  const isLaid = (rule: RegExp): boolean => names.some(name => rule.test(name))
  const found = RULES.find(([, rule]) => isLaid(rule))?.[0]
  if (found !== 'tool' && found !== undefined) return found
  if (names.includes('game') && names.includes('assets')) return 'game'
  if (isAboutGame(readmeText)) return 'game'
  if (WEB_DEPENDENCY.test(packageText)) return 'web'
  if (found === 'tool') return 'tool'
  const shown = names.filter(name => !name.startsWith('.'))
  const writing = shown.filter(name => WRITING.test(name)).length
  // A page or two beside a pile of documents is still a pile of documents.
  if (writing > 0 && writing * 2 >= shown.length) return 'writing'
  if (names.includes('index.html')) return 'web'
  if (names.some(name => CODE.test(name))) return 'tool'

  return writing > 0 ? 'writing' : 'other'
}

export type KindIo = { list: (dir: string) => Promise<readonly { name: string }[]>; read: (path: string) => Promise<string> }

const baseOf = (path: string): string => path.split(/[\\/]+/).filter(Boolean).pop() ?? path

// Each shown project's kind by its short name. A folder since moved or deleted is just "other".
export async function projectKinds(paths: readonly string[], shown: ReadonlySet<string>, io: KindIo): Promise<Record<string, ProjectKind>> {
  const kinds: Record<string, ProjectKind> = {}
  for (const path of paths) {
    const name = baseOf(path)
    if (!shown.has(name) || kinds[name] !== undefined) continue
    const names = await io.list(path).then(entries => entries.map(entry => entry.name)).catch((): string[] => [])
    const textOf = (file: string) => (names.includes(file) ? io.read(`${path}/${file}`).catch(() => '') : Promise.resolve(''))
    kinds[name] = projectKindOf(names, { packageText: await textOf('package.json'), readmeText: await textOf(README) })
  }

  return kinds
}

const LANGUAGES: Record<string, string> = {
  ts: 'TypeScript', tsx: 'React', js: 'JavaScript', jsx: 'React', py: 'Python', go: 'Go', rs: 'Rust', swift: 'Swift', dart: 'Dart', kt: 'Kotlin',
  java: 'Java', cs: 'C#', c: 'C', cpp: 'C++', rb: 'Ruby', vue: 'Vue', svelte: 'Svelte', html: 'HTML', gd: 'GDScript', sql: 'SQL', php: 'PHP',
}

export type FileLook = { kind: FileKind; language: string | null }

// The language is kept only for code, the one place it says something about the work and nothing about the file.
export function fileKindOf(name: string): FileLook {
  const lower = name.toLowerCase()
  const extension = lower.includes('.') ? (lower.split('.').pop() as string) : ''
  const look = (kind: FileKind): FileLook => ({ kind, language: null })
  if (/(^|[._-])(test|spec)([._-]|$)/.test(lower) || lower.startsWith('test_')) return look('test')
  if (/^(claude|agents|skill|memory|gemini)\.md$/.test(lower)) return look('agent')
  if (/^(md|mdx|txt|rst|pdf|docx?)$/.test(extension)) return look('doc')
  if (/^(css|scss|sass|less)$/.test(extension)) return look('style')
  if (/^(csv|tsv|xlsx?|parquet|ipynb)$/.test(extension)) return look('data')
  if (/^(sh|zsh|bash|ps1|bat)$/.test(extension)) return look('script')
  if (/^(json|jsonc|ya?ml|toml|ini|lock|env|plist|xml)$/.test(extension) || lower.startsWith('.') || /^(dockerfile|makefile)$/.test(lower)) return look('config')

  return { kind: 'code', language: LANGUAGES[extension] ?? null }
}
