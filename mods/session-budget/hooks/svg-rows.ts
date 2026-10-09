import { escape, eyebrow, eyebrowWidth, measure, segmentedArc, svgDoc } from './svg'
import type { SvgDoc } from './svg'

// The desktop drawings: the 80% band row (a meter whose tidemark is the budget), the row after
// "Dur", and the full-budget card above the question.

const ROW_H = 24
const BASELINE = 16
const SIZE = 12.5
const METER = { width: 132, height: 6, scale: 1.25 } as const
const GAP = 10
// Room between words, and slack for heavier weights than the estimate assumes.
const WORD_GAP = 5
const WEIGHT_SLACK = 1.08

type Word = { value: string; cls: string; isMono?: boolean; weight?: number }

// Words in a row from `x`, a space apart; returns the markup and where the row ends.
function words(list: readonly Word[], x: number): { body: string; end: number } {
  let at = x
  const body = list.map(word => {
    const drawn = `<text class="${word.cls}${word.isMono === true ? ' num' : ''}" x="${at.toFixed(1)}" y="${BASELINE}" font-size="${SIZE}" font-weight="${word.weight ?? 500}">${escape(word.value)}</text>`
    at += measure(word.value, SIZE, word.isMono) * (word.isMono === true ? 1 : WEIGHT_SLACK) + WORD_GAP

    return drawn
  })

  return { body: body.join(''), end: at }
}

// Spent against the budget: the track runs past it, the budget stands as the tidemark, and the
// stretch beyond it is tinted so the overflow reads before it happens.
function tidemarkMeter(ratio: number): string {
  const y = (ROW_H - METER.height) / 2
  const mark = METER.width / METER.scale
  const fill = Math.min(METER.width, Math.max(METER.height, ratio * mark))
  const r = METER.height / 2

  return [
    `<rect class="f-track" x="0" y="${y}" width="${METER.width}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-warn-t" x="${mark}" y="${y}" width="${METER.width - mark}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-warn" x="0" y="${y}" width="${fill.toFixed(1)}" height="${METER.height}" rx="${r}"/>`,
    `<rect class="f-hi" x="${mark - 0.75}" y="${y - 4}" width="1.5" height="${METER.height + 8}" rx=".75"/>`,
  ].join('')
}

export type WarnRow = { percent: string; spend: string; eta: string; ratio: number }

export function warnRowSvg(row: WarnRow): SvgDoc {
  const placed = words(
    [
      { value: 'Bütçe', cls: 'f-mid', weight: 600 },
      { value: row.percent, cls: 'f-warn', isMono: true, weight: 650 },
      { value: '·', cls: 'f-lo' },
      { value: row.spend, cls: 'f-hi', isMono: true },
      ...(row.eta === '' ? [] : [{ value: '·', cls: 'f-lo' }, { value: row.eta, cls: 'f-lo' }]),
    ],
    METER.width + GAP + 2,
  )
  const alt = ['Bütçe', row.percent, row.spend, row.eta].filter(part => part !== '').join(' · ')

  return svgDoc({ width: placed.end, height: ROW_H, body: tidemarkMeter(row.ratio) + placed.body, alt })
}

const X_ICON = 'M-3 -3 L3 3 M3 -3 L-3 3'

export function stoppedRowSvg(spend: string): SvgDoc {
  const icon = `<circle class="f-danger-t s-danger-l" cx="9" cy="12" r="8.5"/><path class="s-danger" d="${X_ICON}" transform="translate(9 12)" stroke-width="1.6" stroke-linecap="round"/>`
  const placed = words(
    [
      { value: 'Durduruldu: bütçe doldu', cls: 'f-danger', weight: 600 },
      { value: '·', cls: 'f-lo' },
      { value: spend, cls: 'f-hi', isMono: true },
      { value: '·', cls: 'f-lo' },
      { value: '/budget ile artır', cls: 'f-lo' },
    ],
    26,
  )

  return svgDoc({ width: placed.end, height: ROW_H, body: icon + placed.body, alt: `Durduruldu: bütçe doldu · ${spend} · /budget ile artır` })
}

export type FullCard = { spend: string; percent: string; step: string; width: number }

const CARD = { h: 98, pad: 18, ring: 56, radius: 12 } as const

export function fullCardSvg(card: FullCard): SvgDoc {
  const textX = CARD.pad + CARD.ring + 16
  const ring = segmentedArc({ cx: CARD.pad + CARD.ring / 2, cy: CARD.h / 2, r: 23, stroke: 5, segments: 20, percent: 100, tone: 'warn', pace: null })
  const meta = `${card.spend} · ${card.percent}`
  const fitsMeta = textX + eyebrowWidth('Oturum bütçesi') + measure(meta, 11.5, true) + 24 <= card.width - CARD.pad
  const body = [
    `<rect class="f-card s-warn-l" x=".5" y=".5" width="${card.width - 1}" height="${CARD.h - 1}" rx="${CARD.radius}"/>`,
    ring,
    `<text class="f-warn num" x="${CARD.pad + CARD.ring / 2}" y="${CARD.h / 2 + 4.5}" font-size="12.5" font-weight="650" text-anchor="middle">${escape(card.percent)}</text>`,
    eyebrow('Oturum bütçesi', textX, 30, 'f-warn'),
    fitsMeta ? `<text class="f-lo num" x="${card.width - CARD.pad}" y="30" font-size="11.5" text-anchor="end">${escape(meta)}</text>` : '',
    `<text class="f-hi" x="${textX}" y="55" font-size="17" font-weight="620">Bütçe doldu</text>`,
    `<text class="f-mid" x="${textX}" y="77" font-size="12.5">${escape(`Mesajın bekletiliyor. Devam edersen bütçe ${card.step} artar.`)}</text>`,
  ].join('')

  return svgDoc({ width: card.width, height: CARD.h, body, alt: `Oturum bütçesi doldu: ${meta}. Mesajın bekletiliyor; devam edersen bütçe ${card.step} artar.` })
}
