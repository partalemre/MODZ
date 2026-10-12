// The world beneath the mod, shared by the test files: a mocked model, files, store and prompt box.
import { mock } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'


export const VOID = { value: undefined } as never
export const ok = (value: unknown) => ({ value }) as never

export type Opts = {
  verdicts?: Record<string, object | 'error' | 'throw'>
  files?: Record<string, string>
  root?: () => string
  box?: string
  theme?: string
  // MODZ_LANG as $.env.get answers it: Turkish unless a test asks for the English default (null).
  lang?: string | null
}

export function world(on: On, opts: Opts = {}) {
  const clock = mock.clock(on, { now: Date.parse('2026-10-02T12:00:00Z') })
  mock.store(on, {})
  const lang = opts.lang === undefined ? 'tr' : opts.lang
  mock.env(on, { HOME: '/home/u', ...(lang === null ? {} : { MODZ_LANG: lang }) })
  const files: Record<string, string> = { ...(opts.files ?? {}) }
  const asked: string[] = []
  const systems: string[] = []
  const filled: string[] = []
  on('model.complete', async ($, e) => {
    const text = /<user_message>([\s\S]*)<\/user_message>/.exec(e.prompt)?.[1] ?? ''
    asked.push(text)
    systems.push(e.system ?? '')
    const v = opts.verdicts?.[text]
    if (v === 'throw') throw new Error('model blocked')
    if (v === 'error') return ok({ isAnswered: false, reason: 'api-error', status: 529, error: 'overloaded', usage: {} })
    return ok({ isAnswered: true, text: JSON.stringify(v ?? { is_rule: false, rule: '', scope: 'global', confidence: 0.9 }), usage: {} })
  })
  on('session.messages', async () => ok([{ role: 'assistant', text: 'I used npm to install it.', toolUses: [] }]))
  on('session.root', async () => ok(opts.root?.() ?? '/repo'))
  on('fs.exists', async ($, e) => ok(e.path in files))
  on('fs.read', async ($, e) => ok(files[e.path] ?? ''))
  on('fs.write', async ($, e) => {
    files[e.path] = e.text
    return VOID
  })
  on('prompt.read', async () => ok({ text: opts.box ?? '', cursor: 0 }))
  on('prompt.fill', async ($, e) => {
    filled.push(e.text)
    return { isFilled: true } as never
  })
  if (opts.theme) on('config.list', async () => ok([{ key: 'theme', label: 'Theme', kind: 'choice', value: opts.theme, provider: { plugin: 'engine', tier: 'core' }, isLocked: false }]))
  on('command.register', async ($, e) => ok({ command: e.name }))
  on('ui.toast', async () => VOID)
  on('ui.render', async () => ({ type: 'Box', props: {}, children: [] }) as never)
  on('session.start', async () => ({ cwd: '/repo' }) as never)
  on('prompt.submit', async ($, e) => ({ text: e.text }))
  on('prompt.compose', async () => ({ sections: [] }))
  return { clock, files, asked, systems, filled }
}

export const start = ($: Engine) => $.session.start({ source: 'startup', cwd: '/repo', surface: 'terminal', isInteractive: true } as never)
export async function say($: Engine, w: { clock: { settle: () => Promise<void> } }, text: string, kind = 'composer') {
  await $.prompt.submit({ text, origin: { kind }, wait: false } as never)
  await w.clock.settle()
}
export const BAND = { component: 'AbovePrompt', props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 80 } as never } as const
export const mount = ($: Engine) => $.ui.mount({ plugin: 'reflect-mod', surface: 'terminal', ...BAND })
/** What the band shows: the card's rule (with its repeat count) and the "+N" line under it. */
export async function rows($: Engine) {
  const ui = await mount($)
  const found = (await ui.findAll({ type: 'Text', text: /^(“.*”( ×\d+)?|\+\d+ kural daha · \/reflect-queue)$/ }))
    .filter(t => t.props.italic !== true)
    .map(t => t.text)
  await ui.unmount()
  return found
}
export async function press($: Engine, prefix: string) {
  const ui = await mount($)
  const key = (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith(prefix))?.key ?? ''
  await ui.press({ key })
  await ui.unmount()
}
export const compose = ($: Engine) =>
  $.prompt.compose({ model: 'm', promptModel: 'm', surfaces: [], tools: [], outputStyle: null, traits: [] } as never)

