// A report in the person's words: the headline, the risk banner, the rows to list and
// the button that runs it. Pure, so the pane, the band and the terminal share it.

import type { Risk } from './classify'
import type { IconName } from './svg-kit'
import type { Report } from './report'
import { words } from './words'

export type RowKind = 'folder' | 'file' | 'item' | 'more'
export type Row = { kind: RowKind; name: string; tag: string; count: string; size: string; share: number | null; icon: IconName }
export type Banner = { tone: 'danger' | 'read' | 'warn'; text: string }
export type Choice = { label: string; hotkey: string }

// Flare for what can't be undone; Amber for a caution (another chat's edit, a house rule).
export type CardTone = 'danger' | 'warn'

export type View = {
  tone: CardTone
  eyebrow: string
  icon: IconName
  command: string
  // A sentence in place of the command line, for a card that holds something other than a command.
  headline: string | null
  payload: string
  isPayloadEmpty: boolean
  tail: string
  context: string
  fullCommand: string | null
  banner: Banner | null
  rows: Row[]
  // Rows the toggle would add (collapsed) or take away (expanded); 0 hides it.
  toggleCount: number
  action: Choice
  // The safe answer; it holds the focus.
  cancel: Choice
}

const FILES_COLLAPSED = 6
const GROUPS_COLLAPSED = 4
const ITEMS_COLLAPSED = 6

const baseName = (path: string): string => path.replace(/\/+$/, '').split('/').pop() || path

function shownCommand(risk: Risk): string {
  if (risk.kind === 'rm') return [risk.label, ...risk.targets].join(' ')
  if (risk.kind === 'git-clean') return ['git clean', ...risk.args].join(' ')
  if (risk.kind === 'git-push-force') return ['git push', ...risk.args].join(' ')

  return risk.label
}

const ICON_OF: Record<Risk['kind'], IconName> = {
  rm: 'trash', 'git-clean': 'branch', 'git-reset': 'rewind', 'git-checkout': 'rewind', 'git-push-force': 'push', migrate: 'database',
}

function fileRows(report: Report, isExpanded: boolean): { rows: Row[]; listed: number; shown: number } {
  const said = words()
  const total = report.bytes || 1
  const groups = isExpanded ? report.groups : report.groups.slice(0, GROUPS_COLLAPSED)
  const rows: Row[] = []
  let budget = isExpanded ? Number.MAX_SAFE_INTEGER : FILES_COLLAPSED
  let shown = 0
  let shownBytes = 0
  groups.forEach((group, index) => {
    const later = groups.length - index - 1
    const take = Math.max(Math.min(1, budget), Math.min(group.files.length, budget - later))
    rows.push({ kind: 'folder', name: group.dir, tag: '', count: said.folderCount(group.count), size: said.size(group.bytes), share: group.bytes / total, icon: 'folder' })
    for (const file of group.files.slice(0, take)) {
      rows.push({ kind: 'file', name: file.name, tag: '', count: '', size: said.size(file.bytes), share: file.bytes / total, icon: 'file' })
      shownBytes += file.bytes
    }
    shown += Math.min(take, group.files.length)
    budget -= take
  })
  const hidden = report.count - shown
  if (hidden > 0) rows.push({ kind: 'more', name: said.moreFiles(hidden, Math.max(0, (report.bytes ?? 0) - shownBytes)), tag: '', count: '', size: '', share: null, icon: 'file' })
  const listed = report.groups.reduce((sum, group) => sum + group.files.length, 0)

  return { rows, listed, shown }
}

const ITEM_ICON: Partial<Record<Report['kind'], IconName>> = { commits: 'commit', migrations: 'database' }

function itemRows(report: Report, isExpanded: boolean): { rows: Row[]; listed: number; shown: number } {
  const icon = ITEM_ICON[report.kind] ?? 'file'
  const totalWeight = report.items.reduce((sum, item) => sum + item.weight, 0)
  const items = isExpanded ? report.items : report.items.slice(0, ITEMS_COLLAPSED)
  const rows: Row[] = items.map(item => ({ kind: 'item', name: item.name, tag: item.tag, count: '', size: item.meta, share: totalWeight > 0 ? item.weight / totalWeight : null, icon }))
  const hidden = report.count - items.length
  if (hidden > 0) rows.push({ kind: 'more', name: words().moreItems(hidden, report.kind), tag: '', count: '', size: '', share: null, icon })

  return { rows, listed: report.items.length, shown: items.length }
}

export function viewOf(held: { command: string; risk: Risk; report: Report; cwd: string; isExpanded: boolean }): View {
  const { report, risk } = held
  const rowsOf = report.groups.length > 0 ? fileRows : itemRows
  const list = rowsOf(report, held.isExpanded)
  const collapsed = rowsOf(report, false)
  const command = shownCommand(risk)
  const said = words()

  return {
    tone: 'danger',
    eyebrow: said.eyebrow,
    icon: ICON_OF[risk.kind],
    command,
    headline: null,
    ...said.headline(report),
    isPayloadEmpty: report.count === 0,
    context: said.context({ where: report.where, folder: held.cwd === '' ? '' : baseName(held.cwd) }),
    fullCommand: held.command.trim() === command ? null : held.command.trim(),
    banner: said.banner(report),
    rows: list.rows,
    toggleCount: collapsed.listed - collapsed.shown,
    action: said.action(report),
    cancel: said.cancel,
  }
}
