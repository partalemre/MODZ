import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Register } from 'claude-code'

import {
  compact, decline, dismiss, drop, forgetCompacted, isOffered, isOwnCompaction, measured, noteCompacted, noteSection, notesBefore, remove, resetConversation,
  restore, runCommand, snooze, take, toggleInject, write, writeHub,
} from './actions'
import { bandCard, withTheirs } from './band'
import { cardOf, isBandQuiet, isLouderNow } from './gate'
import { isOpenFor } from './hub'
import { reasonOf } from './io'
import type { Io, ValueKey, Values } from './io'
import { withHome } from './kit/home'
import { setLang } from './kit/lang'
import { pinned } from './kit/pin'
import { isSame } from './kit/same'
import { isOffStage, shownOf } from './kit/stage'
import { resolveLight } from './kit/tokens'
import type { DrawCtx } from './kit/ui'
import { COMMAND, PANE, settingsOf } from './limits'
import type { Settings } from './limits'
import { loadNotes } from './notes'
import { motion, paneTree } from './pane'
import { loadNote, repoOf } from './state'
import { errorLine, touchedPath, withFile } from './track'
import { words } from './words'

// Watches the context fill and every compaction. Before one, working notes go to `.claude/handoff/`; after it, one
// line offers them back. Near auto-compaction one line asks: compact now, or hand off a note to the next fresh chat.

const percentAtom = atom({ plugin: 'handoff', key: 'percent' } as const, null)
const snoozeAtom = atom({ plugin: 'handoff', key: 'snoozeUntil' } as const, null)
const stageAtom = atom({ plugin: 'handoff', key: 'stage' } as const, 'idle')
const failureAtom = atom({ plugin: 'handoff', key: 'failure' } as const, null)
const latestAtom = atom({ plugin: 'handoff', key: 'latest' } as const, null)
const filesAtom = atom({ plugin: 'handoff', key: 'files' } as const, [])
const errorAtom = atom({ plugin: 'handoff', key: 'lastError' } as const, null)
const noticeAtom = atom({ plugin: 'handoff', key: 'notice' } as const, null)
const declinedAtom = atom({ plugin: 'handoff', key: 'declined' } as const, null)
const notesAtom = atom({ plugin: 'handoff', key: 'notes' } as const, [])
const compactedAtom = atom({ plugin: 'handoff', key: 'compacted' } as const, null)
const autoAtAtom = atom({ plugin: 'handoff', key: 'autoAt' } as const, null)
const hubRef = { plugin: 'handoff', key: 'hub' } as const
const homeRef = { plugin: 'handoff', key: 'home' } as const
const hubOnRef = { plugin: 'modz', key: 'isOn' } as const
const tasksRef = { plugin: 'plan-steps', key: 'tasks' } as const
// Louder notices share the band's notice slot (DESIGN.md §6): while one shows, the handoff card waits.
const cacheTaxNotice = { plugin: 'cache-tax', key: 'notice' } as const
const knowNotice = { plugin: 'you-should-know', key: 'notice' } as const
const reflectNotice = { plugin: 'reflect', key: 'notice' } as const
const budgetNotice = { plugin: 'session-budget', key: 'notice' } as const

type Cells = { [K in ValueKey]: { get: () => Promise<Values[K]>; set: (value: Values[K]) => Promise<unknown> } }

// Each value of this mod, read and written through its own atom (the scan reads each by name).
function cellsOf($: EngineInterface): Cells {
  return {
    percent: { get: () => read($, percentAtom), set: value => update($, percentAtom, () => value) },
    snoozeUntil: { get: () => read($, snoozeAtom), set: value => update($, snoozeAtom, () => value) },
    stage: { get: () => read($, stageAtom), set: value => update($, stageAtom, () => value) },
    failure: { get: () => read($, failureAtom), set: value => update($, failureAtom, () => value) },
    latest: { get: () => read($, latestAtom), set: value => update($, latestAtom, () => value) },
    files: { get: () => read($, filesAtom), set: value => update($, filesAtom, () => value) },
    lastError: { get: () => read($, errorAtom), set: value => update($, errorAtom, () => value) },
    notice: { get: () => read($, noticeAtom), set: value => update($, noticeAtom, () => value) },
    declined: { get: () => read($, declinedAtom), set: value => update($, declinedAtom, () => value) },
    notes: { get: () => read($, notesAtom), set: value => update($, notesAtom, () => value) },
    compacted: { get: () => read($, compactedAtom), set: value => update($, compactedAtom, () => value) },
    autoAt: { get: () => read($, autoAtAtom), set: value => update($, autoAtAtom, () => value) },
  }
}

