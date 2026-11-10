// effort-router: each main-loop turn's effective effort and model, seen in a small pane and on the MODZ hub, or in
// hud-pro's Usage pane while it runs (`show`, no tokens); in `auto`, a light prompt goes at low effort. Subagent steps are never
// touched, and a turn is never sent above the person's own setting.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { EffortMode, HubCard, RouteClass, TurnRow } from '../types'
import { classify } from './classify'
import { withHome } from './kit/home'
import type { JudgeEnv, JudgeIo } from './kit/judge'
import { setLang } from './kit/lang'
import { pinned } from './kit/pin'
import { isSame } from './kit/same'
import { isOffStage, shownOf } from './kit/stage'
import { resolveLight } from './kit/tokens'
import { motion, paneTree } from './pane'
import { loweredRow } from './lowered'
import type { Lowered } from './lowered'
import { DEFAULT_MODE, isPerson, isSkipped, modeOf, resolveMode, routedEffort } from './route'
import type { PromptFacts } from './route'
import { effortSection, isLive, loweredNotice } from './section'
import { hubOf, startedRow, withStep, withTurn } from './turns'
import { words } from './words'

const PANE = 'effort'
const COMMAND = 'effort-router'
const MODE_STORE_KEY = 'mode'
const DEFAULT_COLUMNS = 80

const modeAtom = atom({ plugin: 'effort-router', key: 'mode' } as const, DEFAULT_MODE)
const turnsAtom = atom({ plugin: 'effort-router', key: 'turns' } as const, [] as TurnRow[])
const HUB = { plugin: 'effort-router', key: 'hub' } as const
const HOME = { plugin: 'effort-router', key: 'home' } as const
const HUB_ON = { plugin: 'modz', key: 'isOn' } as const
const SECTION = { plugin: 'effort-router', key: 'section' } as const
const NOTICE = { plugin: 'effort-router', key: 'notice' } as const

// The module's own: the judge's settings, the theme override, the routing judged for the person's prompt whose turn
// starts next (consumed by that turn alone), whether a task is under way, and the last lowered turn the band names.
const session = {
  env: {} as JudgeEnv,
  themeOverride: undefined as string | undefined,
  route: null as RouteClass | null,
  isInTask: false,
  // The running turn's own prompt, kept only to send it again from the band.
  turn: null as { turnId: string; text: string } | null,
  lowered: null as Lowered | null,
}

const log = ($: EngineInterface, line: string) => $.ui.log(`effort-router: ${line}`, { to: 'debug' })

// Read once at session.start. Spelled out: the engine admits an env read by a literal name only.
async function judgeEnvOf($: EngineInterface): Promise<JudgeEnv> {
  const backend = await $.env.get('MODZ_JUDGE').catch(() => undefined)
  const typesafeKey = await $.env.get('TYPESAFE_API_KEY').catch(() => undefined)

  return { backend, typesafeKey }
}

// The engine calls the judge runs on; `classify` adds the mask.
function judgeIoOf($: EngineInterface): JudgeIo {
  return {
    complete: request => $.model.complete(request),
    fetch: (url, init) => $.http.fetch(url, init),
    sleep: ms => $.clock.sleep(ms),
    env: session.env,
  }
}

// While hud-pro runs, its Usage pane is this mod's one place: the section there, no pane or hub row of its own.
const isHosted = async ($: EngineInterface): Promise<boolean> => (await $.state.get({ plugin: 'hud-pro', key: 'host' })).value === true
// The section hud-pro's Usage pane draws, written only when it changes (with or without hud-pro: it may come later).
async function writeSection($: EngineInterface): Promise<void> {
  const section = effortSection(await read($, turnsAtom), await read($, modeAtom))
  const { value } = await $.state.get(SECTION)
  if (value === undefined || !isSame(value, section)) await $.state.set(SECTION, section)
}

// The lowered turn's notice for the shared line above the prompt, so the quieter meters wait behind it (DESIGN.md §6).
async function setLowered($: EngineInterface, lowered: Lowered | null): Promise<void> {
  session.lowered = lowered
  $.ui.invalidate('ui.render')
  await $.state.set(NOTICE, lowered === null ? null : loweredNotice(lowered)).catch(() => log($, 'the notice could not be written'))
}

