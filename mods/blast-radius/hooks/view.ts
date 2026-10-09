// A report in the person's words: the headline, the risk banner, the rows to list and
// the button that runs it. Pure, so the pane, the band and the terminal share it.

import type { Risk } from './classify'
import type { IconName } from './svg-kit'
import type { Report } from './report'

export type RowKind = 'folder' | 'file' | 'item' | 'more'
export type Row = { kind: RowKind; name: string; tag: string; count: string; size: string; share: number | null; icon: IconName }
export type Banner = { tone: 'danger' | 'read' | 'warn'; text: string }

export type View = {
  icon: IconName
  command: string
  payload: string
  isPayloadEmpty: boolean
  tail: string
  context: string
  fullCommand: string | null
  banner: Banner | null
  rows: Row[]
  // Rows the toggle would add (collapsed) or take away (expanded); 0 hides it.
  toggleCount: number
  action: { label: string; hotkey: string }
}

const FILES_COLLAPSED = 6
const GROUPS_COLLAPSED = 4
const ITEMS_COLLAPSED = 6
const DECIMAL_LIMIT = 10
const KIB = 1024

/** `286 KB`, `6,3 KB`: the Turkish decimal comma. */
export function trSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < KIB) return `${bytes || 0} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let n = bytes
  let i = -1
  while (n >= KIB && i < units.length - 1) {
    n /= KIB
    i += 1
  }

  return `${n.toFixed(n < DECIMAL_LIMIT ? 1 : 0).replace('.', ',')} ${units[i]}`
}

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
  const total = report.bytes || 1
  const groups = isExpanded ? report.groups : report.groups.slice(0, GROUPS_COLLAPSED)
  const rows: Row[] = []
  let budget = isExpanded ? Number.MAX_SAFE_INTEGER : FILES_COLLAPSED
  let shown = 0
  let shownBytes = 0
  groups.forEach((group, index) => {
    const later = groups.length - index - 1
    const take = Math.max(Math.min(1, budget), Math.min(group.files.length, budget - later))
    rows.push({ kind: 'folder', name: group.dir, tag: '', count: `${group.count} dosya`, size: trSize(group.bytes), share: group.bytes / total, icon: 'folder' })
    for (const file of group.files.slice(0, take)) {
      rows.push({ kind: 'file', name: file.name, tag: '', count: '', size: trSize(file.bytes), share: file.bytes / total, icon: 'file' })
      shownBytes += file.bytes
    }
    shown += Math.min(take, group.files.length)
    budget -= take
  })
  const hidden = report.count - shown
  if (hidden > 0) rows.push({ kind: 'more', name: `+${hidden} dosya daha · ${trSize(Math.max(0, (report.bytes ?? 0) - shownBytes))}`, tag: '', count: '', size: '', share: null, icon: 'file' })
  const listed = report.groups.reduce((sum, group) => sum + group.files.length, 0)

  return { rows, listed, shown }
}

function itemRows(report: Report, isExpanded: boolean): { rows: Row[]; listed: number; shown: number } {
  const icon: IconName = report.kind === 'commits' ? 'commit' : report.kind === 'migrations' ? 'database' : 'file'
  const totalWeight = report.items.reduce((sum, item) => sum + item.weight, 0)
  const items = isExpanded ? report.items : report.items.slice(0, ITEMS_COLLAPSED)
  const rows: Row[] = items.map(item => ({ kind: 'item', name: item.name, tag: item.tag, count: '', size: item.meta, share: totalWeight > 0 ? item.weight / totalWeight : null, icon }))
  const hidden = report.count - items.length
  if (hidden > 0) rows.push({ kind: 'more', name: `+${hidden} tane daha`, tag: '', count: '', size: '', share: null, icon })

  return { rows, listed: report.items.length, shown: items.length }
}

function filesBanner(report: Report): Banner | null {
  if (report.count === 0 || report.tracked === null) return null
  const untracked = Math.max(0, report.count - report.tracked)
  if (untracked === 0) return { tone: 'read', text: 'Hepsi git\'te; git checkout ile geri getirilebilir.' }
  if (untracked === report.count) return { tone: 'danger', text: 'Bunların hiçbiri git\'te değil, geri getirilemez.' }

  return { tone: 'danger', text: `${untracked} tanesi git'te değil, geri getirilemez.` }
}

function bannerOf(report: Report): Banner | null {
  if (report.note !== null && report.count === 0) return { tone: 'warn', text: report.note }
  if (report.kind === 'files') return filesBanner(report)
  if (report.kind === 'changes') return { tone: 'danger', text: `Commit edilmemiş değişiklikler (+${report.added} −${report.removed} satır) geri getirilemez.` }
  if (report.kind === 'commits') return { tone: 'danger', text: 'Bu commit\'ler uzak daldan silinir; yerelde kopyası yoksa geri gelmez.' }
  if (report.kind === 'migrations') return { tone: 'danger', text: 'Migration\'lar veritabanını değiştirir; geri almak ayrı bir iş.' }

  return report.note === null ? null : { tone: 'warn', text: report.note }
}

function headline(report: Report): { payload: string; tail: string } {
  if (report.count === 0) return { payload: 'önceden ölçülemedi', tail: '' }
  if (report.kind === 'files') return { payload: report.bytes === null ? `${report.count} yol` : `${report.count} dosya · ${trSize(report.bytes)}`, tail: ' silinecek' }
  if (report.kind === 'changes') return { payload: `${report.count} dosyadaki değişiklik`, tail: ' silinecek' }
  if (report.kind === 'commits') return { payload: `${report.count} commit`, tail: ' düşecek' }

  return { payload: `${report.count} migration`, tail: ' uygulanacak' }
}

function actionOf(report: Report): View['action'] {
  if (report.count === 0) return { label: 'Yine de çalıştır', hotkey: 'c' }
  if (report.kind === 'files') return { label: `${report.count} dosyayı sil`, hotkey: 's' }
  if (report.kind === 'changes') return { label: 'Değişiklikleri sil', hotkey: 's' }
  if (report.kind === 'commits') return { label: 'Zorla gönder', hotkey: 'z' }

  return { label: `${report.count} migration'ı uygula`, hotkey: 'u' }
}

export function viewOf(held: { command: string; risk: Risk; report: Report; cwd: string; isExpanded: boolean }): View {
  const { report, risk } = held
  const rowsOf = report.groups.length > 0 ? fileRows : itemRows
  const list = rowsOf(report, held.isExpanded)
  const collapsed = rowsOf(report, false)
  const command = shownCommand(risk)
  const place = held.cwd === '' ? '' : `${baseName(held.cwd)} içinde`
  const where = report.where === null ? '' : `${report.where} · `

  return {
    icon: ICON_OF[risk.kind],
    command,
    ...headline(report),
    isPayloadEmpty: report.count === 0,
    context: `${where}${place}`,
    fullCommand: held.command.trim() === command ? null : held.command.trim(),
    banner: bannerOf(report),
    rows: list.rows,
    toggleCount: collapsed.listed - collapsed.shown,
    action: actionOf(report),
  }
}
