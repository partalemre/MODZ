import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { pastsOf } from './past'
import { EMPTY_LOG, isLog } from './past-log'
import { scanLog } from './past-scan'
import type { ScanIo } from './past-scan'
import type { HudLog, HudPast, HudRange } from '../types'

// The Usage pane's history: the transcripts' folder from the session's own transcript path, the log kept in the
// store across sessions, and a read of the changed transcripts as the pane opens and then at most every few
// minutes while it stays open, in a dispatch of its own and one at a time. Until a read has worked nothing shows.

export type PastView = { past: HudPast; choose: (range: HudRange) => void }

const PANE = 'hud-pro'
const LOG_KEY = 'hud-pro.past'
// The transcripts are read again at most this often, and only while the pane is open.
export const PAST_REFRESH_MS = 300_000

const pastAtom = atom({ plugin: 'hud-pro', key: 'past' } as const, null)
const rootAtom = atom({ plugin: 'hud-pro', key: 'pastRoot' } as const, '')

type Kept = { log: HudLog | null; isLoaded: boolean; isReading: boolean; isTicking: boolean; triedAt: number }
const kept: Kept = { log: null, isLoaded: false, isReading: false, isTicking: false, triedAt: Number.NEGATIVE_INFINITY }

const folderOf = (path: string): string => path.slice(0, Math.max(0, path.lastIndexOf('/')))

// `<config>/projects/<project>/<session>.jsonl` → `<config>/projects`; '' for no path.
export const rootOf = (transcript: string): string => (transcript.endsWith('.jsonl') ? folderOf(folderOf(transcript)) : '')

const why = (error: unknown): string => (error instanceof Error ? error.message : String(error))

function scanIo($: EngineInterface): ScanIo {
  return { list: dir => $.fs.list(dir), spawn: argv => $.process.spawn({ argv }) }
}

// The last log a read came to, from an earlier session: shown until the next read.
async function loadLog($: EngineInterface): Promise<void> {
  if (kept.isLoaded) return
  kept.isLoaded = true
  const saved = await $.store.get(LOG_KEY).catch(() => undefined)
  if (!isLog(saved)) return
  kept.log = saved
  const nowMs = await $.clock.now()
  await update($, pastAtom, () => pastsOf(saved.days, nowMs))
}

async function readTranscripts($: EngineInterface, root: string): Promise<void> {
  try {
    const nowMs = await $.clock.now()
    const log = await scanLog(scanIo($), { root, log: kept.log ?? EMPTY_LOG, nowMs })
    kept.log = log
    await update($, pastAtom, () => pastsOf(log.days, nowMs))
    await $.store.set(LOG_KEY, log).catch((error: unknown) => $.ui.log(`hud-pro: history not kept (${why(error)})`, { to: 'debug' }))
  } catch (error) {
    $.ui.log(`hud-pro: transcripts not readable (${why(error)})`, { to: 'debug' })
  } finally {
    kept.isReading = false
  }
}

// A read starts when the last one is old.
async function readIfOld($: EngineInterface): Promise<void> {
  await loadLog($)
  const root = await read($, rootAtom)
  const nowMs = await $.clock.now()
  const lastMs = Math.max(kept.log?.at ?? Number.NEGATIVE_INFINITY, kept.triedAt)
  if (root === '' || kept.isReading || nowMs - lastMs < PAST_REFRESH_MS) return
  kept.isReading = true
  kept.triedAt = nowMs
  $.clock.after(1, () => readTranscripts($, root))
}

// While the pane stays open, a read every few minutes; a closed pane reads nothing.
async function tick($: EngineInterface): Promise<void> {
  try {
    if ((await $.ui.panes()).some(pane => pane.id === PANE)) await readIfOld($)
  } catch (error) {
    $.ui.log(`hud-pro: history tick failed (${why(error)})`, { to: 'debug' })
  }
}

// What the pane shows of the history: the range chosen, or nothing until a read has worked.
export function pastViewOf(pasts: { week: HudPast; month: HudPast } | null, spec: { range: HudRange; choose: PastView['choose'] }): PastView | null {
  if (pasts === null) return null

  return { past: spec.range === 30 ? pasts.month : pasts.week, choose: spec.choose }
}

type On = Parameters<Register>[0]

export function onPast(on: On) {
  // Every classic event carries the transcript's path; the start is enough.
  on('classic.SessionStart', async ($, e, next) => {
    const root = rootOf(typeof e.transcript_path === 'string' ? e.transcript_path : '')
    if (root !== '') await update($, rootAtom, () => root)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.open', async ($, e, next) => {
    const opened = await next(e)
    if (e.id !== PANE) return opened
    try {
      await readIfOld($)
      if (!kept.isTicking) $.clock.every(PAST_REFRESH_MS, () => void tick($))
      kept.isTicking = true
    } catch (error) {
      $.ui.log(`hud-pro: history read not started (${why(error)})`, { to: 'debug' })
    }

    return opened
  }).catch(($, e, next) => next(e))
}
