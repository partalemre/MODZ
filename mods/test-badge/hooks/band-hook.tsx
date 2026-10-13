import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import { bandTree } from './band'
import { fixPrompt } from './ci-text'
import { ciCardTree } from './ci-view'
import { isLive } from './notice'
import { isFailing } from './parse'
import { EMPTY } from './limits'
import { pinned } from './pin'
import { AUTO } from './tidemark'
import { words } from './words'
import type { CiCard, CiWatch, TestBadge } from '../types'

// The band's notice slot (DESIGN.md §6, notices, one at a time): a red CI finish's card first, until pressed;
// else a finished run's notice, or the running pill. All of it gives way to louder notices.

// The $.state values this file reads or writes, declared here: the scan lists them per file.
const badgeAtom = atom({ plugin: 'test-badge', key: 'badge' } as const, EMPTY)
const ciAtom = atom({ plugin: 'test-badge', key: 'ci' } as const, null as CiWatch | null)
const ciCardAtom = atom({ plugin: 'test-badge', key: 'ciCard' } as const, null as CiCard | null)
const noticeAtom = atom({ plugin: 'test-badge', key: 'notice' } as const, null)
const themeAtom = atom({ plugin: 'test-badge', key: 'theme' } as const, AUTO)

const PANE = 'test-badge'
// The shared notice line: every one of these outranks this mod's line (session-budget ties at 1 and wins).
const cacheTaxNotice = { plugin: 'cache-tax', key: 'notice' } as const
const knowNotice = { plugin: 'you-should-know', key: 'notice' } as const
const budgetNotice = { plugin: 'session-budget', key: 'notice' } as const
const reflectNotice = { plugin: 'reflect', key: 'notice' } as const
const handoffNotice = { plugin: 'handoff', key: 'notice' } as const

async function isOutranked($: EngineInterface): Promise<boolean> {
  const nowMs = await $.clock.now()
  const others: { value?: unknown }[] = [
    await $.state.get(cacheTaxNotice as never), await $.state.get(knowNotice as never),
    await $.state.get(budgetNotice as never), await $.state.get(reflectNotice as never),
    await $.state.get(handoffNotice as never),
  ]

  return others.some(other => isLive(other.value, nowMs))
}

async function bandOf($: EngineInterface, now: number): Promise<{ badge: TestBadge; isNotice: boolean } | null> {
  const badge = await read($, badgeAtom)
  const notice = await read($, noticeAtom)
  const isNotice = notice !== null && isLive(notice, now)
  if (!badge.isRunning && !isNotice) return null

  return (await isOutranked($)) ? null : { badge, isNotice }
}

async function clearCard($: EngineInterface): Promise<void> {
  if ((await read($, ciCardAtom)) !== null) await update($, ciCardAtom, () => null)
}

// "Ask Claude to fix": the person's press, the only way this mod submits a prompt.
async function askFix($: EngineInterface, card: CiCard): Promise<void> {
  await clearCard($)
  await $.prompt.submit({ text: fixPrompt(card) }).catch(error => $.ui.log(`test-badge: could not send the CI prompt (${String(error)})`, { to: 'debug' }))
}

export function hookBand(on: On): void {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const theirs = await next(e)
    if (e.props.hasSurvey) return theirs
    const ui = $.ui.resolve(e)
    const view = { columns: e.props.bodyColumns, theme: await read($, themeAtom), isRich: e.surface !== 'terminal' }
    const card = await read($, ciCardAtom)
    if (card !== null && !(await isOutranked($))) {
      const title = (await read($, ciAtom))?.title ?? ''

      return pinned(e, ciCardTree(ui, { ...view, card, title, onAsk: () => void askFix($, card), onDismiss: () => void clearCard($) }, theirs))
    }
    const now = await $.clock.now()
    const shown = await bandOf($, now)
    if (shown === null) return theirs
    const { badge, isNotice } = shown

    return pinned(e, bandTree(ui, {
      ...view, badge, now,
      hasDetails: !badge.isRunning && isFailing(badge),
      onDetails: () => void $.ui.open({ id: PANE, title: words().paneTitle, focus: true }),
      onDismiss: badge.isRunning || !isNotice ? undefined : () => void update($, noticeAtom, () => null),
    }, theirs))
  })
}
