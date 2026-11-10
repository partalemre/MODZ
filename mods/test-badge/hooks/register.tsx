import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Register, RenderSurface } from 'claude-code'

import type { Commands } from './detect'
import { hookBand } from './band-hook'
import { hookCi } from './ci'
import { hookHandoff } from './handoff'
import { HUB_PANE, isOpenFor } from './hub'
import { EMPTY, OPEN_TIMEOUT_MS } from './limits'
import { openCandidates, pathOf, placeOf } from './open'
import { overridesOf, type Overrides } from './options'
import { withHome } from './home'
import { hookRuns } from './runs'
import { isOffStage, shownOf } from './stage'
import { pinned } from './pin'
import { AUTO } from './tidemark'
import { motion } from './pane-pic'
import { paneTree } from './view'
import { words } from './words'
import type { CiWatch, Failure, SuiteFilter } from '../types'

// The $.state values this file reads or writes, declared here: the scan lists them per file.
const badgeAtom = atom({ plugin: 'test-badge', key: 'badge' } as const, EMPTY)
const ciAtom = atom({ plugin: 'test-badge', key: 'ci' } as const, null as CiWatch | null)
const enabledAtom = atom({ plugin: 'test-badge', key: 'isEnabled' } as const, true)
const filterAtom = atom({ plugin: 'test-badge', key: 'filter' } as const, 'all' as SuiteFilter)
const noticeAtom = atom({ plugin: 'test-badge', key: 'notice' } as const, null)
const commandsAtom = atom({ plugin: 'test-badge', key: 'commands' } as const, null as Commands | null)
const themeAtom = atom({ plugin: 'test-badge', key: 'theme' } as const, AUTO)
// A press asks runs.ts for a run by bumping this count.
const rerunAtom = atom({ plugin: 'test-badge', key: 'rerun' } as const, 0)

const COMMAND = 'test-badge'
const PANE = 'test-badge'
const STORE_KEY = 'test-badge.enabled'
// `on`/`off` set the switch; any other argument flips it.
const SWITCH_ARGS = new Map([['on', true], ['off', false]])

const homeRef = { plugin: 'test-badge', key: 'home' } as const

// Opens the failure's file at its line; where no opener runs, copies "file:line" instead.
async function openFailure($: EngineInterface, failure: Failure, where: { root: string; template: string; surface: RenderSurface }): Promise<void> {
  const path = pathOf(failure, where.root)
  if (path === null) return
  const isWindows = (await $.env.get('OS').catch(() => undefined)) === 'Windows_NT'
  for (const argv of openCandidates(where.template, { path, line: failure.line }, isWindows)) {
    const out = await $.process.run(argv, { timeoutMs: OPEN_TIMEOUT_MS }).catch(() => null)
    if (out !== null && out.exitCode === 0) return
  }
  const place = placeOf(failure)
  const copied = await $.ui.copy({ text: place, surface: where.surface })
  $.ui.toast(copied.isCopied ? words().openCopied(place) : words().openFailed(place))
}

// Tells the hub this pane now holds the panel, so the hub and every other pane step aside (kit/stage.ts).
async function reportShown($: EngineInterface): Promise<void> {
  try {
    if ((await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'test-badge', key: 'shown' }, shownOf(HUB_PANE, await $.clock.now()))
  } catch (error) {
    $.ui.log(`test-badge: shown failed (${String(error)})`, { to: 'debug' })
  }
}

// The same pane whoever asks (/test-badge details, the MODZ main panel; band-hook.tsx opens it the same way); an
// open one comes forward.
async function openPane($: EngineInterface): Promise<void> {
  motion.reset()
  const opened = await $.ui.open({ id: PANE, title: words().paneTitle, focus: true })
  if (opened.isPlaced) await reportShown($)
}

async function runCommand($: EngineInterface, arg: string): Promise<string> {
  if (arg === 'run') {
    await update($, rerunAtom, count => count + 1)

    return words().commandRunning
  }
  if (arg === 'details') {
    await openPane($)

    return words().commandDetails
  }
  const isOn = SWITCH_ARGS.get(arg) ?? !(await read($, enabledAtom))
  await update($, enabledAtom, () => isOn)
  await $.store.set(STORE_KEY, isOn)
  if (!isOn) await update($, noticeAtom, () => null)

  return words().commandSwitched(isOn)
}

// The main panel's open request opens the details pane, or brings it forward; it never closes it. Another
// pane taking the main panel closes it, so it never waits as a tab.
function hookHub(on: On): void {
  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await openPane($)

    return done
  }).catch(($, e, next) => next(e))
  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    if (isOffStage(e.value, HUB_PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($, e, next) => next(e))
}

function hookPane(on: On, overrides: Overrides): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const badge = await read($, badgeAtom)
    const where = { root: badge.root ?? (await $.session.cwd()), template: overrides.open, surface: e.surface }

    const isHubOn = (await $.state.get({ plugin: 'modz', key: 'isOn' })).value === true
    // Written when pressed, never while drawing; a failure only goes to the debug log.
    const goHome = () => void $.clock.now().then(at => $.state.set(homeRef, { at })).catch(() => $.ui.log('test-badge: could not go back to MODZ', { to: 'debug' }))
    const ui = $.ui.resolve(e)
    const tree = paneTree(ui, {
      badge, now: await $.clock.now(), columns: e.props.bodyColumns, filter: await read($, filterAtom),
      theme: await read($, themeAtom), isRich: e.surface !== 'terminal',
      onOpen: failure => void openFailure($, failure, where),
      onRerun: () => void update($, rerunAtom, count => count + 1),
      onFilter: filter => void update($, filterAtom, () => filter),
      ci: await read($, ciAtom),
      commands: await read($, commandsAtom),
    })

    return pinned(e, withHome(ui, tree, isHubOn ? goHome : null))
  })
}

export const register: Register = (on, options) => {
  const overrides = overridesOf(options)
  hookRuns(on, overrides)
  on('command.run', { command: COMMAND }, async ($, e) => ({ text: await runCommand($, e.args.trim().toLowerCase()) }))
  hookHub(on)
  hookBand(on)
  hookPane(on, overrides)
  hookCi(on)
  hookHandoff(on)
}
