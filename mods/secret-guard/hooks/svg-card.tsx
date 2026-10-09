// The desktop leak card beside the dialog: one Svg (the dialog counts its rows, an Svg
// by its alt) inside a single Flare border. Tile + eyebrow + headline, then one row per
// finding: detector chip, `path:line`, the masked value as a highlight span.

import { palette, role, svgStyle } from './theme'
import { escape, fit, fitMiddle, measure, svgOpen, tile } from './svg-kit'
import type { Ui } from './confirm'
import type { GuardPending } from '../types'

const ROWS_MAX = 5
const TILE = 38
const HEAD_X = 52
const HEAD_H = 50
const ROW_H = 32
const ROW_TOP_GAP = 12
const CHIP_H = 20
const CHIP_PAD = 9
const SPAN_PAD = 6
const CARD_CHROME = 6
const PX_PER_COLUMN = 8
const MIN_WIDTH = 300
const META_GAP = 24
const MAX_WIDTH = 640
// Each 40 characters of alt cost the dialog a row: border, padding and this keep the card to 10 of its 12.
const ALT_MAX = 200

type Finding = { chip: string; where: string; value: string; tone: 'danger' | 'warn' }

export const svgWidth = (columns: number): number => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, (columns - CARD_CHROME) * PX_PER_COLUMN))

const SOURCE_WORD: Record<GuardPending['source'], string> = { write: 'Bu yazımda', add: 'Bu eklemede', commit: 'Bu commit\'te' }

export function headlineOf(pending: GuardPending): { eyebrow: string; title: string; tone: 'danger' | 'warn' } {
  const secrets = pending.secrets.length
  if (secrets > 0) return { eyebrow: 'SIZINTI ENGELLENDİ', title: `${SOURCE_WORD[pending.source]} ${secrets} gizli anahtar var`, tone: 'danger' }
  const env = pending.envFiles.length
  const what = env === 1 ? (pending.envFiles[0] ?? '.env') : `${env} ortam dosyası`

  return { eyebrow: 'ORTAM DOSYASI', title: `${what} git'e ekleniyor`, tone: 'warn' }
}

function findingsOf(pending: GuardPending): Finding[] {
  const env: Finding[] = pending.envFiles.map(path => ({ chip: '.env', where: path, value: 'git\'e ekleniyor', tone: 'warn' }))
  const secrets: Finding[] = pending.secrets.map(secret => ({ chip: secret.chip, where: secret.at, value: secret.masked, tone: 'danger' }))

  return [...env, ...secrets]
}

function headerSvg(pending: GuardPending, width: number): string {
  const head = headlineOf(pending)
  const eyebrowW = measure(head.eyebrow, { size: 10.5, isBold: true }) * 1.12
  const line = pending.subject.split('\n')[0] ?? ''
  // The subject sits beside the eyebrow only whole; the rows below name every file anyway.
  const subject = measure(line, { size: 11.5, isMono: true }) <= width - HEAD_X - eyebrowW - META_GAP ? line : ''

  return [
    tile(head.tone === 'danger' ? 'key' : 'shield', { x: 0, y: 4, size: TILE, role: head.tone }),
    `<text x="${HEAD_X}" y="16" font-size="10.5" font-weight="700" letter-spacing="0.1em" style="fill:var(--${head.tone})">${escape(head.eyebrow)}</text>`,
    `<text x="${width}" y="16" text-anchor="end" class="mono" font-size="11.5" style="fill:var(--lo)">${escape(subject)}</text>`,
    `<text x="${HEAD_X}" y="38" font-size="17" font-weight="620" style="fill:var(--hi)">${escape(fit(head.title, width - HEAD_X, { size: 17, isBold: true }))}</text>`,
  ].join('')
}

function findingSvg(finding: Finding, top: number, width: number): string {
  const chipText = fit(finding.chip, 120, { size: 11, isBold: true })
  const chipW = measure(chipText, { size: 11, isBold: true }) + CHIP_PAD * 2
  const valueW = measure(finding.value, { size: 12, isMono: true }) + SPAN_PAD * 2
  const chipY = top + (ROW_H - CHIP_H) / 2
  const base = top + ROW_H / 2 + 4.5
  const whereX = chipW + 12
  const where = fitMiddle(finding.where, width - whereX - valueW - 16, { size: 12.5, isMono: true })
  const tone = finding.tone

  return [
    `<path d="M0 ${top + 0.5}H${width}" style="stroke:var(--line)"/>`,
    `<rect x=".5" y="${chipY + 0.5}" width="${chipW - 1}" height="${CHIP_H - 1}" rx="${CHIP_H / 2}" style="fill:var(--${tone}-tint);stroke:var(--${tone}-line)"/>`,
    `<text x="${chipW / 2}" y="${chipY + 14}" text-anchor="middle" font-size="11" font-weight="600" style="fill:var(--${tone})">${escape(chipText)}</text>`,
    `<text x="${whereX}" y="${base}" class="mono" font-size="12.5" style="fill:var(--mid)">${escape(where)}</text>`,
    `<rect x="${width - valueW}" y="${top + 6}" width="${valueW}" height="${ROW_H - 12}" rx="4" style="fill:var(--${tone}-tint)"/>`,
    `<text x="${width - SPAN_PAD}" y="${base}" text-anchor="end" class="mono" font-size="12" style="fill:var(--${tone})">${escape(finding.value)}</text>`,
  ].join('')
}

export function leakSvg(pending: GuardPending, width: number): { source: string; height: number; alt: string } {
  const findings = findingsOf(pending)
  const shown = findings.slice(0, ROWS_MAX)
  const more = findings.length - shown.length
  const top = HEAD_H + ROW_TOP_GAP
  const height = top + shown.length * ROW_H + (more > 0 ? ROW_H - 6 : 0) + 2
  const rows = shown.map((finding, index) => findingSvg(finding, top + index * ROW_H, width))
  const moreRow = more > 0 ? `<text x="0" y="${top + shown.length * ROW_H + 18}" font-size="12.5" style="fill:var(--lo)">+${more} bulgu daha</text>` : ''
  const head = headlineOf(pending)
  const said = `${head.title}: ${findings.map(finding => `${finding.chip} ${finding.where} ${finding.value}`).join('; ')}`

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
