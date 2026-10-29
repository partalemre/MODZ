// What the "Now" card says: the turn's file activity told as one sentence in the session's language.

import type { Touch, TouchRole, TurnLog } from '../types'
import { badgeOf } from './badges'
import type { TouchedRow } from './cards'
import { costText } from './costtext'
import type { Role } from './theme'
import { words } from './words'

export type Part = { text: string; cls: string; isBold?: boolean; isNum?: boolean }
export type Hero = {
  // "Now" or "Done": not drawn on the card, whose headline says as much; it names the card to a reader.
  label: string
  title: { lead: string; name: string; tail: string }
  sub: Part[]
  // Claude is at work this very moment: the card's dot breathes.
  isLive?: boolean
}
export type NowInput = {
  turn: TurnLog
  live: ReadonlySet<string>
  root: string
  isCommitting: boolean
  branch: string
  diff: Record<string, [number, number]>
}

const ROLE: Record<TouchRole, Role> = { read: 'read', edit: 'edit', commit: 'ok' }

export const baseName = (id: string): string => id.slice(id.lastIndexOf('/') + 1)

export function relDir(id: string, root: string): string {
  const rel = id.startsWith(`${root}/`) ? id.slice(root.length + 1) : id
  const cut = rel.lastIndexOf('/')
  return cut < 0 ? '' : rel.slice(0, cut)
}

export const relPath = (id: string, root: string): string => (id.startsWith(`${root}/`) ? id.slice(root.length + 1) : id)

const where = (id: string, root: string): Part => {
  const dir = relDir(id, root)
  return { text: dir ? words().inDir(dir) : words().inRoot, cls: 'mid' }
}

export function diffParts(diff: [number, number] | undefined): Part[] {
  if (!diff || (diff[0] === 0 && diff[1] === 0)) return []
  return [
    ...(diff[0] ? [{ text: ` +${diff[0]}`, cls: 'f-ok', isNum: true }] : []),
    ...(diff[1] ? [{ text: ` −${diff[1]}`, cls: 'f-danger', isNum: true }] : []),
  ]
}

const count = (turn: TurnLog, role: TouchRole): number => turn.touches.filter(t => t.role === role).length

function tally(turn: TurnLog): string {
  const w = words()
  const parts = [
    count(turn, 'read') ? w.openedFiles(count(turn, 'read')) : '',
    count(turn, 'edit') ? w.editedFiles(count(turn, 'edit')) : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : w.noTouchYet
}

function liveHero(input: NowInput, latest: Touch): Hero {
  const same = input.turn.touches.filter(t => t.role === latest.role && input.live.has(t.id))
  const w = words()
  const [lead = '', tail = ''] = w.liveOne[latest.role]
  const isMany = same.length > 1
  const title = isMany ? { lead: w.liveMany[latest.role](same.length), name: '', tail: '' } : { lead, name: baseName(latest.id), tail }
  const sub = latest.role === 'commit' ? shaParts(input) : [where(latest.id, input.root)]
  return { label: w.now, title, sub }
}

function shaParts(input: NowInput): Part[] {
  const sha = input.turn.sha ? [{ text: input.turn.sha, cls: 'mid', isNum: true }] : []
  const branch = input.branch ? [{ text: `${sha.length ? ' · ' : ''}${words().onBranch(input.branch)}`, cls: 'lo' }] : []
  return [...sha, ...branch]
}

const quiet = (label: string, lead: string, sub: string): Hero => ({
  label,
  title: { lead, name: '', tail: '' },
  sub: [{ text: sub, cls: 'mid' }],
})

function names(touches: Touch[]): string {
  return touches.map(t => baseName(t.id)).join(', ')
}

function doneHero(input: NowInput): Hero {
  const { turn, root } = input
  const w = words()
  const commits = count(turn, 'commit')
  if (commits || turn.committed) {
    const n = Math.max(commits, turn.committed)
    return { label: w.done, title: { lead: w.committedN(n), name: '', tail: '' }, sub: shaParts(input) }
  }
  const edits = turn.touches.filter(t => t.role === 'edit')
  const reads = count(turn, 'read')
  const opened: Part[] = reads ? [{ text: ` · ${w.openedFiles(reads)}`, cls: 'lo' }] : []
  if (edits.length) {
    const first = edits[0] as Touch
    const sub = edits.length === 1 ? [{ text: relPath(first.id, root), cls: 'mid' }, ...diffParts(input.diff[first.id])] : [{ text: names(edits), cls: 'mid' }]
    return { label: w.done, title: { lead: w.editedN(edits.length), name: '', tail: '' }, sub: [...sub, ...opened] }
  }
  if (reads) {
    const sub = [{ text: names(turn.touches), cls: 'mid' }]
    return { label: w.done, title: { lead: w.readN(reads), name: '', tail: '' }, sub }
  }
  return quiet(w.done, w.untouched, w.untouchedSub)
}

function runningHero(input: NowInput): Hero {
  const { turn } = input
  const w = words()
  const latest = [...turn.touches].filter(t => input.live.has(t.id)).sort((a, b) => a.at - b.at).pop()
  if (latest) return liveHero(input, latest)
  if (input.isCommitting) {
    const sub = input.branch ? [{ text: w.toBranch(input.branch), cls: 'mid' }] : []
    return { label: w.now, title: { lead: w.committing, name: '', tail: '' }, sub }
  }
  return quiet(w.now, w.thinking, tally(turn))
}

export function heroOf(input: NowInput): Hero {
  const { turn } = input
  if (turn.isRunning) return { ...runningHero(input), isLive: true }
  if (!turn.hasRun) return quiet(words().now, words().waiting, words().waitingSub)
  return doneHero(input)
}

export const heroText = (h: Hero): string => `${h.title.lead}${h.title.name}${h.title.tail}`
export const subText = (h: Hero): string => h.sub.map(p => p.text).join('')

// The touched card's rows: past tense once Claude has moved on, present while it is there.
export function touchedRows(input: NowInput): TouchedRow[] {
  const { turn, root } = input
  const w = words()
  return turn.touches.map(t => {
    const isLive = turn.isRunning && input.live.has(t.id)
    const diff = t.role === 'read' ? undefined : input.diff[t.id]
    const cost = turn.costs?.[t.id]
    return {
      name: baseName(t.id),
      dir: relDir(t.id, root),
      badge: badgeOf(baseName(t.id)),
      pill: { text: (isLive ? w.pillLive : w.pillDone)[t.role], role: isLive ? ROLE[t.role] : null },
      ...(diff && (diff[0] || diff[1]) ? { diff } : {}),
      ...(cost ? { cost: costText(cost) } : {}),
    }
  })
}
