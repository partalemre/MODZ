import { NICE } from './limits'

export type Commands = { test: string[] | null; lint: string[] | null }

// What the project root holds: its file names, and the text of the few files detection reads.
export type RootInfo = { names: ReadonlySet<string>; texts: Readonly<Record<string, string>>; hasVendorBin: (tool: string) => boolean }

const NPM_DEFAULT_TEST = 'no test specified'
const SOURCE_EXT = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'mts', 'cts', 'vue', 'svelte', 'py', 'go', 'rs', 'php', 'rb',
  'java', 'kt', 'kts', 'swift', 'dart', 'c', 'h', 'cc', 'cpp', 'hpp', 'cs', 'scala', 'ex', 'exs', 'lua',
])
export const PROBED_TEXTS = ['package.json', 'pyproject.toml', 'setup.cfg', 'tox.ini', 'go.mod', 'pubspec.yaml']
const PYTHON_MARKS = ['pyproject.toml', 'setup.py', 'setup.cfg']

export function isSource(path: string): boolean {
  const name = path.split(/[\\/]/).pop() ?? ''
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

// The project's own environment where it has one: a uv or plain venv in the folder, then poetry's, then python3.
// shortcut: a venv kept elsewhere (pyenv, conda) is not found; set testCommand for those.
function pythonOf(names: ReadonlySet<string>): string[] {
  if (names.has('.venv')) return ['.venv/bin/python']
  if (names.has('venv')) return ['venv/bin/python']

  return names.has('poetry.lock') ? ['poetry', 'run', 'python'] : ['python3']
}

const has = (root: RootInfo, ...names: string[]): boolean => names.some(name => root.names.has(name))

function pythonTest(root: RootInfo): string[] | null {
  if (hasPytest(root)) return [...pythonOf(root.names), '-m', 'pytest', '-q']
  const folder = ['tests', 'test'].find(name => root.names.has(name))

  return has(root, ...PYTHON_MARKS) && folder !== undefined ? [...pythonOf(root.names), '-m', 'unittest', 'discover', '-s', folder, '-t', '.'] : null
}

// The JVM, Swift and Ruby builds; an Xcode project needs a scheme and a simulator, so it gets none.
function buildTest(root: RootInfo): string[] | null {
  if (has(root, 'build.gradle', 'build.gradle.kts')) return [has(root, 'gradlew') ? './gradlew' : 'gradle', 'test', '-q']
  if (has(root, 'pom.xml')) return [has(root, 'mvnw') ? './mvnw' : 'mvn', '-q', 'test']
  if (has(root, 'Package.swift')) return ['swift', 'test']
  if (has(root, '.rspec', 'spec') && has(root, 'Gemfile')) return ['bundle', 'exec', 'rspec']

  return null
}

function detectTest(root: RootInfo, scripts: Record<string, string>): string[] | null {
  const test = scripts.test
  if (typeof test === 'string' && !test.includes(NPM_DEFAULT_TEST)) return [...runnerOf(root.names), 'test']
  if (has(root, 'deno.json', 'deno.jsonc')) return ['deno', 'test']
  const python = pythonTest(root)
  if (python !== null) return python
  if (root.names.has('go.mod')) return ['go', 'test', './...']
  if (root.names.has('Cargo.toml')) return ['cargo', 'test', '-q']
  if (root.names.has('pubspec.yaml') && root.names.has('test')) return /sdk:\s*flutter/.test(root.texts['pubspec.yaml'] ?? '') ? ['flutter', 'test'] : ['dart', 'test']
  if (root.names.has('phpunit.xml') || root.names.has('phpunit.xml.dist')) return [phpTool(root, 'phpunit')]

  return buildTest(root)
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

// What is really spawned. Windows has no `nice` and no /bin/sh, calls Python `python`, and runs npm and friends
// (.cmd scripts) only through cmd, which also takes a path only with backslashes.
export function spawnArgv(argv: string[], isWindows: boolean): string[] {
  if (!isWindows) return [...NICE, ...argv]
  const [head = '', ...rest] = argv
  if (head === '/bin/sh') return ['cmd', '/c', rest[1] ?? '']
  const tool = head === 'python3' ? 'python' : head.replace(/\/bin\/python$/, '/Scripts/python').replace(/\//g, '\\')

  return ['cmd', '/c', tool, ...rest]
}
