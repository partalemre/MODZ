import type { Step } from './match'
import { baseName } from './parse'
import type { StepTrack } from '../types'
import { upper } from './kit/lang'
import { escape, fit, measure, wrap } from './ui/svg'
import { words } from './words'

// What the step under way shows beneath its title on the desktop: its checks and finished agents on one
// meta line, the files it touched (newest first, each with its type badge), and the agents still running.

export type DeskDetails = { meta: string; files: string[]; running: string[] }
export type Block = { svg: string; height: number }
type Frame = { x: number; top: number; width: number }

const FILES_SHOWN = 3
const AGENTS_SHOWN = 3
const LINE = 17
const FILE_ROW = 22
const BADGE = { w: 26, h: 16, gap: 8 }
const NAME_SIZE = 12
const META_SIZE = 12
const AGENT_INDENT = 14
const LINES_MAX = 3

const BADGE_ROLE: Record<string, string> = {
  ts: 'amber', tsx: 'amber', js: 'amber', jsx: 'amber', mjs: 'amber', cjs: 'amber', py: 'tide', md: 'run', txt: 'run',
  json: 'ok', csv: 'ok', yaml: 'ok', yml: 'ok', pdf: 'danger', png: 'plan', jpg: 'plan', svg: 'plan',
}

export const DETAIL_CSS = '.badge{font-size:9.5px;font-weight:700}'

export function deskDetails(step: Step, track: StepTrack | undefined): DeskDetails {
  const done = track?.agents.filter(agent => !agent.isRunning).length ?? 0
  const say = words()
  const meta = [step.checksTotal > 0 ? say.checks(step.checksDone, step.checksTotal) : '', done > 0 ? say.agentsDone(done) : '']
  const running = (track?.agents ?? []).filter(agent => agent.isRunning).map(agent => agent.description)

  return { meta: meta.filter(Boolean).join(' · '), files: [...(track?.files ?? [])].reverse(), running: running.slice(0, AGENTS_SHOWN) }
}

export function hasDetails(details: DeskDetails): boolean {
  return details.meta !== '' || details.files.length > 0 || details.running.length > 0
}

// The extension in mono capitals on its type's tint (DESIGN.md §4); an unknown type sits on the inset.
function fileBadge(x: number, y: number, path: string): string {
  const name = baseName(path)
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
  const role = BADGE_ROLE[ext]
  const label = escape(upper(ext === '' ? '·' : ext.slice(0, 3)))
  const box = role === undefined
    ? `<rect x="${x}" y="${y}" width="${BADGE.w}" height="${BADGE.h}" rx="4" fill="var(--inset)" stroke="var(--line)"/>`
    : `<rect x="${x}" y="${y}" width="${BADGE.w}" height="${BADGE.h}" rx="4" fill="var(--${role}-t)"/>`

  return `${box}<text x="${x + BADGE.w / 2}" y="${y + 11.5}" text-anchor="middle" class="mono badge" fill="var(--${role ?? 'lo'})">${label}</text>`
}

// The folder in text.lo, the name in text.hi; a long folder gives way from its start, the name never does.
function fileRow(path: string, frame: Frame): string {
  const nameX = frame.x + BADGE.w + BADGE.gap
  const room = frame.width - (nameX - frame.x)
  const name = fit(baseName(path), room, { size: NAME_SIZE })
  const folder = path.slice(0, path.length - baseName(path).length)
  const folderRoom = room - measure(name, NAME_SIZE)
  const kept = measure(folder, NAME_SIZE) <= folderRoom ? folder : ''
  const y = frame.top + 3

  return `${fileBadge(frame.x, y, path)}<text x="${nameX}" y="${y + 12}" class="label"><tspan class="lo">${escape(kept)}</tspan><tspan class="hi">${escape(name)}</tspan></text>`
}

function lines(texts: string[], at: { x: number; top: number; cls: string }): string {
  return texts.map((line, n) => `<text x="${at.x}" y="${at.top + 13 + n * LINE}" class="${at.cls}">${escape(line)}</text>`).join('')
}

function filesBlock(files: string[], frame: Frame): Block {
  const rows = files.slice(0, FILES_SHOWN).map((path, n) => fileRow(path, { ...frame, top: frame.top + n * FILE_ROW }))
  const shown = Math.min(files.length, FILES_SHOWN)
  const rest = files.length - shown
  const more = rest > 0 ? `<text x="${frame.x + BADGE.w + BADGE.gap}" y="${frame.top + shown * FILE_ROW + 11}" class="micro lo">${words().moreFiles(rest)}</text>` : ''

  return { svg: rows.join('') + more, height: shown * FILE_ROW + (rest > 0 ? LINE : 0) }
}

function agentBlock(agent: string, frame: Frame): Block {
  const texts = wrap(`${agent} · ${words().running}`, { width: frame.width - AGENT_INDENT, size: META_SIZE, maxLines: LINES_MAX })
  const dot = `<circle cx="${frame.x + 4}" cy="${frame.top + 9}" r="3.5" class="f-run breathe"/>`

  return { svg: dot + lines(texts, { x: frame.x + AGENT_INDENT, top: frame.top, cls: 'label mid' }), height: texts.length * LINE }
}

export function detailBlock(details: DeskDetails, frame: Frame): Block {
  const parts: Block[] = []
  let top = frame.top
  const push = (block: Block) => {
    parts.push(block)
    top += block.height
  }
  if (details.meta !== '') {
    const texts = wrap(details.meta, { width: frame.width, size: META_SIZE, maxLines: LINES_MAX })
    push({ svg: lines(texts, { x: frame.x, top, cls: 'label lo' }), height: texts.length * LINE + 2 })
  }
  if (details.files.length > 0) push(filesBlock(details.files, { ...frame, top }))
  for (const agent of details.running) push(agentBlock(agent, { ...frame, top }))

  return { svg: parts.map(part => part.svg).join(''), height: top - frame.top }
}
