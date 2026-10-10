import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Register } from 'claude-code'

import type { JustSaved, Learning } from '../types'
import { cardDesktop, cardText, savedDesktop, savedText } from './card'
import type { CardActions, Scope } from './card'
import { decide, isHere, items, record } from './learn'
import type { Io } from './learn'
import { SYSTEM, checkPrompt, parseVerdict } from './policy'
import { MAX_PROMPT, cleanRule, hasTrigger, isTrivial, looksSecret, remembered, withRule } from './rules'
import { pinned } from './pin'
import { isLightTheme } from './theme'

export { cleanRule, hasTrigger, isTrivial, looksSecret, similarity, withRule } from './rules'
export { parseVerdict } from './policy'

const pending = atom({ plugin: 'reflect-mod', key: 'pending' } as const, [])
const savedThisSession = atom({ plugin: 'reflect-mod', key: 'savedThisSession' } as const, [])
const picked = atom({ plugin: 'reflect-mod', key: 'picked' } as const, {})
const editing = atom({ plugin: 'reflect-mod', key: 'editing' } as const, null)
const justSaved = atom({ plugin: 'reflect-mod', key: 'justSaved' } as const, null)

const MIN_CONFIDENCE = 0.7
const MAX_QUEUE = 20
/** How long the "saved" state stays before the card closes itself. */
const SAVED_MS = 4000
const CHECK_TIMEOUT_MS = 30000
const CHECK_MAX_TOKENS = 300
const GLOBAL_DISPLAY = '~/.claude/CLAUDE.md'
/** The person's own prompts: typed at the terminal, or sent by Remote Control. */
const HUMAN = new Set(['composer', 'bridge'])
const RULE_SHAPE = 'reflect: kaydedilmedi - tek satır, sır yok, en fazla 200 karakter'

// The module's own: a reload drops them; the store keeps the learnings themselves.
let model = 'haiku'
let isDraining = false
let isLight = false
/** Saves to CLAUDE.md files run one after another inside this session. */
let writing: Promise<unknown> = Promise.resolve()
const queue: string[] = []

async function readText($: EngineInterface, path: string): Promise<string> {
  if (!(await $.fs.exists(path))) return ''
  const got = await $.fs.read(path)
  return typeof got === 'string' ? got : ''
}

/** The store's reach, bound here: only this file holds `$`. */
function io($: EngineInterface): Io {
  return { get: key => $.store.get(key), set: (key, value) => $.store.set(key, value), now: () => $.clock.now(), read: path => readText($, path) }
}

async function fileFor($: EngineInterface, scope: Scope, root: string): Promise<string> {
  if (scope === 'global') return `${(await $.env.get('HOME')) ?? ''}/.claude/CLAUDE.md`
  return `${root}/CLAUDE.md`
}

/** The paths as the card shows them: the project's by its folder name, the global one from home. */
function shownPaths(root: string): Record<Scope, string> {
  return { project: `${root.split('/').filter(Boolean).at(-1) ?? '.'}/CLAUDE.md`, global: GLOBAL_DISPLAY }
}

async function refreshBand($: EngineInterface) {
  const root = await $.session.root()
  const mine = (await items(io($)))
    .filter(l => l.status === 'pending' && isHere(l, root))
    .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
  await update($, pending, () => mine)
}

/** The text of the assistant's last reply, for the check's context. */
async function lastReply($: EngineInterface): Promise<string> {
  const rows = await $.session.messages()
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i]
    if (row?.role === 'assistant' && row.text.trim() !== '') return row.text
  }
  return ''
}

/** One prompt, end to end: one cheap model call at most, outside the prompt's own dispatch. */
async function checkOne($: EngineInterface, text: string) {
  if ((await $.store.get('paused')) === true) return
  const root = await $.session.root()
  const files = [await fileFor($, 'project', root), await fileFor($, 'global', root)]
  const told = remembered(text)
  if (told !== undefined) {
    const rule = cleanRule(told)
    if (rule === undefined) return $.ui.toast(RULE_SHAPE)
    return record(io($), { verdict: { isRule: true, rule, scope: 'global', confidence: 1 }, root, isExplicit: true, said: text, files })
  }
  const r = await $.model.complete({
    model, system: SYSTEM, prompt: checkPrompt(text, await lastReply($), root), maxTokens: CHECK_MAX_TOKENS, timeoutMs: CHECK_TIMEOUT_MS,
  })
  if (!r.isAnswered) return
  const verdict = parseVerdict(r.text)
  if (verdict === undefined || !verdict.isRule || verdict.confidence < MIN_CONFIDENCE) return
  await record(io($), { verdict, root, isExplicit: false, said: text, files })
}

