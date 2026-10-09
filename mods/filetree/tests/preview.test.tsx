import { expect, test } from 'claude-code/testing'

// Draws the desktop pane in the states the video walks through, for bin/preview.
// Each tree is logged as @@TREE@@<theme>-<state>@@<json>, the rows Client spliced in.

type Files = Record<string, [string, 'file' | 'dir', number?][]>
type Git = { status: string; numstat: string; heads: string[]; committed: string }
const NOW = 1_800_000_000_000
const DAY = 86_400_000

function world(on: any, opts: { root: string; dirs: Files; git: Git | null; theme: string }) {
  const { root, dirs, git, theme } = opts
  on('session.start', (_$: any, e: any) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: root }))
  on('session.id', () => ({ value: 'preview' }))
  on('command.register', () => ({ value: undefined }))
  on('config.list', () => ({ value: [{ key: 'theme', label: 'Tema', kind: 'choice', value: theme, provider: { kind: 'engine' }, isLocked: false }] }))
  on('env.get', (_$: any, e: any) => ({ value: e.name === 'HOME' ? '/Users/k' : undefined }))
  on('clock.now', () => ({ value: NOW }))
  on('fs.read', () => {
    throw new Error('no file')
  })
  on('fs.list', (_$: any, e: any) => {
    const kids = dirs[e.path]
    if (!kids) throw new Error(`ENOENT ${e.path}`)
    return { value: kids.map(([name, kind, age]) => ({ name, kind, size: 2048 + name.length * 911, mtimeMs: NOW - (age ?? 0), isLink: false })) }
  })
  on('fs.stat', (_$: any, e: any) => {
    const p: string = e.path
    const parent = p.slice(0, p.lastIndexOf('/'))
    const hit = dirs[p] ? 'dir' : dirs[parent]?.find(([n]) => n === p.slice(parent.length + 1))?.[1]
    if (!hit) throw new Error(`ENOENT ${p}`)
    return { value: { kind: hit, size: 1, mtimeMs: NOW, isLink: false } }
  })
  on('process.run', (_$: any, e: any) => {
    const argv: string[] = [...e.argv]
    const ok = (stdout: string, exitCode = 0) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
    if (argv[0] === 'uname') return ok('Darwin\n')
    if (argv[0] !== 'git') return ok('')
    if (!git) return ok('', 128)
    const verb = argv.slice(4).find(a => !a.startsWith('-'))
    if (verb === 'rev-parse' && argv.at(-1) === 'HEAD') return ok(`${git.heads.length > 1 ? git.heads.shift() : git.heads[0]}\n`)
    if (verb === 'rev-parse') return ok(`\n${root}\n`)
    if (verb === 'status') return ok(git.status)
    if (verb === 'diff') return ok(git.numstat)
    if (verb === 'diff-tree') return ok(git.committed)
    return ok('')
  })
  on('tool.call', () => ({ result: { stdout: '', stderr: '' } }))
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', (_$: any, e: any) => ({ text: e.answer }))
}

const paneProps = { title: 'Dosyalar', isFocused: false, bodyColumns: 56, placement: 'dock', scroll: { offset: 0, bodyRows: 64 }, view: {} } as any

async function snap(ui: any, label: string) {
  const tree = (await ui.drawn()) as any
  const rows = await ui.drawn({ in: 'rows' })
  // The renderer reads `height` as 8px units; a one-cell row is a text line, so it drops it.
  const line = (node: any): any => {
    if (!node || typeof node !== 'object') return node
    const { height, ...props } = node.props ?? {}
    return { ...node, props: height === 1 ? props : node.props, children: (node.children ?? []).map(line) }
  }
  const swap = (node: any): any => {
    if (!node || typeof node !== 'object') return node
    if (node.type === 'Client') return line(rows)
    return { ...node, children: (node.children ?? []).map(swap) }
  }
  console.log('@@TREE@@' + label + '@@' + JSON.stringify(swap(tree)))
}

const turn = (id: string) => ({ text: 'go', turnId: id }) as any
const done = (id: string) => ({ answer: '', durationMs: 1, isAborted: false, turnId: id, reason: 'answer' }) as any