// Every open of the pane is a person's (the card's button, /handoff show, the hub's row). Placed, it takes a running
// hub's one panel, so the hub and every other pane step aside (kit/stage.ts); a failed note of that is only logged.
async function openPane($: EngineInterface): Promise<void> {
  motion.reset()
  const opened = await $.ui.open({ id: PANE, title: words().title, focus: true })
  try {
    if (!opened.isPlaced || (await $.state.get({ plugin: 'modz', key: 'isOn' })).value !== true) return
    await $.state.set({ plugin: 'handoff', key: 'shown' }, shownOf(PANE, await $.clock.now()))
  } catch (error) {
    $.ui.log(`handoff: shown failed (${reasonOf(error)})`, { to: 'debug' })
  }
}

// The engine calls the other files use, as closures over this hook's `$`.
function ioOf($: EngineInterface): Io {
  const cells = cellsOf($)

  return {
    get: key => cells[key].get(),
    put: async (key, value) => {
      if (!isSame(await cells[key].get(), value)) await cells[key].set(value)
    },
    hub: { get: async () => (await $.state.get(hubRef)).value, set: async card => void (await $.state.set(hubRef, card)) },
    tasks: async () => (await $.state.get(tasksRef)).value,
    store: { get: key => $.store.get(key), set: (key, note) => $.store.set(key, note), delete: key => $.store.delete(key) },
    now: () => $.clock.now(),
    root: () => $.session.root(),
    sessionId: () => $.session.id(),
    messages: () => $.session.messages(),
    complete: request => $.model.complete(request),
    run: (argv, options) => $.process.run(argv, options),
    writeFile: (path, text) => $.fs.write(path, text),
    compact: () => $.session.compact(),
    autoCompact: async () => {
      const { context } = await $.session.usage({ breakdown: 'summary' })
      const isOn = context.breakdown?.isAutoCompactEnabled === true

      return { tokens: isOn ? (context.breakdown?.autoCompactThreshold ?? null) : null, window: context.window }
    },
    append: text => $.session.append({ message: { type: 'user', content: [{ type: 'text', text }] } }),
    openPane: () => openPane($),
    log: text => $.ui.log(`handoff: ${text}`, { to: 'debug' }),
  }
}

// Light or dark for Box/Text hex: MODZ_THEME wins, then Claude's own theme setting.
async function isLightNow($: EngineInterface): Promise<boolean> {
  const override = await $.env.get('MODZ_THEME').catch(() => undefined)
  const rows = await $.config.list().catch(() => [])

  return resolveLight({ override, theme: rows.find(row => row.key === 'theme')?.value })
}

function hookSession(on: On, settings: Settings): void {
  on('session.start', async ($, e, next) => {
    setLang(await $.env.get('MODZ_LANG').catch(() => undefined))
    const io = ioOf($)
    try {
      await $.command.register({ name: COMMAND, description: words().commandHelp, argumentHint: '[show]' })
      const repo = await repoOf(io)
      await loadNote(io, repo)
      await loadNotes(io, repo)
      await writeHub(io, settings)
    } catch (error) {
      io.log(`could not start (${reasonOf(error)})`)
    }

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    const io = ioOf($)
    if (e.reason === 'clear') await resetConversation(io, settings).catch(error => io.log(`reset skipped (${reasonOf(error)})`))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    const done = await next(e)
    if (e.changed.includes('context')) await measured(ioOf($), settings, e.context.percent === undefined ? null : Math.round(e.context.percent))

    return done
  }).catch(($, e, next) => next(e))
}

function hookCompaction(on: On): void {
  // Any compaction of the main conversation: the notes first, then core; a precompute installs nothing. Nothing
  // after `next` may throw, or `.catch` would compact a second time.
  on('session.compact', async ($, e, next) => {
    if (e.agentId !== undefined || e.trigger === 'precompute' || isOwnCompaction()) return next(e)
    const io = ioOf($)
    const entry = await notesBefore(io, e.trigger)
    const result = await next(e)
    await noteCompacted(io, { trigger: e.trigger, result, entry }).catch(error => io.log(`after compaction (${reasonOf(error)})`))

    return result
  }).catch(($, e, next) => next(e))
}

function hookTools(on: On): void {
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    if (result.deny !== undefined) return result
    const tool = String(e.tool)
    const path = touchedPath(tool, e)
    if (result.isError === true) await ioOf($).put('lastError', errorLine(tool, result.text))
    else if (path !== null) await update($, filesAtom, files => withFile(files, path))

    return result
  }).catch(($, e, next) => next(e))
}

