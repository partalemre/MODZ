import type { Palette } from './skin'
import { CONTROL_SLOT, escape, HEADER_MID, fitText, MONO, pill, riseDelay, strokeIcon, svgCard } from './svg-kit'
import type { CardFrame } from './svg-kit'

// A shell command's output as a terminal card: a status pill, the output in mono with
// stderr in the error colour, and long output folded to its head and tail.

const HEADER_H = 56
const LINE_H = 20
const CODE = 12.5
const HEAD = 6
const TAIL = 6
const PROMPT = '<path d="M5 7l5 5-5 5"/><path d="M12 18h7"/>'

// Escape sequences for colour and cursor moves, which a card cannot draw.
const ANSI = /\u001b\[[0-9;?]*[A-Za-z]/g

export type ShellOutput = { stdout: string; stderr: string; interrupted: boolean; timedOutAfterMs?: number; returnCodeInterpretation?: string }

export function shellOutputOf(output: unknown): ShellOutput | null {
  const record = (typeof output === 'object' && output !== null ? output : {}) as Record<string, unknown>

  if (typeof record.stdout !== 'string' || typeof record.stderr !== 'string') {
    return null
  }

  return {
    stdout: record.stdout,
    stderr: record.stderr,
    interrupted: record.interrupted === true,
    ...(typeof record.timedOutAfterMs === 'number' ? { timedOutAfterMs: record.timedOutAfterMs } : {}),
    ...(typeof record.returnCodeInterpretation === 'string' ? { returnCodeInterpretation: record.returnCodeInterpretation } : {}),
  }
}

type Line = { text: string; isErr: boolean } | { fold: number }

// A stream's lines, colour codes stripped and trailing blank lines dropped.
function streamLines(text: string, isErr: boolean): { text: string; isErr: boolean }[] {
  const lines = text.replace(ANSI, '').replace(/\r/g, '').replace(/\t/g, '  ').split('\n')
  const end = lines.length - [...lines].reverse().findIndex(line => line.trim() !== '')

  return lines.every(line => line.trim() === '') ? [] : lines.slice(0, end).map(line => ({ text: line, isErr }))
}

export function outputLines(output: ShellOutput): Line[] {
  const kept = [...streamLines(output.stdout, false), ...streamLines(output.stderr, true)]

  return kept.length <= HEAD + TAIL + 1
    ? kept
    : [...kept.slice(0, HEAD), { fold: kept.length - HEAD - TAIL }, ...kept.slice(kept.length - TAIL)]
}

type Status = { text: string; color: string }

function statusOf(output: ShellOutput, isErrored: boolean, palette: Palette): Status {
  if (output.interrupted) {
    return { text: 'durduruldu', color: palette.warn }
  }

  if (output.timedOutAfterMs !== undefined) {
    return { text: 'zaman aşımı', color: palette.warn }
  }

  return isErrored ? { text: 'hata', color: palette.err } : { text: 'tamam', color: palette.ok }
}

type Shown = Line | { text: string; isErr: boolean; isNote: true }

function lineColor(line: { text: string; isErr: boolean; isNote?: true }, palette: Palette): string {
  if (line.isNote === true) {
    return palette.muted
  }

  return line.isErr ? palette.err : palette.fg
}

function outputRow(line: Shown, i: number, { palette, width }: CardFrame): string {
  const top = HEADER_H + 6 + i * LINE_H

  if ('fold' in line) {
    return `<g class="rise" ${riseDelay(i, 22)}><text x="20" y="${top + 14}" font-size="11.5" style="fill:${palette.muted}">⋯  ${line.fold} satır daha</text></g>`
  }

  return `<g class="rise" ${riseDelay(i, 22)}><text x="20" y="${top + 14}" font-family="${MONO}" font-size="${CODE}" style="fill:${lineColor(line, palette)}" xml:space="preserve">${escape(fitText(line.text, width - 40, { isMono: true, size: CODE }))}</text></g>`
}

// `hasControl` leaves the header's right corner free for a Copy button laid over it.
export function terminalSvg(output: ShellOutput, isErrored: boolean, frame: CardFrame): { source: string; width: number; height: number; alt: string } {
  const { palette, width, hasControl = false } = frame
  const lines = outputLines(output)
  const status = statusOf(output, isErrored, palette)
  const shown: Shown[] = lines.length === 0 ? [{ text: 'çıktı yok', isErr: false, isNote: true }] : lines
  const rows = shown.map((line, i) => outputRow(line, i, frame))

  const height = HEADER_H + 6 + Math.max(1, lines.length) * LINE_H + 10
  const note = output.returnCodeInterpretation === undefined ? 'Çıktı' : `Çıktı · ${output.returnCodeInterpretation}`
  const header = [
    strokeIcon(PROMPT, { x: 16, y: HEADER_MID - 9, size: 18, color: palette.fg }),
    `<text x="42" y="${HEADER_MID + 4}" font-size="12" style="fill:${palette.muted};letter-spacing:.04em">${escape(note)}</text>`,
    pill(palette, { right: width - 16 - (hasControl ? CONTROL_SLOT : 0), y: HEADER_MID - 10, text: status.text, color: status.color }),
    `<line x1="0" y1="${HEADER_H - 0.5}" x2="${width}" y2="${HEADER_H - 0.5}" stroke="${palette.muted}" stroke-opacity=".3"/>`,
  ].join('')

  return {
    source: svgCard({ width, height, palette, body: header + rows.join('') }),
    width,
    height,
    alt: lines.map(line => ('fold' in line ? `… ${line.fold} satır daha` : line.text)).join('\n') || 'çıktı yok',
  }
}
