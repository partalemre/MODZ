// The desktop leak card beside the dialog: one Svg (the dialog counts its rows, an Svg
// by its alt) inside a single Flare border. Bare icon, label and headline, then one row per
// finding: the detector as a quiet pill, `path:line`, the masked value in the danger colour.
// Colour is state only: the frame and the masked value say danger; the rest is ink.

import { palette, role, svgStyle } from './theme'
import { escape, fit, fitMiddle, measure, svgOpen, icon } from './svg-kit'
import type { Ui } from './confirm'
import type { GuardPending } from '../types'
import { words } from './words'

const ROWS_MAX = 5
const HEAD_ICON = 20
const HEAD_X = 30
const HEAD_H = 46
const ROW_H = 32
const ROW_TOP_GAP = 12
const CHIP_H = 20
const CHIP_PAD = 9
const CARD_CHROME = 6
const PX_PER_COLUMN = 8
const MIN_WIDTH = 300
const META_GAP = 24
const MAX_WIDTH = 640
// Each 40 characters of alt cost the dialog a row: border, padding and this keep the card to 10 of its 12.
const ALT_MAX = 200

type Finding = { chip: string; where: string; value: string; tone: 'danger' | 'warn' }

export const svgWidth = (columns: number): number => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, (columns - CARD_CHROME) * PX_PER_COLUMN))

export function headlineOf(pending: GuardPending): { eyebrow: string; title: string; tone: 'danger' | 'warn' } {
  const said = words()
  const secrets = pending.secrets.length
  if (secrets > 0) return { eyebrow: said.leakEyebrow, title: said.leakTitle(pending.source, secrets), tone: 'danger' }

  return { eyebrow: said.envEyebrow, title: said.envTitle(pending.envFiles), tone: 'warn' }
}

/** The subject (file or git command) beside the label, only whole; '' when it doesn't fit. */
function subjectOf(pending: GuardPending, width: number): string {
  const eyebrowW = measure(headlineOf(pending).eyebrow, { size: 12, isBold: true })
  const line = pending.subject.split('\n')[0] ?? ''

  return measure(line, { size: 11.5, isMono: true }) <= width - HEAD_X - eyebrowW - META_GAP ? line : ''
}

// A write whose file the header already names says only the line (`line 4`); otherwise the full spot.
function findingsOf(pending: GuardPending, isSubjectShown: boolean): Finding[] {
  const isLineEnough = pending.source === 'write' && isSubjectShown
  const env: Finding[] = pending.envFiles.map(path => ({ chip: '.env', where: path, value: words().toGit, tone: 'warn' }))
  const secrets: Finding[] = pending.secrets.map(secret => ({ chip: secret.chip, where: isLineEnough ? secret.where : secret.at, value: secret.masked, tone: 'danger' }))

  return [...env, ...secrets]
}

function headerSvg(pending: GuardPending, width: number): string {
  const head = headlineOf(pending)
  const subject = subjectOf(pending, width)

  return [
    icon(head.tone === 'danger' ? 'key' : 'shield', { x: 0, y: 19, size: HEAD_ICON, color: 'var(--mid)' }),
    `<text x="${HEAD_X}" y="13" font-size="12" font-weight="600" style="fill:var(--lo)">${escape(head.eyebrow)}</text>`,
    `<text x="${width}" y="13" text-anchor="end" class="mono" font-size="11.5" style="fill:var(--lo)">${escape(subject)}</text>`,
    `<text x="${HEAD_X}" y="35" font-size="16" font-weight="600" style="fill:var(--hi)">${escape(fit(head.title, width - HEAD_X, { size: 16, isBold: true }))}</text>`,
  ].join('')
}

function findingSvg(finding: Finding, top: number, width: number): string {
  const chipText = fit(finding.chip, 120, { size: 11, isBold: true })
  const chipW = measure(chipText, { size: 11, isBold: true }) + CHIP_PAD * 2
  const valueW = measure(finding.value, { size: 12, isMono: true })
  const chipY = top + (ROW_H - CHIP_H) / 2
  const base = top + ROW_H / 2 + 4.5
  const whereX = chipW + 12
  const where = fitMiddle(finding.where, width - whereX - valueW - 16, { size: 12.5, isMono: true })
  const tone = finding.tone

  return [
    `<path d="M0 ${top + 0.5}H${width}" style="stroke:var(--line)"/>`,
    `<rect x="0" y="${chipY}" width="${chipW}" height="${CHIP_H}" rx="${CHIP_H / 2}" style="fill:var(--track)"/>`,
    `<text x="${chipW / 2}" y="${chipY + 14}" text-anchor="middle" font-size="11" font-weight="600" style="fill:var(--mid)">${escape(chipText)}</text>`,
    `<text x="${whereX}" y="${base}" class="mono" font-size="12.5" style="fill:var(--mid)">${escape(where)}</text>`,
    `<text x="${width}" y="${base}" text-anchor="end" class="mono" font-size="12" style="fill:var(--${tone})">${escape(finding.value)}</text>`,
  ].join('')
}

export function leakSvg(pending: GuardPending, width: number): { source: string; height: number; alt: string } {
  const findings = findingsOf(pending, subjectOf(pending, width) !== '')
  const shown = findings.slice(0, ROWS_MAX)
  const more = findings.length - shown.length
  const top = HEAD_H + ROW_TOP_GAP
  const height = top + shown.length * ROW_H + (more > 0 ? ROW_H - 6 : 0) + 2
  const rows = shown.map((finding, index) => findingSvg(finding, top + index * ROW_H, width))
  const moreRow = more > 0 ? `<text x="0" y="${top + shown.length * ROW_H + 18}" font-size="12.5" style="fill:var(--lo)">${escape(words().moreFindings(more))}</text>` : ''
  const head = headlineOf(pending)
  // The alt reads every full spot, even where the drawing says only the line.
  const said = `${head.title}: ${findingsOf(pending, false).map(finding => `${finding.chip} ${finding.where} ${finding.value}`).join('; ')}`

  return {
    height,
    alt: said.length > ALT_MAX ? `${said.slice(0, ALT_MAX - 1)}…` : said,
    source: [svgOpen(width, height), svgStyle(), headerSvg(pending, width), ...rows, moreRow, '</svg>'].join(''),
  }
}

export function desktopCard(ui: Ui, pending: GuardPending, spec: { width: number; isLight: boolean }) {
  const { Box, Svg } = ui
  const width = svgWidth(spec.width)
  const card = leakSvg(pending, width)
  const tone = headlineOf(pending).tone

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={role(tone, spec.isLight).line} backgroundColor={palette(spec.isLight).card} paddingX={2} paddingY={1}>
      <Svg source={card.source} alt={card.alt} width={width} height={card.height} />
    </Box>
  )
}
