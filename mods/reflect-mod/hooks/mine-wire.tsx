// `/mine` and its Ideas pane: read the last chats of this project, find what keeps coming back with the
// local prefilter (zero tokens), and ask the model once to turn the strongest into typed ideas. The pane
// opens only on the person's own `/mine`; a rule idea goes to reflect's own card to be saved.

import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, RenderSurface } from 'claude-code'

import type { Candidate, Idea, IdeasView, Learning, SavedRule } from '../types'
import { withHome } from './home'
import { SYSTEM, ideasPrompt, parseIdeas } from './ideas'
import { ideasPane } from './ideas-pane'
import type { PaneActions, RowState } from './ideas-pane'
import { claudePaths, isHere, items, record, waitingHere } from './learn'
import type { Io } from './learn'
import { TOP_CANDIDATES, candidatesOf } from './mine'
import { mineWords } from './mine-words'
import { pinned } from './pin'
import { SAME, similarity } from './rules'
import { signalsOf } from './signals'
import { isOffStage, shownOf } from './stage'
import { findFolder, projectsBase, readRecent } from './transcripts'
import type { Disk } from './transcripts'

/** What the wiring reads from register.tsx, which owns the theme and the model option. */
export type MineDeps = { look: () => { isLight: boolean; model: string } }

// The engine reads each state reference where it is written, so the band's two this pane reads are declared here too.
const pending = atom({ plugin: 'reflect-mod', key: 'pending' } as const, [])
const savedThisSession = atom({ plugin: 'reflect-mod', key: 'savedThisSession' } as const, [])
const ideas = atom({ plugin: 'reflect-mod', key: 'ideas' } as const, null)
const copied = atom({ plugin: 'reflect-mod', key: 'copied' } as const, null)

export const PANE = 'reflect-ideas'
export const MINE_COMMAND = 'mine'
const HOME = { plugin: 'reflect-mod', key: 'home' } as const
const MINE_TIMEOUT_MS = 30000
const MINE_MAX_TOKENS = 900
const TAIL_TIMEOUT_MS = 10000
/** How long a copied idea's button says "Copied". */
const COPIED_MS = 3000
const NO_SCAN = { read: 0, partial: 0, skipped: 0, hasFolder: true }
const READING: IdeasView = { status: 'reading', ideas: [], candidates: [], failure: null, scan: NO_SCAN }

// The module's own: a reload starts it over, and a run cut short by one only leaves the pane as it was.
let isMining = false

/** `tail` reads a large chat's end without a shell; the engine's own read stops at 4 MiB. */
async function tailOf($: EngineInterface, path: string, bytes: number): Promise<string | undefined> {
  const r = await $.process.run(['tail', '-c', String(bytes), '--', path], { timeoutMs: TAIL_TIMEOUT_MS })
  return r.exitCode === 0 ? r.stdout : undefined
}

const disk = ($: EngineInterface): Disk => ({
  exists: path => $.fs.exists(path), list: path => $.fs.list(path), read: path => $.fs.read(path), tail: (path, bytes) => tailOf($, path, bytes),
})

const setView = ($: EngineInterface, view: IdeasView) => update($, ideas, () => view)

// The engine follows `$` only into functions of the same file, so the store's reach is bound here as in register.tsx.
async function readText($: EngineInterface, path: string): Promise<string> {
  if (!(await $.fs.exists(path))) return ''
  const got = await $.fs.read(path)
  return typeof got === 'string' ? got : ''
}

function ioOf($: EngineInterface): Io {
  return { get: key => $.store.get(key), set: (key, value) => $.store.set(key, value), now: () => $.clock.now(), read: path => readText($, path) }
}

async function refreshBand($: EngineInterface, root: string) {
  const waiting = waitingHere(await items(ioOf($)), root)
  await update($, pending, () => waiting)
}

/** A chat counts when it holds anything to learn from; a scripted run with none does not take a chat's place. */
function hasFriction(text: string): boolean {
  const s = signalsOf(text)
  return s.prompts.length + s.holds.length + s.failures.length > 0
}

async function readChats($: EngineInterface) {
  const home = (await $.env.get('HOME')) ?? ''
  const configDir = await $.env.get('CLAUDE_CONFIG_DIR').catch(() => undefined)
  const folder = await findFolder(disk($), { base: projectsBase({ home, configDir }), root: await $.session.root() })
  return readRecent(disk($), { folder, currentId: await $.session.id(), isTalk: hasFriction })
}

/** The one model call per `/mine`; undefined when it did not answer or its answer does not parse. */
async function askModel($: EngineInterface, deps: MineDeps, candidates: Candidate[]): Promise<Idea[] | undefined> {
  const { prompt, sent } = ideasPrompt(candidates)
  const r = await $.model.complete({ model: deps.look().model, system: SYSTEM, prompt, maxTokens: MINE_MAX_TOKENS, timeoutMs: MINE_TIMEOUT_MS })
  return r.isAnswered ? parseIdeas(r.text, sent) : undefined
}

