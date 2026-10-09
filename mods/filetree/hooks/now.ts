// What the "ŞU AN" card says: the turn's file activity told as one Turkish sentence.

import type { Touch, TouchRole, TurnLog } from '../types'
import { badgeOf } from './badges'
import type { TouchedRow } from './cards'
import type { IconName } from './svg'
import type { Role } from './theme'

export type Part = { text: string; cls: string; isBold?: boolean; isNum?: boolean }
export type Hero = {
  role: Role
  icon: IconName
  eyebrow: string
  title: { lead: string; name: string; tail: string }
  sub: Part[]
}
export type NowInput = {
  turn: TurnLog
  live: ReadonlySet<string>
  root: string
  isCommitting: boolean
  branch: string
  diff: Record<string, [number, number]>
}

const NOW = 'ŞU AN'
const DONE = 'BİTTİ'
const ROLE: Record<TouchRole, Role> = { read: 'read', edit: 'edit', commit: 'ok' }
const ICON: Record<TouchRole, IconName> = { read: 'eye', edit: 'pencil', commit: 'check' }
const VERB_NOW: Record<TouchRole, [string, string]> = {
  read: ['dosyasını okuyor', 'dosyayı okuyor'],
  edit: ['dosyasını düzenliyor', 'dosyayı düzenliyor'],
  commit: ['dosyasını commit etti', 'dosyayı commit etti'],
}

export const baseName = (id: string): string => id.slice(id.lastIndexOf('/') + 1)

export function relDir(id: string, root: string): string {
  const rel = id.startsWith(`${root}/`) ? id.slice(root.length + 1) : id
  const cut = rel.lastIndexOf('/')
  return cut < 0 ? '' : rel.slice(0, cut)
}

export const relPath = (id: string, root: string): string => (id.startsWith(`${root}/`) ? id.slice(root.length + 1) : id)

const where = (id: string, root: string): Part => {
  const dir = relDir(id, root)
  return { text: dir ? `${dir} klasöründe` : 'proje kökünde', cls: 'mid' }
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
  const parts = [
    count(turn, 'read') ? `${count(turn, 'read')} dosya açtı` : '',
    count(turn, 'edit') ? `${count(turn, 'edit')} dosya düzenledi` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'henüz dosyaya dokunmadı'
}

function liveHero(input: NowInput, latest: Touch): Hero {
  const same = input.turn.touches.filter(t => t.role === latest.role && input.live.has(t.id))
  const [one, many] = VERB_NOW[latest.role]
  const isMany = same.length > 1
  const title = isMany
    ? { lead: `Claude ${same.length} ${many}`, name: '', tail: '' }
    : { lead: 'Claude ', name: baseName(latest.id), tail: ` ${one}` }
  const sub = latest.role === 'commit' ? shaParts(input) : [where(latest.id, input.root)]
  return { role: ROLE[latest.role], icon: ICON[latest.role], eyebrow: NOW, title, sub }
}

function shaParts(input: NowInput): Part[] {
  const sha = input.turn.sha ? [{ text: input.turn.sha, cls: 'mid', isNum: true }] : []
  const branch = input.branch ? [{ text: `${sha.length ? ' · ' : ''}${input.branch} dalında`, cls: 'lo' }] : []
  return [...sha, ...branch]
}

const quiet = (eyebrow: string, lead: string, sub: string): Hero => ({
  role: 'neutral',
  icon: 'sparkle',
  eyebrow,
  title: { lead, name: '', tail: '' },
  sub: [{ text: sub, cls: 'mid' }],
})

function names(touches: Touch[]): string {
  return touches.map(t => baseName(t.id)).join(', ')
}

function doneHero(input: NowInput): Hero {
  const { turn, root } = input
  const commits = count(turn, 'commit')
  if (commits || turn.committed) {
    const n = Math.max(commits, turn.committed)
    return { role: 'ok', icon: 'check', eyebrow: DONE, title: { lead: `Claude ${n} dosyayı commit etti`, name: '', tail: '' }, sub: shaParts(input) }
  }
  const edits = turn.touches.filter(t => t.role === 'edit')
  const reads = count(turn, 'read')
  const opened: Part[] = reads ? [{ text: ` · ${reads} dosya açtı`, cls: 'lo' }] : []
  if (edits.length) {
    const first = edits[0] as Touch
    const sub = edits.length === 1 ? [{ text: relPath(first.id, root), cls: 'mid' }, ...diffParts(input.diff[first.id])] : [{ text: names(edits), cls: 'mid' }]
    return { role: 'edit', icon: 'pencil', eyebrow: DONE, title: { lead: `Claude ${edits.length} dosyayı düzenledi`, name: '', tail: '' }, sub: [...sub, ...opened] }
  }
  if (reads) {
    const sub = [{ text: names(turn.touches), cls: 'mid' }]
    return { role: 'read', icon: 'eye', eyebrow: DONE, title: { lead: `Claude ${reads} dosyayı okudu`, name: '', tail: '' }, sub }
  }
  return quiet(DONE, 'Claude dosyalara dokunmadı', 'Son turda dosya okumadı, düzenlemedi.')
}

export function heroOf(input: NowInput): Hero {
  const { turn } = input
  if (turn.isRunning) {
    const latest = [...turn.touches].filter(t => input.live.has(t.id)).sort((a, b) => a.at - b.at).pop()
    if (latest) return liveHero(input, latest)
    if (input.isCommitting) {
      const sub = input.branch ? [{ text: `${input.branch} dalına`, cls: 'mid' }] : []
      return { role: 'ok', icon: 'check', eyebrow: NOW, title: { lead: 'Claude commit ediyor', name: '', tail: '' }, sub }
    }
    return quiet(NOW, 'Claude düşünüyor', tally(turn))
  }
  if (!turn.hasRun) return quiet(NOW, 'Claude bekliyor', 'Bu oturumda henüz dosyaya dokunmadı')
  return doneHero(input)
}

export const heroText = (h: Hero): string => `${h.title.lead}${h.title.name}${h.title.tail}`
export const subText = (h: Hero): string => h.sub.map(p => p.text).join('')

const PILL_LIVE: Record<TouchRole, string> = { read: 'Okunuyor', edit: 'Düzenleniyor', commit: 'Commit edildi' }
const PILL_DONE: Record<TouchRole, string> = { read: 'Açıldı', edit: 'Düzenlendi', commit: 'Commit edildi' }

// The touched card's rows: past tense once Claude has moved on, present while it is there.
export function touchedRows(input: NowInput): TouchedRow[] {
  const { turn, root } = input
  return turn.touches.map(t => {
    const isLive = turn.isRunning && input.live.has(t.id)
    const diff = t.role === 'read' ? undefined : input.diff[t.id]
    return {
      name: baseName(t.id),
      dir: relDir(t.id, root),
      badge: badgeOf(baseName(t.id)),
      pill: { text: (isLive ? PILL_LIVE : PILL_DONE)[t.role], role: ROLE[t.role] },
      ...(diff && (diff[0] || diff[1]) ? { diff } : {}),
    }
  })
}