function weather(): { root: string; dirs: Files; git: Git } {
  const root = '/Users/k/weather-app'
  return {
    root,
    dirs: {
      [root]: [['.git', 'dir'], ['docs', 'dir'], ['src', 'dir'], ['tests', 'dir'], ['.gitignore', 'file', 9 * DAY], ['package.json', 'file', 2 * DAY], ['README.md', 'file', 40 * DAY]],
      [`${root}/src`]: [['api', 'dir'], ['index.js', 'file', 3 * DAY]],
      [`${root}/src/api`]: [['client.js', 'file', 3 * DAY]],
      [`${root}/tests`]: [['client.test.js', 'file', 3_600_000]],
      [`${root}/docs`]: [['setup.md', 'file', 20 * DAY]],
    },
    git: { status: '## main...origin/main\0', numstat: '', heads: ['a1c9e42f00'], committed: '' },
  }
}

for (const theme of ['dark', 'light'] as const) {
  test(`preview ${theme}: reading, editing, committed`, { timeoutMs: 30_000 }, async ($, on) => {
    const w = weather()
    world(on, { ...w, theme })
    await $.session.start({ cwd: w.root, surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props: paneProps })
    await ($ as any).turn.start(turn('t1'))
    await $.tool.call({ tool: 'Read', file_path: `${w.root}/tests/client.test.js` } as any)
    await snap(ui, `${theme}-1-reading`)
    w.git.status = '## main...origin/main\0 M src/api/client.js\0'
    w.git.numstat = '1\t1\tsrc/api/client.js\0'
    await $.tool.call({ tool: 'Edit', file_path: `${w.root}/src/api/client.js`, old_string: 'a', new_string: 'b' } as any)
    await snap(ui, `${theme}-2-editing`)
    w.git.heads = ['a1c9e42f00', 'b7d2e91c3a']
    w.git.status = '## main...origin/main [ahead 1]\0'
    w.git.numstat = ''
    w.git.committed = 'src/api/client.js\0tests/client.test.js\0'
    await $.tool.call({ tool: 'Bash', command: 'git commit -am "Fix client retry"' } as any)
    await ($ as any).turn.complete(done('t1'))
    await snap(ui, `${theme}-3-committed`)
    expect(JSON.stringify(await ui.drawn())).toContain('commit etti')
    await ui.unmount()
  })

  test(`preview ${theme}: a folder outside git`, { timeoutMs: 30_000 }, async ($, on) => {
    const root = '/Users/k/tax-return-2026'
    const dirs: Files = {
      [root]: [['bank-statements', 'dir'], ['receipts', 'dir'], ['deductions.csv', 'file', 2 * DAY], ['income.csv', 'file', 6 * DAY], ['notes.md', 'file', 5 * DAY], ['tax-return.docx', 'file', 30 * DAY]],
      [`${root}/receipts`]: [['desk-chair.pdf', 'file', 36 * DAY], ['laptop.pdf', 'file', 58 * DAY], ['phone-bill.pdf', 'file', 9 * DAY]],
      [`${root}/bank-statements`]: [['2026-08.pdf', 'file', 40 * DAY]],
    }
    world(on, { root, dirs, git: null, theme })
    await $.session.start({ cwd: root, surface: 'desktop', isInteractive: true })
    const ui = await $.ui.mount({ plugin: 'filetree', surface: 'desktop', component: 'Pane', requestId: 'filetree', props: paneProps })
    await ($ as any).turn.start(turn('t2'))
    for (const f of ['desk-chair.pdf', 'laptop.pdf', 'phone-bill.pdf']) await $.tool.call({ tool: 'Read', file_path: `${root}/receipts/${f}` } as any)
    await snap(ui, `${theme}-4-nongit-reading`)
    await $.tool.call({ tool: 'Edit', file_path: `${root}/deductions.csv`, old_string: 'a', new_string: 'b' } as any)
    await ($ as any).turn.complete(done('t2'))
    await snap(ui, `${theme}-5-nongit-done`)
    expect(JSON.stringify(await ui.drawn())).toContain('düzenledi')
    await ui.unmount()
  })
}