async function mine($: EngineInterface, deps: MineDeps) {
  const recent = await readChats($)
  const scan = { read: recent.chats.length, partial: recent.partial, skipped: recent.skipped, hasFolder: recent.hasFolder }
  const candidates = candidatesOf(recent.chats.map(chat => signalsOf(chat.text))).slice(0, TOP_CANDIDATES)
  if (candidates.length === 0) return setView($, { status: 'done', ideas: [], candidates, failure: null, scan })
  await setView($, { status: 'thinking', ideas: [], candidates, failure: null, scan })
  // A blocked model rejects: the pane then shows the local candidates alone, as for an unusable answer.
  const found = await askModel($, deps, candidates).catch(() => undefined)
  await setView($, { status: 'done', ideas: found ?? [], candidates, failure: found === undefined ? 'model' : null, scan })
}

/** Starts a run unless one is going; the pane shows "reading" at once, the work runs on a timer. */
async function start($: EngineInterface, deps: MineDeps) {
  if (isMining) return
  await setView($, READING)
  isMining = true
  $.clock.after(0, () => void mine($, deps)
    .catch(async () => {
      $.ui.log('reflect: /mine could not read the past chats', { to: 'debug' })
      await setView($, { ...READING, status: 'done', failure: 'read' })
    })
    .finally(() => { isMining = false }))
}

const isSameRule = (a: string, b: string): boolean => similarity(a, b) >= SAME

function stateOf(idea: Idea, o: { waiting: Learning[]; saved: SavedRule[]; root: string }): RowState {
  if (idea.type !== 'rule') return undefined
  if (o.saved.some(r => (r.scope === 'global' || r.project === o.root) && isSameRule(r.rule, idea.text))) return 'saved'
  if (idea.offer === 'known') return 'known'
  // Waiting, unless the card's "Don't save" took it off: then the button comes back.
  if (idea.offer === 'waiting' && o.waiting.some(l => isSameRule(l.rule, idea.text))) return 'waiting'
  return undefined
}

/** A rule idea becomes a learning, so reflect's card offers it with its own CLAUDE.md choice and save. */
async function offerRule($: EngineInterface, i: number) {
  const idea = (await read($, ideas))?.ideas[i]
  if (idea === undefined || idea.type !== 'rule') return
  const root = await $.session.root()
  const io = ioOf($)
  const verdict = { isRule: true, rule: idea.text, scope: 'project' as const, confidence: 1 }
  const paths = claudePaths((await $.env.get('HOME')) ?? '', root)
  await record(io, { verdict, root, isExplicit: true, said: '', files: [paths.project, paths.global] })
  const kept = (await items(io)).find(l => isHere(l, root) && l.status !== 'skipped' && isSameRule(l.rule, idea.text))
  const offer: Idea['offer'] = kept?.status === 'saved' ? 'known' : 'waiting'
  await update($, ideas, view => (view === null ? view : { ...view, ideas: view.ideas.map((one, j) => (j === i ? { ...one, offer } : one)) }))
  await refreshBand($, root)
}

async function copyIdea($: EngineInterface, i: number, surface: RenderSurface) {
  const idea = (await read($, ideas))?.ideas[i]
  if (idea === undefined) return
  if (!(await $.ui.copy({ text: idea.text, surface })).isCopied) return $.ui.toast(mineWords().copyFailed)
  await update($, copied, () => idea.text)
  $.clock.after(COPIED_MS, () => void update($, copied, now => (now === idea.text ? null : now)))
}

function actions($: EngineInterface, deps: MineDeps): PaneActions {
  const quiet = (what: string) => () => $.ui.log(`reflect: ${what} failed`, { to: 'debug' })
  return {
    save: i => void offerRule($, i).catch(quiet('saving an idea')),
    copy: (i, surface) => void copyIdea($, i, surface).catch(quiet('copying an idea')),
    again: () => void start($, deps).catch(quiet('/mine')),
  }
}

/**
 * With the MODZ hub on, the opened pane takes its one panel and the hub and every other pane step aside
 * (kit/stage.ts). Ideas has no hub row, so its own id names it there. A failed note is only logged.
 */
async function reportShown($: EngineInterface) {
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'reflect-mod', key: 'shown' }, shownOf(PANE, await $.clock.now()))
  } catch {
    $.ui.log('reflect: could not tell MODZ the Ideas pane is shown', { to: 'debug' })
  }
}

/** `/mine` is registered with the mod's other commands, at its one session.start. */
export function wireMine(on: On, deps: MineDeps) {
  // The command answers with no text: a transcript row would be read by the model on its next request.
  on('command.run', { command: MINE_COMMAND }, async $ => {
    await start($, deps)
    const opened = await $.ui.open({ id: PANE, title: mineWords().title })
    if (opened.isPlaced) await reportShown($)
    return {}
  })

  // Another pane took the hub's one panel: Ideas steps aside rather than wait as a tab.
  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    if (isOffStage(e.value, PANE)) await $.ui.close({ id: PANE })
    return done
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const view = (await read($, ideas)) ?? READING
    const root = await $.session.root()
    const marks = { waiting: await read($, pending), saved: await read($, savedThisSession), root }
    const input = { view, states: view.ideas.map(idea => stateOf(idea, marks)), copied: await read($, copied), on: actions($, deps) }
    const ui = $.ui.resolve(e)
    const tree = ideasPane(ui, input, { isLight: deps.look().isLight, columns: e.props.bodyColumns, surface: e.surface })
    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    // Written when pressed, never while drawing; a failure only goes to the debug log.
    const goHome = () => void $.clock.now().then(at => $.state.set(HOME, { at })).catch(() => $.ui.log('reflect: could not go back to MODZ', { to: 'debug' }))
    return pinned(e, withHome(ui, tree, isHubOn ? goHome : null))
  })
}