// The louder notices of the shared line, top first (DESIGN.md §6): while one is live the lowered row waits.
async function isOutranked($: EngineInterface): Promise<boolean> {
  const now = await $.clock.now()
  const louder = [await $.state.get({ plugin: 'reflect', key: 'notice' }), await $.state.get({ plugin: 'you-should-know', key: 'notice' }),
    await $.state.get({ plugin: 'cache-tax', key: 'notice' }), await $.state.get({ plugin: 'session-budget', key: 'notice' })]

  return louder.some(({ value }) => isLive(value, now))
}

// The hub's row (DESIGN.md §9): the hub does not know this mod, so the card names its own title, hint, icon and
// section. Written only when what it shows changes; the section with it.
async function writeHub($: EngineInterface): Promise<void> {
  await writeSection($)
  if (await isHosted($)) return
  const said = words()
  const shown = hubOf(await read($, turnsAtom), await read($, modeAtom))
  const card = { pane: PANE, ...shown, title: said.title, hint: said.hint, icon: 'bolt', section: 'meter' as const }
  const { value } = await $.state.get(HUB)
  if (value !== undefined && isSame({ ...value, at: 0 }, { ...card, at: 0 })) return
  const written: HubCard = { ...card, at: await $.clock.now() }
  await $.state.set(HUB, written)
}

async function setTurns($: EngineInterface, change: (turns: TurnRow[]) => TurnRow[]): Promise<void> {
  const before = await read($, turnsAtom)
  const after = change(before)
  if (isSame(before, after)) return
  await update($, turnsAtom, () => after)
  await writeHub($)
}

async function setMode($: EngineInterface, mode: EffortMode): Promise<void> {
  if ((await read($, modeAtom)) !== mode) await update($, modeAtom, () => mode)
  await $.store.set(MODE_STORE_KEY, mode)
  await writeHub($)
}

// Placed, the pane takes a running hub's one panel, so the hub and every other pane step aside (kit/stage.ts).
// A failed note of that is only logged: the pane is open either way.
async function reportShown($: EngineInterface): Promise<void> {
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'effort-router', key: 'shown' }, shownOf(PANE, await $.clock.now()))
  } catch (error) {
    $.ui.log(`effort-router: shown failed (${String(error)})`, { to: 'debug' })
  }
}

async function openPane($: EngineInterface, isFocused: boolean): Promise<void> {
  motion.reset()
  const opened = await $.ui.open({ id: PANE, title: words().title, ...(isFocused ? { focus: true } : {}) })
  if (opened.isPlaced) await reportShown($)
}

type On = Parameters<Register>[0]
type Options = Parameters<Register>[1]

function sessionHooks(on: On, options: Options): void {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    const done = await next(e)
    session.env = await judgeEnvOf($)
    session.themeOverride = await $.env.get('MODZ_THEME').catch(() => undefined)
    const stored = await $.store.get(MODE_STORE_KEY).catch(() => undefined)
    await update($, modeAtom, () => resolveMode(stored, options.mode))
    await $.command.register({ name: COMMAND, description: words().command })
    await writeHub($)

    return done
  })

  // While hud-pro runs, the command opens its Usage pane at this mod's section instead.
  on('command.run', { command: COMMAND }, async $ => {
    if (await isHosted($)) await $.state.set({ plugin: 'effort-router', key: 'openUsage' }, { section: 'effort', at: await $.clock.now() })
    else await openPane($, false)

    return {}
  })

}

// hud-pro's Usage pane and the shared line: a mode button pressed there, and a louder notice that clears.
function usageHooks(on: On): void {
  // A press on the section's mode buttons in hud-pro's Usage pane.
  on('state.set', { plugin: 'hud-pro', key: 'press' }, async ($, e, next) => {
    const done = await next(e)
    const mode = e.value?.section === 'effort' ? modeOf(e.value.action) : undefined
    if (mode !== undefined) await setMode($, mode)

    return done
  }).catch(($, e, next) => next(e))

  // A louder notice that clears hands the shared line back to the lowered row.
  on('state.set', { key: 'notice' } as any, async ($: EngineInterface, e: any, next: any) => {
    const done = await next(e)
    if (session.lowered !== null && e.plugin !== 'effort-router') $.ui.invalidate('ui.render')

    return done
  }).catch(($: EngineInterface, e: any, next: any) => next(e))

  // The hub's open request: opens only, so a pane already open comes forward instead of closing.
  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    const pane = (e.value as { pane?: unknown } | undefined)?.pane
    if (pane === PANE && !(await isHosted($))) await openPane($, true)

    return done
  }).catch(($, e, next) => next(e))

  // Another pane took the hub's one panel: this one steps aside rather than wait as a tab.
  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    if (isOffStage(e.value, PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($, e, next) => next(e))
}