/** Works through the queue one prompt at a time; each found rule shows at once, and one failure stops nothing. */
async function drain($: EngineInterface) {
  if (isDraining) return
  isDraining = true
  try {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      await checkOne($, next).catch(() => undefined) // A blocked model, a store or file error: this prompt is lost, the rest still run.
      await refreshBand($).catch(() => undefined)
    }
  } finally {
    isDraining = false
  }
}

async function settle($: EngineInterface, d: Parameters<typeof decide>[1]) {
  await decide(io($), d)
  await refreshBand($)
}

/** Writes the rule to the CLAUDE.md the button names, after reading it again just before the write. */
async function saveTo($: EngineInterface, l: Learning, scope: Scope) {
  const job = writing.then(async () => {
    const latest = (await items(io($))).find(one => one.id === l.id)
    if (latest === undefined || latest.status !== 'pending') return
    const root = await $.session.root()
    const path = await fileFor($, scope, root)
    const before = await readText($, path)
    const after = withRule(before, latest.rule)
    if (after === undefined) return $.ui.toast(`reflect: ${path} içindeki claude-reflect işaretleri bozuk; elle düzelt, bir şey yazılmadı`)
    if (after !== before) await $.fs.write(path, after)
    await settle($, { id: l.id, status: 'saved', scope, project: root })
    await update($, savedThisSession, rules => [...rules, { rule: latest.rule, scope, project: root }])
    const done: JustSaved = { rule: latest.rule, scope, path: shownPaths(root)[scope], isNew: after !== before }
    await update($, justSaved, () => done)
    // A later save keeps its own few seconds: only this one's state is closed.
    $.clock.after(SAVED_MS, () => void update($, justSaved, now => (JSON.stringify(now) === JSON.stringify(done) ? null : now)))
  })
  writing = job.catch(() => undefined)
  await job
}

/** Where no field can be drawn: the rule goes into an empty prompt box, and comes back as a "remember:" learning. */
async function rewordInBox($: EngineInterface, l: Learning) {
  if ((await $.prompt.read()).text.trim() !== '') return $.ui.toast('reflect: önce istem kutusunu boşalt - kural oraya yazılacak')
  if ((await $.prompt.fill({ text: `remember: ${l.rule}` })).isFilled) await settle($, { id: l.id, status: 'skipped' })
}

async function reworded($: EngineInterface, l: Learning, value: string) {
  const rule = cleanRule(value)
  if (rule === undefined) return $.ui.toast(RULE_SHAPE)
  await update($, editing, () => null)
  await settle($, { id: l.id, status: 'pending', rule })
}

function actions($: EngineInterface, l: Learning, hasField: boolean): CardActions {
  return {
    pick: scope => void update($, picked, all => ({ ...all, [l.id]: scope })),
    save: scope => void saveTo($, l, scope),
    reword: () => void (hasField ? update($, editing, () => l.id) : rewordInBox($, l)),
    submitReword: value => void reworded($, l, value),
    cancelReword: () => void update($, editing, () => null),
    skip: () => void settle($, { id: l.id, status: 'skipped' }),
  }
}

async function readTheme($: EngineInterface) {
  const rows = await $.config.list().catch(() => []) // A host without the settings rows: the dark palette stands.
  isLight = isLightTheme(rows.find(row => row.key === 'theme')?.value)
}

function wireSession(on: On) {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'reflect-queue', description: 'reflect: burada bulunan kurallar ve durumları' })
    await $.command.register({ name: 'reflect-pause', description: 'reflect: istemlerinin denetimini duraklat ya da sürdür' })
    await readTheme($)
    await refreshBand($)
    return next(e)
  })

  on('config.set', { key: 'theme' }, async ($, e, next) => {
    const result = await next(e)
    if (result.deny === undefined) {
      isLight = isLightTheme(result.value)
      $.ui.invalidate('ui.render')
    }
    return result
  })

}

