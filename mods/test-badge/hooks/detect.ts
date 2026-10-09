export type Commands = { test: string[] | null; lint: string[] | null }

// What the project root holds: its file names, and the text of the few files detection reads.
export type RootInfo = { names: ReadonlySet<string>; texts: Readonly<Record<string, string>>; hasVendorBin: (tool: string) => boolean }

const NPM_DEFAULT_TEST = 'no test specified'
const SOURCE_EXT = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'mts', 'cts', 'vue', 'svelte', 'py', 'go', 'rs', 'php', 'rb',
  'java', 'kt', 'kts', 'swift', 'dart', 'c', 'h', 'cc', 'cpp', 'hpp', 'cs', 'scala', 'ex', 'exs', 'lua',
])
export const PROBED_TEXTS = ['package.json', 'pyproject.toml', 'setup.cfg', 'tox.ini', 'go.mod', 'pubspec.yaml']

export function isSource(path: string): boolean {
  const name = path.split('/').pop() ?? ''
  const dot = name.lastIndexOf('.')

  return dot > 0 && SOURCE_EXT.has(name.slice(dot + 1).toLowerCase())
}

function runnerOf(names: ReadonlySet<string>): string[] {
  if (names.has('pnpm-lock.yaml')) return ['pnpm']
  if (names.has('yarn.lock')) return ['yarn']
  if (names.has('bun.lockb') || names.has('bun.lock')) return ['bun', 'run']

  return ['npm', 'run', '--silent']
}

function scriptsOf(text: string | undefined): Record<string, string> {
  if (text === undefined) return {}
  try {
    const parsed: unknown = JSON.parse(text)
    const scripts = (parsed as { scripts?: unknown } | null)?.scripts

    return typeof scripts === 'object' && scripts !== null ? (scripts as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function hasPytest(root: RootInfo): boolean {
  if (root.names.has('pytest.ini') || root.names.has('conftest.py')) return true

  return ['pyproject.toml', 'setup.cfg', 'tox.ini'].some(name => (root.texts[name] ?? '').includes('pytest'))
}

function phpTool(root: RootInfo, tool: string): string {
  return root.hasVendorBin(tool) ? `vendor/bin/${tool}` : tool
}

function detectTest(root: RootInfo, scripts: Record<string, string>): string[] | null {
  const test = scripts.test
  if (typeof test === 'string' && !test.includes(NPM_DEFAULT_TEST)) return [...runnerOf(root.names), 'test']
  if (hasPytest(root)) return ['python3', '-m', 'pytest', '-q']
  if (root.names.has('go.mod')) return ['go', 'test', './...']
  if (root.names.has('Cargo.toml')) return ['cargo', 'test', '-q']
  if (root.names.has('pubspec.yaml') && root.names.has('test')) return /sdk:\s*flutter/.test(root.texts['pubspec.yaml'] ?? '') ? ['flutter', 'test'] : ['dart', 'test']
  if (root.names.has('phpunit.xml') || root.names.has('phpunit.xml.dist')) return [phpTool(root, 'phpunit')]

  return null
}

function detectLint(root: RootInfo, scripts: Record<string, string>): string[] | null {
  if (typeof scripts.lint === 'string') return [...runnerOf(root.names), 'lint']
  if (root.names.has('phpstan.neon') || root.names.has('phpstan.neon.dist')) return [phpTool(root, 'phpstan'), 'analyse', '--no-progress', '--no-ansi']

  return null
}

// The module path in go.mod, which maps a failing package back to its folder.
export function goModuleOf(root: RootInfo): string | null {
  return /^module\s+(\S+)/m.exec(root.texts['go.mod'] ?? '')?.[1] ?? null
}

export function detect(root: RootInfo, overrides: { test: string; lint: string }): Commands {
  const scripts = scriptsOf(root.texts['package.json'])
  const shell = (command: string) => ['/bin/sh', '-c', command]

  return {
    test: overrides.test.trim() !== '' ? shell(overrides.test) : detectTest(root, scripts),
    lint: overrides.lint.trim() !== '' ? shell(overrides.lint) : detectLint(root, scripts),
  }
}
