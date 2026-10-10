import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Register, RenderSurface, Timer } from 'claude-code'

import { PROBED_TEXTS, detect, goModuleOf, isSource } from './detect'
import type { RootInfo } from './detect'
import { HUB_PANE, hubOf, isOpenFor } from './hub'
import { DEBOUNCE_MS, DISMISS_AFTER_MS, EMPTY, NICE, OPEN_TIMEOUT_MS, PRIORITY, REFRESH_MS, TIMEOUT_MS, TIMEOUT_SLACK_MS, VENDOR_TOOLS, WRITE_TOOLS } from './limits'
import { openCandidates, pathOf, placeOf } from './open'
import { overridesOf, type Overrides } from './options'
import { badgeText, isFailing, parseLint, parseTests } from './parse'
import type { ParseContext } from './text'
import { bandTree } from './band'
import { isLive } from './notice'
import { pinned } from './pin'
import { AUTO, themeFrom } from './tidemark'
import { paneTree } from './view'
import type { CheckOutcome, Failure, HubCard, SuiteFilter, TestBadge } from '../types'

const COMMAND = 'test-badge'
const PANE = 'test-badge'
const STORE_KEY = 'test-badge.enabled'
// `on`/`off` set the switch; any other argument flips it.
const SWITCH_ARGS = new Map([['on', true], ['off', false]])

const badgeAtom = atom({ plugin: 'test-badge', key: 'badge' } as const, EMPTY)
const noticeAtom = atom({ plugin: 'test-badge', key: 'notice' } as const, null)
const enabledAtom = atom({ plugin: 'test-badge', key: 'isEnabled' } as const, true)
const filterAtom = atom({ plugin: 'test-badge', key: 'filter' } as const, 'all' as SuiteFilter)
const themeAtom = atom({ plugin: 'test-badge', key: 'theme' } as const, AUTO)
const hubRef = { plugin: 'test-badge', key: 'hub' } as const
// The shared notice line: every one of these outranks this mod's line (session-budget ties at 1 and wins).
const cacheTaxNotice = { plugin: 'cache-tax', key: 'notice' } as const
const knowNotice = { plugin: 'you-should-know', key: 'notice' } as const
const budgetNotice = { plugin: 'session-budget', key: 'notice' } as const
const reflectNotice = { plugin: 'reflect', key: 'notice' } as const

type Parse = (out: string, code: number, ctx: ParseContext) => CheckOutcome
const flags = { isDirty: false, isRunning: false, isQueued: false, debounce: null as Timer | null, noticeId: 0 }

async function rootInfo($: EngineInterface, cwd: string): Promise<RootInfo> {
  const names = new Set((await $.fs.list(cwd)).map(entry => entry.name))
  const texts: Record<string, string> = {}
  for (const name of PROBED_TEXTS.filter(file => names.has(file))) texts[name] = await $.fs.read(`${cwd}/${name}`)
  const vendor = new Set<string>()
  for (const tool of VENDOR_TOOLS) if (await $.fs.exists(`${cwd}/vendor/bin/${tool}`)) vendor.add(tool)

  return { names, texts, hasVendorBin: tool => vendor.has(tool) }
}

async function check($: EngineInterface, argv: string[], how: { parse: Parse; ctx: ParseContext }): Promise<CheckOutcome> {
  const started = await $.clock.now()
  try {
    const out = await $.process.run([...NICE, ...argv], { cwd: how.ctx.root, timeoutMs: TIMEOUT_MS, env: { CI: '1', FORCE_COLOR: '0' } })

    return how.parse(`${out.stdout}\n${out.stderr}`, out.exitCode, how.ctx)
  } catch {
    const isTimeout = (await $.clock.now()) - started >= TIMEOUT_MS - TIMEOUT_SLACK_MS

    return { status: isTimeout ? 'timeout' : 'error', passed: null, total: null, errors: null, failures: [], tail: [] }
  }
}

// The status line is drawn as a warning (⚠), so it holds a failure only; a green run lives in the band and the MODZ hub.
async function showStatus($: EngineInterface): Promise<void> {
  const badge = await read($, badgeAtom)
  const isShown = (await read($, enabledAtom)) && isFailing(badge)
  $.ui.status(isShown ? badgeText(badge, await $.clock.now()) : undefined)
}

