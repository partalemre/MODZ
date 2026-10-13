import { mock } from 'claude-code/testing'

// The host the CI watch runs against: a git repo whose branch has PR #7, and a fake `gh` answering from
// what the test sets. Only process.run is faked for git and gh: the boundary the watch talks across.

export type Check = { name: string; state: string; bucket: string; link: string }
export type Gh = {
  calls: string[][]
  notes: string[]
  prompts: string[]
  opened: string[]
  isRepo: boolean
  hasGh: boolean
  // What `gh pr view --json number,…` answers for the branch; null: no PR (gh exits 1).
  branchPr: { number: number; url: string; title: string; state: string } | null
  checks: Check[] | null
  prState: string
  talk: number
  // The Bash tool's output for the next command, and whether it failed.
  bashOut: string
  isBashError: boolean
}

export const PR_URL = 'https://github.com/acme/shop/pull/7'
export const pending = (name: string): Check => ({ name, state: 'IN_PROGRESS', bucket: 'pending', link: `https://github.com/acme/shop/actions/runs/1/job/${encodeURIComponent(name)}` })
export const passed = (name: string): Check => ({ ...pending(name), state: 'SUCCESS', bucket: 'pass' })
export const failed = (name: string): Check => ({ ...pending(name), state: 'FAILURE', bucket: 'fail' })

export const newGh = (over: Partial<Gh> = {}): Gh => ({
  calls: [], notes: [], prompts: [], opened: [], isRepo: true, hasGh: true,
  branchPr: { number: 7, url: PR_URL, title: 'Add the checkout page', state: 'OPEN' },
  checks: [pending('lint'), pending('test')], prState: 'OPEN', talk: 0, bashOut: '', isBashError: false, ...over,
})

const out = (stdout: string, exitCode = 0) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
const commentsOf = (count: number) => Array.from({ length: count }, () => ({ body: 'x' }))

function ghAnswer(gh: Gh, argv: string[]) {
  if (!gh.hasGh) throw new Error('gh: not found')
  const [, noun, verb, arg] = argv
  if (noun !== 'pr') return out('', 1)
  if (verb === 'checks') return gh.checks === null ? out('no checks reported', 1) : out(JSON.stringify(gh.checks), 8)
  const fields = argv[argv.indexOf('--json') + 1] ?? ''
  if (fields.includes('reviews')) return out(JSON.stringify({ state: gh.prState, title: 'Add the checkout page', reviews: [], comments: commentsOf(gh.talk) }))
  const pr = arg === '--json' ? gh.branchPr : { ...gh.branchPr, number: Number(arg) }

  return gh.branchPr === null ? out('no pull requests found', 1) : out(JSON.stringify(pr))
}

export async function setupCi($: any, on: any, spec: { gh: Gh; surface?: string; theme?: string; lang?: string }) {
  const { gh } = spec
  const clock = mock.clock(on)
  mock.env(on, { MODZ_LANG: spec.lang ?? 'en', ...(spec.theme === undefined ? {} : { MODZ_THEME: spec.theme }) })
  for (const name of ['store.get', 'store.set', 'command.register', 'ui.log', 'ui.status', 'ui.toast']) on(name, () => ({ value: undefined }))
  on('ui.open', (_: any, e: any) => (gh.opened.push(e.id), { value: { isPlaced: true } }))
  on('ui.notify', (_: any, e: any) => (gh.notes.push(e.text), { value: { isSent: true, channel: 'kitty' } }))
  on('prompt.submit', (_: any, e: any) => (gh.prompts.push(e.text), { text: e.text }))
  on('ui.render', () => ({ type: 'engine', ref: 1 }))
  on('session.start', () => ({ cwd: '/w' }))
  on('session.cwd', () => ({ value: '/w' }))
  on('fs.list', () => ({ value: [] }))
  on('tool.call', () => ({ result: { stdout: gh.bashOut, stderr: '' }, text: gh.bashOut, ...(gh.isBashError ? { isError: true } : {}) }))
  on('process.run', async (_: any, e: any) => {
    gh.calls.push([...e.argv])
    if (e.argv[0] === 'git') return gh.isRepo ? out('true\n') : out('', 128)

    return e.argv[0] === 'gh' ? ghAnswer(gh, e.argv) : out('', 0)
  })
  await $.session.start({ surface: spec.surface ?? 'terminal', isInteractive: true, cwd: '/w' })
  await clock.settle()

  return clock
}

// Stands for the MODZ main panel: it reads the hub card this mod writes, as `modz` does.
export const modz = {
  name: 'modz',
  register(on: any) {
    on('command.run', { command: 'modz-hub' }, async ($: any) => ({ text: JSON.stringify((await $.state.get({ plugin: 'test-badge', key: 'hub' })).value ?? null) }))
  },
}
export const hubOf = async ($: any) => JSON.parse((await $.command.run({ command: 'modz-hub', args: '' })).text)
export const hrefsOf = async (ui: any): Promise<string[]> => (await ui.findAll({ type: 'Link' })).map((link: any) => link.props.href)

export const ghCalls = (gh: Gh, verb: string) => gh.calls.filter(argv => argv[0] === 'gh' && argv[2] === verb)

export async function bash($: any, gh: Gh, spec: { command: string; out?: string; isError?: boolean }) {
  gh.bashOut = spec.out ?? ''
  gh.isBashError = spec.isError === true
  await $.tool.call({ tool: 'Bash', command: spec.command })
}

export const bandOf = (surface: string) => ({
  plugin: 'test-badge', component: 'AbovePrompt', requestId: 'band', surface, viewport: { columns: 120, rows: 40 },
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
})
export const paneOf = (surface: string, bodyColumns = 80) => ({
  plugin: 'test-badge', component: 'Pane', requestId: 'test-badge', surface, viewport: { columns: 120, rows: 40 },
  props: { title: 'Tests', isFocused: true, bodyColumns, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
})

// Every Svg alt and Text in a drawn tree: what each surface shows.
export function shownText(tree: any): string {
  if (tree === null || typeof tree !== 'object') return typeof tree === 'string' ? tree : ''
  if (Array.isArray(tree)) return tree.map(shownText).join('\n')
  const own = tree.type === 'Svg' ? String(tree.props?.alt ?? '') : ''
  const text = typeof tree.text === 'string' ? tree.text : ''

  return [own, text, shownText(tree.children ?? [])].filter(part => part !== '').join('\n')
}
