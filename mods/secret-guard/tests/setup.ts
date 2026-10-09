// The engine beneath secret-guard in tests: files, git answers, the dialog answered with `choice`.

export type Setup = { choice: string; asked: string[]; files: Record<string, string>; ran: any[]; git: Record<string, string>; cards: string[][]; trees: any[]; dialogs: any[]; theme: string; surface: 'terminal' | 'desktop' }

// The card as the person reads it: one string per line, indents included.
export function textOf(node: any): string {
  return typeof node === 'string' ? node : (node?.children ?? []).map(textOf).join('')
}

export function linesOf(node: any, indent = 0): string[] {
  if (node === null || typeof node !== 'object') return []
  if (node.type === 'Text') return [' '.repeat(indent) + textOf(node)]
  const pad = indent + Number(node.props?.paddingLeft ?? 0)

  return (node.children ?? []).flatMap((child: any) => linesOf(child, pad))
}

export async function drawCard($: any, setup: Setup, questions: unknown[]): Promise<void> {
  const ui = await $.ui.mount({
    plugin: 'secret-guard', component: 'AskUserQuestion', requestId: 'q', surface: setup.surface,
    viewport: { columns: 100, rows: 40 }, props: { tool: 'AskUserQuestion', questions },
  })
  const tree = await ui.drawn()
  setup.trees.push(tree)
  setup.cards.push(linesOf(tree))
  await ui.unmount()
}

export function stub($: any, on: any, setup: Setup) {
  on('session.start', () => ({ cwd: '/work' }))
  on('ui.log', (_: any, e: any) => {
    setup.asked.push(`LOG ${e.text}`)

    return { value: undefined }
  })
  on('ui.render', (_: any, e: any) => {
    setup.dialogs.push(e.props)

    return { type: 'engine', ref: 1 }
  })
  on('config.list', () => ({ value: [{ key: 'theme', label: 'Theme', kind: 'enum', value: setup.theme }] }))
  on('env.get', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('store.set', () => ({ value: undefined }))
  on('command.register', () => ({ value: undefined }))
  on('fs.exists', (_: any, e: any) => ({ value: e.path in setup.files }))
  on('fs.read', (_: any, e: any) => ({ value: setup.files[e.path] ?? '' }))
  on('fs.stat', (_: any, e: any) => ({ value: { kind: 'file', size: (setup.files[e.path] ?? '').length, mtimeMs: 0, isLink: false } }))
  on('fs.write', (_: any, e: any) => {
    setup.files[e.path] = e.text

    return { value: undefined }
  })
  on('process.run', (_: any, e: any) => {
    const stdout = setup.git[e.argv.slice(1).join(' ')] ?? ''

    return { value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('tool.call', async (_: any, e: any) => {
    if (e.tool === 'AskUserQuestion') {
      const question = e.questions[0].question
      setup.asked.push(question)
      await drawCard($, setup, e.questions)

      return { result: { answers: { [question]: setup.choice } } }
    }
    setup.ran.push(e)

    return { result: 'ran' }
  })
}

export async function start($: any, on: any, setup: Setup) {
  stub($, on, setup)
  await $.session.start({ surface: setup.surface, isInteractive: true, cwd: '/work' })
}

export function fresh(choice: string, surface: 'terminal' | 'desktop' = 'terminal'): Setup {
  return { choice, asked: [], files: {}, ran: [], git: {}, cards: [], trees: [], dialogs: [], theme: 'dark', surface }
}