function wirePrompts(on: On) {
  // Only cheap checks here: the prompt goes on at once, the work runs on a timer.
  on('prompt.submit', ($, e, next) => {
    const text = e.text.trim()
    const isExplicit = remembered(text) !== undefined
    const isCandidate = HUMAN.has(e.origin.kind) && !text.startsWith('/') && !isTrivial(text) && !looksSecret(text) &&
      (isExplicit || (text.length <= MAX_PROMPT && hasTrigger(text)))
    if (isCandidate && queue.length < MAX_QUEUE) {
      queue.push(text)
      $.clock.after(0, () => void drain($).catch(() => undefined))
    }
    return next(e)
  })

  // Another session may have found or decided learnings: draw what the store holds now.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await refreshBand($).catch(() => undefined)
    return next(e)
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const root = await $.session.root()
    const rules = (await read($, savedThisSession)).filter(r => r.scope === 'global' || r.project === root)
    if (rules.length === 0) return composed
    const text = ['Rules the user saved this session (they are in CLAUDE.md too; follow them):', ...rules.map(r => `- ${r.rule}`)].join('\n')
    return { sections: [...composed.sections, { id: 'reflect-mod:saved', text, scope: 'session' as const }] }
  })

}

function wireCommands(on: On) {
  on('command.run', { command: 'reflect-queue' }, async $ => {
    const root = await $.session.root()
    const list = (await items(io($))).filter(l => isHere(l, root))
    if (list.length === 0) return { text: 'Burada henüz bir şey bulunmadı.' }
    const waiting = list.filter(l => l.status === 'pending')
    const word = { pending: 'bekliyor', saved: 'kayıtlı', skipped: 'atlandı' } as const
    const lines = [...waiting, ...list.filter(l => l.status !== 'pending').sort((a, b) => b.lastAt - a.lastAt)]
      .slice(0, 40)
      .map(l => `${word[l.status].padEnd(8)} ×${l.count} ${(l.scope === 'global' ? 'genel' : 'proje').padEnd(5)} ${l.rule}`)
    return { text: [`${waiting.length} bekliyor, toplam ${list.length} (burada ve genel)`, ...lines].join('\n') }
  })

  on('command.run', { command: 'reflect-pause' }, async $ => {
    const isPaused = (await $.store.get('paused')) !== true
    await $.store.set('paused', isPaused)
    if (isPaused) queue.length = 0
    return { text: isPaused ? 'Duraklatıldı. İstemlerin denetlenmiyor.' : 'Açık. Kısa istemler yeniden denetleniyor.' }
  })

}

function wireBand(on: On) {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const done = await read($, justSaved)
    const list = await read($, pending)
    const theirs = await next(e)
    const l = list[0]
    if (done === null && l === undefined) return theirs
    const look = { isLight, columns: e.props.bodyColumns }
    const ui = $.ui.resolve(e)
    if (done !== null) {
      const card = e.surface === 'desktop' ? savedDesktop($.ui.resolve(e), done, look) : savedText(ui, done)
      return pinned(e, <ui.Box flexDirection="column" gap={1}>{card}{theirs}</ui.Box>)
    }
    if (l === undefined) return theirs
    const hasField = 'Input' in ui
    const input = {
      l, picked: (await read($, picked))[l.id] ?? l.scope, isEditing: (await read($, editing)) === l.id, more: list.length - 1,
      paths: shownPaths(await $.session.root()), on: actions($, l, hasField),
    }
    const card = e.surface === 'desktop' ? cardDesktop($.ui.resolve(e), input, look) : cardText(ui, input)
    return pinned(e, <ui.Box flexDirection="column" gap={1}>{card}{theirs}</ui.Box>)
  })
}

export const register: Register = (on, options) => {
  if (typeof options.model === 'string' && options.model.trim() !== '') model = options.model.trim()
  wireSession(on)
  wirePrompts(on)
  wireCommands(on)
  wireBand(on)
}