async function notify($: EngineInterface, badge: TestBadge): Promise<void> {
  flags.noticeId += 1
  const id = flags.noticeId
  const now = await $.clock.now()
  const text = badgeText(badge, now) ?? ''
  const expiresAt = now + DISMISS_AFTER_MS
  await update($, noticeAtom, () => ({ id, text, isFailing: isFailing(badge), hasDetails: isFailing(badge), priority: PRIORITY, expiresAt }))
  $.clock.after(DISMISS_AFTER_MS, () => {
    void update($, noticeAtom, current => (current !== null && current.id === id ? null : current))
  })
}

async function runChecks($: EngineInterface, overrides: Overrides): Promise<void> {
  const root = await $.session.cwd()
  const info = await rootInfo($, root)
  const commands = detect(info, overrides)
  if (commands.test === null && commands.lint === null) {
    $.ui.log('test-badge: no test or lint command found here', { to: 'debug' })

    return
  }
  const ctx: ParseContext = { root, goModule: goModuleOf(info) }
  const started = await $.clock.now()
  await writeHub($, await update($, badgeAtom, badge => ({ ...badge, isRunning: true })))
  await showStatus($)
  const tests = commands.test === null ? null : await check($, commands.test, { parse: parseTests, ctx })
  const lint = commands.lint === null ? null : await check($, commands.lint, { parse: parseLint, ctx })
  const finishedAt = await $.clock.now()
  const badge: TestBadge = { tests, lint, root, finishedAt, durationMs: finishedAt - started, isRunning: false }
  await update($, badgeAtom, () => badge)
  await writeHub($, badge)
  await update($, filterAtom, () => 'all')
  await showStatus($)
  await notify($, badge)
}

// One run at a time: a request while one runs is queued and runs once after it.
async function runAll($: EngineInterface, overrides: Overrides): Promise<void> {
  if (flags.isRunning) {
    flags.isQueued = true

    return
  }
  flags.isRunning = true
  try {
    await runChecks($, overrides)
  } catch (error) {
    $.ui.log(`test-badge: run failed (${error instanceof Error ? error.message : 'unknown'})`, { to: 'debug' })
    await writeHub($, await update($, badgeAtom, badge => ({ ...badge, isRunning: false })))
  } finally {
    flags.isRunning = false
  }
  if (flags.isQueued) {
    flags.isQueued = false
    await runAll($, overrides)
  }
}

function schedule($: EngineInterface, overrides: Overrides): void {
  flags.debounce?.cancel()
  flags.debounce = $.clock.after(DEBOUNCE_MS, () => void runAll($, overrides))
}

async function isOutranked($: EngineInterface): Promise<boolean> {
  const nowMs = await $.clock.now()
  const others: { value?: unknown }[] = [
    await $.state.get(cacheTaxNotice as never), await $.state.get(knowNotice as never),
    await $.state.get(budgetNotice as never), await $.state.get(reflectNotice as never),
  ]

  return others.some(other => isLive(other.value, nowMs))
}

// Opens the failure's file at its line; where no opener runs, copies "file:line" instead.
async function openFailure($: EngineInterface, failure: Failure, where: { root: string; template: string; surface: RenderSurface }): Promise<void> {
  const path = pathOf(failure, where.root)
  if (path === null) return
  for (const argv of openCandidates(where.template, { path, line: failure.line })) {
    const out = await $.process.run(argv, { timeoutMs: OPEN_TIMEOUT_MS }).catch(() => null)
    if (out !== null && out.exitCode === 0) return
  }
  const place = placeOf(failure)
  const copied = await $.ui.copy({ text: place, surface: where.surface })
  $.ui.toast(copied.isCopied ? `Açılamadı, kopyalandı: ${place}` : `Açılamadı: ${place}`)
}

// The same pane whoever asks (Ayrıntı, /test-badge details, the MODZ main panel); an open one comes forward.
async function openPane($: EngineInterface): Promise<void> {
  await $.ui.open({ id: PANE, title: 'Testler', focus: true })
}

// The MODZ main panel's card, written only when what it shows changes.
async function writeHub($: EngineInterface, badge: TestBadge): Promise<void> {
  const shown = hubOf(badge)
  const { value } = await $.state.get(hubRef)
  if (value !== undefined && value.detail === shown.detail && value.tone === shown.tone) return
  const card: HubCard = { pane: HUB_PANE, ...shown, at: await $.clock.now() }
  await $.state.set(hubRef, card)
}