function hookCommands(on: On, settings: Settings): void {
  on('command.run', { command: COMMAND }, async ($, e) => ({ text: await runCommand(ioOf($), settings, e.args.trim().toLowerCase()) }))

  // The main panel's open request opens this pane, or brings it forward; it never closes it.
  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOpenFor(e.value, PANE)) await ioOf($).openPane()

    return done
  }).catch(($, e, next) => next(e))

  // Another pane took the hub's one panel: this one steps aside rather than wait as a tab.
  on('state.set', { plugin: 'modz', key: 'stage' }, async ($, e, next) => {
    const done = await next(e)
    if (isOffStage(e.value, PANE)) await $.ui.close({ id: PANE })

    return done
  }).catch(($, e, next) => next(e))

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    const section = await noteSection(ioOf($))

    return section === null ? composed : { sections: [...composed.sections, section] }
  }).catch(($, e, next) => next(e))
}

// When each louder notice was first seen, by its value: one left set for ever must not hold the card back for ever.
const louderSince = new Map<string, number>()

async function hasLouderNotice($: EngineInterface): Promise<boolean> {
  const now = await $.clock.now()
  const others: { value?: unknown }[] = [
    await $.state.get(cacheTaxNotice as never),
    await $.state.get(knowNotice as never),
    await $.state.get(reflectNotice as never),
    await $.state.get(budgetNotice as never),
  ]
  const values = others.map(other => other.value)

  return values.some((value, index) => value !== undefined && value !== null && isLouderNow(louderSince, { key: `${index}:${JSON.stringify(value)}`, now }))
}

// A press runs its action in the background; a failure only goes to the debug log.
const pressed = (io: Io, run: () => Promise<unknown>) => () => void run().catch(error => io.log(`press failed (${reasonOf(error)})`))

function hookBand(on: On, settings: Settings): void {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    if (isBandQuiet({ isWorking: e.props.isWorking, hasSurvey: e.props.hasSurvey })) return theirs
    const io = ioOf($)
    const percent = await io.get('percent')
    const compacted = await io.get('compacted')
    const autoAt = await io.get('autoAt')
    const asked = cardOf({ percent, threshold: settings.threshold, snoozeUntil: await io.get('snoozeUntil'), stage: await io.get('stage'), autoAt, hasCompacted: compacted !== null })
    const kind = asked ?? ((await isOffered(io)) ? 'offer' : null)
    // Read after the card's own values, so the next measurement draws again and a stuck notice times out.
    if (kind === null || (await hasLouderNotice($))) return theirs
    const draw: DrawCtx = { ui: $.ui.resolve(e), surface: e.surface, isLight: await isLightNow($) }
    const card = bandCard(draw, {
      kind, percent, threshold: settings.threshold, autoAt: typeof autoAt === 'number' ? autoAt : null, compacted,
      note: await io.get('latest'), failure: await io.get('failure'), columns: e.props.bodyColumns,
      actions: {
        onWrite: pressed(io, () => write(io, settings)),
        onCompact: pressed(io, () => compact(io, settings)),
        onSnooze: pressed(io, () => snooze(io, settings)),
        onShow: pressed(io, () => io.openPane()),
        onDismiss: pressed(io, () => dismiss(io, settings)),
        onContinue: pressed(io, () => take(io, settings)),
        onDecline: pressed(io, () => decline(io)),
        onRestore: pressed(io, () => restore(io)),
        onForget: pressed(io, () => forgetCompacted(io)),
      },
      now: await io.now(),
    })

    return pinned(e, withTheirs(draw, card, theirs))
  })
}

function hookPane(on: On, settings: Settings): void {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const io = ioOf($)
    const draw: DrawCtx = { ui: $.ui.resolve(e), surface: e.surface, isLight: await isLightNow($), motion }
    const isHubOn = (await $.state.get(hubOnRef)).value === true
    const goHome = pressed(io, async () => $.state.set(homeRef, { at: await $.clock.now() }))
    const autoAt = await io.get('autoAt')
    const tree = paneTree(draw, {
      note: await io.get('latest'), now: await io.now(), percent: await io.get('percent'), threshold: settings.threshold,
      autoAt: typeof autoAt === 'number' ? autoAt : null, notes: await io.get('notes'),
      stage: await io.get('stage'), columns: e.props.bodyColumns,
      actions: {
        onWrite: pressed(io, () => write(io, settings)),
        onToggle: pressed(io, () => toggleInject(io, settings)),
        onDelete: pressed(io, () => remove(io, settings)),
        onDrop: path => pressed(io, () => drop(io, settings, path))(),
      },
    })

    return pinned(e, withHome(draw.ui, tree, isHubOn ? goHome : null))
  })
}

export const register: Register = (on, options) => {
  const settings = settingsOf(options)
  hookSession(on, settings)
  hookCompaction(on)
  hookTools(on)
  hookCommands(on, settings)
  hookBand(on, settings)
  hookPane(on, settings)
}