// The judge's routing for this prompt alone: null for a skipped one, which then goes at the person's own effort.
async function judgeFor($: EngineInterface, facts: PromptFacts): Promise<RouteClass | null> {
  if ((await read($, modeAtom)) !== 'auto' || isSkipped(facts)) return null
  const cls = await classify(judgeIoOf($), facts.text)
  if (cls !== null) session.isInTask = cls !== 'light'

  return cls
}

function turnHooks(on: On): void {
  // At most one judge call per prompt, and only in `auto`. A person's new prompt clears the band's last notice.
  on('prompt.submit', async ($, e, next) => {
    const facts = { text: e.text, origin: e.origin.kind, isMidTurn: e.turnId !== undefined, isInTask: session.isInTask }
    if (!facts.isMidTurn) session.route = await judgeFor($, facts)
    if (isPerson(facts.origin) && session.lowered !== null) await setLowered($, null)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    const done = await next(e)
    const mode = await read($, modeAtom)
    const cls = mode === 'auto' ? session.route : null
    session.route = null
    if (mode === 'off') return done
    session.turn = { turnId: e.turnId, text: e.text }
    const row = startedRow({ turnId: e.turnId, at: await $.clock.now(), text: e.text, cls })
    await setTurns($, turns => withTurn(turns, row))

    return done
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) session.route = null

    return next(e)
  }).catch(($, e, next) => next(e))

  // Main-loop steps only: a subagent's request goes on exactly as it came.
  on('turn.step', async function* ($, e, next) {
    const mode = await read($, modeAtom)
    if (e.agentId !== undefined || mode === 'off') return yield* next(e)
    const turns = await read($, turnsAtom)
    const known = turns.find(turn => turn.turnId === e.turnId)
    // A turn no judged prompt started (a continuation, a notification) goes at the person's own effort.
    const cls = mode === 'auto' ? (known?.cls ?? null) : null
    const sent = mode === 'auto' ? routedEffort(cls, e.effort) : e.effort
    const at = await $.clock.now()
    const seeded = known === undefined ? withTurn(turns, startedRow({ turnId: e.turnId, at, text: '', cls })) : turns
    await setTurns($, () => withStep(seeded, { turnId: e.turnId, asked: e.effort, sent, model: e.model }))
    if (sent !== e.effort && session.turn?.turnId === e.turnId && session.lowered?.turnId !== e.turnId) {
      await setLowered($, { turnId: e.turnId, text: session.turn.text, asked: e.effort, sent })
    }

    return yield* next(sent === e.effort ? e : { ...e, effort: sent })
  })
}

function paneHooks(on: On): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const rows = await $.config.list().catch(() => [])
    const isLight = resolveLight({ override: session.themeOverride, theme: rows.find(row => row.key === 'theme')?.value })
    const look = { ui, surface: e.surface, isLight, columns: e.props.bodyColumns || e.viewport?.columns || DEFAULT_COLUMNS }
    const view = { mode: await read($, modeAtom), turns: await read($, turnsAtom), now: await $.clock.now() }
    // Written when pressed, never while drawing; a failure only goes to the debug log.
    const onMode = (mode: EffortMode) => void setMode($, mode).catch(cause => log($, `the mode could not be kept: ${String(cause)}`))
    const isHubOn = (await $.state.get(HUB_ON)).value === true
    const goHome = () => void $.clock.now().then(at => $.state.set(HOME, { at })).catch(() => log($, 'could not go back to MODZ'))

    return pinned(e, withHome(ui, paneTree(look, { view, onMode }), isHubOn ? goHome : null))
  })
}

// The last lowered turn, above the prompt where the person looks: what it went at, and one press to send the same
// prompt again at their own effort (a plugin's prompt, which the judge never reads).
function bandHooks(on: On): void {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    const lowered = session.lowered
    if (lowered === null || e.props.hasSurvey || (await isOutranked($))) return theirs
    const resend = () => {
      void setLowered($, null)
      void $.prompt.submit({ text: lowered.text, asUser: true }).catch(() => log($, 'could not send the prompt again'))
    }

    return pinned(e, loweredRow($.ui.resolve(e), { theirs, lowered, resend }))
  }).catch(($, e, next) => next(e))
}

export const register: Register = (on, options) => {
  sessionHooks(on, options)
  usageHooks(on)
  turnHooks(on)
  paneHooks(on)
  bandHooks(on)
}