async function runCommand($: EngineInterface, arg: string, overrides: Overrides): Promise<string> {
  if (arg === 'run') {
    void runAll($, overrides)

    return 'test-badge: testler ve lint çalışıyor'
  }
  if (arg === 'details') {
    await openPane($)

    return 'test-badge: ayrıntılar açıldı'
  }
  const isOn = SWITCH_ARGS.get(arg) ?? !(await read($, enabledAtom))
  await update($, enabledAtom, () => isOn)
  await $.store.set(STORE_KEY, isOn)
  if (!isOn) await update($, noticeAtom, () => null)
  await showStatus($)

  return `test-badge ${isOn ? 'açık' : 'kapalı'}`
}

function hookRuns(on: On, overrides: Overrides): void {
  on('session.start', async ($, e, next) => {
    try {
      const saved = await $.store.get(STORE_KEY)
      await update($, enabledAtom, () => saved !== false)
      const pinned = await $.env.get('MODZ_THEME').catch(() => undefined)
      await update($, themeAtom, () => themeFrom(pinned))
      await writeHub($, await read($, badgeAtom))
      await $.command.register({ name: COMMAND, description: 'Düzenlemeden sonra arka planda test/lint: aç/kapa; run şimdi çalıştırır, details ayrıntıları açar', argumentHint: '[on|off|run|details]' })
      $.clock.every(REFRESH_MS, () => {
        void read($, badgeAtom).then(badge => (badge.finishedAt === null ? undefined : showStatus($)))
      })
    } catch {
      $.ui.log('test-badge: could not load settings', { to: 'debug' })
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => ({ text: await runCommand($, e.args.trim().toLowerCase(), overrides) }))

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    const path = (e as { file_path?: unknown }).file_path
    const isEdit = WRITE_TOOLS.has(String(e.tool)) && typeof path === 'string' && isSource(path)
    if (isEdit && result.deny === undefined && result.isError !== true) flags.isDirty = true

    return result
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && flags.isDirty && (await read($, enabledAtom))) {
      flags.isDirty = false
      schedule($, overrides)
    }

    return next(e)
  })
}

// The main panel's open request opens the details pane, or brings it forward; it never closes it.
function hookHub(on: On): void {
  on('state.set', { plugin: 'modz', key: 'open' }, async ($, e, next) => {
    const done = await next(e)
    if (isOpenFor(e.value, HUB_PANE)) await openPane($)

    return done
  }).catch(($, e, next) => next(e))
}

// The band shows a finished run's notice, or the running pill; both give way to louder notices.
async function bandOf($: EngineInterface, now: number): Promise<{ badge: TestBadge; isNotice: boolean } | null> {
  const badge = await read($, badgeAtom)
  const notice = await read($, noticeAtom)
  const isNotice = notice !== null && isLive(notice, now)
  if (!badge.isRunning && !isNotice) return null

  return (await isOutranked($)) ? null : { badge, isNotice }
}

function hookDrawing(on: On, overrides: Overrides): void {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    if (e.props.hasSurvey) return theirs
    const now = await $.clock.now()
    const shown = await bandOf($, now)
    if (shown === null) return theirs
    const { badge, isNotice } = shown

    const ui = $.ui.resolve(e)
    return pinned(e, bandTree(ui, {
      badge, now, columns: e.props.bodyColumns, theme: await read($, themeAtom), isRich: e.surface !== 'terminal',
      hasDetails: !badge.isRunning && isFailing(badge),
      onDetails: () => void openPane($),
      onDismiss: badge.isRunning || !isNotice ? undefined : () => void update($, noticeAtom, () => null),
    }, theirs))
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const badge = await read($, badgeAtom)
    const where = { root: badge.root ?? (await $.session.cwd()), template: overrides.open, surface: e.surface }

    const ui = $.ui.resolve(e)
    return pinned(e, paneTree(ui, {
      badge, now: await $.clock.now(), columns: e.props.bodyColumns, filter: await read($, filterAtom),
      theme: await read($, themeAtom), isRich: e.surface !== 'terminal',
      onOpen: failure => void openFailure($, failure, where),
      onRerun: () => void runAll($, overrides),
      onFilter: filter => void update($, filterAtom, () => filter),
    }))
  })
}

export const register: Register = (on, options) => {
  const overrides = overridesOf(options)
  hookRuns(on, overrides)
  hookHub(on)
  hookDrawing(on, overrides)
}
