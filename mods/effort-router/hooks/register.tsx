// effort-router: each main-loop turn's effective effort and model, seen in a small pane and on the MODZ hub
// (`show`, no tokens); in `auto`, a prompt the judge calls light goes at low effort. Subagent steps are never
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
import { resolveLight } from './kit/tokens'
import { paneTree } from './pane'
import { DEFAULT_MODE, isSkipped, resolveMode, routedEffort } from './route'
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

// The module's own: the judge's settings, the theme override, and the routing the last judged prompt set.
const session = { env: {} as JudgeEnv, themeOverride: undefined as string | undefined, route: null as RouteClass | null }

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

// The hub's row (DESIGN.md §9): the hub does not know this mod, so the card names its own title, hint, icon and
// section. Written only when what it shows changes.
async function writeHub($: EngineInterface): Promise<void> {
  const said = words()
  const shown = hubOf(await read($, turnsAtom), await read($, modeAtom))
  const card = { pane: PANE, ...shown, title: said.title, hint: said.hint, icon: 'gauge', section: 'meter' as const }
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

const openPane = ($: EngineInterface, isFocused: boolean) =>
  $.ui.open({ id: PANE, title: words().title, ...(isFocused ? { focus: true } : {}) })

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

  on('command.run', { command: COMMAND }, async $ => (await openPane($, false), {}))

  // The hub's open request: opens only, so a pane already open comes forward instead of closing.
  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    const pane = (e.value as { pane?: unknown } | undefined)?.pane
    if (pane === PANE) await openPane($, true)

    return done
  }).catch(($, e, next) => next(e))
}

function turnHooks(on: On): void {
  // At most one judge call per prompt, and only in `auto`; a skipped prompt keeps the last routing.
  on('prompt.submit', async ($, e, next) => {
    const facts = { text: e.text, origin: e.origin.kind, isMidTurn: e.turnId !== undefined }
    if ((await read($, modeAtom)) === 'auto' && !isSkipped(facts)) session.route = await classify(judgeIoOf($), e.text)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    const done = await next(e)
    const mode = await read($, modeAtom)
    if (mode === 'off') return done
    const row = startedRow({ turnId: e.turnId, at: await $.clock.now(), text: e.text, cls: mode === 'auto' ? session.route : null })
    await setTurns($, turns => withTurn(turns, row))

    return done
  }).catch(($, e, next) => next(e))

  // Main-loop steps only: a subagent's request goes on exactly as it came.
  on('turn.step', async function* ($, e, next) {
    const mode = await read($, modeAtom)
    if (e.agentId !== undefined || mode === 'off') return yield* next(e)
    const turns = await read($, turnsAtom)
    const known = turns.find(turn => turn.turnId === e.turnId)
    const cls = mode === 'auto' ? (known?.cls ?? session.route) : null
    const sent = mode === 'auto' ? routedEffort(cls, e.effort) : e.effort
    const at = await $.clock.now()
    const seeded = known === undefined ? withTurn(turns, startedRow({ turnId: e.turnId, at, text: '', cls })) : turns
    await setTurns($, () => withStep(seeded, { turnId: e.turnId, asked: e.effort, sent, model: e.model }))

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

export const register: Register = (on, options) => {
  sessionHooks(on, options)
  turnHooks(on)
  paneHooks(on)
}
